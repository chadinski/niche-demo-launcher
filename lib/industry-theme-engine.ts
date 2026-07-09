import type { BusinessInfo } from "@/lib/types";

export type GeneralWebsiteCategoryId =
  | "food-hospitality-entertainment"
  | "health-wellness-beauty"
  | "trades-repairs-local-services"
  | "professional-finance-business"
  | "retail-products-ecommerce"
  | "creative-events-personal-brands"
  | "memorial-community-special-purpose";

export type ThemeVariation =
  | "premium"
  | "modern"
  | "local-community"
  | "luxury"
  | "bold-high-energy"
  | "soft-elegant"
  | "corporate";

export interface GeneralWebsiteCategory {
  id: GeneralWebsiteCategoryId;
  label: string;
  examples: string[];
}

export interface CategoryThemeRule {
  mood: string;
  colors: string[];
  typography: string;
  animation: string;
  sectionPriorities: string[];
  ctaStyle: string;
  imageStyle: string;
  trustElements: string[];
  layoutStyle: string;
}

export interface CandidateScore {
  value: string;
  score: number;
  evidence: string[];
}

export interface IndustryClassification {
  primaryIndustry: string;
  secondaryIndustry: string;
  confidence: number;
  category: GeneralWebsiteCategory;
  categoryConfidence: number;
  explanation: string;
  triggeredKeywords: string[];
}

export interface ThemeAssignment {
  variation: ThemeVariation;
  mood: string;
  palette: string[];
  typography: string;
  animation: string;
  sectionPriorities: string[];
  cta: string;
  imageStyle: string;
  trustElements: string[];
  layoutStyle: string;
  notes: string[];
}

export type FieldEvidenceSource = "image" | "ocr" | "user_input" | "inferred" | "fallback";

export interface ExtractedFieldEvidence {
  value: string | string[];
  confidence: number;
  source: FieldEvidenceSource;
  evidence: string[];
  needsReview: boolean;
}

export interface BusinessUnderstanding {
  rawOcrText: string;
  cleanedText: string;
  visualClues: string[];
  businessNameCandidates: CandidateScore[];
  selectedBusinessName: string;
  businessNameConfidence: number;
  businessNameReason: string;
  industry: IndustryClassification;
  theme: ThemeAssignment;
  services: string[];
  contact: {
    phone: string;
    email: string;
    website: string;
    social: string;
    location: string;
  };
  seoKeywords: string[];
  missingInformation: string[];
  assumptions: string[];
  enrichedInfo: Partial<BusinessInfo>;
  fieldEvidence?: {
    businessName: ExtractedFieldEvidence;
    category: ExtractedFieldEvidence;
    location: ExtractedFieldEvidence;
    phone: ExtractedFieldEvidence;
    email: ExtractedFieldEvidence;
    websiteUrl: ExtractedFieldEvidence;
    socialUrl: ExtractedFieldEvidence;
    services: ExtractedFieldEvidence;
    brandColors: ExtractedFieldEvidence;
  };
  reportMarkdown: string;
}

export const generalWebsiteCategories: GeneralWebsiteCategory[] = [
  {
    id: "food-hospitality-entertainment",
    label: "Food, Hospitality & Entertainment",
    examples: ["restaurants", "cafes", "bars", "catering", "hotels", "villas", "event venues", "lounges", "bakeries", "food trucks"],
  },
  {
    id: "health-wellness-beauty",
    label: "Health, Wellness & Beauty",
    examples: ["dentists", "doctors", "clinics", "pharmacies", "gyms", "spas", "salons", "barbers", "nail techs", "therapists"],
  },
  {
    id: "trades-repairs-local-services",
    label: "Trades, Repairs & Local Services",
    examples: ["mechanics", "plumbers", "electricians", "appliance repair", "contractors", "cleaning", "pest control", "landscaping", "AC repair", "locksmiths"],
  },
  {
    id: "professional-finance-business",
    label: "Professional, Finance & Business Services",
    examples: ["accountants", "lawyers", "consultants", "real estate agents", "insurance brokers", "agencies", "recruiters", "business coaches", "logistics consultants"],
  },
  {
    id: "retail-products-ecommerce",
    label: "Retail, Products & E-commerce",
    examples: ["boutiques", "gift shops", "electronics stores", "furniture stores", "cosmetic stores", "hardware stores", "online shops", "product brands"],
  },
  {
    id: "creative-events-personal-brands",
    label: "Creative, Events & Personal Brands",
    examples: ["musicians", "photographers", "videographers", "artists", "DJs", "event planners", "decorators", "influencers", "speakers", "coaches"],
  },
  {
    id: "memorial-community-special-purpose",
    label: "Memorial, Community & Special Purpose",
    examples: ["funeral homes", "memorial pages", "churches", "nonprofits", "schools", "charities", "community organizations", "tribute websites", "cultural organizations"],
  },
];

