import type { LeadCandidate, LeadSourceType } from "@/lib/leads/types";
import type { LeadTemperature } from "@/lib/types";
import { leadIndustryPriorityWeight, type LeadIndustryTarget } from "@/lib/leads/industry-targets";

type RawLeadResult = {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
  summary?: string;
};

const directoryHosts = [
  "google.",
  "yelp.",
  "tripadvisor.",
  "findyello.",
  "jamaicayp.",
  "yellowpages",
  "facebook.com/pages/category",
  "business.site",
];

const socialHosts = [
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  "linkedin.com",
  "x.com",
  "twitter.com",
];

function compact(value: string, maxLength = 240) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function stableId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return `firecrawl-${Math.abs(hash).toString(36)}`;
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function sourceType(url: string): LeadSourceType {
  const host = hostname(url);
  if (!host) return "search-result";
  if (socialHosts.some((item) => host.includes(item))) return "social";
  if (directoryHosts.some((item) => host.includes(item))) return "directory";
  return "website";
}

function stripTitleNoise(title: string) {
  return title
    .replace(/\s*[|-]\s*(Facebook|Instagram|YouTube|TikTok|LinkedIn|Official Site|Home)\s*$/i, "")
    .replace(/\s*[|-]\s*(Reviews?|Photos?|Videos?|Menu|Services?)\s*$/i, "")
    .trim();
}

