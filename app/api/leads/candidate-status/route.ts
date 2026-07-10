import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireServerUser } from "@/lib/auth/server-guard";
import { updateLeadCandidateStatus } from "@/lib/leads/persistence";

const requestSchema = z.object({
  candidateId: z.string().uuid().optional(),
  sourceUrl: z.string().trim().max(300).optional(),
  businessName: z.string().trim().max(180).optional(),
  status: z.enum(["new", "saved", "rejected", "contacted", "blacklisted"]),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };

  try {
    const user = await requireServerUser();
    const body = await request.json().catch(() => null);
    const input = requestSchema.parse(body);
    const result = await updateLeadCandidateStatus({ user, ...input });

    return NextResponse.json(result, { headers });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return NextResponse.json(authError.body, { status: authError.status, headers });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Candidate status could not be updated." },
      { status: error instanceof z.ZodError ? 400 : 503, headers },
    );
  }
}
