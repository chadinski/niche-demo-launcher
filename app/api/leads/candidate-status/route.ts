import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireServerUser } from "@/lib/auth/server-guard";
import { updateLeadCandidateStatus } from "@/lib/leads/persistence";
import { guardApiRequest } from "@/lib/security/request-guards";
import { userSafeError } from "@/lib/security/api-error";

const requestSchema = z.object({
  candidateId: z.string().uuid().optional(),
  sourceUrl: z.string().trim().max(300).optional(),
  businessName: z.string().trim().max(180).optional(),
  status: z.enum(["new", "saved", "rejected", "contacted", "blacklisted"]),
  reason: z.string().trim().max(500).optional(),
}).refine(value=>Boolean(value.candidateId||value.sourceUrl),"A candidate ID or source URL is required.");

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };
  let requestId="";

  try {
    const user = await requireServerUser();
    requestId=guardApiRequest(request,{userId:user.userId,route:"lead-candidate-status",maxBytes:20_000,limit:30}).requestId;
    const body = await request.json().catch(() => null);
    const input = requestSchema.parse(body);
    const result = await updateLeadCandidateStatus({ user, ...input });

    return NextResponse.json({...result,requestId}, { headers });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return NextResponse.json(authError.body, { status: authError.status, headers });

    if(error instanceof z.ZodError)return NextResponse.json({error:"Review the candidate update.",code:"INVALID_REQUEST",requestId},{status:400,headers});
    const safe=userSafeError(error,"Candidate status could not be updated.");
    return NextResponse.json({...safe.body,requestId},{status:safe.status,headers});
  }
}
