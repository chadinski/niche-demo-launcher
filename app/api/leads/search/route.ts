import { NextResponse } from "next/server";
import { z } from "zod";
import { searchFirecrawlLeads } from "@/lib/leads/firecrawl-lead-search";

const requestSchema = z.object({
  industry: z.string().trim().min(2).max(80),
  location: z.string().trim().max(80).default(""),
  limit: z.number().int().min(5).max(20).default(10),
});

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const input = requestSchema.parse(json);
    const result = await searchFirecrawlLeads(input);

    return NextResponse.json(
      {
        ...result,
        searchedAt: new Date().toISOString(),
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => issue.message).join(" ")
      : error instanceof Error
        ? error.message
        : "Lead search could not complete.";

    return NextResponse.json(
      {
        configured: Boolean(process.env.FIRECRAWL_API_KEY),
        query: "",
        candidates: [],
        warnings: [message],
        searchedAt: new Date().toISOString(),
      },
      { status: 400, headers: noStoreHeaders },
    );
  }
}
