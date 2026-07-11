import { NextResponse } from "next/server";
import { authErrorResponse, requireServerUser } from "@/lib/auth/server-guard";
import { getGenerationJob, requestGenerationCancellation } from "@/lib/generation/jobs";
import { userSafeError } from "@/lib/security/api-error";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ generationId: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireServerUser();
    const { generationId } = await params;
    const job = await getGenerationJob(user, generationId);
    if (!job) return NextResponse.json({ error: "Generation job not found.", code: "JOB_NOT_FOUND", requestId }, { status: 404 });
    return NextResponse.json({ job, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return NextResponse.json({ ...auth.body, requestId }, { status: auth.status });
    const safe = userSafeError(error, "Generation status is temporarily unavailable.");
    return NextResponse.json({ ...safe.body, requestId }, { status: safe.status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ generationId: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const user = await requireServerUser();
    const { generationId } = await params;
    const body = await request.json().catch(() => null) as { action?: string } | null;
    if (body?.action !== "cancel") {
      return NextResponse.json({ error: "Only cancellation is supported.", code: "INVALID_JOB_ACTION", requestId }, { status: 400 });
    }
    const cancelled = await requestGenerationCancellation(user, generationId);
    if (!cancelled) return NextResponse.json({ error: "This generation is no longer cancellable.", code: "JOB_NOT_CANCELLABLE", requestId }, { status: 409 });
    return NextResponse.json({ cancelled: true, generationId, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return NextResponse.json({ ...auth.body, requestId }, { status: auth.status });
    const safe = userSafeError(error, "The generation could not be cancelled.");
    return NextResponse.json({ ...safe.body, requestId }, { status: safe.status });
  }
}