function inferBusinessName(result: RawLeadResult, url: string, industry: string) {
  const title = stripTitleNoise(compact(result.title || "", 120));
  if (title && !/^https?:\/\//i.test(title)) return title;

  const host = hostname(url);
  const hostName = host
    .split(".")
    .filter((part) => !["com", "net", "org", "co", "www"].includes(part))
    .join(" ")
    .replace(/[-_]/g, " ")
    .trim();

  return hostName ? hostName.replace(/\b\w/g, (char) => char.toUpperCase()) : compact(industry || "Untitled lead", 80);
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function extractPhone(text: string) {
  return text.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] ?? "";
}

function temperature(score: number): LeadTemperature {
  if (score >= 75) return "Hot";
  if (score >= 45) return "Warm";
  return "Cold";
}

function scoreCandidate(input: {
  type: LeadSourceType;
  target: LeadIndustryTarget;
  phone: string;
  email: string;
  websiteUrl: string;
  socialUrl: string;
  category: string;
  location: string;
  snippet: string;
}) {
  let score = 24;
  const reasons: string[] = [];
  const text = `${input.category} ${input.location} ${input.snippet}`.toLowerCase();
  const targetMatches = input.target.qualificationSignals.filter((signal) => text.includes(signal.toLowerCase()));
  const avoidMatches = input.target.avoidSignals.filter((signal) => text.includes(signal.toLowerCase()));

  const priorityBoost = leadIndustryPriorityWeight(input.target.priority);
  if (priorityBoost) {
    score += priorityBoost;
    reasons.push(`${input.target.priority} priority niche with strong website-sales fit.`);
  }

  if (targetMatches.length) {
    score += Math.min(14, targetMatches.length * 4);
    reasons.push(`Matches target signals: ${targetMatches.slice(0, 4).join(", ")}.`);
  }

  if (!input.websiteUrl) {
    score += 20;
    reasons.push("No clear standalone website was found in the search result.");
  } else if (/(old|outdated|slow|not secure|basic|facebook only|no menu|no booking)/i.test(input.snippet)) {
    score += 18;
    reasons.push("The visible result suggests a presentation or conversion improvement angle.");
  } else {
    score += 6;
    reasons.push("A website exists, so the angle should focus on improving presentation and conversion.");
  }

  if (input.socialUrl) {
    score += 12;
    reasons.push("Social presence gives manual outreach a warmer reference point.");
  }

  if (input.phone || input.email) {
    score += 14;
    reasons.push("Contact information appears available for manual follow-up.");
  }

  if (input.location) {
    score += 8;
    reasons.push("Location signal is present, which supports local-business positioning.");
  }

  if (/(auto|detailing|restaurant|food|dental|clinic|salon|spa|pet|home|contractor|repair|fitness|real estate|law|accounting|travel|tour|event|catering)/.test(text)) {
    score += 12;
    reasons.push("The niche has clear commercial intent and benefits from a stronger website demo.");
  }

  if (input.type === "social") {
    score += 10;
    reasons.push("The lead appears social-first, often a strong fit for a polished demo website.");
  }

  if (input.type === "directory") {
    score += 5;
    reasons.push("Directory discovery suggests customers may be finding scattered business information.");
  }

  if (avoidMatches.length) {
    score -= Math.min(18, avoidMatches.length * 6);
    reasons.push(`Review carefully; possible low-fit signals detected: ${avoidMatches.slice(0, 3).join(", ")}.`);
  }

  const finalScore = Math.min(100, Math.max(0, score));
  const leadTemperature = temperature(finalScore);
  return {
    score: finalScore,
    temperature: leadTemperature,
    reasons,
    recommendedAngle:
      leadTemperature === "Hot"
        ? "Lead with a ready-to-review website concept and a direct improvement opportunity."
        : leadTemperature === "Warm"
          ? "Lead with a helpful observation and invite them to review the website direction."
          : "Use a soft educational angle and confirm whether a website upgrade is relevant.",
  };
}

export function normalizeLeadCandidate(
  result: RawLeadResult,
  industry: string,
  location: string,
  target: LeadIndustryTarget,
): LeadCandidate | null {
  const sourceUrl = compact(result.url || "", 300);
  const sourceTitle = compact(result.title || "", 160);
  const sourceSnippet = compact(
    [result.description, result.summary, result.markdown].filter(Boolean).join(" "),
    700,
  );

  if (!sourceUrl && !sourceTitle && !sourceSnippet) return null;

  const type = sourceType(sourceUrl);
  const combined = `${sourceTitle} ${sourceSnippet}`;
  const phone = extractPhone(combined);
  const email = extractEmail(combined);
  const socialUrl = type === "social" ? sourceUrl : "";
  const websiteUrl = type === "website" ? sourceUrl : "";
  const category = compact(industry || "Local business", 80);
  const businessName = inferBusinessName(result, sourceUrl, industry);
  const inferredLocation = location || compact(sourceSnippet.match(/\b(Kingston|Portmore|Montego Bay|Ocho Rios|Jamaica|Mandeville|Spanish Town)\b/i)?.[0] || "", 80);
  const scoring = scoreCandidate({
    type,
    target,
    phone,
    email,
    websiteUrl,
    socialUrl,
    category,
    location: inferredLocation,
    snippet: sourceSnippet,
  });
  const warnings = [
    type === "directory" ? "Directory result; verify the official business profile before outreach." : "",
    !phone && !email && !socialUrl && !websiteUrl ? "No direct contact route found in this result." : "",
  ].filter(Boolean);

  return {
    id: stableId(`${sourceUrl}|${sourceTitle}|${industry}|${location}`),
    targetIndustryId: target.id,
    targetIndustryRank: target.rank,
    targetIndustryPriority: target.priority,
    businessName,
    category,
    location: inferredLocation,
    phone,
    email,
    websiteUrl,
    socialUrl,
    sourceUrl,
    sourceTitle,
    sourceSnippet,
    sourceType: type,
    services: category,
    opportunity: websiteUrl
      ? "Review the existing website for mobile clarity, CTA strength, and premium presentation."
      : target.worthTargeting,
    websiteOffer: target.bestWebsiteOffer,
    outreachHook: target.outreachHook,
    leadScore: scoring.score,
    leadTemperature: scoring.temperature,
    scoreReasons: scoring.reasons,
    recommendedAngle: scoring.recommendedAngle,
    confidence: Math.min(95, 45 + scoring.reasons.length * 10 + (businessName ? 10 : 0)),
    warnings,
  };
}
