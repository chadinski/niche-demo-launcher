import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireGenerationWorkerUser, requireServerUser } from "@/lib/auth/server-guard";
import { safeImageDataUrlSchema } from "@/lib/openai-business-intelligence";
import { guardApiRequestAsync, idempotencyKey } from "@/lib/security/request-guards";
import { ApiError, userSafeError } from "@/lib/security/api-error";
import { completeUsage, operationForGeneration, reserveUsage, type UsageReservation } from "@/lib/usage/entitlements";
import { finishGenerationJob, isGenerationCancelled, startGenerationJob } from "@/lib/generation/jobs";
import { runFastPipeline } from "@/lib/generation/pipeline/fast-pipeline";
import { runPremiumPipeline } from "@/lib/generation/pipeline/premium-pipeline";
import { normalizeGenerationDepth, type NormalizedGenerationInput, type PipelineResult } from "@/lib/generation/pipeline/types";
import type { EventSender } from "@/lib/generation/pipeline/events";
import { usageStatusForPipelineOutcome } from "@/lib/generation/pipeline/events";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const infoSchema = z.object({ rawInfo: z.string().default(""), businessName: z.string().default(""), category: z.string().default(""), location: z.string().default(""), phone: z.string().default(""), email: z.string().default(""), websiteUrl: z.string().default(""), socialUrl: z.string().default(""), services: z.string().default(""), brandColors: z.string().default(""), notes: z.string().default(""), painPoints: z.string().default(""), packagePrice: z.string().default(""), demoUrl: z.string().default("") });
const requestSchema = z.object({
  generationId: z.string().min(1).max(80).optional(), info: infoSchema.optional().default(() => infoSchema.parse({})),
  business: z.object({ name: z.string().min(1).max(180), description: z.string().max(4000).default(""), targetAudience: z.string().max(1200).default(""), differentiators: z.array(z.string().max(240)).default([]), brandPersonality: z.string().max(600).optional() }).optional(),
  visualPreferences: z.unknown().optional(), generationDepth: z.enum(["fast-draft", "premium-final"]).optional().default("fast-draft"), generationMode: z.string().max(80).optional().default("standard"), imageName: z.string().max(180).optional(), sourceImageDataUrl: safeImageDataUrlSchema.optional().default(""), businessUnderstanding: z.unknown().optional(), archetypeId: z.string().min(1).max(80).optional(),
});

function generationId(value?: string) { return value || crypto.randomUUID(); }
function normalize(input: z.infer<typeof requestSchema>, id: string): NormalizedGenerationInput {
  const business = input.business;
  const details = [business?.description, business?.targetAudience && `Target audience: ${business.targetAudience}`, business?.brandPersonality && `Brand personality: ${business.brandPersonality}`, business?.differentiators?.length ? `Services: ${business.differentiators.join(", ")}` : ""].filter(Boolean).join("\n");
  return { generationId: id, generationDepth: normalizeGenerationDepth(input.generationDepth), generationMode: input.generationMode, info: { rawInfo: [input.info.rawInfo, details].filter(Boolean).join("\n"), businessName: input.info.businessName || business?.name || "", category: input.info.category || "Local business", location: input.info.location, phone: input.info.phone, email: input.info.email, websiteUrl: input.info.websiteUrl, socialUrl: input.info.socialUrl, services: input.info.services || business?.differentiators.join(", ") || "", brandColors: input.info.brandColors, notes: [input.info.notes, details].filter(Boolean).join("\n") }, business: { name: business?.name || input.info.businessName || "Local business", description: business?.description || input.info.rawInfo, targetAudience: business?.targetAudience || input.info.painPoints, differentiators: business?.differentiators || [], brandPersonality: business?.brandPersonality || "" }, visualPreferences: input.visualPreferences, archetypeId: input.archetypeId, sourceImageDataUrl: input.sourceImageDataUrl, businessUnderstanding: input.businessUnderstanding };
}

