import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireServerUser } from "@/lib/auth/server-guard";
import { createClient } from "@/lib/supabase/server";
import { guardApiRequestAsync, idempotencyKey } from "@/lib/security/request-guards";
import { userSafeError } from "@/lib/security/api-error";

const queueSchema = z.object({
  generationId: z.string().min(1).max(80),
  generationDepth: z.literal("premium-final"),
}).passthrough();

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireServerUser();
    const guarded = await guardApiRequestAsync(request, { userId: user.userId, route: "generation-job-queue", maxBytes: 10_000_000, limit: 2, windowMs: 60_000 });
    const parsed = queueSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Only Premium Final generations can be queued.", code: "INVALID_GENERATION_JOB", requestId: guarded.requestId }, { status: 400 });
    if (user.mode === "local-demo") return NextResponse.json({ error: "Durable Premium generation requires a configured account.", code: "QUEUE_UNAVAILABLE", requestId: guarded.requestId }, { status: 503 });
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Generation queue is temporarily unavailable.", code: "QUEUE_UNAVAILABLE", requestId: guarded.requestId }, { status: 503 });
    const { data, error } = await supabase.from("generation_jobs").insert({
      user_id: user.userId,
      generation_id: parsed.data.generationId,
      status: "queued",
      stage: "queued",
      progress: 0,
      request_id: guarded.requestId,
      payload: parsed.data,
      cancel_requested: false,
      next_attempt_at: new Date().toISOString(),
      error_code: "",
      error_message: "",
      completed_at: null,
    }).select("generation_id,status,stage,progress,created_at").single();
    if (error?.code === "23505") return NextResponse.json({ error: "This Premium generation is already queued or completed.", code: "DUPLICATE_REQUEST", requestId: guarded.requestId }, { status: 409 });
    if (error || !data) throw new Error("generation-job-queue-failed");
    return NextResponse.json({ job: data, requestId: guarded.requestId, idempotencyKey: idempotencyKey(request, `${parsed.data.generationId}:premium-final`) }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return NextResponse.json({ ...auth.body, requestId }, { status: auth.status });
    const safe = userSafeError(error, "The Premium generation could not be queued.");
    return NextResponse.json({ ...safe.body, requestId }, { status: safe.status });
  }
}
