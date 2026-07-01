import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildPlannerPrompt, type BusinessData, type WebsitePlan, type WebsitePlanSection } from "@/lib/ai/prompts/planner";
import { buildQAPrompt, type SectionQAResult } from "@/lib/ai/prompts/qa";
import { buildSectionPrompt } from "@/lib/ai/prompts/section";
import { getRoutesForStage, runWithModelRouteRetry, type ModelRoute } from "@/lib/ai/modelRouter";
import { getArchetypeById, getArchetypeForIndustry, type Archetype } from "@/lib/archetypes";
import { buildDesignTokensFromArchetype, type DesignTokenPreferences, type DesignTokens } from "@/lib/design/tokens";
import { fetchDesignInspiration } from "@/lib/inspiration/firecrawl";

const businessInfoSchema = z.object({
  rawInfo: z.string().default(""),
  businessName: z.string().default(""),
  category: z.string().default(""),
  location: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  websiteUrl: z.string().default(""),
  socialUrl: z.string().default(""),
  services: z.string().default(""),
  brandColors: z.string().default(""),
  notes: z.string().default(""),
  painPoints: z.string().default(""),
  packagePrice: z.string().default(""),
  demoUrl: z.string().default(""),
});

const requestSchema = z.object({
  generationId: z.string().min(1).max(80).optional(),
  info: businessInfoSchema.optional().default(() => businessInfoSchema.parse({})),
  business: z.object({
    name: z.string().min(1).max(180),
    description: z.string().max(4000).default(""),
    targetAudience: z.string().max(1200).default(""),
    differentiators: z.array(z.string().max(240)).default([]),
    brandPersonality: z.string().max(600).optional(),
  }).optional(),
  visualPreferences: z.unknown().optional(),
  generationMode: z.string().max(80).optional().default("standard"),
  imageName: z.string().max(180).optional().default(""),
  businessUnderstanding: z.unknown().optional(),
  archetypeId: z.string().min(1).max(80).optional(),
});

type CleanBusinessData = {
  companyName: string;
  businessType: string;
  visibleDescription: string;
  services: string[];
  products: string[];
  phone: string;
  email: string;
  websiteUrl: string;
  address: string;
  city: string;
  country: string;
  socialLinks: string[];
  visibleColors: string[];
  visualEvidence: string[];
  logoDescription: string;
  sourceImageName: string;
  targetAudience: string;
  brandTone: string;
  missingFields: string[];
  dataConfidence: number;
  unsafeOrUnverifiedClaims: string[];
  verifiedFacts: string[];
  rawExtractedData: string;
};

type SeraphimIndustryBrief = {
  id: string;
  name: string;
  matchedSignals: string[];
  visualThesis: string;
  pageStory: string[];
  sectionGuidance: string[];
  imageStrategy: string[];
  copyRules: string[];
  qaPriorities: string[];
  brief: string;
};

type QualityGate = {
  score: number;
  passed: boolean;
  dimensionScores: Record<string, number>;
  rejectionReasons: string[];
  revisionBrief: string;
  source: "model" | "heuristic" | "combined";
};

type StageMetadata = {
  stage: string;
  provider: string;
  model: string;
  fallback: boolean;
};

type GenerationPlanResponse = {
  generationId: string;
  stage: "planning";
  summary: string;
  sectionIds: string[];
  premiumPlan: WebsitePlan;
  archetype?: {
    id: string;
    name: string;
    tone: string;
    sectionOrder: string[];
    qaChecks: string[];
  };
  seraphimGenerator: {
    authority: string;
    industryBrief: string;
    industryName: string;
    matchedSignals: string[];
  };
  qualityGate?: QualityGate;
  revisionCount?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function splitList(value: string, limit = 12) {
  return unique(value.split(/[,;\n|]+/).map((item) => item.replace(/^[\-*]\s*/, "").trim())).slice(0, limit);
}

function stringList(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];
  return unique(value.filter((item): item is string => typeof item === "string")).slice(0, limit);
}