async function runPipeline(input: NormalizedGenerationInput, send?: EventSender) { return input.generationDepth === "premium-final" ? runPremiumPipeline(input, send) : runFastPipeline(input, send); }
function responsePayload(generationId: string, result: PipelineResult) { return { generationId, html: result.html, generationDepth: result.generationPlan.generationDepth, unifiedBrief: result.unifiedBrief, creativeContract: result.unifiedBrief, plan: result.generationPlan.premiumPlan, generationPlan: result.generationPlan, qualityGate: result.qualityGate, qa: result.validation, modelMetadata: result.metadata.at(-1), pipelineModelMetadata: result.metadata, revisionCount: result.revisionCount }; }

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };
  let user; let requestId = ""; let reservation: UsageReservation | undefined;
  try {
    user = request.headers.get("x-seraphim-worker-secret") ? await requireGenerationWorkerUser(request) : await requireServerUser();
    requestId = user.mode === "worker" ? request.headers.get("x-request-id")?.slice(0, 120) || crypto.randomUUID() : (await guardApiRequestAsync(request, { userId: user.userId, route: "generate-website", maxBytes: 10_000_000, limit: 4, windowMs: 60_000 })).requestId;
  } catch (error) { const auth = authErrorResponse(error); if (auth) return NextResponse.json(auth.body, { status: auth.status, headers }); const safe = userSafeError(error, "The generation request could not be accepted."); return NextResponse.json({ ...safe.body, requestId }, { status: safe.status, headers }); }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid website generation request.", details: parsed.error.flatten() }, { status: 400, headers });
  const id = generationId(parsed.data.generationId); const input = normalize(parsed.data, id); const wantsStream = request.headers.get("accept")?.includes("text/event-stream");
  try { reservation = await reserveUsage(user, operationForGeneration(input.generationDepth), idempotencyKey(request, `${id}:${input.generationDepth}`), requestId); await startGenerationJob(user, id, requestId); }
  catch (error) { const safe = userSafeError(error, "Usage could not be verified. No website generation was started."); return NextResponse.json({ generationId: id, requestId, ...safe.body }, { status: safe.status, headers }); }
  const execute = async (send?: EventSender) => {
    if (await isGenerationCancelled(user, id)) throw new ApiError("GENERATION_CANCELLED", "Generation was cancelled.", 409);
    const result = await runPipeline(input, send);
    if (await isGenerationCancelled(user, id)) throw new ApiError("GENERATION_CANCELLED", "Generation was cancelled.", 409);
    return result;
  };
  if (wantsStream) return new Response(new ReadableStream({ async start(controller) {
    const encoder = new TextEncoder(); const send: EventSender = (event) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    try { const result = await execute(send); const payload = responsePayload(id, result); await completeUsage(reservation!, usageStatusForPipelineOutcome(true), { provider: result.metadata.at(-1)?.provider, model: result.metadata.at(-1)?.model }); await finishGenerationJob(user, id, "succeeded", "", { html: payload.html, generationPlan: payload.generationPlan, qualityGate: payload.qualityGate }); send({ type: "complete", ...payload }); }
    catch (error) { await completeUsage(reservation!, usageStatusForPipelineOutcome(false), { errorCode: error instanceof ApiError ? error.code : "GENERATION_FAILED" }); await finishGenerationJob(user, id, "failed", error instanceof ApiError ? error.code : "GENERATION_FAILED"); send({ type: "error", generationId: id, error: "Website generation could not complete. Your previous saved version is unchanged.", code: error instanceof ApiError ? error.code : "GENERATION_FAILED" }); }
    finally { controller.close(); }
  } }), { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-cache, must-revalidate", Connection: "keep-alive" } });
  try { const result = await execute(); const payload = responsePayload(id, result); await completeUsage(reservation, usageStatusForPipelineOutcome(true), { provider: result.metadata.at(-1)?.provider, model: result.metadata.at(-1)?.model }); await finishGenerationJob(user, id, "succeeded", "", { html: payload.html, generationPlan: payload.generationPlan, qualityGate: payload.qualityGate }); return NextResponse.json({ ...payload, requestId, usage: { used: reservation.used, limit: reservation.limit } }, { headers }); }
  catch (error) { await completeUsage(reservation, usageStatusForPipelineOutcome(false), { errorCode: error instanceof ApiError ? error.code : "GENERATION_FAILED" }); await finishGenerationJob(user, id, "failed", error instanceof ApiError ? error.code : "GENERATION_FAILED"); const safe = userSafeError(error, "Website generation could not complete. Your previous saved version is unchanged."); return NextResponse.json({ generationId: id, requestId, ...safe.body }, { status: safe.status, headers }); }
}
