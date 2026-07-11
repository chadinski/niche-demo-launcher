import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.GENERATION_WORKER_SECRET || "";
  const supplied = request.headers.get("x-seraphim-worker-secret") || "";
  const cronSecret = process.env.CRON_SECRET || "";
  const authorization = request.headers.get("authorization") || "";
  const cronAuthorized = Boolean(cronSecret && authorization === `Bearer ${cronSecret}`);
  const workerAuthorized = Boolean(expected && supplied && expected.length === supplied.length && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied)));
  return workerAuthorized || cronAuthorized;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Worker is not configured.", code: "WORKER_UNAVAILABLE" }, { status: 503 });
  const workerId = createHash("sha256").update(`${Date.now()}:${Math.random()}`).digest("hex").slice(0, 24);
  const { data: claimed, error: claimError } = await admin.rpc("claim_generation_job", { p_worker_id: workerId, p_lease_seconds: 300 });
  if (claimError) return NextResponse.json({ error: "Generation queue is unavailable.", code: "WORKER_QUEUE_ERROR" }, { status: 503 });
  const job = Array.isArray(claimed) ? claimed[0] : claimed;
  if (!job?.id || !job.payload) return new NextResponse(null, { status: 204 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is required for the worker.", code: "WORKER_CONFIG_ERROR" }, { status: 503 });
  try {
    const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/generate-website`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "x-seraphim-worker-secret": process.env.GENERATION_WORKER_SECRET || "",
        "x-seraphim-worker-user-id": job.user_id,
        "x-request-id": job.request_id || crypto.randomUUID(),
        "x-idempotency-key": `${job.generation_id}:premium-final:worker`,
      },
      body: JSON.stringify(job.payload),
      cache: "no-store",
    });
    await response.arrayBuffer();
    if (!response.ok) throw new Error(`generation-route-${response.status}`);
    return NextResponse.json({ processed: true, generationId: job.generation_id, workerId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const attempts = Number(job.attempts || 1);
    const retry = attempts < 3;
    await admin.from("generation_jobs").update({
      status: retry ? "queued" : "failed",
      stage: retry ? "retry_scheduled" : "failed",
      error_code: "WORKER_REQUEST_FAILED",
      error_message: "The durable worker could not reach the generation pipeline.",
      next_attempt_at: new Date(Date.now() + (retry ? attempts * 30_000 : 0)).toISOString(),
      lease_expires_at: null,
      completed_at: retry ? null : new Date().toISOString(),
    }).eq("id", job.id);
    console.error("generation-worker.failed", { generationId: job.generation_id, attempts, error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: retry ? "Generation will retry automatically." : "Generation failed after worker retries.", code: "WORKER_REQUEST_FAILED", generationId: job.generation_id }, { status: retry ? 202 : 502 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