function compactBusinessFacts(info: z.infer<typeof businessInfoSchema>) {
  const rows = [
    ["Business", info.businessName],
    ["Category", info.category],
    ["Location", info.location],
    ["Phone", info.phone],
    ["Email", info.email],
    ["Website", info.websiteUrl],
    ["Social", info.socialUrl],
    ["Services", info.services],
    ["Brand colors", info.brandColors],
    ["Observed opportunity", info.painPoints],
    ["Internal notes", info.notes],
    ["Package price", info.packagePrice],
    ["Demo URL", info.demoUrl],
  ]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`);

  if (info.rawInfo.trim()) rows.push(`Raw source notes:\n${info.rawInfo.trim().slice(0, 6000)}`);

  return rows.join("\n") || "No business facts supplied.";
}

function modeDirection(mode: string) {
  switch (mode) {
    case "more-luxury":
      return "Push the result more editorial, spacious, refined, and luxury-service. Use restraint, strong typography, composed imagery, and premium proof framing.";
    case "more-local":
      return "Make the result warmer, more neighborhood-rooted, practical, and easy to contact while preserving polish.";
    case "more-bold":
      return "Make the result more dramatic, modern, energetic, and visually confident without becoming gimmicky.";
    default:
      return "Balanced premium: custom, polished, conversion-focused, and industry-specific.";
  }
}

function compactText(value: string, maxLength = 800) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function buildCleanBusinessData(input: z.infer<typeof requestSchema>): CleanBusinessData {
  const { info, businessUnderstanding } = input;
  const understanding = isRecord(businessUnderstanding) ? businessUnderstanding : {};
  const industry = isRecord(understanding.industry) ? understanding.industry : {};
  const theme = isRecord(understanding.theme) ? understanding.theme : {};
  const contact = isRecord(understanding.contact) ? understanding.contact : {};
  const services = unique([...splitList(info.services), ...stringList(understanding.services)]).slice(0, 14);
  const visibleColors = unique([...splitList(info.brandColors, 8), ...stringList(theme.palette, 8)]).slice(0, 8);
  const visualEvidence = unique([
    ...stringList(understanding.visualClues, 14),
    asString(theme.mood),
    asString(theme.imageStyle),
    asString(theme.layoutStyle),
    asString(theme.typography),
    ...stringList(theme.notes, 8),
  ]).slice(0, 18);
  const missingFromUnderstanding = stringList(understanding.missingInformation, 12);
  const assumptions = stringList(understanding.assumptions, 12);
  const category = info.category.trim() || asString(industry.primaryIndustry) || asString(industry.businessModel);
  const location = info.location.trim() || asString(contact.location);
  const locationParts = location.split(",").map((part) => part.trim()).filter(Boolean);
  const phone = info.phone.trim() || asString(contact.phone);
  const email = info.email.trim() || asString(contact.email);
  const websiteUrl = info.websiteUrl.trim() || asString(contact.website);
  const socialLinks = unique([info.socialUrl.trim(), asString(contact.social)]).filter((item) => /^https?:\/\//i.test(item));
  const confidenceValues = [
    typeof understanding.businessNameConfidence === "number" ? understanding.businessNameConfidence : null,
    isRecord(understanding.industry) && typeof understanding.industry.confidence === "number" ? understanding.industry.confidence : null,
  ].filter((item): item is number => typeof item === "number");
  const dataConfidence = confidenceValues.length
    ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length)
    : Math.max(45, Math.min(88, 45 + [info.businessName, category, location, phone || email, services.join(", ")].filter(Boolean).length * 8));

  const missingFields = unique([
    ...missingFromUnderstanding,
    !phone ? "phone" : "",
    !email ? "email" : "",
    !location ? "service area or location" : "",
    !services.length ? "services or products" : "",
    !visibleColors.length ? "brand colors" : "",
    "verified reviews/testimonials",
    "verified awards/certifications",
    "verified business photography",
  ]);

  const verifiedFacts = [
    info.businessName.trim() ? `Business name: ${info.businessName.trim()}` : "",
    category ? `Business type: ${category}` : "",
    location ? `Location/service area: ${location}` : "",
    phone ? "Phone available" : "",
    email ? "Email available" : "",
    websiteUrl ? "Website URL available" : "",
    socialLinks.length ? "Social profile available" : "",
    services.length ? `Visible services/products: ${services.join(", ")}` : "",
    visibleColors.length ? `Visible colors: ${visibleColors.join(", ")}` : "",
    visualEvidence.length ? `Screenshot/reference visual evidence: ${visualEvidence.join("; ")}` : "",
  ].filter(Boolean);

  return {
    companyName: info.businessName.trim() || asString(understanding.selectedBusinessName) || "Demo Business",
    businessType: category || "Local business",
    visibleDescription: compactText([info.notes, info.painPoints, info.rawInfo].filter(Boolean).join(" "), 900),
    services,
    products: [],
    phone,
    email,
    websiteUrl,
    address: location,
    city: locationParts[0] || "",
    country: locationParts.length > 1 ? locationParts[locationParts.length - 1] : "",
    socialLinks,
    visibleColors,
    visualEvidence,
    logoDescription: compactText([asString(theme.logo), ...visualEvidence].filter(Boolean).join("; "), 620),
    sourceImageName: input.imageName || "",
    targetAudience: location ? `Customers in or near ${location} looking for ${category || "this service"}.` : `Customers looking for ${category || "this service"}.`,
    brandTone: compactText([asString(theme.mood), asString(theme.variation), modeDirection(input.generationMode)].filter(Boolean).join(" "), 520),
    missingFields,
    dataConfidence,
    unsafeOrUnverifiedClaims: unique([
      ...assumptions,
      "Do not invent testimonials, ratings, awards, certifications, prices, guarantees, customer counts, or years in business.",
      "Do not present representative imagery or placeholder proof as verified business evidence.",
    ]),
    verifiedFacts,
    rawExtractedData: compactBusinessFacts(info).slice(0, 8000),
  };
}

function safeDebug(generationId: string, label: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[premium-generation:${generationId}] ${label}`, data);
}

const industryBriefs = [
  {
    id: "hospitality-food",
    name: "Hospitality and Food",
    keywords: ["restaurant", "cafe", "bar", "grill", "catering", "bakery", "food", "menu", "dining", "kitchen", "lunch", "dinner"],
    visualThesis: "Sensory invitation: food-first imagery, warm atmosphere, tactile surfaces, local character, and a fast visit/call/order path.",
    pageStory: ["Appetite and location", "Cuisine or offer clarity", "Menu or availability confirmation", "Atmosphere or food proof", "Visit/contact decision"],
    sectionGuidance: ["Use food, atmosphere, location, and call/order/reserve logic as the story spine.", "Do not invent menu items, hours, reviews, delivery, reservations, or prices.", "If the menu is unknown, group sections around call-to-confirm meal occasions."],
    imageStrategy: ["Use real supplied food or restaurant imagery first.", "Use representative food/hospitality imagery only with honest captions.", "Avoid luxury dining imagery for casual/local restaurants unless the brand supports it."],
    copyRules: ["Write sensory but factual copy.", "Use call-first language when menu/hours are unknown.", "Preserve cuisine, address, and phone exactly."],
    qaPriorities: ["first-screen appetite", "clear visit/contact path", "no invented menu or ratings"],
  },
  {
    id: "auto-service",
    name: "Automotive Service",
    keywords: ["auto", "automotive", "mechanic", "detailing", "car wash", "garage", "vehicle", "tire", "tyre", "repair", "roadside"],
    visualThesis: "Capable vehicle care: practical confidence, finish or repair clarity, strong contact paths, and road-ready visual energy.",
    pageStory: ["Vehicle need", "Service scope", "Care/process", "Visual work proof", "Quote or call"],
    sectionGuidance: ["Let the type of auto business decide the tone: luxury detailing can be editorial, repair should be practical and direct.", "Do not invent certifications, warranties, emergency coverage, or turnaround claims."],
    imageStrategy: ["Use vehicle, shop, tool, finish, diagnostic, or road imagery that matches the actual service.", "Before/after framing requires real or clearly representative labeling."],
    copyRules: ["Write around safety, clarity, pride of ownership, or convenience according to the offer.", "Keep contact and estimate language specific."],
    qaPriorities: ["phone-first CTA", "service clarity", "no fake guarantees/certifications"],
  },
  {
    id: "care-wellness",
    name: "Care, Health, Wellness, and Pet Services",
    keywords: ["clinic", "medical", "doctor", "health", "dental", "wellness", "therapy", "spa", "pet", "grooming", "care"],
    visualThesis: "Calm trust: gentle hierarchy, approachable surfaces, readable copy, preparation clarity, and low-stress contact.",
    pageStory: ["Who is cared for", "Services or care options", "Comfort and preparation", "Verified trust facts", "Appointment/enquiry"],
    sectionGuidance: ["Use calm, spacious layouts and explicit next-step guidance.", "Do not invent practitioners, credentials, medical claims, outcomes, reviews, or pet-care guarantees."],
    imageStrategy: ["Use real facility/team/patient/pet imagery when supplied.", "Use representative care imagery carefully, without implying actual staff or outcomes."],
    copyRules: ["Keep claims conservative and helpful.", "Explain what to ask or bring when booking details are unknown."],
    qaPriorities: ["factual safety", "calm mobile flow", "appointment/enquiry clarity"],
  },
  {
    id: "professional-trust",
    name: "Professional, Legal, Finance, and Consulting",
    keywords: ["law", "legal", "attorney", "finance", "insurance", "consulting", "accounting", "professional", "advisor", "agency"],
    visualThesis: "Composed authority: crisp hierarchy, restrained color, proof from verified facts, and consultation-first structure.",
    pageStory: ["Problem and audience", "Expertise areas", "Process/fit", "Verified credibility", "Consultation"],
    sectionGuidance: ["Favor measured copy and clear segmentation over decorative novelty.", "Do not invent credentials, case results, client names, confidentiality promises, or financial outcomes."],
    imageStrategy: ["Use workspace, documents, city, team, or abstract professional detail imagery that does not imply false staff/client relationships."],
    copyRules: ["Make expertise clear without overclaiming.", "Use consultation language when pricing/process is unknown."],
    qaPriorities: ["credibility", "no unsupported outcomes", "clear consultation path"],
  },
  {
    id: "trades-home-local",
    name: "Trades, Home Services, Retail, and Local Services",
    keywords: ["construction", "contractor", "plumbing", "electrical", "windows", "doors", "awning", "home", "retail", "store", "supplier", "repair", "installation", "service"],
    visualThesis: "Practical capability: visible craft, service-area clarity, quote-ready details, durable design, and easy contact.",
    pageStory: ["Service need", "Capabilities", "Process/scope", "Work or product proof", "Quote/contact"],
    sectionGuidance: ["Group services around customer intent and quote readiness.", "Do not invent licenses, insurance, warranties, project counts, supplier relationships, or timelines."],
    imageStrategy: ["Use materials, tools, finished work, storefront, product shelves, job sites, or process detail imagery."],
    copyRules: ["Ask for scope, location, timing, and contact details.", "Keep claims concrete and practical."],
    qaPriorities: ["quote clarity", "service area", "visible capability"],
  },
  {
    id: "creative-beauty-events",
    name: "Creative, Beauty, Fashion, Events, and Portfolio",
    keywords: ["salon", "beauty", "fashion", "artist", "music", "event", "florist", "photography", "portfolio", "creative"],
    visualThesis: "Expressive taste with conversion discipline: editorial composition, portfolio energy, clear booking/collaboration paths.",
    pageStory: ["Creative identity", "Services/occasions", "Portfolio or visual direction", "Process/booking fit", "Enquiry"],
    sectionGuidance: ["Let visuals lead, but keep booking practical.", "Do not invent client names, press, event history, transformations, or availability."],
    imageStrategy: ["Use real work first; otherwise representative imagery must be labeled and style-matched."],
    copyRules: ["Write with personality but avoid unsupported prestige claims.", "Make booking details and unknowns explicit."],
    qaPriorities: ["visual originality", "booking clarity", "no fake portfolio proof"],
  },
  {
    id: "digital-platform",
    name: "Digital Products, Apps, and Marketplaces",
    keywords: ["app", "software", "platform", "marketplace", "saas", "digital", "download", "google play", "web application"],
    visualThesis: "Product clarity: interface-led storytelling, audience segmentation, feature flow, status honesty, and direct signup/download/contact.",
    pageStory: ["Product promise", "User/provider paths", "Feature flow", "Availability/status", "Conversion"],
    sectionGuidance: ["Use product/interface concepts only for digital products.", "Do not invent live features, store URLs, user counts, integrations, or metrics."],
    imageStrategy: ["Use real screenshots when supplied; otherwise label interface visuals as concepts."],
    copyRules: ["Separate current facts from planned or placeholder functionality.", "Make download/signup links honest."],
    qaPriorities: ["product status clarity", "no fake metrics", "audience path clarity"],
  },
];

