import { runRenderQA } from "@/lib/generation/quality/render-qa";
import { GenerationBudget } from "./generation-budget";
import { generateCompletePage } from "./generate-complete-page";
import { callConfiguredModel } from "./model-call";
import { repairCompletePage } from "./repair-output";
import { validateGeneratedHtml } from "./validate-output";
import { buildBusinessContext, generateUnifiedBrief } from "./unified-brief";
import type { EventSender } from "./events";
import type { NormalizedGenerationInput, PipelineResult } from "./types";

function planFor(generationId: string, context: ReturnType<typeof buildBusinessContext>, brief: Awaited<ReturnType<typeof generateUnifiedBrief>>["brief"], qualityGate?: Record<string, unknown>) {
  return { generationId, generationDepth: "premium-final", stage: "planning", summary: brief.pageNarrative, sectionIds: brief.sectionOutline.map((section) => section.name), premiumPlan: { sections: brief.sectionOutline, layoutPhilosophy: brief.visualThesis }, unifiedBrief: brief, creativeContract: brief, designSystem: { colorAndTypographyDirection: brief.colorAndTypographyDirection }, pageContract: { sections: brief.sectionOutline }, designTokens: context.tokens, archetype: context.archetype, visualIdentity: context.visualIdentity, seraphimGenerator: { authority: "only-website-generation-system", industryBrief: context.category, industryName: context.category, matchedSignals: context.services }, qualityGate };
}

function parseQa(text: string): { findings: string[]; repairRequired: boolean } { try { const value: unknown = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}"); const record = value && typeof value === "object" ? value as Record<string, unknown> : {}; return { findings: Array.isArray(record.findings) ? record.findings.filter((item: unknown): item is string => typeof item === "string").slice(0, 8) : [], repairRequired: record.repairRequired === true }; } catch { return { findings: [], repairRequired: false }; } }

export async function runPremiumPipeline(input: NormalizedGenerationInput, send?: EventSender): Promise<PipelineResult> {
  const budget = new GenerationBudget("premium-final");
  const context = buildBusinessContext(input);
  send?.({ type: "understanding-business", generationId: input.generationId });
  const briefResult = await generateUnifiedBrief(context, budget);
  const initialPlan = planFor(input.generationId, context, briefResult.brief);
  send?.({ type: "planning-site", generationId: input.generationId, unifiedBrief: briefResult.brief, generationPlan: initialPlan });
  send?.({ type: "generating-website", generationId: input.generationId });
  const page = await generateCompletePage(context, briefResult.brief, budget);
  let validation = validateGeneratedHtml(page.html, context);
  send?.({ type: "checking-output", generationId: input.generationId, findings: validation.findings });
  const metadata = [briefResult.metadata, page.metadata];
  let revisionCount = 0;
  if (validation.fatal) {
    send?.({ type: "repairing-output", generationId: input.generationId, findings: validation.findings });
    const repaired = await repairCompletePage(context, briefResult.brief, validation.html, validation, budget);
    metadata.push(repaired.metadata); validation = validateGeneratedHtml(repaired.html, context); revisionCount = 1;
  }
  if (validation.fatal) throw new Error("The bounded repair did not produce a safe standalone website.");
  const render = await runRenderQA(validation.html);
  let visualQa = { findings: [] as string[], repairRequired: false };
  let visualQaProviderFailure = false;
  try {
    const qa = await callConfiguredModel({ stage: "visual-qa", maxOutputTokens: 1600, budget, json: true, prompt: `Review this rendered complete website against this brief. Return JSON {findings:string[],repairRequired:boolean}. Only flag material visual/factual/accessibility defects. Brief: ${JSON.stringify(briefResult.brief)}. Render findings: ${JSON.stringify(render.findings)}. HTML: ${validation.html}` });
    metadata.push({ ...qa.metadata, stage: "visual-qa" }); visualQa = parseQa(qa.text);
  } catch {
    visualQaProviderFailure = true;
    metadata.push({ stage: "visual-qa", provider: "local", model: "visual-qa-provider-failed", fallback: true, attempt: 0, latencyMs: 0 });
  }
  if (!validation.fatal && visualQa.repairRequired && visualQa.findings.length && revisionCount === 0) {
    const repairValidation = { ...validation, findings: visualQa.findings.map((message: string) => ({ code: "VISUAL_QA", severity: "fatal" as const, message })), fatal: true };
    send?.({ type: "repairing-output", generationId: input.generationId, findings: repairValidation.findings });
    const repaired = await repairCompletePage(context, briefResult.brief, validation.html, repairValidation, budget);
    metadata.push(repaired.metadata); validation = validateGeneratedHtml(repaired.html, context); revisionCount = 1;
  }
  const qualityGate = { passed: !validation.fatal, findings: validation.findings, rejectionReasons: validation.findings.map((item) => item.message), visualFindings: visualQa.findings, render: { available: render.available, findings: render.findings, warnings: render.warnings }, measured: validation.quality.measured, notMeasured: visualQaProviderFailure ? [...validation.quality.notMeasured, "model visual QA (provider failure)"] : validation.quality.notMeasured, providerFailure: visualQaProviderFailure, revisionCount, budget: budget.snapshot() };
  return { html: validation.html, unifiedBrief: briefResult.brief, validation, metadata, generationPlan: planFor(input.generationId, context, briefResult.brief, qualityGate), qualityGate, revisionCount };
}
