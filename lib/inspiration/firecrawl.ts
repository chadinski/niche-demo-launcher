type FirecrawlSearchResult = {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
  summary?: string;
};

function compact(value: string, maxLength = 420) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function summarizeResults(results: FirecrawlSearchResult[], industry: string) {
  if (!results.length) return "";

  const lines = results.slice(0, 5).map((result, index) => {
    const cues = compact([result.description, result.summary, result.markdown].filter(Boolean).join(" "), 520);
    return `${index + 1}. ${result.title || "Premium landing reference"} (${result.url || "no URL"}): ${cues || "Use as abstract visual and conversion inspiration only."}`;
  });

  return [
    `Firecrawl inspiration summary for ${industry}:`,
    "Extract abstract design patterns only. Do not copy layouts, copy, trademarks, screenshots, or branded assets.",
    ...lines,
    "Look for recurring patterns: first-screen headline clarity, visual hierarchy, CTA wording, image direction, section rhythm, trust placement, and mobile conversion flow.",
  ].join("\n");
}

export async function fetchDesignInspiration(industry: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return "";

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${industry || "local business"} premium landing page examples conversion design CTA layout`,
        limit: 5,
        sources: ["web"],
        includeDomains: ["land-book.com", "lapa.ninja", "awwwards.com", "godly.website"],
        timeout: 15000,
        scrapeOptions: {
          formats: [{ type: "summary" }],
          onlyMainContent: true,
        },
      }),
      signal: AbortSignal.timeout(18000),
    });

    const payload = (await response.json().catch(() => null)) as {
      success?: boolean;
      data?: { web?: unknown[] };
    } | null;

    if (!response.ok || !payload?.success || !Array.isArray(payload.data?.web)) return "";

    const results = payload.data.web
      .filter((item): item is FirecrawlSearchResult => Boolean(item && typeof item === "object"))
      .map((item) => ({
        title: compact(String(item.title || ""), 120),
        url: compact(String(item.url || ""), 220),
        description: compact(String(item.description || ""), 360),
        markdown: compact(String(item.markdown || ""), 520),
        summary: compact(String(item.summary || ""), 520),
      }))
      .filter((item) => item.url || item.title || item.description || item.summary || item.markdown);

    return summarizeResults(results, industry);
  } catch {
    return "";
  }
}