function buildSeraphimIndustryBrief(cleanBusinessData: CleanBusinessData): SeraphimIndustryBrief {
  const searchText = [
    cleanBusinessData.businessType,
    cleanBusinessData.visibleDescription,
    cleanBusinessData.targetAudience,
    ...cleanBusinessData.services,
    ...cleanBusinessData.products,
    cleanBusinessData.rawExtractedData,
  ].join(" ").toLowerCase();

  const scored = industryBriefs
    .map((brief) => ({
      brief,
      matchedSignals: brief.keywords.filter((keyword) => searchText.includes(keyword)),
    }))
    .sort((a, b) => b.matchedSignals.length - a.matchedSignals.length);

  const selected = scored.find((item) => item.matchedSignals.length > 0) ?? {
    brief: industryBriefs[4],
    matchedSignals: ["general local business"],
  };

  const { brief, matchedSignals } = selected;
  const formatted = [
    `Seraphim industry brief: ${brief.name} (${brief.id}).`,
    `Matched signals: ${matchedSignals.join(", ")}.`,
    `Visual thesis: ${brief.visualThesis}`,
    "Page story guidance:",
    ...brief.pageStory.map((item) => `- ${item}`),
    "Section guidance:",
    ...brief.sectionGuidance.map((item) => `- ${item}`),
    "Image strategy:",
    ...brief.imageStrategy.map((item) => `- ${item}`),
    "Copy rules:",
    ...brief.copyRules.map((item) => `- ${item}`),
    "QA priorities:",
    ...brief.qaPriorities.map((item) => `- ${item}`),
  ].join("\n");

  return {
    id: brief.id,
    name: brief.name,
    matchedSignals,
    visualThesis: brief.visualThesis,
    pageStory: brief.pageStory,
    sectionGuidance: brief.sectionGuidance,
    imageStrategy: brief.imageStrategy,
    copyRules: brief.copyRules,
    qaPriorities: brief.qaPriorities,
    brief: formatted,
  };
}

function parseJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object found.");
  return JSON.parse(fenced.slice(start, end + 1)) as unknown;
}

function extractHtml(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced || text).trim();
  const start = candidate.search(/<!doctype html|<html/i);
  return start >= 0 ? candidate.slice(start).trim() : candidate;
}

function normalizeHtml(html: string) {
  let output = extractHtml(html);

  if (!/<!doctype html/i.test(output)) {
    output = `<!DOCTYPE html>\n${output}`;
  }

  if (!/<meta\s+name=["']robots["']/i.test(output)) {
    output = output.replace(/<head[^>]*>/i, (match) => `${match}\n  <meta name="robots" content="noindex, nofollow">`);
  }

  if (!/<meta\s+name=["']generator["']\s+content=["']Seraphim Generator["']/i.test(output)) {
    output = output.replace(/<head[^>]*>/i, (match) => `${match}\n  <meta name="generator" content="Seraphim Generator">`);
  }

  if (!/data-seraphim-generator=["']true["']/i.test(output)) {
    output = output.replace(/<body\b([^>]*)>/i, (_match, attrs: string) => `<body${attrs} data-seraphim-generator="true">`);
  }

  if (!/<\/html>\s*$/i.test(output)) {
    throw new Error("AI website generator did not return a complete HTML document.");
  }

  if (!/<style[\s>]/i.test(output) || !/<body[\s>]/i.test(output)) {
    throw new Error("AI website generator returned incomplete HTML.");
  }

  return output;
}

async function generateTextWithGemini(
  prompt: string,
  route: ModelRoute,
  options: { temperature?: number; maxOutputTokens?: number } = {},
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(route.model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.78,
          topP: 0.92,
          maxOutputTokens: options.maxOutputTokens ?? 50000,
          responseMimeType: "text/plain",
        },
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Gemini website generation failed.");
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text.trim()) throw new Error("Gemini did not return output.");

  return text;
}

async function generateTextWithOpenAI(prompt: string, route: ModelRoute, maxOutputTokens = 30000) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: route.model,
    input: prompt,
    max_output_tokens: maxOutputTokens,
  });

  if (!response.output_text?.trim()) {
    throw new Error("OpenAI did not return output.");
  }

  return response.output_text;
}

