import type { BusinessInfo } from "@/lib/types";

const labelSeparators = String.raw`[:\-–—|]`;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeRaw(raw: string) {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

function splitLines(raw: string) {
  return normalizeRaw(raw)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripListMarker(value: string) {
  return value.replace(/^\s*(?:[-*•·]|\d+[.)])\s*/, "").trim();
}

function valueAfterLabel(raw: string, labels: string[]) {
  const lines = splitLines(raw);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    for (const label of labels) {
      const escaped = escapeRegExp(label);
      const inline = line.match(new RegExp(`^\\s*${escaped}\\s*${labelSeparators}\\s*(.+)$`, "i"));
      if (inline?.[1]) return stripListMarker(inline[1]);

      const sameLine = line.match(new RegExp(`^\\s*${escaped}\\s+(.{3,})$`, "i"));
      if (sameLine?.[1] && !isNoiseLine(sameLine[1])) return stripListMarker(sameLine[1]);

      if (new RegExp(`^\\s*${escaped}\\s*${labelSeparators}?\\s*$`, "i").test(line)) {
        const nextUseful = lines.slice(index + 1).find((nextLine) => !isNoiseLine(nextLine));
        if (nextUseful) return stripListMarker(nextUseful);
      }
    }
  }

  return "";
}

function firstMatch(raw: string, pattern: RegExp) {
  return normalizeRaw(raw).match(pattern)?.[0]?.trim() ?? "";
}

const noiseLabels = new Set([
  "search",
  "home",
  "posts",
  "photos",
  "reviews",
  "about",
  "menu",
  "share",
  "follow",
  "like",
  "comment",
  "comments",
  "sponsored",
  "open",
  "directions",
  "call",
  "message",
  "more",
  "back",
  "today",
  "screenshot",
  "image",
  "photo",
  "facebook",
  "instagram",
  "google",
  "chrome",
  "safari",
  "website",
  "maps",
  "reels",
  "profile",
  "notifications",
  "likes",
  "shares",
  "followers",
  "following",
  "overview",
  "mentions",
  "tagged",
  "story",
  "stories",
  "ad",
  "ads",
  "public figure",
  "local business",
  "product/service",
  "see more",
  "view profile",
  "visit website",
  "send message",
  "get directions",
]);

const businessNameKeywords =
  /\b(studio|salon|auto|automotive|detailing|repairs?|dental|care|restaurant|cafe|coffee|bar|grill|catering|barber|print|printing|3d|design|works|services|construction|memorial|funeral|clinic|spa|interiors|events|music|company|co\.?|ltd\.?|limited|group|solutions|supplies|florist|bakery|fitness|gym|wellness|beauty|realty|law|accounting|cleaning|veterinary|pet|garage|kitchen|hardware)\b/i;

