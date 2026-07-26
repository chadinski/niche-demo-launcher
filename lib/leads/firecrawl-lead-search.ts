import { normalizeLeadCandidate } from "@/lib/leads/lead-qualification";
import type { LeadCandidate } from "@/lib/leads/types";
import { buildLeadIndustrySearchPhrase, getLeadIndustryTarget } from "@/lib/leads/industry-targets";
import { serverLog } from "@/lib/observability/logger";
import { ApiError } from "@/lib/security/api-error";

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
  warning?: string;
  code?: string;
};

function clean(value: string, maxLength = 120) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function countryCode(value: string | undefined) {
  const normalized = value?.trim().toUpperCase() || "";
  return /^[A-Z]{2}$/.test(normalized) ? normalized : "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(response: Response) {
  const header = response.headers.get("retry-after");
  if (!header) return 750;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? Math.min(5_000, Math.max(500, seconds * 1_000)) : 750;
}

function safeProviderError(status: number) {
  if (status === 429) return new ApiError("LEAD_SEARCH_RATE_LIMITED", "Lead search is temporarily rate-limited. Wait a minute and try again.", 429);
  if (status === 401 || status === 403) return new ApiError("LEAD_SEARCH_NOT_CONFIGURED", "Lead search credentials need attention before another search can run.", 503);
  if (status === 402) return new ApiError("LEAD_SEARCH_CREDITS_EXHAUSTED", "Firecrawl credits are exhausted. Add credits or update the Firecrawl plan, then try again.", 503);
  if (status === 408) return new ApiError("LEAD_SEARCH_TIMEOUT", "Lead search timed out before Firecrawl returned results. Try a narrower niche or location.", 504);
  return new ApiError("LEAD_SEARCH_PROVIDER_FAILED", "Firecrawl could not complete this search. No lead-search allowance was used.", 503);
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
  const country = countryCode(input.country);
  const limit = Math.min(20, Math.max(5, input.limit || 10));
  const providerLimit = Math.min(100, Math.ceil(limit * 1.5));
  const query = clean([
    buildLeadIndustrySearchPhrase(target, industry),
    location,
    "business contact website Facebook Instagram WhatsApp quote booking",
    "-jobs -hiring",
    target.avoidSignals.map((signal) => `-"${signal.replace(/\s+/g, " ")}"`).join(" "),
  ].filter(Boolean).join(" "), 500);

  if (!apiKey) {
    throw new ApiError("LEAD_SEARCH_NOT_CONFIGURED", "FIRECRAWL_API_KEY is not configured, so live lead search is unavailable.", 503);
  }

  try {
    let payload: FirecrawlPayload | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch("https://api.firecrawl.dev/v2/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: providerLimit,
          sources: ["web"],
          ...(location ? { location } : {}),
          ...(country ? { country } : {}),
          ignoreInvalidURLs: true,
          highlights: false,
          timeout: 45000,
          scrapeOptions: {
            formats: [{ type: "summary" }],
            onlyMainContent: true,
          },
        }),
        signal: AbortSignal.timeout(50000),
      });

      payload = (await response.json().catch(() => null)) as FirecrawlPayload | null;
      if (response.ok && payload?.success) break;
      serverLog("warn", "lead_search.provider_failed", {
        status: response.status,
        code: payload?.code || "unknown",
        attempt: attempt + 1,
      });
      const retryable = response.status === 429 || response.status >= 500;
      if (attempt === 0 && retryable) {
        await sleep(retryAfterMs(response));
        continue;
      }
      throw safeProviderError(response.status);
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
      .sort((a, b) => b.leadScore - a.leadScore)
      .slice(0, limit);
    const warnings = [
      payload?.warning,
      ...(candidates.length ? [] : ["Firecrawl returned results, but none looked like usable business leads."]),
      ...(candidates.length && candidates.length < limit ? [`Firecrawl found ${candidates.length} usable unique lead${candidates.length === 1 ? "" : "s"} for this search. Try a broader niche or nearby area for more.`] : []),
    ].filter((warning): warning is string => Boolean(warning));

    return {
      configured: true,
      query,
      targetIndustryId: target.id,
      candidates,
      warnings,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const timedOut = error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name);
    serverLog("warn", "lead_search.request_failed", { errorType: error instanceof Error ? error.name : "unknown" });
    throw timedOut
      ? new ApiError("LEAD_SEARCH_TIMEOUT", "Lead search timed out before Firecrawl returned results. Try a narrower niche or location.", 504)
      : new ApiError("LEAD_SEARCH_PROVIDER_FAILED", "Firecrawl could not complete this search. No lead-search allowance was used.", 503);
  }
}