async function generateTextWithRoute(prompt: string, route: ModelRoute, options: { temperature?: number; maxOutputTokens?: number } = {}) {
  return route.provider === "gemini"
    ? generateTextWithGemini(prompt, route, options)
    : generateTextWithOpenAI(prompt, route, options.maxOutputTokens ?? 30000);
}

function generationIdFromBody(parsedId?: string) {
  return parsedId || globalThis.crypto?.randomUUID?.() || `generation-${Date.now()}`;
}

function withLegacyInfo(data: z.infer<typeof requestSchema>): z.infer<typeof requestSchema> {
  if (!data.business) return data;

  const business = data.business;
  const businessNotes = [
    business.description,
    business.targetAudience ? `Target audience: ${business.targetAudience}` : "",
    business.brandPersonality ? `Brand personality: ${business.brandPersonality}` : "",
    business.differentiators.length ? `Differentiators: ${business.differentiators.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  return {
    ...data,
    info: {
      ...data.info,
      businessName: data.info.businessName || business.name,
      rawInfo: [data.info.rawInfo, businessNotes].filter(Boolean).join("\n\n"),
      notes: [data.info.notes, businessNotes].filter(Boolean).join("\n\n"),
      painPoints: data.info.painPoints || business.targetAudience,
      services: data.info.services || business.differentiators.join(", "),
      category: data.info.category || business.description.split(/[.\n]/)[0]?.slice(0, 120) || "Local business",
    },
  };
}

function coerceVisualPreferences(value: unknown): DesignTokenPreferences {
  return isRecord(value) ? value as DesignTokenPreferences : {};
}

function resolveArchetype(data: z.infer<typeof requestSchema>, cleanBusinessData: CleanBusinessData): Archetype {
  const selected = data.archetypeId ? getArchetypeById(data.archetypeId) : undefined;
  if (selected) return selected;

  const industrySignals = unique([
    cleanBusinessData.businessType,
    data.info.category,
    ...cleanBusinessData.services,
    ...cleanBusinessData.products,
    cleanBusinessData.visibleDescription,
    cleanBusinessData.targetAudience,
  ]);

  return getArchetypeForIndustry(industrySignals.join(" "));
}

function buildTokensForGeneration(archetype: Archetype, preferences: unknown): DesignTokens {
  return buildDesignTokensFromArchetype(archetype, coerceVisualPreferences(preferences));
}

function businessDataFromCleanData(cleanBusinessData: CleanBusinessData, structured?: BusinessData): BusinessData {
  return {
    name: structured?.name || cleanBusinessData.companyName,
    description: structured?.description || cleanBusinessData.visibleDescription || cleanBusinessData.rawExtractedData,
    targetAudience: structured?.targetAudience || cleanBusinessData.targetAudience,
    differentiators: structured?.differentiators?.length
      ? structured.differentiators
      : unique([
          ...cleanBusinessData.services.slice(0, 5),
          ...cleanBusinessData.verifiedFacts.slice(0, 5),
          cleanBusinessData.brandTone,
        ]).slice(0, 8),
    brandPersonality: structured?.brandPersonality || cleanBusinessData.brandTone,
  };
}

function fallbackWebsitePlan(business: BusinessData, tokens: DesignTokens, archetype?: Archetype): WebsitePlan {
  const fallbackSections = archetype?.sectionOrder.length
    ? archetype.sectionOrder.slice(0, 9).map((name, index) => ({
        name,
        goal: index === 0
          ? "Orient the visitor, communicate the offer, and present the primary CTA."
          : `Support the ${archetype.name} conversion story with a premium ${name.toLowerCase()} section.`,
        order: index + 1,
      }))
    : [
        { name: "Hero", goal: "Orient the visitor, communicate the offer, and present the primary CTA.", order: 1 },
        { name: "Trust Bridge", goal: "Use verified facts and safe reassurance to reduce uncertainty.", order: 2 },
        { name: "Services", goal: "Explain the visible services or differentiators around customer intent.", order: 3 },
        { name: "Experience", goal: "Tell the business-specific story and emotional value.", order: 4 },
        { name: "Showcase", goal: "Use niche-relevant visuals or representative imagery to make the offer tangible.", order: 5 },
        { name: "FAQ", goal: "Answer practical decision blockers without inventing facts.", order: 6 },
        { name: "Contact", goal: "End with a low-friction conversion path.", order: 7 },
      ];

  return {
    colorPalette: {
      primary: tokens.colors.primary,
      secondary: tokens.colors.secondary,
      accent: tokens.colors.accent,
      neutral: tokens.colors.neutral[900] || "#0F172A",
      rationale: "Use the configured brand palette as a premium foundation while preserving readable contrast.",
    },
    typography: {
      heading: tokens.fonts.heading,
      body: tokens.fonts.body,
      rationale: "Use a strong heading voice with a clean body face for premium readability.",
    },
    layoutPhilosophy: archetype?.tone
      ? `Build a custom, mobile-first landing page with ${archetype.tone}`
      : "Build a custom, mobile-first landing page with a cinematic hero, varied section rhythm, and clear conversion momentum.",
    visualThesis: `Make ${business.name} feel specific, credible, and visually memorable from the first viewport.`,
    sections: fallbackSections,
    conversionFlow: archetype
      ? `Attention, ${archetype.name.toLowerCase()} relevance, credibility, offer clarity, visual confidence, objection handling, contact.`
      : "Attention, relevance, credibility, offer clarity, visual confidence, objection handling, contact.",
  };
}

function normalizeWebsitePlan(value: unknown, fallback: WebsitePlan): WebsitePlan {
  if (!isRecord(value)) return fallback;
  const palette = isRecord(value.colorPalette) ? value.colorPalette : {};
  const typography = isRecord(value.typography) ? value.typography : {};
  const sections = Array.isArray(value.sections)
    ? value.sections
        .filter(isRecord)
        .map((section, index) => ({
          name: asString(section.name) || `Section ${index + 1}`,
          goal: asString(section.goal) || "Support the conversion story.",
          order: typeof section.order === "number" ? section.order : index + 1,
        }))
        .filter((section) => section.name && section.goal)
        .slice(0, 10)
    : fallback.sections;

  return {
    colorPalette: {
      primary: asString(palette.primary) || fallback.colorPalette.primary,
      secondary: asString(palette.secondary) || fallback.colorPalette.secondary,
      accent: asString(palette.accent) || fallback.colorPalette.accent,
      neutral: asString(palette.neutral) || fallback.colorPalette.neutral,
      rationale: asString(palette.rationale) || fallback.colorPalette.rationale,
    },
    typography: {
      heading: asString(typography.heading) || fallback.typography.heading,
      body: asString(typography.body) || fallback.typography.body,
      rationale: asString(typography.rationale) || fallback.typography.rationale,
    },
    layoutPhilosophy: asString(value.layoutPhilosophy) || fallback.layoutPhilosophy,
    visualThesis: asString(value.visualThesis) || fallback.visualThesis,
    sections: sections.length >= 4 ? sections.sort((a, b) => a.order - b.order) : fallback.sections,
    conversionFlow: asString(value.conversionFlow) || fallback.conversionFlow,
  };
}

async function generateWebsitePlanFromPrompt(
  business: BusinessData,
  tokens: DesignTokens,
  inspiration: string,
  generationId: string,
  archetype?: Archetype,
) {
  const fallback = fallbackWebsitePlan(business, tokens, archetype);
  const prompt = buildPlannerPrompt(business, tokens, inspiration, archetype);
  const errors: string[] = [];

  for (const route of getRoutesForStage("planning")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        generateTextWithRoute(prompt, route, { temperature: 0.45, maxOutputTokens: 8000 }),
      );
      return {
        plan: normalizeWebsitePlan(parseJsonObject(text), fallback),
        metadata: { stage: "planning", provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  safeDebug(generationId, "planner-fallback", { errors: errors.slice(-3) });
  return {
    plan: fallback,
    metadata: { stage: "planning", provider: "local", model: "fallback-section-plan", fallback: true } satisfies StageMetadata,
    errors,
  };
}

function extractSectionFragment(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  return fenced.trim().replace(/<\/?(?:html|head|body)[^>]*>/gi, "").trim();
}

function fallbackSectionHtml(section: WebsitePlanSection, business: BusinessData) {
  const slug = section.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
  return `<section id="${slug}" class="seraphim-section section-${slug}">
  <div class="section-inner">
    <p class="eyebrow">${section.name}</p>
    <h2>${section.goal}</h2>
    <p>${business.description || `${business.name} website section prepared from verified business details.`}</p>
  </div>
</section>`;
}

async function generateSectionHtmlFromPrompt(input: {
  business: BusinessData;
  section: WebsitePlanSection;
  plan: WebsitePlan;
  tokens: DesignTokens;
  inspiration: string;
  archetype?: Archetype;
  correctiveFeedback?: string[];
}) {
  const prompt = buildSectionPrompt(
    { ...input.section, correctiveFeedback: input.correctiveFeedback },
    input.plan,
    input.tokens,
    input.inspiration,
    input.archetype,
  );
  const errors: string[] = [];

  for (const route of getRoutesForStage("section")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        generateTextWithRoute(prompt, route, { temperature: 0.7, maxOutputTokens: 14000 }),
      );
      return {
        html: extractSectionFragment(text),
        metadata: { stage: `section:${input.section.name}`, provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  return {
    html: fallbackSectionHtml(input.section, input.business),
    metadata: { stage: `section:${input.section.name}`, provider: "local", model: "fallback-section-html", fallback: true } satisfies StageMetadata,
    errors,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTokenCss(tokens: DesignTokens, plan: WebsitePlan) {
  const neutral = tokens.colors.neutral;
  return `:root {
  --color-primary: ${plan.colorPalette.primary || tokens.colors.primary};
  --color-secondary: ${plan.colorPalette.secondary || tokens.colors.secondary};
  --color-accent: ${plan.colorPalette.accent || tokens.colors.accent};
  --color-neutral: ${plan.colorPalette.neutral || neutral[900] || "#0F172A"};
  --color-bg: ${neutral[50] || "#F8FAFC"};
  --color-surface: #ffffff;
  --color-text: ${neutral[900] || "#0F172A"};
  --color-muted: ${neutral[600] || "#475569"};
  --seraphim-primary: var(--color-primary);
  --seraphim-secondary: var(--color-secondary);
  --seraphim-accent: var(--color-accent);
  --seraphim-neutral: var(--color-neutral);
  --seraphim-bg: var(--color-bg);
  --seraphim-surface: var(--color-surface);
  --seraphim-text: var(--color-text);
  --seraphim-muted: var(--color-muted);
  --font-heading: ${tokens.fonts.heading};
  --font-body: ${tokens.fonts.body};
  --seraphim-heading-font: var(--font-heading);
  --seraphim-body-font: var(--font-body);
  --radius-sm: ${tokens.borderRadius.sm};
  --radius-md: ${tokens.borderRadius.md};
  --radius-lg: ${tokens.borderRadius.lg};
  --radius-xl: ${tokens.borderRadius.xl};
  --shadow-md: ${tokens.shadows.md};
  --shadow-lg: ${tokens.shadows.lg};
  --space-base: ${tokens.spacing.base};
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  line-height: 1.6;
  overflow-x: hidden;
}
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; }
.seraphim-site { min-height: 100vh; }
.seraphim-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem clamp(1rem, 4vw, 3rem);
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid color-mix(in srgb, var(--color-neutral) 14%, transparent);
}
.seraphim-brand { font-family: var(--font-heading); font-weight: 800; letter-spacing: -0.04em; }
.seraphim-nav { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.9rem; }
.seraphim-menu-toggle {
  display: none;
  border: 1px solid color-mix(in srgb, var(--color-neutral) 18%, transparent);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0.65rem 0.9rem;
  font: inherit;
  cursor: pointer;
}
.seraphim-section { padding: clamp(4rem, 8vw, 8rem) clamp(1rem, 4vw, 3rem); }
.section-inner { width: min(1120px, 100%); margin: 0 auto; }
.eyebrow { color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.75rem; font-weight: 800; }
h1, h2, h3 { font-family: var(--font-heading); line-height: 1.05; letter-spacing: -0.045em; }
h1 { font-size: clamp(3rem, 9vw, 7.5rem); }
h2 { font-size: clamp(2rem, 5vw, 4.5rem); }
.seraphim-footer { padding: 2rem clamp(1rem, 4vw, 3rem); background: var(--color-neutral); color: white; }
.seraphim-footer-inner { width: min(1120px, 100%); margin: 0 auto; display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
button, .button, .btn, [role="button"] { min-height: 44px; }
@media (max-width: 720px) {
  .seraphim-header { align-items: flex-start; flex-direction: column; }
  .seraphim-header-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .seraphim-menu-toggle { display: inline-flex; align-items: center; justify-content: center; }
  .seraphim-nav { display: none; width: 100%; flex-direction: column; }
  .seraphim-nav[data-open="true"] { display: flex; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}`;
}

function buildJsonLd(cleanBusinessData: CleanBusinessData) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: cleanBusinessData.companyName,
    description: cleanBusinessData.visibleDescription || cleanBusinessData.businessType,
  };
  if (cleanBusinessData.phone) data.telephone = cleanBusinessData.phone;
  if (cleanBusinessData.email) data.email = cleanBusinessData.email;
  if (cleanBusinessData.websiteUrl) data.url = cleanBusinessData.websiteUrl;
  if (cleanBusinessData.address) data.address = cleanBusinessData.address;
  if (cleanBusinessData.socialLinks.length) data.sameAs = cleanBusinessData.socialLinks;
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
}

function assembleFullHtml(input: {
  business: BusinessData;
  cleanBusinessData: CleanBusinessData;
  tokens: DesignTokens;
  plan: WebsitePlan;
  sections: string[];
}) {
  const title = `${input.business.name} | ${input.cleanBusinessData.businessType}`;
  const description = compactText(input.business.description || input.plan.conversionFlow || input.cleanBusinessData.visibleDescription, 155);
  const bodyStyle = [
    `--seraphim-primary:${input.plan.colorPalette.primary || input.tokens.colors.primary}`,
    `--seraphim-secondary:${input.plan.colorPalette.secondary || input.tokens.colors.secondary}`,
    `--seraphim-accent:${input.plan.colorPalette.accent || input.tokens.colors.accent}`,
    `--seraphim-heading-font:${input.tokens.fonts.heading}`,
    `--seraphim-body-font:${input.tokens.fonts.body}`,
  ].join(";");
  const navLinks = input.plan.sections
    .slice(0, 6)
    .map((section) => {
      const id = section.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return `<a href="#${id}">${escapeHtml(section.name)}</a>`;
    })
    .join("");

  return normalizeHtml(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="generator" content="Seraphim Generator">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="${escapeHtml(input.plan.colorPalette.primary || input.tokens.colors.primary)}">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232B5E8C'/%3E%3Ctext x='50%25' y='56%25' text-anchor='middle' font-size='32' fill='white' font-family='Arial'%3ES%3C/text%3E%3C/svg%3E">
  <script type="application/ld+json">${buildJsonLd(input.cleanBusinessData)}</script>
  <style>${buildTokenCss(input.tokens, input.plan)}</style>
</head>
<body data-seraphim-generator="true" style="${escapeHtml(bodyStyle)}">
  <div class="seraphim-site">
    <header class="seraphim-header">
      <div class="seraphim-header-row">
        <a class="seraphim-brand" href="#">${escapeHtml(input.business.name)}</a>
        <button class="seraphim-menu-toggle" type="button" aria-controls="seraphim-primary-nav" aria-expanded="false">Menu</button>
      </div>
      <nav id="seraphim-primary-nav" class="seraphim-nav" aria-label="Primary navigation">${navLinks}</nav>
    </header>
    <main>
      ${input.sections.join("\n\n")}
    </main>
    <footer class="seraphim-footer">
      <div class="seraphim-footer-inner">
        <strong>${escapeHtml(input.business.name)}</strong>
        <span>${escapeHtml(input.cleanBusinessData.phone || input.cleanBusinessData.email || "Contact details to confirm before launch")}</span>
      </div>
    </footer>
  </div>
  <script>
    const menuToggle = document.querySelector('.seraphim-menu-toggle');
    const primaryNav = document.querySelector('#seraphim-primary-nav');
    menuToggle?.addEventListener('click', () => {
      const open = primaryNav?.getAttribute('data-open') === 'true';
      primaryNav?.setAttribute('data-open', String(!open));
      menuToggle.setAttribute('aria-expanded', String(!open));
    });
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
          primaryNav?.setAttribute('data-open', 'false');
          menuToggle?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  </script>
</body>
</html>`);
}