const categoryById = Object.fromEntries(generalWebsiteCategories.map((category) => [category.id, category])) as Record<GeneralWebsiteCategoryId, GeneralWebsiteCategory>;

export const categoryThemeRules: Record<GeneralWebsiteCategoryId, CategoryThemeRule> = {
  "food-hospitality-entertainment": {
    mood: "Warm, inviting, sensory, appetizing, and social.",
    colors: ["#fff7ed", "#1f130f", "#f97316", "#b91c1c", "#d97706", "#14532d"],
    typography: "Bold display headings with friendly, highly readable body text.",
    animation: "Subtle image reveal, menu card hover, soft ambient gradients.",
    sectionPriorities: ["menu or offer", "food/atmosphere gallery", "hours/location", "reservation or order CTA"],
    ctaStyle: "Order Now, View Menu, Book a Table, Reserve Now, or WhatsApp to Order.",
    imageStyle: "Warm food, dining, venue, or hospitality imagery with real photos preferred.",
    trustElements: ["reviews", "opening hours", "location", "menu clarity", "catering/private event details"],
    layoutStyle: "Menu-forward editorial layout with atmosphere and practical visit details.",
  },
  "health-wellness-beauty": {
    mood: "Clean, calm, trustworthy, polished, and reassuring.",
    colors: ["#ffffff", "#e0f2fe", "#ccfbf1", "#fce7f3", "#e9d5ff", "#1f2937"],
    typography: "Clean sans-serif with elegant headings for beauty and wellness brands.",
    animation: "Soft fade, clean reveal, gentle glow, minimal motion.",
    sectionPriorities: ["services", "appointment path", "staff or care credibility", "preparation details"],
    ctaStyle: "Book Appointment, Schedule Consultation, WhatsApp Us, or View Services.",
    imageStyle: "Bright clinic, spa, salon, staff, or client-care imagery with careful claims.",
    trustElements: ["credentials", "patient/client guidance", "before/after placeholders", "verified reviews"],
    layoutStyle: "Calm split layouts, appointment cards, and reassuring FAQ blocks.",
  },
  "trades-repairs-local-services": {
    mood: "Reliable, strong, practical, fast-response, and trustworthy.",
    colors: ["#ffffff", "#0f172a", "#475569", "#f97316", "#facc15", "#166534"],
    typography: "Strong bold headings with clean readable service copy.",
    animation: "Card lift, route/line motion, industrial grid, subtle tool motif.",
    sectionPriorities: ["service list", "service area", "quote path", "process steps", "proof-ready work"],
    ctaStyle: "Request a Quote, Call Now, Book Service, or Get Emergency Help.",
    imageStyle: "Real work, tools, vehicles, equipment, job sites, and before/after proof.",
    trustElements: ["service area", "response path", "work examples", "licenses/certifications when verified"],
    layoutStyle: "Capability-first layout with strong process and contact modules.",
  },
  "professional-finance-business": {
    mood: "Premium, intelligent, credible, structured, and corporate.",
    colors: ["#ffffff", "#0f172a", "#111827", "#d4af37", "#047857", "#64748b"],
    typography: "Elegant serif or premium sans headings with highly readable body text.",
    animation: "Sleek reveal, subtle data-grid, premium border sheen, clean hover states.",
    sectionPriorities: ["authority", "services", "process", "consultation CTA", "trust indicators"],
    ctaStyle: "Book Consultation, Request Proposal, Start Your Project, or Speak With Us.",
    imageStyle: "Professional office, consultation, documents, property, or team imagery.",
    trustElements: ["credentials", "case-study blocks", "process clarity", "confidentiality notes"],
    layoutStyle: "Structured editorial sections with clear authority hierarchy.",
  },
  "retail-products-ecommerce": {
    mood: "Desirable, stylish, product-focused, and conversion-driven.",
    colors: ["#ffffff", "#111111", "#fce7f3", "#f5f5dc", "#e5e7eb", "#fb7185"],
    typography: "Modern editorial or clean commerce style.",
    animation: "Product card hover, soft sheen, collection reveals.",
    sectionPriorities: ["featured products", "collections", "benefits", "shipping/pickup", "order CTA"],
    ctaStyle: "Shop Now, View Collection, WhatsApp to Order, or Browse Products.",
    imageStyle: "Product-first imagery, collection grids, packaging, lifestyle shots.",
    trustElements: ["pickup/delivery details", "product quality", "social proof", "return/order instructions"],
    layoutStyle: "Commerce-led cards and collection modules with strong product hierarchy.",
  },
  "creative-events-personal-brands": {
    mood: "Expressive, cinematic, artistic, premium, and personality-driven.",
    colors: ["#050505", "#ffffff", "#d6b56d", "#6d28d9", "#e11d48", "#2563eb"],
    typography: "Expressive display headings with editorial layout and dramatic spacing.",
    animation: "Cinematic reveals, spotlight gradients, floating motifs, media-first motion.",
    sectionPriorities: ["portfolio", "media", "booking", "story", "social links"],
    ctaStyle: "Book Now, View Portfolio, Watch Reel, Schedule Event, or Contact for Booking.",
    imageStyle: "Portfolio, stage, event, creative process, or personal-brand imagery.",
    trustElements: ["featured work", "event dates", "media links", "booking availability"],
    layoutStyle: "Portfolio-first sequencing with cinematic gallery and booking modules.",
  },
  "memorial-community-special-purpose": {
    mood: "Respectful, warm, calm, dignified, and human.",
    colors: ["#fffaf0", "#dbeafe", "#b8a47a", "#dbe7dd", "#ffffff", "#30343b"],
    typography: "Elegant serif headings with soft readable body text.",
    animation: "Very subtle fade, soft light movement, minimal motion.",
    sectionPriorities: ["story/tribute", "support details", "gallery", "event or donation information"],
    ctaStyle: "View Tribute, Share Memory, Support the Family, Contact Us, or Learn More.",
    imageStyle: "Gentle, dignified, community, tribute, school, church, or nonprofit imagery.",
    trustElements: ["event details", "support routes", "community proof", "verified organization details"],
    layoutStyle: "Measured story-led layout with restrained visual pressure.",
  },
};

