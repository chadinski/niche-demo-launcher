import { normalizeLeadCandidate } from "@/lib/leads/lead-qualification";
import type { LeadCandidate } from "@/lib/leads/types";
import { buildLeadIndustrySearchPhrase, getLeadIndustryTarget } from "@/lib/leads/industry-targets";

type FirecrawlSearchResult = {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
  summary?: string;
};

type FirecrawlPayload = {
  success?: boolean;
  data?: {
    web?: unknown[];
  } | unknown[];
  error?: string;
};

function clean(value: string, maxLength = 120) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeResults(payload: FirecrawlPayload | null) {
  const raw = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data && "web" in payload.data ? payload.data.web : undefined)
      ? (payload?.data as { web: unknown[] }).web
      : [];

  return raw
    .filter((item): item is FirecrawlSearchResult => Boolean(item && typeof item === "object"))
    .map((item) => ({
      title: String(item.title || ""),
      url: String(item.url || ""),
      description: String(item.description || ""),
      markdown: String(item.markdown || ""),
      summary: String(item.summary || ""),
    }));
}

export async function searchFirecrawlLeads(input: {
  targetIndustryId?: string;
  industry: string;
  location: string;
  country?: string;
  region?: string;
  city?: string;
  limit: number;
}): Promise<{
  configured: boolean;
  query: string;
  targetIndustryId: string;
  candidates: LeadCandidate[];
  warnings: string[];
}> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const target = getLeadIndustryTarget(input.targetIndustryId || "");
  const industry = clean(input.industry || target.searchLabel, 120);
  const location = clean(input.location, 80);
  const limit = Math.min(20, Math.max(5, input.limit || 10));
  const query = [
    buildLeadIndustrySearchPhrase(target, industry),
    location,
    "business contact website Facebook Instagram WhatsApp quote booking",
    "-jobs -hiring",
    target.avoidSignals.map((signal) => `-${signal.replace(/\s+/g, " ")}`).join(" "),
  ].filter(Boolean).join(" ");

  if (!apiKey) {
    return {
      configured: false,
      query,
      targetIndustryId: target.id,
      candidates: [],
      warnings: ["FIRECRAWL_API_KEY is not configured, so live lead search is unavailable."],
    };
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit,
        sources: ["web"],
        timeout: 20000,
        scrapeOptions: {
          formats: [{ type: "summary" }],
          onlyMainContent: true,
        },
      }),
      signal: AbortSignal.timeout(24000),
    });

    const payload = (await response.json().catch(() => null)) as FirecrawlPayload | null;
    if (!response.ok || !payload?.success) {
      return {
        configured: true,
        query,
        targetIndustryId: target.id,
        candidates: [],
        warnings: [payload?.error || `Firecrawl search failed with status ${response.status}.`],
      };
    }

    const seen = new Set<string>();
    const candidates = normalizeResults(payload)
      .map((result) => normalizeLeadCandidate(result, industry, location, target))
      .filter((candidate): candidate is LeadCandidate => Boolean(candidate))
      .filter((candidate) => {
        const key = candidate.sourceUrl || `${candidate.businessName}|${candidate.sourceTitle}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.leadScore - a.leadScore);

    return {
      configured: true,
      query,
      targetIndustryId: target.id,
      candidates,
      warnings: candidates.length ? [] : ["Firecrawl returned results, but none looked like usable business leads."],
    };
  } catch (error) {
    return {
      configured: true,
      query,
      targetIndustryId: target.id,
      candidates: [],
      warnings: [error instanceof Error ? error.message : "Firecrawl lead search could not complete."],
    };
  }
}