const categorySignals: Array<{ category: string; pattern: RegExp; weight: number }> = [
  { category: "restaurant", pattern: /\b(restaurant|dining|diner|chef|menu|grill|bar\s*&?\s*grill|eatery|food|cuisine|lunch|dinner)\b/gi, weight: 5 },
  { category: "cafe", pattern: /\b(cafe|coffee|espresso|bakery|pastry|brunch|tea)\b/gi, weight: 5 },
  { category: "catering", pattern: /\b(catering|private dining|events menu|party trays)\b/gi, weight: 4 },
  { category: "auto detailing", pattern: /\b(auto detailing|detailing|ceramic coating|paint correction|car wash|vehicle appearance|interior shampoo)\b/gi, weight: 6 },
  { category: "auto repair", pattern: /\b(auto repair|mechanic|garage|diagnostic|brakes?|oil change|engine|transmission|vehicle repair)\b/gi, weight: 6 },
  { category: "dental clinic", pattern: /\b(dental|dentist|orthodontic|teeth whitening|oral care)\b/gi, weight: 6 },
  { category: "clinic", pattern: /\b(clinic|medical|doctor|patient|health centre|healthcare|urgent care)\b/gi, weight: 5 },
  { category: "wellness", pattern: /\b(wellness|therapy|massage|holistic|yoga|meditation|healing)\b/gi, weight: 5 },
  { category: "spa", pattern: /\b(spa|facial|body treatment|skin care|aesthetic)\b/gi, weight: 5 },
  { category: "salon", pattern: /\b(salon|barber|hair|nails|lashes|makeup|beauty|stylist|braids)\b/gi, weight: 6 },
  { category: "construction", pattern: /\b(construction|contractor|builder|renovation|roofing|plumb(?:ing|er|ers)?|electric(?:al|ian|ians)?|paint(?:ing|er|ers)?|locksmiths?|hardware|supplies|materials|home service|in-home service)\b/gi, weight: 5 },
  { category: "real estate", pattern: /\b(real estate|realtor|realty|property|home staging)\b/gi, weight: 6 },
  { category: "interior design", pattern: /\b(interior|architect|decor|furniture|space planning)\b/gi, weight: 5 },
  { category: "funeral home", pattern: /\b(funeral|memorial|cremation|tribute|remembrance|urn)\b/gi, weight: 6 },
  { category: "3d printing", pattern: /\b(3d printing|prototype|prototyping|fabrication|laser cutting|cnc|custom product|sign shop|signage)\b/gi, weight: 6 },
  { category: "music", pattern: /\b(music|musician|band|dj|recording studio|performer|entertainment|artist|violin|singer)\b/gi, weight: 5 },
  { category: "florist", pattern: /\b(florist|flowers?|bouquet|arrangement|wedding florals|event florals)\b/gi, weight: 6 },
  { category: "pet care", pattern: /\b(pet|pet store|veterinary|vet|grooming|dog|cat|animal care)\b/gi, weight: 6 },
  { category: "law firm", pattern: /\b(law|legal|attorney|lawyer|barrister|solicitor)\b/gi, weight: 6 },
  { category: "accounting", pattern: /\b(accounting|accountant|tax|bookkeeping|finance|financial)\b/gi, weight: 5 },
  { category: "consulting", pattern: /\b(consulting|consultant|advisory|professional service)\b/gi, weight: 4 },
  { category: "cleaning service", pattern: /\b(cleaning|janitorial|maid|sanitization|deep clean)\b/gi, weight: 5 },
  { category: "fitness", pattern: /\b(fitness|gym|trainer|personal training|coaching)\b/gi, weight: 5 },
];

const knownLocations = [
  "Kingston",
  "St. Andrew",
  "Saint Andrew",
  "Montego Bay",
  "Mobay",
  "Spanish Town",
  "Portmore",
  "Ocho Rios",
  "Negril",
  "Mandeville",
  "May Pen",
  "Port Antonio",
  "Savanna-la-Mar",
  "St. Ann",
  "Saint Ann",
  "St. Catherine",
  "Saint Catherine",
  "St. James",
  "Saint James",
  "St. Elizabeth",
  "Saint Elizabeth",
  "Manchester",
  "Clarendon",
  "Trelawny",
  "Hanover",
  "Westmoreland",
  "Portland",
  "Jamaica",
];

const serviceTerms = [
  "ceramic coating",
  "paint correction",
  "interior detailing",
  "exterior detailing",
  "oil change",
  "brake service",
  "diagnostics",
  "dental cleaning",
  "teeth whitening",
  "consultations",
  "catering",
  "private events",
  "delivery",
  "takeout",
  "hair styling",
  "barbering",
  "nails",
  "lashes",
  "facials",
  "massage",
  "renovation",
  "roofing",
  "plumbing",
  "electrical supplies",
  "3d printing",
  "prototyping",
  "custom signage",
  "wedding arrangements",
  "bouquets",
  "pet grooming",
  "veterinary care",
  "tax preparation",
  "bookkeeping",
  "legal consultation",
];