export const colorPalettePresets = {
  warmFood: ["#fff7ed", "#7c2d12", "#f97316", "#b91c1c"],
  cleanCare: ["#ffffff", "#0f766e", "#38bdf8", "#ccfbf1"],
  practicalTrades: ["#f8fafc", "#0f172a", "#f97316", "#475569"],
  corporateTrust: ["#ffffff", "#0f172a", "#d4af37", "#64748b"],
  productEditorial: ["#ffffff", "#111111", "#fce7f3", "#fb7185"],
  cinematicCreative: ["#050505", "#ffffff", "#6d28d9", "#e11d48"],
  dignifiedMemorial: ["#fffaf0", "#30343b", "#b8a47a", "#dbe7dd"],
};

export const themeVariationRules: Record<ThemeVariation, string[]> = {
  premium: ["premium", "exclusive", "signature", "studio", "bespoke", "concierge"],
  modern: ["modern", "digital", "online", "tech", "studio", "solutions"],
  "local-community": ["local", "family", "community", "jamaica", "parish", "neighborhood"],
  luxury: ["luxury", "villa", "fine", "elite", "boutique", "private", "seafood"],
  "bold-high-energy": ["gym", "fitness", "music", "dj", "bar", "grill", "jerk", "chicken", "sports", "performance"],
  "soft-elegant": ["spa", "beauty", "salon", "dental", "clinic", "memorial", "wellness", "floral", "wedding"],
  corporate: ["accounting", "law", "finance", "insurance", "consulting", "logistics"],
};

