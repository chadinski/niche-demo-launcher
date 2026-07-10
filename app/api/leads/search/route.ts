import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireServerUser } from "@/lib/auth/server-guard";
import { searchFirecrawlLeads } from "@/lib/leads/firecrawl-lead-search";
import { persistLeadSearch } from "@/lib/leads/persistence";
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
    const user = await requireServerUser();

    const json = await request.json().catch(() => ({}));
    const input = requestSchema.parse(json);
    const location = buildLeadSearchLocation({
      city: input.city,
      region: input.region,
      country: input.country,
      fallbackLocation: input.location,
    });
    const result = await searchFirecrawlLeads({
      ...input,
      location,
    });
    const persisted = await persistLeadSearch({
      user,
      targetIndustryId: result.targetIndustryId,
      industry: input.industry,
      country: input.country,
      region: input.region,
      city: input.city,
      query: result.query,
      candidates: result.candidates,
    });

    return NextResponse.json(
      {
        ...result,
        candidates: persisted.candidates,
        searchRunId: persisted.searchRunId,
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
      { status: error instanceof z.ZodError ? 400 : 503, headers: noStoreHeaders },
    );
  }
}
