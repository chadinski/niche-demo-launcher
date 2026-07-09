import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireServerUser } from "@/lib/auth/server-guard";
import { searchFirecrawlLeads } from "@/lib/leads/firecrawl-lead-search";
import { buildLeadSearchLocation } from "@/lib/leads/regions";

const requestSchema = z.object({
  targetIndustryId: z.string().trim().max(80).optional().default(""),
  industry: z.string().trim().min(2).max(80),
  location: z.string().trim().max(80).default(""),
  country: z.string().trim().max(40).optional().default(""),
  region: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  limit: z.number().int().min(5).max(20).default(10),
});

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(request: Request) {
  try {
    await requireServerUser();

    const json = await request.json().catch(() => ({}));
    const input = requestSchema.parse(json);
    const result = await searchFirecrawlLeads({
      ...input,
      location: buildLeadSearchLocation({
        city: input.city,
        region: input.region,
        country: input.country,
        fallbackLocation: input.location,
      }),
    });

    return NextResponse.json(
      {
        ...result,
        searchedAt: new Date().toISOString(),
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status, headers: noStoreHeaders });
    }

    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => issue.message).join(" ")
      : error instanceof Error
        ? error.message
        : "Lead search could not complete.";

    return NextResponse.json(
      {
        configured: Boolean(process.env.FIRECRAWL_API_KEY),
        query: "",
        targetIndustryId: "",
        candidates: [],
        warnings: [message],
        searchedAt: new Date().toISOString(),
      },
      { status: 400, headers: noStoreHeaders },
    );
  }
}