type IndustryRule = {
  industry: string;
  category: GeneralWebsiteCategoryId;
  keywords: string[];
};

export const industryKeywordMap: IndustryRule[] = [
  { industry: "restaurant", category: "food-hospitality-entertainment", keywords: ["restaurant", "menu", "jerk", "chicken", "seafood", "lunch", "dinner", "cuisine", "catering", "grill", "food", "order", "reservation"] },
  { industry: "hotel or venue", category: "food-hospitality-entertainment", keywords: ["hotel", "villa", "venue", "lounge", "rooms", "book a stay", "event venue"] },
  { industry: "dentist or clinic", category: "health-wellness-beauty", keywords: ["dental", "dentist", "clinic", "doctor", "patient", "medical", "pharmacy", "appointment", "health"] },
  { industry: "salon or beauty", category: "health-wellness-beauty", keywords: ["salon", "barber", "hair", "nails", "lashes", "spa", "beauty", "facial", "massage", "wellness"] },
  { industry: "fitness or wellness", category: "health-wellness-beauty", keywords: ["gym", "fitness", "trainer", "yoga", "therapy", "coach", "wellness"] },
  { industry: "mechanic or auto repair", category: "trades-repairs-local-services", keywords: ["mechanic", "auto repair", "garage", "brakes", "engine", "diagnostic", "oil change", "vehicle", "transmission"] },
  { industry: "trades or contractor", category: "trades-repairs-local-services", keywords: ["plumber", "electrician", "contractor", "construction", "roofing", "repair", "cleaning", "pest", "landscaping", "ac repair", "locksmith"] },
  { industry: "professional service", category: "professional-finance-business", keywords: ["accounting", "accountant", "law", "lawyer", "attorney", "consulting", "insurance", "finance", "realtor", "real estate"] },
  { industry: "courier or logistics service", category: "professional-finance-business", keywords: ["courier", "logistics", "same-day", "route", "routes", "dispatch", "delivery service", "business delivery"] },
  { industry: "retail or product brand", category: "retail-products-ecommerce", keywords: ["boutique", "shop", "store", "collection", "products", "cosmetics", "furniture", "electronics", "hardware", "cart"] },
  { industry: "creative or event brand", category: "creative-events-personal-brands", keywords: ["music", "musician", "artist", "dj", "photography", "photographer", "videographer", "portfolio", "decor", "event planner", "speaker", "influencer"] },
  { industry: "memorial or community organization", category: "memorial-community-special-purpose", keywords: ["funeral", "memorial", "tribute", "obituary", "burial", "cremation", "church", "nonprofit", "charity", "school", "community", "ministry"] },
  { industry: "3d printing or product studio", category: "retail-products-ecommerce", keywords: ["3d printing", "prototype", "fabrication", "custom product", "signage", "laser", "cnc", "print shop"] },
];

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function splitUsefulLines(value: string) {
  const seen = new Set<string>();
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => normalizeText(line))
    .filter((line) => {
      if (!line || line.length < 2) return false;
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function scoreKeywordMatches(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  const matched = keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
  return { score: matched.reduce((total, keyword) => total + Math.max(4, keyword.length / 2), 0), matched };
}

function extractDomainName(value: string) {
  const match = value.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+)\.(?:com|net|org|co|biz|shop|store|ja)\b/i);
  return match?.[1]?.replace(/[-_]+/g, " ") ?? "";
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function scoreBusinessNameCandidate(value: string, index: number, allText: string): CandidateScore {
  const cleaned = normalizeText(value)
    .replace(/^[@#]+/, "")
    .replace(/^(business name|company|brand|name)\s*[:|-]\s*/i, "")
    .replace(/\s+\|\s+.*$/, "")
    .trim();
  const evidence: string[] = [];
  let score = 0;

  if (!cleaned || cleaned.length < 2 || cleaned.length > 80) return { value: cleaned, score: -20, evidence: ["Rejected: length or empty value."] };
  if (/^(home|menu|posts|reviews|photos|follow|message|call|directions|website|services|products|shop now|book consultation|book appointment|call now|order now|view menu|learn more|contact us)$/i.test(cleaned)) {
    return { value: cleaned, score: -20, evidence: ["Rejected: common interface label."] };
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length <= 6) {
    score += 15;
    evidence.push("Short enough to be a brand or page title.");
  }
  if (/^[A-Z0-9][A-Za-z0-9'&.-]*(?:\s+[A-Z0-9][A-Za-z0-9'&.-]*){0,7}$/.test(cleaned)) {
    score += 14;
    evidence.push("Title-case/page-title pattern.");
  }
  if (/(studio|salon|clinic|dental|auto|care|restaurant|cafe|bar|grill|boutique|accounting|tax|logistics|courier|construction|memorial|funeral|music|flor|print|shop|solutions|services|group|company|co\.?|ltd\.?)/i.test(cleaned)) {
    score += 16;
    evidence.push("Contains business-name keyword.");
  }
  const repetitions = allText.toLowerCase().split(cleaned.toLowerCase()).length - 1;
  if (repetitions > 1) {
    score += Math.min(16, repetitions * 4);
    evidence.push(`Repeated ${repetitions} times in OCR text.`);
  }
  score += Math.max(0, 12 - index);
  if (index < 4) evidence.push("Appears near the top/header OCR region.");
  if (/@|https?:\/\//i.test(cleaned)) score -= 10;
  if (/[.!?]$/.test(cleaned) && words.length > 5) score -= 12;

  return { value: cleaned, score, evidence };
}

export function detectBusinessNameCandidates(rawText: string, knownUrls: string[] = []): CandidateScore[] {
  const lines = splitUsefulLines(rawText);
  const allText = lines.join("\n");
  const candidates = lines.slice(0, 18).map((line, index) => scoreBusinessNameCandidate(line, index, allText));

  for (const domain of knownUrls.map(extractDomainName).filter(Boolean)) {
    candidates.push({
      value: titleCase(domain),
      score: 26,
      evidence: ["Derived from visible website or email domain."],
    });
  }

  return candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .filter((candidate, index, all) => all.findIndex((item) => item.value.toLowerCase() === candidate.value.toLowerCase()) === index)
    .slice(0, 8);
}

export function classifyIndustryFromExtractedText(text: string, visualClues: string[] = []): IndustryClassification {
  const source = `${text}\n${visualClues.join("\n")}`;
  const scored = industryKeywordMap
    .map((rule) => {
      const result = scoreKeywordMatches(source, rule.keywords);
      return { ...rule, score: result.score, matched: result.matched };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored.find((item) => item.industry !== best?.industry);
  const fallback = categoryById["professional-finance-business"];

  if (!best) {
    return {
      primaryIndustry: "local business",
      secondaryIndustry: "",
      confidence: 42,
      category: fallback,
      categoryConfidence: 38,
      explanation: "No strong industry signal was found. Assigned a broad professional/local business category for review.",
      triggeredKeywords: [],
    };
  }

  const confidence = Math.min(96, Math.round(48 + best.score * 2.4));

  return {
    primaryIndustry: best.industry,
    secondaryIndustry: second?.industry ?? "",
    confidence,
    category: categoryById[best.category],
    categoryConfidence: Math.max(45, Math.min(96, confidence - (second && second.score > best.score * 0.65 ? 12 : 0))),
    explanation: `${best.industry} selected from OCR/visual context keywords: ${best.matched.join(", ")}.`,
    triggeredKeywords: best.matched,
  };
}

export function assignCategory(classification: IndustryClassification) {
  return classification.category;
}

export function selectTheme(classification: IndustryClassification, text: string, brandColors = ""): ThemeAssignment {
  const rules = categoryThemeRules[classification.category.id];
  const lower = text.toLowerCase();
  const variationScores = Object.entries(themeVariationRules)
    .map(([variation, keywords]) => ({
      variation: variation as ThemeVariation,
      score: keywords.filter((keyword) => lower.includes(keyword)).length,
    }))
    .sort((a, b) => b.score - a.score);
  const topVariationScore = variationScores[0]?.score ?? 0;
  let variation: ThemeVariation = topVariationScore ? variationScores[0].variation : classification.category.id === "professional-finance-business" ? "corporate" : "modern";
  const scoreFor = (candidate: ThemeVariation) => variationScores.find((item) => item.variation === candidate)?.score ?? 0;
  if (classification.category.id === "professional-finance-business" && scoreFor("corporate") >= topVariationScore) {
    variation = "corporate";
  }
  if (classification.category.id === "health-wellness-beauty" && scoreFor("soft-elegant") >= topVariationScore && scoreFor("soft-elegant") > 0) {
    variation = "soft-elegant";
  }
  if (classification.category.id === "memorial-community-special-purpose" && scoreFor("soft-elegant") > topVariationScore) {
    variation = "soft-elegant";
  }
  const suppliedPalette = brandColors.match(/#[0-9a-f]{6}\b/gi) ?? [];
  const palette = suppliedPalette.length ? suppliedPalette.slice(0, 4) : rules.colors.slice(0, 4);

  return {
    variation,
    mood: rules.mood,
    palette,
    typography: rules.typography,
    animation: rules.animation,
    sectionPriorities: rules.sectionPriorities,
    cta: rules.ctaStyle.split(",")[0],
    imageStyle: rules.imageStyle,
    trustElements: rules.trustElements,
    layoutStyle: rules.layoutStyle,
    notes: [
      `Seven-category theme: ${classification.category.label}.`,
      `Variation selected: ${variation}.`,
      suppliedPalette.length ? "Using colors sampled or supplied from the source image." : "Using category palette because no reliable brand palette was supplied.",
    ],
  };
}

export function generateThemeNotes(theme: ThemeAssignment) {
  return [
    `Mood: ${theme.mood}`,
    `Palette: ${theme.palette.join(", ")}`,
    `Typography: ${theme.typography}`,
    `Animation: ${theme.animation}`,
    `Sections: ${theme.sectionPriorities.join(", ")}`,
    `CTA: ${theme.cta}`,
  ].join("\n");
}

function extractContacts(rawText: string, info?: Partial<BusinessInfo>) {
  const phone = info?.phone || rawText.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || "";
  const email = info?.email || rawText.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/i)?.[0] || "";
  const urls = rawText.match(/\b(?:https?:\/\/[^\s<>()\]]+|www\.[^\s<>()\]]+)/gi) ?? [];
  return {
    phone,
    email,
    website: info?.websiteUrl || urls.find((url) => !/(instagram|facebook|tiktok|linkedin|youtube|twitter|x\.com)/i.test(url)) || "",
    social: info?.socialUrl || urls.find((url) => /(instagram|facebook|tiktok|linkedin|youtube|twitter|x\.com)/i.test(url)) || "",
    location: info?.location || "",
  };
}

function extractServices(rawText: string, classification: IndustryClassification, existing = "") {
  if (existing.trim()) return existing.split(/,|\n|\u2022|\||;/).map((item) => normalizeText(item)).filter(Boolean).slice(0, 8);

  const source = rawText.toLowerCase();
  const serviceWords = industryKeywordMap
    .find((rule) => rule.industry === classification.primaryIndustry)
    ?.keywords
    .filter((keyword) => source.includes(keyword)) ?? [];

  return [...new Set(serviceWords)].slice(0, 8).map(titleCase);
}

function inferVisualClues(rawText: string, brandColors = "", imageName = "") {
  const source = `${rawText} ${imageName}`.toLowerCase();
  const clues: string[] = [];
  const clueMap: Array<[string, RegExp]> = [
    ["food/menu imagery or menu context", /\b(menu|food|plate|jerk|chicken|seafood|cuisine|catering|lunch|dinner)\b/],
    ["vehicle/garage context", /\b(vehicle|car|auto|mechanic|garage|brake|engine|diagnostic)\b/],
    ["medical/dental/appointment context", /\b(dental|clinic|doctor|patient|appointment|pharmacy|medical)\b/],
    ["beauty/hair/nail/spa context", /\b(salon|barber|hair|nail|lashes|spa|beauty|facial)\b/],
    ["construction/tools/trades context", /\b(construction|tools|contractor|plumbing|electrical|roofing|repair)\b/],
    ["memorial/community context", /\b(funeral|memorial|tribute|church|nonprofit|school|community)\b/],
    ["product grid/shop context", /\b(shop|store|product|collection|boutique|cart|order|delivery)\b/],
    ["portfolio/media context", /\b(portfolio|music|artist|photography|video|dj|booking|event)\b/],
  ];

  for (const [label, pattern] of clueMap) {
    if (pattern.test(source)) clues.push(label);
  }
  if (brandColors) clues.push(`sampled or supplied colors: ${brandColors}`);
  if (imageName) clues.push(`image filename/context: ${imageName}`);
  if (!clues.length) clues.push("No strong visual clue available without object-recognition vision; classification relies on OCR and supplied metadata.");
  return clues;
}

function seoKeywordsFor(name: string, classification: IndustryClassification, services: string[], location: string) {
  return [
    name,
    classification.primaryIndustry,
    classification.category.label,
    ...services.slice(0, 5),
    location,
    location && `${classification.primaryIndustry} ${location}`,
  ].filter(Boolean);
}

function missingInfoFor(info: Partial<BusinessInfo>, understandingName: string, services: string[]) {
  return [
    !understandingName && "Business name needs human review.",
    !info.phone && !info.email && !info.socialUrl && "No reliable contact route found.",
    !info.location && "Location or service area not confirmed.",
    !services.length && "Services/products need confirmation.",
    !info.websiteUrl && "No existing website link found.",
    "Verified testimonials, awards, prices, credentials, and final photography are not assumed.",
  ].filter(Boolean) as string[];
}

function markdownList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None found";
}

export function analyzeBusinessScreenshot(input: {
  rawOcrText: string;
  parsedInfo?: Partial<BusinessInfo>;
  brandColors?: string;
  imageName?: string;
}): BusinessUnderstanding {
  const cleanedText = splitUsefulLines(input.rawOcrText).join("\n");
  const contact = extractContacts(input.rawOcrText, input.parsedInfo);
  const knownUrls = [contact.website, contact.social, contact.email.split("@")[1] ?? ""].filter(Boolean);
  const businessNameCandidates = detectBusinessNameCandidates(input.rawOcrText, knownUrls);
  const selectedCandidate = businessNameCandidates[0];
  const visualClues = inferVisualClues(input.rawOcrText, input.brandColors || input.parsedInfo?.brandColors || "", input.imageName);
  const industry = classifyIndustryFromExtractedText(`${input.rawOcrText}\n${input.parsedInfo?.category ?? ""}\n${input.parsedInfo?.services ?? ""}`, visualClues);
  const theme = selectTheme(industry, input.rawOcrText, input.brandColors || input.parsedInfo?.brandColors || "");
  const services = extractServices(input.rawOcrText, industry, input.parsedInfo?.services);
  const selectedBusinessName = input.parsedInfo?.businessName || selectedCandidate?.value || "";
  const businessNameConfidence = input.parsedInfo?.businessName ? Math.max(68, selectedCandidate?.score ?? 68) : Math.min(96, Math.max(22, selectedCandidate?.score ?? 22));
  const seoKeywords = seoKeywordsFor(selectedBusinessName || "Your Business Name", industry, services, contact.location);
  const missingInformation = missingInfoFor(input.parsedInfo ?? {}, selectedBusinessName, services);
  const assumptions = [
    industry.confidence < 65 ? "Industry confidence is moderate/low and should be reviewed before outreach." : "",
    businessNameConfidence < 55 ? "Business name confidence is low; using best candidate or neutral placeholder." : "",
    "Visual clue analysis is deterministic and based on OCR context, filename, and sampled colors; no external object-recognition model is used.",
  ].filter(Boolean);
  const enrichedInfo: Partial<BusinessInfo> = {
    businessName: selectedBusinessName || "Your Business Name",
    category: industry.primaryIndustry,
    services: services.join(", "),
    brandColors: (input.parsedInfo?.brandColors || input.brandColors || theme.palette.slice(1, 3).join(", ")).trim(),
    phone: contact.phone,
    email: contact.email,
    websiteUrl: contact.website,
    socialUrl: contact.social,
    location: contact.location,
    painPoints:
      input.parsedInfo?.painPoints ||
      (industry.confidence < 65
        ? "Business identity or industry classification needs human review before final outreach."
        : "The website opportunity is to present the business with clearer services, category-fit visuals, and a stronger contact path."),
  };

  const reportMarkdown = `# Business Intelligence Report

## Raw OCR Text
\`\`\`text
${input.rawOcrText || "No OCR text supplied."}
\`\`\`

## Cleaned Extracted Text
\`\`\`text
${cleanedText || "No cleaned text available."}
\`\`\`

## Business Name Candidates
${businessNameCandidates.map((candidate) => `- ${candidate.value} (${candidate.score}/100): ${candidate.evidence.join("; ")}`).join("\n") || "- No confident name candidates found."}

## Selected Business Name
- Name: ${selectedBusinessName || "Your Business Name"}
- Confidence: ${businessNameConfidence}/100
- Reason: ${input.parsedInfo?.businessName ? "Parser supplied a business name and candidate scoring supported or accepted it." : selectedCandidate?.evidence.join("; ") || "No reliable candidate found; neutral placeholder required."}

## Industry Classification
- Primary industry: ${industry.primaryIndustry}
- Secondary industry: ${industry.secondaryIndustry || "None"}
- Confidence: ${industry.confidence}/100
- Seven-category assignment: ${industry.category.label}
- Category confidence: ${industry.categoryConfidence}/100
- Explanation: ${industry.explanation}
- Triggered keywords: ${industry.triggeredKeywords.join(", ") || "None"}

## Visual Context Clues
${markdownList(visualClues)}

## Recommended Design Theme
${generateThemeNotes(theme)}

## Recommended Website Sections
${markdownList(theme.sectionPriorities)}

## Recommended CTA
- ${theme.cta}

## Extracted Services / Products
${markdownList(services)}

## Contact / Location
- Phone: ${contact.phone || "Missing"}
- Email: ${contact.email || "Missing"}
- Website: ${contact.website || "Missing"}
- Social: ${contact.social || "Missing"}
- Location: ${contact.location || "Missing"}

## SEO Keyword Suggestions
${markdownList(seoKeywords)}

## Missing Information
${markdownList(missingInformation)}

## Assumptions Made
${markdownList(assumptions)}
`;

  return {
    rawOcrText: input.rawOcrText,
    cleanedText,
    visualClues,
    businessNameCandidates,
    selectedBusinessName,
    businessNameConfidence,
    businessNameReason: input.parsedInfo?.businessName ? "Parser supplied a business name." : selectedCandidate?.evidence.join("; ") || "Low-confidence placeholder.",
    industry,
    theme,
    services,
    contact,
    seoKeywords,
    missingInformation,
    assumptions,
    enrichedInfo,
    reportMarkdown,
  };
}