function normalizeSectionQA(value: unknown, fallbackIssues: string[] = []): SectionQAResult {
  if (!isRecord(value)) return { passed: fallbackIssues.length === 0, issues: fallbackIssues };
  return {
    passed: Boolean(value.passed),
    issues: stringList(value.issues, 20),
  };
}

function heuristicSectionIssues(html: string) {
  const issues: string[] = [];
  const visibleText = html
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  if (!/<title>/i.test(html) || !/meta\s+name=["']description/i.test(html)) issues.push("Missing core SEO metadata.");
  if (!/<script[^>]+type=["']application\/ld\+json["']/i.test(html)) issues.push("Missing JSON-LD schema.");
  if (!/data-seraphim-generator=["']true["']/i.test(html)) issues.push("Missing Seraphim output signature.");
  if (!/<section\b/i.test(html)) issues.push("No meaningful sections were generated.");
  if ((html.match(/<section\b/gi) ?? []).length < 6) issues.push("Generated page has fewer than 6 meaningful sections.");
  if (/<meta\s+name=["']keywords["']/i.test(html)) issues.push("Meta keywords are not allowed.");
  if (/(five-star|5-star|award-winning|guaranteed|certified|\b\d+ reviews\b|\b\d+\+ customers\b)/i.test(html)) {
    issues.push("Potential fabricated proof or unsupported metrics found.");
  }
  if (/\bplaceholder\b|lorem ipsum|TODO|\[[A-Z][^\]]{2,60}\]/i.test(visibleText)) issues.push("Placeholder content found.");
  return issues;
}

async function runSectionQA(fullHtml: string, archetype?: Archetype) {
  const heuristicIssues = heuristicSectionIssues(fullHtml);
  const errors: string[] = [];

  for (const route of getRoutesForStage("qa")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        generateTextWithRoute(buildQAPrompt(fullHtml, archetype), route, { temperature: 0.15, maxOutputTokens: 3000 }),
      );
      const modelQa = normalizeSectionQA(parseJsonObject(text), heuristicIssues);
      const issues = unique([...heuristicIssues, ...modelQa.issues]);
      return {
        qa: { passed: modelQa.passed && issues.length === 0, issues } satisfies SectionQAResult,
        metadata: { stage: "qa", provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  return {
    qa: { passed: heuristicIssues.length === 0, issues: heuristicIssues } satisfies SectionQAResult,
    metadata: { stage: "qa", provider: "local", model: "heuristic-section-qa", fallback: true } satisfies StageMetadata,
    errors,
  };
}

function sectionNamesForIssues(sections: WebsitePlanSection[], issues: string[]) {
  const issueText = issues.join(" ").toLowerCase();
  const matched = sections.filter((section) => issueText.includes(section.name.toLowerCase()));
  return matched.length ? matched : sections.slice(0, Math.min(3, sections.length));
}

function qualityGateFromSectionQA(qa: SectionQAResult): QualityGate {
  const score = qa.passed ? 9 : Math.max(5, 8 - qa.issues.length * 0.4);
  return {
    score: Number(score.toFixed(1)),
    passed: qa.passed,
    dimensionScores: {
      visualPremiumFeel: qa.passed ? 9 : 7,
      visualMagnetism: qa.passed ? 9 : 7,
      brandSpecificity: qa.passed ? 9 : 7,
      sectionDepth: qa.passed ? 9 : 7,
      conversionClarity: qa.passed ? 9 : 7,
      seoCompleteness: qa.issues.some((issue) => /seo|meta/i.test(issue)) ? 6 : 9,
      mobileResponsiveness: qa.issues.some((issue) => /mobile|overflow/i.test(issue)) ? 6 : 9,
      imageQuality: qa.passed ? 9 : 7,
      interactionQuality: qa.passed ? 9 : 7,
      factualSafety: qa.issues.some((issue) => /fake|fabricated|unsupported/i.test(issue)) ? 5 : 9,
      codeCleanliness: qa.passed ? 9 : 7,
    },
    rejectionReasons: qa.issues,
    revisionBrief: qa.issues.length ? `Fix section QA issues: ${qa.issues.join(" ")}` : "Passed section QA.",
    source: "combined",
  };
}

function buildGenerationPlanResponse(input: {
  generationId: string;
  plan: WebsitePlan;
  industryBrief: SeraphimIndustryBrief;
  archetype?: Archetype;
  qualityGate?: QualityGate;
  revisionCount?: number;
}): GenerationPlanResponse {
  return {
    generationId: input.generationId,
    stage: "planning",
    summary: input.plan.layoutPhilosophy,
    sectionIds: input.plan.sections.map((section) => section.name),
    premiumPlan: input.plan,
    archetype: input.archetype ? {
      id: input.archetype.id,
      name: input.archetype.name,
      tone: input.archetype.tone,
      sectionOrder: input.archetype.sectionOrder,
      qaChecks: input.archetype.qaChecks,
    } : undefined,
    seraphimGenerator: {
      authority: "only-website-generation-system",
      industryBrief: input.industryBrief.id,
      industryName: input.industryBrief.name,
      matchedSignals: input.industryBrief.matchedSignals,
    },
    qualityGate: input.qualityGate,
    revisionCount: input.revisionCount,
  };
}

function buildGenerationResponse(input: {
  generationId: string;
  pipeline: Awaited<ReturnType<typeof runSectionGenerationPipeline>>;
  cleanBusinessData: CleanBusinessData;
  industryBrief: SeraphimIndustryBrief;
  pipelineMetadata: StageMetadata[];
}) {
  const qualityGate = qualityGateFromSectionQA(input.pipeline.qa);
  const modelMetadata = input.pipeline.metadata.find((item) => item.stage.startsWith("section:")) ??
    input.pipeline.metadata[input.pipeline.metadata.length - 1];
  const generationPlan = buildGenerationPlanResponse({
    generationId: input.generationId,
    plan: input.pipeline.plan,
    industryBrief: input.industryBrief,
    archetype: input.pipeline.archetype,
    qualityGate,
    revisionCount: input.pipeline.revisionCount,
  });

  return {
    generationId: input.generationId,
    html: input.pipeline.html,
    plan: input.pipeline.plan,
    qa: input.pipeline.qa,
    designTokens: input.pipeline.tokens,
    modelMetadata,
    pipelineModelMetadata: input.pipelineMetadata,
    cleanedBusinessData: input.cleanBusinessData,
    archetype: input.pipeline.archetype ? {
      id: input.pipeline.archetype.id,
      name: input.pipeline.archetype.name,
      tone: input.pipeline.archetype.tone,
      sectionOrder: input.pipeline.archetype.sectionOrder,
      qaChecks: input.pipeline.archetype.qaChecks,
    } : undefined,
    generationPlan,
    qualityGate,
    warning: input.pipeline.qa.passed
      ? undefined
      : "Generated website returned the best available attempt after archetype QA retries.",
  };
}

async function runSectionGenerationPipeline(input: {
  data: z.infer<typeof requestSchema>;
  cleanBusinessData: CleanBusinessData;
  generationId: string;
}) {
  const archetype = resolveArchetype(input.data, input.cleanBusinessData);
  const tokens = buildTokensForGeneration(archetype, input.data.visualPreferences);
  const business = businessDataFromCleanData(input.cleanBusinessData, input.data.business);
  const inspiration = await fetchDesignInspiration(input.cleanBusinessData.businessType);
  const planResult = await generateWebsitePlanFromPrompt(business, tokens, inspiration, input.generationId, archetype);
  const metadata: StageMetadata[] = [planResult.metadata];
  const sectionResults = new Map<string, string>();

  for (const section of planResult.plan.sections) {
    const result = await generateSectionHtmlFromPrompt({
      business,
      section,
      plan: planResult.plan,
      tokens,
      inspiration,
      archetype,
    });
    sectionResults.set(section.name, result.html);
    metadata.push(result.metadata);
  }

  let html = assembleFullHtml({
    business,
    cleanBusinessData: input.cleanBusinessData,
    tokens,
    plan: planResult.plan,
    sections: planResult.plan.sections.map((section) => sectionResults.get(section.name) || fallbackSectionHtml(section, business)),
  });
  let qaResult = await runSectionQA(html, archetype);
  metadata.push(qaResult.metadata);
  let revisionCount = 0;

  while (!qaResult.qa.passed && revisionCount < 2 && qaResult.qa.issues.length) {
    revisionCount += 1;
    const sectionsToRegenerate = sectionNamesForIssues(planResult.plan.sections, qaResult.qa.issues);
    for (const section of sectionsToRegenerate) {
      const result = await generateSectionHtmlFromPrompt({
        business,
        section,
        plan: planResult.plan,
        tokens,
        inspiration,
        archetype,
        correctiveFeedback: qaResult.qa.issues,
      });
      sectionResults.set(section.name, result.html);
      metadata.push({ ...result.metadata, stage: `revision:${section.name}` });
    }
    html = assembleFullHtml({
      business,
      cleanBusinessData: input.cleanBusinessData,
      tokens,
      plan: planResult.plan,
      sections: planResult.plan.sections.map((section) => sectionResults.get(section.name) || fallbackSectionHtml(section, business)),
    });
    qaResult = await runSectionQA(html, archetype);
    metadata.push({ ...qaResult.metadata, stage: `qa:retry-${revisionCount}` });
  }

  return {
    html,
    plan: planResult.plan,
    qa: qaResult.qa,
    metadata,
    revisionCount,
    business,
    tokens,
    archetype,
    inspiration,
  };
}

async function streamSectionGenerationPipeline(input: {
  data: z.infer<typeof requestSchema>;
  cleanBusinessData: CleanBusinessData;
  industryBrief: SeraphimIndustryBrief;
  generationId: string;
  send: (event: Record<string, unknown>) => void;
}) {
  const archetype = resolveArchetype(input.data, input.cleanBusinessData);
  const tokens = buildTokensForGeneration(archetype, input.data.visualPreferences);
  const business = businessDataFromCleanData(input.cleanBusinessData, input.data.business);
  const inspiration = await fetchDesignInspiration(input.cleanBusinessData.businessType);
  const planResult = await generateWebsitePlanFromPrompt(business, tokens, inspiration, input.generationId, archetype);
  const metadata: StageMetadata[] = [planResult.metadata];
  const sectionResults = new Map<string, string>();
  const earlyGenerationPlan = buildGenerationPlanResponse({
    generationId: input.generationId,
    plan: planResult.plan,
    industryBrief: input.industryBrief,
    archetype,
  });

  input.send({
    type: "plan",
    plan: planResult.plan,
    generationPlan: earlyGenerationPlan,
    designTokens: tokens,
    archetype: {
      id: archetype.id,
      name: archetype.name,
      tone: archetype.tone,
      sectionOrder: archetype.sectionOrder,
      qaChecks: archetype.qaChecks,
    },
  });

  for (const [index, section] of planResult.plan.sections.entries()) {
    const result = await generateSectionHtmlFromPrompt({
      business,
      section,
      plan: planResult.plan,
      tokens,
      inspiration,
      archetype,
    });
    sectionResults.set(section.name, result.html);
    metadata.push(result.metadata);
    input.send({
      type: "section",
      index,
      html: result.html,
      sectionName: section.name,
      modelMetadata: result.metadata,
    });
  }

  let html = assembleFullHtml({
    business,
    cleanBusinessData: input.cleanBusinessData,
    tokens,
    plan: planResult.plan,
    sections: planResult.plan.sections.map((section) => sectionResults.get(section.name) || fallbackSectionHtml(section, business)),
  });
  let qaResult = await runSectionQA(html, archetype);
  metadata.push(qaResult.metadata);
  let revisionCount = 0;
  input.send({
    type: "qa",
    result: qaResult.qa,
    qualityGate: qualityGateFromSectionQA(qaResult.qa),
    modelMetadata: qaResult.metadata,
  });

  while (!qaResult.qa.passed && revisionCount < 2 && qaResult.qa.issues.length) {
    revisionCount += 1;
    const sectionsToRegenerate = sectionNamesForIssues(planResult.plan.sections, qaResult.qa.issues);
    for (const section of sectionsToRegenerate) {
      const index = planResult.plan.sections.findIndex((candidate) => candidate.name === section.name);
      const result = await generateSectionHtmlFromPrompt({
        business,
        section,
        plan: planResult.plan,
        tokens,
        inspiration,
        archetype,
        correctiveFeedback: qaResult.qa.issues,
      });
      sectionResults.set(section.name, result.html);
      metadata.push({ ...result.metadata, stage: `revision:${section.name}` });
      input.send({
        type: "section",
        index,
        html: result.html,
        sectionName: section.name,
        revision: revisionCount,
        modelMetadata: result.metadata,
      });
    }
    html = assembleFullHtml({
      business,
      cleanBusinessData: input.cleanBusinessData,
      tokens,
      plan: planResult.plan,
      sections: planResult.plan.sections.map((section) => sectionResults.get(section.name) || fallbackSectionHtml(section, business)),
    });
    qaResult = await runSectionQA(html, archetype);
    metadata.push({ ...qaResult.metadata, stage: `qa:retry-${revisionCount}` });
    input.send({
      type: "qa",
      result: qaResult.qa,
      qualityGate: qualityGateFromSectionQA(qaResult.qa),
      modelMetadata: qaResult.metadata,
      revision: revisionCount,
    });
  }

  return {
    html,
    plan: planResult.plan,
    qa: qaResult.qa,
    metadata,
    revisionCount,
    business,
    tokens,
    archetype,
    inspiration,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        generationId: isRecord(body) ? asString(body.generationId) : "",
        error: "Invalid website generation request.",
        details: parsed.error.flatten(),
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const pipelineMetadata: StageMetadata[] = [];
  const generationId = generationIdFromBody(parsed.data.generationId);
  const wantsStream = request.headers.get("accept")?.includes("text/event-stream");

  if (wantsStream) {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          const normalizedData = withLegacyInfo({ ...parsed.data, generationId });
          const cleanBusinessData = buildCleanBusinessData(normalizedData);
          const industryBrief = buildSeraphimIndustryBrief(cleanBusinessData);
          safeDebug(generationId, "stream-clean-data", {
            companyName: cleanBusinessData.companyName,
            businessType: cleanBusinessData.businessType,
            services: cleanBusinessData.services.length,
            colors: cleanBusinessData.visibleColors.length,
            missingFields: cleanBusinessData.missingFields,
            dataConfidence: cleanBusinessData.dataConfidence,
          });
          safeDebug(generationId, "archetype", {
            requested: normalizedData.archetypeId || "auto",
            selected: resolveArchetype(normalizedData, cleanBusinessData).id,
          });

          const pipeline = await streamSectionGenerationPipeline({
            data: normalizedData,
            cleanBusinessData,
            industryBrief,
            generationId,
            send,
          });
          pipelineMetadata.push(...pipeline.metadata);
          const responsePayload = buildGenerationResponse({
            generationId,
            pipeline,
            cleanBusinessData,
            industryBrief,
            pipelineMetadata,
          });
          send({ type: "complete", ...responsePayload });
        } catch (error) {
          send({
            type: "error",
            generationId,
            error: error instanceof Error ? error.message : "AI website generation could not complete.",
            pipelineModelMetadata: pipelineMetadata,
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const normalizedData = withLegacyInfo({ ...parsed.data, generationId });
    const cleanBusinessData = buildCleanBusinessData(normalizedData);
    const industryBrief = buildSeraphimIndustryBrief(cleanBusinessData);
    safeDebug(generationId, "clean-data", {
      companyName: cleanBusinessData.companyName,
      businessType: cleanBusinessData.businessType,
      services: cleanBusinessData.services.length,
      colors: cleanBusinessData.visibleColors.length,
      missingFields: cleanBusinessData.missingFields,
      dataConfidence: cleanBusinessData.dataConfidence,
    });
    safeDebug(generationId, "seraphim-generator", {
      authority: "only-website-generation-system",
      industryBrief: industryBrief.id,
      industryName: industryBrief.name,
      matchedSignals: industryBrief.matchedSignals,
    });
    safeDebug(generationId, "archetype", {
      requested: normalizedData.archetypeId || "auto",
      selected: resolveArchetype(normalizedData, cleanBusinessData).id,
    });

    const pipeline = await runSectionGenerationPipeline({
      data: normalizedData,
      cleanBusinessData,
      generationId,
    });
    pipelineMetadata.push(...pipeline.metadata);
    safeDebug(generationId, "section-pipeline", {
      sectionCount: pipeline.plan.sections.length,
      qaPassed: pipeline.qa.passed,
      qaIssues: pipeline.qa.issues,
      revisionCount: pipeline.revisionCount,
      inspirationLength: pipeline.inspiration.length,
    });
    const responsePayload = buildGenerationResponse({
      generationId,
      pipeline,
      cleanBusinessData,
      industryBrief,
      pipelineMetadata,
    });

    return NextResponse.json(
      responsePayload,
      { headers: noStoreHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        generationId,
        error: error instanceof Error ? error.message : "AI website generation could not complete.",
        pipelineModelMetadata: pipelineMetadata,
      },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