function isNoiseLine(line: string) {
  const value = stripListMarker(line);
  const lower = value.toLowerCase().replace(/[.!]+$/, "");
  const usefulCharacters = value.match(/[a-z]/gi)?.length ?? 0;

  if (!value || usefulCharacters < 3) return true;
  if (noiseLabels.has(lower)) return true;
  if (/^\d{1,2}:\d{2}(?:\s?[ap]m)?$/i.test(value)) return true;
  if (/^\d{1,2}:\d{2}(?:\s?[ap]m)?\s+(?:today|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))/i.test(value)) return true;
  if (/^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,?\s+\d{4})?$/i.test(value)) return true;
  if (/^(?:19|20)\d{2}$/.test(value)) return true;
  if (/^\d{1,2}[/-]\d{1,2}[/-](?:\d{2}|\d{4})$/.test(value)) return true;
  if (/^(?:https?:\/\/|www\.)\S+$/i.test(value)) return true;
  if (/^page\s*[^\w\s]\s*/i.test(value)) return true;
  if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/i.test(value)) return true;
  if (/\b(?:battery|wi-?fi|lte|5g|4g|3g|carrier|signal|airplane mode|no service|charging|verizon|t-mobile|at&t|digicel|flow)\b/i.test(value)) return true;
  if (/\b(?:screenshot|screen shot|image metadata|file name|dimensions|megapixels|edited|saved to photos)\b/i.test(value)) return true;
  if (/^[\d\s.,:;|/\\()[\]{}+%#@!?_-]+$/.test(value)) return true;
  if (usefulCharacters / value.length < 0.35) return true;

  return false;
}

function isLikelyBusinessName(line: string) {
  const value = stripListMarker(line);

  if (isNoiseLine(value)) return false;
  if (value.length < 3 || value.length > 80) return false;
  if (/@|https?:\/\/|www\./i.test(value)) return false;
  if (/^(?:welcome|contact us|learn more|book now|shop now|see all|view all|services?|products?)\b/i.test(value)) return false;
  if (/[.!?]$/.test(value) && value.split(/\s+/).length > 7) return false;
  if (/^\d/.test(value)) return false;

  const words = value.match(/[a-z][a-z'&.-]*/gi) ?? [];
  return words.length >= 1 && words.length <= 10;
}

function scoreBusinessNameCandidate(line: string, index: number) {
  const value = stripListMarker(line);
  const words = value.split(/\s+/).filter(Boolean);
  const titleLike = /^[A-Z0-9][A-Za-z0-9'&.-]*(?:\s+[A-Z0-9][A-Za-z0-9'&.-]*){0,8}$/.test(value);
  const hasBusinessKeyword = businessNameKeywords.test(value);
  const allCaps = /^[A-Z0-9&'. -]+$/.test(value) && /[A-Z]/.test(value);
  const hasLabel = /^(?:business|company|brand|name)\s*[:|-]/i.test(value);
  const sentenceLike = /\b(?:we|our|your|customers|clients|quality|best|affordable)\b/i.test(value) && words.length > 5;
  const tooGeneric = /^(?:official|public figure|local business|community|product\/service|company|business)$/i.test(value);

  if (!isLikelyBusinessName(value) || tooGeneric) return -100;

  return (
    (hasBusinessKeyword ? 16 : 0) +
    (titleLike ? 8 : 0) +
    (allCaps ? 3 : 0) +
    (hasLabel ? 5 : 0) +
    (words.length >= 2 && words.length <= 5 ? 5 : 0) +
    (words.length === 1 && hasBusinessKeyword ? 2 : 0) +
    Math.max(0, 12 - index) -
    (sentenceLike ? 12 : 0)
  );
}

function cleanRawBusinessInfo(raw: string) {
  return splitLines(raw)
    .map(stripListMarker)
    .filter((line) => !isNoiseLine(line))
    .join("\n");
}

function countMatches(value: string, pattern: RegExp) {
  const matches = value.match(pattern);
  return matches?.length ?? 0;
}

function inferCategory(raw: string) {
  const source = normalizeRaw(raw);
  const scored = categorySignals
    .map((signal) => ({
      category: signal.category,
      score: countMatches(source, signal.pattern) * signal.weight,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.category ?? "";
}

function inferName(raw: string) {
  const labeled = valueAfterLabel(raw, ["business name", "company name", "company", "brand name", "brand", "name"]);
  if (labeled) return cleanupBusinessName(labeled);

  const candidates = cleanRawBusinessInfo(raw)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(isLikelyBusinessName)
    .slice(0, 18);

  const bestCandidate = candidates
    .map((line, index) => ({
      line,
      score: scoreBusinessNameCandidate(line, index),
    }))
    .sort((a, b) => b.score - a.score)[0]?.line;

  return bestCandidate ? cleanupBusinessName(bestCandidate) : "";
}

function cleanupBusinessName(value: string) {
  return stripListMarker(value)
    .split(/[|•]/)[0]
    .split(/\s[-–—]\s/)[0]
    .replace(/^business\s*[:-]\s*/i, "")
    .replace(/^company\s*[:-]\s*/i, "")
    .trim()
    .slice(0, 80);
}

function isKnownLocationLine(value: string) {
  const line = stripListMarker(value);
  if (/@|https?:\/\//i.test(line)) return false;

  const hasKnownPlace = knownLocations.some((place) => new RegExp(`\\b${escapeRegExp(place)}\\b`, "i").test(line));
  const hasAddressWord = /\b(?:road|rd\.?|street|st\.?|avenue|ave\.?|lane|ln\.?|drive|dr\.?|plaza|mall|shop|suite|unit|parish)\b/i.test(line);

  return (hasKnownPlace || hasAddressWord) && line.length <= 120;
}

function cleanupLocation(value: string) {
  const line = stripListMarker(value).replace(/\s+/g, " ").trim();
  const parts = line.split(/\s[·•|]\s|\s[-–—]\s|:\s/).map((part) => part.trim()).filter(Boolean);
  const placePart = parts.find((part) => knownLocations.some((place) => new RegExp(`\\b${escapeRegExp(place)}\\b`, "i").test(part)));

  return (placePart || line)
    .replace(/^(?:restaurant|cafe|salon|barber|clinic|auto repair|auto detailing|contractor|florist|business)\s+/i, "")
    .replace(/^[^a-z0-9+]+/i, "")
    .trim()
    .slice(0, 120);
}

function collectBlockAfterLabels(raw: string, labels: string[]) {
  const lines = splitLines(raw);

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    const isLabel = labels.some((label) => new RegExp(`^\\s*${escapeRegExp(label)}\\s*${labelSeparators}?\\s*$`, "i").test(current));
    if (!isLabel) continue;

    const collected: string[] = [];
    for (const line of lines.slice(index + 1, index + 9)) {
      if (/^\s*(?:phone|email|location|address|website|social|hours?|price|notes?)\s*[:\-]/i.test(line)) break;
      const cleaned = stripListMarker(line);
      if (isKnownLocationLine(cleaned)) break;
      if (!cleaned || isNoiseLine(cleaned)) continue;
      collected.push(cleaned);
    }

    if (collected.length) return collected.join(", ");
  }

  return "";
}

function inferServices(raw: string) {
  const labels = [
    "services",
    "products",
    "offers",
    "specialties",
    "specialities",
    "what they do",
    "menu",
    "capabilities",
  ];
  const block = collectBlockAfterLabels(raw, labels);
  if (block) return block;

  const labeled = valueAfterLabel(raw, labels);
  if (labeled) return labeled;

  const normalized = normalizeRaw(raw).toLowerCase();
  const discovered = serviceTerms.filter((term) => normalized.includes(term)).slice(0, 8);
  if (discovered.length) {
    return discovered.map((term) => term.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(", ");
  }

  const serviceLine = splitLines(raw).find((line) => /\b(services?|products?|speciali[sz](?:es|ing)|offers?|menu|capabilities)\b/i.test(line));
  return serviceLine?.replace(/^.*?[:\-]\s*/, "").trim() ?? "";
}

function inferLocation(raw: string) {
  const labeled = valueAfterLabel(raw, ["location", "address", "service area", "based in", "located in", "area"]);
  if (labeled) return cleanupLocation(labeled);

  const lines = splitLines(raw);
  const addressLine = lines.find(isKnownLocationLine);
  if (addressLine && !isNoiseLine(addressLine)) return cleanupLocation(addressLine);

  const source = normalizeRaw(raw);
  const found = knownLocations.find((place) => new RegExp(`\\b${escapeRegExp(place)}\\b`, "i").test(source));
  return found ?? "";
}

function normalizeUrl(value: string) {
  const cleaned = value.trim().replace(/[),.]+$/, "");
  if (!cleaned) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function extractUrls(raw: string) {
  const urlPattern =
    /\b(?:https?:\/\/[^\s<>()\]]+|www\.[^\s<>()\]]+|(?:instagram|facebook|tiktok|linkedin|youtube|x|twitter)\.com\/[^\s<>()\]]+)/gi;
  return Array.from(new Set((normalizeRaw(raw).match(urlPattern) ?? []).map(normalizeUrl).filter(Boolean)));
}

function inferPainPoints(raw: string, website: string, social: string, category: string) {
  const labeled = valueAfterLabel(raw, ["pain points", "issues", "website issue", "opportunity", "problem", "website status"]);
  if (labeled) return labeled;

  const lower = `${raw} ${category}`.toLowerCase();

  if (!website && social) {
    return "The business appears to rely on social/profile information, so customers may not have one clear website path for services, proof, and contact.";
  }

  if (!website) {
    return "No clear website link was included in the supplied business information.";
  }

  if (/(restaurant|cafe|food|catering|bakery)/.test(lower)) {
    return "The customer journey can be improved by making the menu, atmosphere, visit details, and order/reservation path easier to understand.";
  }

  if (/(construction|contractor|auto repair|mechanic|plumbing|electrical|hardware)/.test(lower)) {
    return "The customer journey can be improved by clarifying services, service area, quote expectations, and direct contact options.";
  }

  if (/(clinic|dental|wellness|spa|salon|barber|beauty)/.test(lower)) {
    return "The customer journey can be improved by clarifying service options, appointment flow, preparation details, and trust signals.";
  }

  return "The current online presentation may benefit from clearer mobile calls to action, stronger visual positioning, and a more polished service journey.";
}

export function emptyBusinessInfo(): BusinessInfo {
  return {
    rawInfo: "",
    businessName: "",
    category: "",
    location: "",
    phone: "",
    email: "",
    websiteUrl: "",
    socialUrl: "",
    services: "",
    brandColors: "",
    notes: "",
    painPoints: "",
    packagePrice: "$1,000",
    demoUrl: "",
  };
}

export function parseBusinessInfo(raw: string): Partial<BusinessInfo> {
  const cleanedRaw = cleanRawBusinessInfo(raw);
  const normalized = normalizeRaw(raw);
  const email = firstMatch(normalized, /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/i);
  const urls = extractUrls(normalized);
  const labeledWebsite = normalizeUrl(valueAfterLabel(raw, ["website", "site", "url", "booking link"]));
  const labeledSocial = normalizeUrl(valueAfterLabel(raw, ["social", "instagram", "facebook", "tiktok", "linkedin", "youtube"]));
  const socialUrl =
    labeledSocial ||
    urls.find((url) => /(instagram|facebook|tiktok|linkedin|youtube|x\.com|twitter)\.com/i.test(url)) ||
    "";
  const websiteUrl = labeledWebsite || urls.find((url) => url !== socialUrl) || "";

  const phone =
    valueAfterLabel(raw, ["phone", "whatsapp", "tel", "telephone", "mobile"]) ||
    firstMatch(normalized, /(?:\+?\d[\d\s().-]{7,}\d)/);

  const colors = normalized.match(/#[0-9a-f]{6}\b/gi)?.slice(0, 3).join(", ") ?? "";
  const pageCategory = normalized.match(/^page\s*[^\w\s]\s*([^\n]+)/im)?.[1]?.trim() ?? "";
  const category = valueAfterLabel(raw, ["category", "business type", "industry", "niche"]) || inferCategory([pageCategory, normalized].filter(Boolean).join("\n"));

  return {
    rawInfo: raw,
    businessName: inferName(normalized),
    category,
    location: inferLocation(normalized),
    phone,
    email,
    websiteUrl,
    socialUrl,
    services: inferServices(cleanedRaw || normalized),
    brandColors: valueAfterLabel(raw, ["brand colors", "brand colours", "colours", "colors"]) || colors,
    painPoints: inferPainPoints(normalized, websiteUrl, socialUrl, category),
  };
}
