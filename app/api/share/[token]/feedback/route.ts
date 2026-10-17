import { NextResponse } from "next/server";
import { z } from "zod";
import { activeShare } from "@/lib/sharing";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardApiRequestAsync } from "@/lib/security/request-guards";
import { ApiError } from "@/lib/security/api-error";
const schema = z
  .object({
    name: z.string().trim().min(1).max(120),
    email: z.union([z.email().max(320), z.literal("")]).default(""),
    message: z.string().trim().min(1).max(4000),
    companyFax: z.literal("").optional(),
  })
  .strict();
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    await guardApiRequestAsync(request, {
      userId: "public-feedback",
      route: "demo-feedback",
      maxBytes: 10000,
      limit: 5,
      windowMs: 3600000,
    });
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 10000)
      throw new ApiError("TOO_LARGE", "Feedback is too long.", 413);
    const parsed = schema.safeParse(JSON.parse(body));
    if (!parsed.success)
      throw new ApiError(
        "INVALID_FEEDBACK",
        "Add your name, a valid email if provided, and a message of up to 4,000 characters.",
        400,
      );
    const share = await activeShare((await params).token);
    if (!share)
      throw new ApiError(
        "SHARE_UNAVAILABLE",
        "This share link has expired or been revoked.",
        404,
      );
    const admin = createAdminClient();
    if (!admin) throw new Error("unavailable");
    const { error } = await admin
      .from("demo_feedback")
      .insert({
        share_id: share.id,
        user_id: share.user_id,
        prospect_id: share.prospect_id,
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      });
    if (error) throw new Error("unavailable");
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const known = error instanceof ApiError;
    return NextResponse.json(
      {
        error: known
          ? error.message
          : "Feedback could not be saved. Try again shortly.",
      },
      { status: known ? error.status : 503 },
    );
  }
}
