import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildPlannerPrompt, type BusinessData, type WebsitePlan, type WebsitePlanSection } from "@/lib/ai/prompts/planner";
import { buildSectionPrompt } from "@/lib/ai/prompts/section";
import { buildCreativeDirectorPrompt } from "@/lib/ai/prompts/creative-director";
import { buildDesignSystemPrompt } from "@/lib/ai/prompts/design-system";
import { buildPageContractPrompt } from "@/lib/ai/prompts/page-contract";
import { buildVisualQAPrompt } from "@/lib/ai/prompts/visual-qa";
import { getRoutesForStage, runWithModelRouteRetry, type ModelRoute } from "@/lib/ai/modelRouter";
import { authErrorResponse, requireServerUser } from "@/lib/auth/server-guard";
import { safeImageDataUrlSchema } from "@/lib/openai-business-intelligence";
import { guardApiRequest, idempotencyKey } from "@/lib/security/request-guards";
import { ApiError, userSafeError } from "@/lib/security/api-error";
import { completeUsage, operationForGeneration, reserveUsage, type UsageReservation } from "@/lib/usage/entitlements";
import { finishGenerationJob, startGenerationJob } from "@/lib/generation/jobs";
import { normalizeGenerationDepth, generationModeSummary } from "@/lib/generation/pipeline/types";
import { runRenderQA } from "@/lib/generation/quality/render-qa";
import {
  DEFAULT_CREATIVE_CONTRACT,
  DEFAULT_DESIGN_SYSTEM_CONTRACT,
  parseCreativeContract,
  parseDesignSystemContract,
  parsePageContract,
  parseVisualQAResult,
  type CreativeContract,
  type DesignSystemContract,
  type PageContract,
  type SectionContract,
  type VisualQAResult,
} from "@/lib/ai/site-contract-schema";
import type { Archetype } from "@/lib/archetypes";
import { buildDesignTokensFromArchetype, type DesignTokenPreferences, type DesignTokens } from "@/lib/design/tokens";
import {
  buildVisualIdentityProfile,
  reconcileArchetype,
  visualTokenOverrides,
  type ArchetypeReconciliation,
  type VisualIdentityProfile,
} from "@/lib/generation/taste-profile";
import {
  recommendPremiumVisualMotifs,
  type PremiumVisualMotifRecommendation,
} from "@/lib/generation/visual-motifs";
import { fetchDesignInspiration } from "@/lib/inspiration/firecrawl";
import { getPremiumReferenceBrief } from "@/lib/reference/premium-reference-library";

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
  generationDepth: z.enum(["fast-draft", "premium-final"]).optional().default("fast-draft"),
  generationMode: z.string().max(80).optional().default("standard"),
  imageName: z.string().max(180).optional().default(""),
  sourceImageDataUrl: safeImageDataUrlSchema.optional().default(""),
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
  sourceImageDataUrl: string;
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

type PremiumReferenceBrief = ReturnType<typeof getPremiumReferenceBrief>;

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

type SectionQAResult = VisualQAResult;

type GenerationPlanResponse = {
  generationId: string;
  stage: "planning";
  summary: string;
  sectionIds: string[];
  premiumPlan: WebsitePlan;
  creativeContract?: CreativeContract;
  designSystem?: DesignSystemContract;
  pageContract?: PageContract;
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
  premiumReferenceBrief?: PremiumReferenceBrief;
  visualIdentity?: VisualIdentityProfile;
  archetypeReconciliation?: ArchetypeReconciliation;
  visualMotifs?: PremiumVisualMotifRecommendation;
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

function explicitPageCategoryFromText(value: string) {
  const match = value
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*Page\s*[^\w\s]+\s*([^\n\r]+)/i))
    .find((candidate): candidate is RegExpMatchArray => Boolean(candidate));
  if (!match) return "";
  return match[1]
    .replace(/\s{2,}.*/, "")
    .replace(/[|•].*$/, "")
    .trim()
    .slice(0, 120);
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
  const sourceTextForCategory = [
    info.rawInfo,
    asString(understanding.rawOcrText),
    asString(understanding.cleanedText),
    asString(understanding.reportMarkdown),
  ].join("\n");
  const explicitCategory = explicitPageCategoryFromText(sourceTextForCategory);
  const category = explicitCategory || info.category.trim() || asString(industry.primaryIndustry) || asString(industry.businessModel);
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
    sourceImageDataUrl: /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(input.sourceImageDataUrl)
      ? input.sourceImageDataUrl
      : "",
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
  options: { temperature?: number; maxOutputTokens?: number; responseMimeType?: "text/plain" | "application/json" } = {},
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(route.model)}:generateContent`,
    {
      method: "POST",
      signal:AbortSignal.timeout(50_000),
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
          responseMimeType: options.responseMimeType ?? "text/plain",
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

async function generateTextWithRoute(
  prompt: string,
  route: ModelRoute,
  options: { temperature?: number; maxOutputTokens?: number; responseMimeType?: "text/plain" | "application/json" } = {},
) {
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
  return resolveTasteLayer(data, cleanBusinessData).archetype;
}

function resolveTasteLayer(data: z.infer<typeof requestSchema>, cleanBusinessData: CleanBusinessData) {
  const visualIdentity = buildVisualIdentityProfile(cleanBusinessData);
  const { archetype, reconciliation } = reconcileArchetype({
    cleanBusinessData,
    visualIdentity,
    selectedArchetypeId: data.archetypeId,
  });

  return { visualIdentity, archetype, reconciliation };
}

function resolveVisualMotifs(input: {
  cleanBusinessData: CleanBusinessData;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
}) {
  return recommendPremiumVisualMotifs(input);
}

function buildTokensForGeneration(archetype: Archetype, preferences: unknown, visualIdentity?: VisualIdentityProfile): DesignTokens {
  return buildDesignTokensFromArchetype(archetype, {
    ...visualTokenOverrides(visualIdentity ?? {
      extractedColors: [],
      dominantAccents: [],
      logoMood: "",
      shapeLanguage: "",
      typographyFeel: "",
      brandTemperature: "neutral",
      imageEnergy: "",
      industryCues: [],
      layoutImplications: [],
      paletteRationale: "",
      fallbackUsed: true,
      warnings: [],
    }),
    ...coerceVisualPreferences(preferences),
  });
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
          : `Create a premium ${name.toLowerCase()} section that helps visitors understand why this business is worth contacting.`,
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
          goal: asString(section.goal) || "Help visitors understand the offer and next step.",
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

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fallbackCreativeContract(cleanBusinessData: CleanBusinessData, industryBrief: SeraphimIndustryBrief, archetype: Archetype): CreativeContract {
  return parseCreativeContract({
    ...DEFAULT_CREATIVE_CONTRACT,
    businessIdentity: {
      name: cleanBusinessData.companyName,
      industry: cleanBusinessData.businessType,
      audience: cleanBusinessData.targetAudience,
      offerSummary: cleanBusinessData.visibleDescription || cleanBusinessData.services.join(", ") || cleanBusinessData.businessType,
      verifiedFacts: cleanBusinessData.verifiedFacts,
      missingFacts: cleanBusinessData.missingFields,
      forbiddenClaims: cleanBusinessData.unsafeOrUnverifiedClaims,
    },
    creativeThesis: {
      ...DEFAULT_CREATIVE_CONTRACT.creativeThesis,
      oneSentenceDirection: industryBrief.visualThesis,
      brandMood: cleanBusinessData.brandTone || archetype.tone,
      visualMetaphor: industryBrief.visualThesis,
      emotionalTarget: "Confidence that this business is credible, specific, and easy to contact.",
      customerDecisionMoment: "The visitor is deciding whether to call, message, or enquire.",
      premiumSignals: archetype.qaChecks,
      localSignals: [cleanBusinessData.address, cleanBusinessData.city, cleanBusinessData.businessType].filter(Boolean),
    },
    layoutStrategy: {
      layoutArchetype: archetype.name,
      heroComposition: "Business-specific hero with clear offer, one primary CTA, and niche-relevant visual composition.",
      sectionRhythm: "Use varied section compositions while preserving a clear visitor journey.",
      conversionPath: industryBrief.pageStory.join(" -> "),
      mobileStrategy: "Mobile-first, clear tap targets, no horizontal overflow, and contact actions easy to reach.",
      scrollExperience: "Subtle reveal with essential content visible without animation.",
    },
    visualRules: {
      colorLogic: `Use the selected ${archetype.name} palette with verified brand colors where present.`,
      typographyLogic: "Use expressive headings with a readable body stack.",
      spacingLogic: "Use generous but purposeful spacing with compact mobile rhythm.",
      surfaceLogic: "Use surfaces to separate proof, services, FAQ, and contact areas.",
      imageryLogic: industryBrief.imageStrategy.join(" "),
      iconographyLogic: "Use simple, consistent icons only when they clarify scanning.",
      motionLogic: "Use subtle hover and reveal effects with reduced-motion support.",
    },
    copyRules: {
      tone: archetype.tone,
      voice: "Specific, believable, helpful, and conversion-aware.",
      ctaStyle: cleanBusinessData.phone ? "Call-first with supporting message/enquiry path." : "Contact/enquiry-first with missing details handled honestly.",
      trustLanguage: "Use verified business facts and conservative reassurance only.",
      wordsToUse: ["ask about", "contact to confirm", cleanBusinessData.businessType].filter(Boolean),
      wordsToAvoid: ["award-winning", "trusted by thousands", "best-in-class", "transform your business"],
    },
    sectionRules: archetype.sectionOrder.slice(0, 8).map((name, index) => ({
      id: slugify(name),
      name,
      goal: index === 0 ? "Introduce the offer, audience, and primary next step in plain customer language." : `Help visitors understand the ${name.toLowerCase()} information they need before contacting.`,
      customerQuestionAnswered: index === 0 ? "Is this the right business for my need?" : `What should I know about ${name.toLowerCase()} before contacting?`,
      requiredContent: index === 0 ? ["business name", "offer", "primary CTA"] : ["verified business detail or safe ask-about language"],
      visualTreatment: `Use the ${archetype.name} design language with a distinct ${name.toLowerCase()} composition.`,
      ctaRole: index === 0 || index >= archetype.sectionOrder.length - 2 ? "Primary conversion support" : "Contextual support only",
      mustAvoid: ["fake proof", "unsupported claims", "placeholder text"],
    })),
  });
}

function fallbackDesignSystemContract(tokens: DesignTokens): DesignSystemContract {
  return parseDesignSystemContract({
    ...DEFAULT_DESIGN_SYSTEM_CONTRACT,
    tokens: {
      ...DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens,
      colors: {
        ...DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens.colors,
        primary: tokens.colors.primary,
        secondary: tokens.colors.secondary,
        accent: tokens.colors.accent,
        bg: tokens.colors.neutral[50] || "#F8FAFC",
        text: tokens.colors.neutral[900] || "#0F172A",
        muted: tokens.colors.neutral[600] || "#475569",
      },
      fonts: {
        heading: tokens.fonts.heading,
        body: tokens.fonts.body,
      },
      radius: tokens.borderRadius,
      shadows: {
        ...DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens.shadows,
        card: tokens.shadows.lg || tokens.shadows.md || "0 20px 50px rgb(15 23 42 / 0.12)",
      },
    },
    components: DEFAULT_DESIGN_SYSTEM_CONTRACT.components,
  }, {
    ...DEFAULT_DESIGN_SYSTEM_CONTRACT,
    tokens: {
      ...DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens,
      colors: DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens.colors,
      fonts: DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens.fonts,
    },
  });
}

function sectionContractFromPlanSection(section: WebsitePlanSection, creativeContract: CreativeContract, index: number): SectionContract {
  const matchingRule = creativeContract.sectionRules.find((rule) =>
    rule.id === slugify(section.name) || rule.name.toLowerCase() === section.name.toLowerCase(),
  );
  if (matchingRule) {
    return {
      ...matchingRule,
      id: slugify(matchingRule.id || matchingRule.name),
    };
  }

  return {
    id: slugify(section.name),
    name: section.name,
    goal: section.goal,
    customerQuestionAnswered: index === 0 ? "Is this the right business for my need?" : "What should I understand before contacting?",
    requiredContent: ["verified business facts", "business-specific copy"],
    visualTreatment: "Use a distinct composition that obeys the design system.",
    ctaRole: index === 0 ? "Primary conversion action" : "Support the conversion path",
    mustAvoid: ["fake proof", "unsupported claims", "placeholder text", "dead Tailwind utility classes"],
  };
}

function fallbackPageContract(
  creativeContract: CreativeContract,
  designSystem: DesignSystemContract,
  websitePlan: WebsitePlan,
): PageContract {
  const sections = websitePlan.sections.map((section, index) => sectionContractFromPlanSection(section, creativeContract, index));
  return parsePageContract({
    creativeContract,
    designSystem,
    sections,
    globalCss: "",
    metadataRules: [
      "Use noindex/nofollow for demos.",
      "Use verified JSON-LD only.",
      "Do not add meta keywords.",
      "Do not invent canonical or production URLs.",
    ],
    qaChecklist: [
      "Follows Creative Contract",
      "Uses Design System classes with embedded CSS",
      "No fake claims",
      "No placeholders",
      "Clear CTA and contact path",
      "No horizontal overflow",
      "Section rhythm varies across the page",
    ],
  });
}

function referenceSectionBlueprints(creativeContract: CreativeContract): SectionContract[] {
  const businessName = creativeContract.businessIdentity.name || "the business";
  return [
    {
      id: "hero",
      name: "Hero",
      goal: "Make the offer, audience, brand feeling, and primary next step obvious in the first viewport.",
      customerQuestionAnswered: `Is ${businessName} the right choice for what I need?`,
      requiredContent: ["business name", "offer summary", "primary CTA", "one strong business-specific visual idea"],
      visualTreatment: "Cinematic, above-the-fold composition with layered media, confident typography, and visible contact action.",
      ctaRole: "Primary conversion action.",
      mustAvoid: ["vague slogan", "fake proof", "generic dashboard or SaaS composition"],
    },
    {
      id: "trust-bridge",
      name: "Trust Bridge",
      goal: "Translate verified facts into immediate reassurance without inventing proof.",
      customerQuestionAnswered: "What real details make this business credible enough to contact?",
      requiredContent: ["verified location, category, contact method, social link, or safe missing-detail language"],
      visualTreatment: "Compact proof strip or editorial fact row with strong spacing and contrast.",
      ctaRole: "Support the hero CTA with low-friction reassurance.",
      mustAvoid: ["fake reviews", "fake ratings", "fake years in business"],
    },
    {
      id: "offers",
      name: "Offers",
      goal: "Explain what visitors can ask about or buy using only verified services/products.",
      customerQuestionAnswered: "What can this business help me with?",
      requiredContent: ["verified services/products or safe ask-about language", "customer-facing benefit copy"],
      visualTreatment: "Varied service architecture, not a generic equal-card grid.",
      ctaRole: "Encourage a specific call, message, visit, or enquiry.",
      mustAvoid: ["invented services", "unsupported package names", "fake pricing"],
    },
    {
      id: "signature-experience",
      name: "Signature Experience",
      goal: "Create the memorable visual/emotional moment that makes the site feel custom.",
      customerQuestionAnswered: "What does the experience of choosing this business feel like?",
      requiredContent: ["industry-specific visual metaphor", "business tone", "one strong editorial composition"],
      visualTreatment: "Full-width or split visual feature with layered surfaces, media frame, or representative CSS art.",
      ctaRole: "Keep CTA secondary; this section builds desire and confidence.",
      mustAvoid: ["plain text only", "blank mockups", "stock-looking proof claims"],
    },
    {
      id: "why-it-matters",
      name: "Why It Matters",
      goal: "Connect the offer to customer pain points and practical outcomes without hype.",
      customerQuestionAnswered: "Why should I care enough to contact now?",
      requiredContent: ["customer concern", "business-specific value", "safe proof or reassurance"],
      visualTreatment: "Problem/solution split, editorial list, or contrast panel.",
      ctaRole: "Support the primary CTA after meaningful persuasion.",
      mustAvoid: ["transform your business", "solutions for every need", "best-in-class"],
    },
    {
      id: "process",
      name: "Process",
      goal: "Reduce uncertainty by showing what happens after the visitor reaches out.",
      customerQuestionAnswered: "What should I expect when I contact this business?",
      requiredContent: ["call/message/visit step", "confirm details step", "next action step"],
      visualTreatment: "Timeline, stepped cards, or anchored sequence with mobile-safe rhythm.",
      ctaRole: "Make contact feel easy and low-risk.",
      mustAvoid: ["fake booking/payment features", "fake guarantees", "unsupported emergency claims"],
    },
    {
      id: "showcase",
      name: "Showcase",
      goal: "Provide a visual proof-adjacent moment while clearly avoiding invented real proof.",
      customerQuestionAnswered: "Can I picture the quality, atmosphere, product, or service style?",
      requiredContent: ["representative visual direction", "honest label when real photos are not available"],
      visualTreatment: "Gallery, media collage, product/atmosphere panel, or crafted visual frame.",
      ctaRole: "Lead toward contact after visual confidence is built.",
      mustAvoid: ["fake before/after", "fake staff/customers", "unlabeled invented project photos"],
    },
    {
      id: "faq",
      name: "FAQ",
      goal: "Answer obvious decision blockers with factual, useful answers.",
      customerQuestionAnswered: "What should I know before calling, visiting, or booking?",
      requiredContent: ["3 to 5 useful questions", "verified answers or safe contact-to-confirm wording"],
      visualTreatment: "Accessible accordion or details list with premium spacing.",
      ctaRole: "Remove friction before the final CTA.",
      mustAvoid: ["trivial SEO filler", "unsupported policies", "invented hours/prices"],
    },
    {
      id: "contact",
      name: "Contact",
      goal: "Make the real next step unmistakable and functional.",
      customerQuestionAnswered: "How do I contact this business now?",
      requiredContent: ["verified phone/email/address/social/contact fallback", "primary CTA", "alternate contact route"],
      visualTreatment: "High-contrast contact panel with tap-friendly actions and footer bridge.",
      ctaRole: "Primary conversion close.",
      mustAvoid: ["fake form submission", "invented contact details", "dead buttons"],
    },
  ];
}

function strengthenPageContractWithReferences(pageContract: PageContract, premiumReferenceBrief: PremiumReferenceBrief) {
  const targetCount = Math.min(9, Math.max(7, premiumReferenceBrief.benchmark.minSections || 7));
  if (pageContract.sections.length >= targetCount) return pageContract;

  const existing = new Set(pageContract.sections.map((section) => slugify(section.id || section.name)));
  const additions = referenceSectionBlueprints(pageContract.creativeContract)
    .filter((section) => !existing.has(slugify(section.id || section.name)))
    .slice(0, targetCount - pageContract.sections.length);

  return parsePageContract({
    ...pageContract,
    sections: [...pageContract.sections, ...additions],
    qaChecklist: unique([
      ...pageContract.qaChecklist,
      `At least ${targetCount} meaningful sections to match the local premium reference floor.`,
      "A memorable industry-specific visual section beyond service cards.",
      "FAQ and contact support must be present unless factually impossible.",
    ]),
  }, pageContract);
}

async function generateCreativeContract(input: {
  cleanBusinessData: CleanBusinessData;
  industryBrief: SeraphimIndustryBrief;
  visualPreferences?: unknown;
  generationMode?: string;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
  archetypeReconciliation: ArchetypeReconciliation;
  generationId: string;
  premiumReferenceBrief: PremiumReferenceBrief;
  visualMotifs: PremiumVisualMotifRecommendation;
}) {
  const fallback = fallbackCreativeContract(input.cleanBusinessData, input.industryBrief, input.archetype);
  const prompt = buildCreativeDirectorPrompt(input);
  const errors: string[] = [];

  for (const route of getRoutesForStage("creative")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        generateTextWithRoute(prompt, route, { temperature: 0.48, maxOutputTokens: 9000 }),
      );
      return {
        creativeContract: parseCreativeContract(text, fallback),
        metadata: { stage: "creative", provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  safeDebug(input.generationId, "creative-contract-fallback", { errors: errors.slice(-3) });
  return {
    creativeContract: fallback,
    metadata: { stage: "creative", provider: "local", model: "fallback-creative-contract", fallback: true } satisfies StageMetadata,
    errors,
  };
}

async function generateDesignSystemContract(input: {
  creativeContract: CreativeContract;
  tokens: DesignTokens;
  visualPreferences?: unknown;
  visualIdentity: VisualIdentityProfile;
  archetypeReconciliation: ArchetypeReconciliation;
  generationId: string;
  premiumReferenceBrief: PremiumReferenceBrief;
  visualMotifs: PremiumVisualMotifRecommendation;
}) {
  const fallback = fallbackDesignSystemContract(input.tokens);
  const prompt = buildDesignSystemPrompt({
    creativeContract: input.creativeContract,
    designTokens: input.tokens,
    visualPreferences: input.visualPreferences,
    premiumReferenceBrief: input.premiumReferenceBrief,
    visualIdentity: input.visualIdentity,
    archetypeReconciliation: input.archetypeReconciliation,
    visualMotifs: input.visualMotifs,
  });
  const errors: string[] = [];

  for (const route of getRoutesForStage("design-system")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        generateTextWithRoute(prompt, route, { temperature: 0.35, maxOutputTokens: 10000 }),
      );
      return {
        designSystem: parseDesignSystemContract(text, fallback),
        metadata: { stage: "design-system", provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  safeDebug(input.generationId, "design-system-fallback", { errors: errors.slice(-3) });
  return {
    designSystem: fallback,
    metadata: { stage: "design-system", provider: "local", model: "fallback-design-system", fallback: true } satisfies StageMetadata,
    errors,
  };
}

async function generateWebsitePlanFromPrompt(
  business: BusinessData,
  tokens: DesignTokens,
  inspiration: string,
  generationId: string,
  archetype?: Archetype,
  creativeContract?: CreativeContract,
  designSystem?: DesignSystemContract,
  premiumReferenceBrief?: PremiumReferenceBrief,
  visualMotifs?: PremiumVisualMotifRecommendation,
) {
  const fallback = fallbackWebsitePlan(business, tokens, archetype);
  const prompt = [
    buildPlannerPrompt(business, tokens, inspiration, archetype, premiumReferenceBrief),
    "LOCAL PREMIUM REFERENCE INTELLIGENCE:",
    JSON.stringify(premiumReferenceBrief ?? {}, null, 2),
    "CREATIVE CONTRACT:",
    JSON.stringify(creativeContract ?? {}, null, 2),
    "DESIGN SYSTEM CONTRACT:",
    JSON.stringify(designSystem ?? {}, null, 2),
    "PREMIUM VISUAL MOTIF LIBRARY RECOMMENDATION:",
    JSON.stringify(visualMotifs ?? {}, null, 2),
    "The website plan must obey the Creative Contract and should use section names that can map to the Page Contract.",
    "The website plan should assign reusable motif primitives to appropriate sections without becoming a fixed template.",
  ].join("\n\n");
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

async function generatePageContract(input: {
  creativeContract: CreativeContract;
  designSystem: DesignSystemContract;
  websitePlan: WebsitePlan;
  visualIdentity: VisualIdentityProfile;
  archetypeReconciliation: ArchetypeReconciliation;
  generationId: string;
  premiumReferenceBrief: PremiumReferenceBrief;
  visualMotifs: PremiumVisualMotifRecommendation;
}) {
  const fallback = fallbackPageContract(input.creativeContract, input.designSystem, input.websitePlan);
  const prompt = buildPageContractPrompt(input);
  const errors: string[] = [];

  for (const route of getRoutesForStage("page-contract")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        generateTextWithRoute(prompt, route, { temperature: 0.35, maxOutputTokens: 12000 }),
      );
      return {
        pageContract: parsePageContract(text, fallback),
        metadata: { stage: "page-contract", provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  safeDebug(input.generationId, "page-contract-fallback", { errors: errors.slice(-3) });
  return {
    pageContract: fallback,
    metadata: { stage: "page-contract", provider: "local", model: "fallback-page-contract", fallback: true } satisfies StageMetadata,
    errors,
  };
}

function extractSectionFragment(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  return fenced.trim().replace(/<\/?(?:html|head|body)[^>]*>/gi, "").trim();
}

function customerFacingFallbackHeading(section: SectionContract, business: BusinessData) {
  const sectionName = section.name.toLowerCase();
  if (sectionName.includes("hero")) return `${business.name} makes the next step clear`;
  if (sectionName.includes("trust")) return `A clearer way to choose ${business.name}`;
  if (sectionName.includes("service") || sectionName.includes("offer")) return `What ${business.name} can help with`;
  if (sectionName.includes("process") || sectionName.includes("journey")) return "What to expect before you reach out";
  if (sectionName.includes("faq")) return "Questions worth answering before you contact us";
  if (sectionName.includes("contact") || sectionName.includes("cta") || sectionName.includes("appointment")) return `Start a conversation with ${business.name}`;
  if (sectionName.includes("gallery") || sectionName.includes("showcase")) return `A closer look at the ${business.name} experience`;
  return `${business.name}, presented with clarity and care`;
}

function internalSectionSummary(section: SectionContract) {
  return `${section.name} section, id ${section.id}.`;
}

function fallbackSectionHtml(section: SectionContract, business: BusinessData) {
  const slug = slugify(section.id || section.name);
  const heading = customerFacingFallbackHeading(section, business);
  return `<section id="${slug}" class="seraphim-section section-${slug}">
  <div class="seraphim-container section-inner">
    <p class="seraphim-eyebrow eyebrow">${escapeHtml(section.name)}</p>
    <h2 class="seraphim-heading">${escapeHtml(heading)}</h2>
    <p class="seraphim-body-text">${escapeHtml(business.description || `${business.name} is ready for a clearer, more useful customer conversation.`)}</p>
  </div>
</section>`;
}

async function generateSectionHtmlFromPrompt(input: {
  business: BusinessData;
  cleanBusinessData: CleanBusinessData;
  section: SectionContract;
  plan: WebsitePlan;
  tokens: DesignTokens;
  inspiration: string;
  creativeContract: CreativeContract;
  designSystem: DesignSystemContract;
  pageContract: PageContract;
  previousSectionSummary?: string;
  nextSectionSummary?: string;
  archetype?: Archetype;
  visualIdentity: VisualIdentityProfile;
  archetypeReconciliation: ArchetypeReconciliation;
  correctiveFeedback?: string[];
  premiumReferenceBrief: PremiumReferenceBrief;
  visualMotifs: PremiumVisualMotifRecommendation;
}) {
  const prompt = buildSectionPrompt({
    business: input.business,
    cleanBusinessData: input.cleanBusinessData,
    creativeContract: input.creativeContract,
    designSystem: input.designSystem,
    pageContract: input.pageContract,
    sectionContract: { ...input.section, correctiveFeedback: input.correctiveFeedback },
    previousSectionSummary: input.previousSectionSummary,
    nextSectionSummary: input.nextSectionSummary,
    correctiveFeedback: input.correctiveFeedback,
    premiumReferenceBrief: input.premiumReferenceBrief,
    visualIdentity: input.visualIdentity,
    archetypeReconciliation: input.archetypeReconciliation,
    visualMotifs: input.visualMotifs,
  });
  const errors: string[] = [];

  for (const route of getRoutesForStage("section")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        generateTextWithRoute(prompt, route, { temperature: 0.7, maxOutputTokens: 14000 }),
      );
      const html = sanitizeGeneratedMedia(extractSectionFragment(text), input.cleanBusinessData, input.section);
      return {
        html,
        metadata: { stage: `section:${input.section.id || input.section.name}`, provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  return {
    html: fallbackSectionHtml(input.section, input.business),
    metadata: { stage: `section:${input.section.id || input.section.name}`, provider: "local", model: "fallback-section-html", fallback: true } satisfies StageMetadata,
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

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function attributeValue(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1]?.trim() || "";
}

function mediaKind(cleanBusinessData: CleanBusinessData) {
  const source = [
    cleanBusinessData.businessType,
    cleanBusinessData.visibleDescription,
    cleanBusinessData.services.join(" "),
    cleanBusinessData.visualEvidence.join(" "),
  ].join(" ").toLowerCase();

  if (/\b(food|restaurant|cafe|kitchen|dining|menu|jerk|grill|catering)\b/.test(source)) return "food";
  if (/\b(auto|car|vehicle|detailing|mechanic|tire|tyre|garage|wash)\b/.test(source)) return "auto";
  if (/\b(home|plumb|electric|contractor|repair|painting|cleaning|locksmith|handy)\b/.test(source)) return "home";
  if (/\b(pet|groom|animal|store)\b/.test(source)) return "pet";
  if (/\b(health|wellness|clinic|dental|medical|therapy|care)\b/.test(source)) return "care";
  return "local";
}

function generatedMediaSvg(cleanBusinessData: CleanBusinessData, label: string, variant = 0) {
  const kind = mediaKind(cleanBusinessData);
  const title = escapeHtml(label || cleanBusinessData.companyName || cleanBusinessData.businessType);
  const motifs: Record<string, string> = {
    food: `<circle cx="660" cy="270" r="156" fill="rgba(255,255,255,.28)"/><circle cx="660" cy="270" r="92" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="16"/><path d="M184 420c130-118 248-142 354-72 84 56 167 55 249-3" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="24" stroke-linecap="round"/>`,
    auto: `<path d="M150 352h540c44 0 82 25 100 65l26 58H96l29-65c17-36 28-58 25-58Z" fill="rgba(255,255,255,.22)"/><circle cx="238" cy="488" r="52" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="18"/><circle cx="682" cy="488" r="52" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="18"/><path d="M250 270h260l95 82H184l66-82Z" fill="rgba(255,255,255,.18)"/>`,
    home: `<path d="M180 420 460 210l280 210v190H560V472H360v138H180V420Z" fill="rgba(255,255,255,.20)"/><path d="M128 432 460 178l332 254" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><path d="M615 222v98" stroke="rgba(255,255,255,.55)" stroke-width="24" stroke-linecap="round"/>`,
    pet: `<circle cx="430" cy="358" r="74" fill="rgba(255,255,255,.24)"/><circle cx="318" cy="298" r="42" fill="rgba(255,255,255,.35)"/><circle cx="392" cy="244" r="42" fill="rgba(255,255,255,.35)"/><circle cx="478" cy="244" r="42" fill="rgba(255,255,255,.35)"/><circle cx="552" cy="298" r="42" fill="rgba(255,255,255,.35)"/><path d="M190 520c160-74 340-70 540 12" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="22" stroke-linecap="round"/>`,
    care: `<path d="M460 184c96 108 168 205 168 306 0 96-75 170-168 170s-168-74-168-170c0-101 72-198 168-306Z" fill="rgba(255,255,255,.20)"/><path d="M460 335v194M363 432h194" stroke="rgba(255,255,255,.70)" stroke-width="26" stroke-linecap="round"/>`,
    local: `<path d="M128 500c116-138 219-192 310-162 108 36 149 158 292 80 56-31 96-74 120-128" fill="none" stroke="rgba(255,255,255,.58)" stroke-width="28" stroke-linecap="round"/><circle cx="660" cy="230" r="92" fill="rgba(255,255,255,.18)"/>`,
  };
  const hue = Math.abs([...cleanBusinessData.companyName].reduce((sum, char) => sum + char.charCodeAt(0), 0) + variant * 37) % 360;
  const accentHue = (hue + 42) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 640" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 78% 28%)"/>
      <stop offset="48%" stop-color="hsl(${accentHue} 74% 42%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 84) % 360} 72% 24%)"/>
    </linearGradient>
    <radialGradient id="r" cx=".74" cy=".18" r=".82">
      <stop offset="0%" stop-color="rgba(255,255,255,.48)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="920" height="640" rx="42" fill="url(#g)"/>
  <rect width="920" height="640" rx="42" fill="url(#r)"/>
  <path d="M-40 550c160-94 298-118 414-72 138 54 262 36 372-54 70-57 139-86 207-86" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="96" stroke-linecap="round"/>
  ${motifs[kind]}
  <text x="64" y="94" fill="rgba(255,255,255,.92)" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="4">${escapeHtml(cleanBusinessData.businessType || "Business visual").toUpperCase()}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function isUnreliableImageSrc(src: string) {
  const value = src.trim();
  if (!value) return true;
  if (/^data:image\//i.test(value)) return false;
  if (/^https:\/\/images\.unsplash\.com\//i.test(value)) return false;
  if (/^https?:\/\//i.test(value)) {
    return /placeholder|placehold|dummyimage|fakeimg|loremflickr|picsum|via\.placeholder/i.test(value);
  }
  return true;
}

function reliableMediaImg(cleanBusinessData: CleanBusinessData, alt: string, variant = 0, preferSourceImage = false) {
  const label = alt || `${cleanBusinessData.companyName} visual direction`;
  const source = preferSourceImage && cleanBusinessData.sourceImageDataUrl
    ? cleanBusinessData.sourceImageDataUrl
    : generatedMediaSvg(cleanBusinessData, label, variant);
  const sourceClass = source === cleanBusinessData.sourceImageDataUrl ? " seraphim-source-photo" : "";
  return `<img class="seraphim-generated-photo${sourceClass}" src="${source}" alt="${escapeAttribute(label)}" loading="lazy" decoding="async">`;
}

function sanitizeGeneratedMedia(html: string, cleanBusinessData: CleanBusinessData, section: SectionContract) {
  let imageIndex = 0;
  const preferSourceImage = Boolean(cleanBusinessData.sourceImageDataUrl && /hero|showcase|gallery|signature|experience|atmosphere|visual|media/i.test(`${section.id} ${section.name}`));
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = attributeValue(tag, "src");
    if (!isUnreliableImageSrc(src)) return tag;
    const alt = attributeValue(tag, "alt") || `${cleanBusinessData.companyName} ${section.name} visual`;
    imageIndex += 1;
    return reliableMediaImg(cleanBusinessData, alt, imageIndex, preferSourceImage && imageIndex === 1);
  });
}

function ensureSourceImageFeatured(sections: string[], cleanBusinessData: CleanBusinessData) {
  if (!cleanBusinessData.sourceImageDataUrl) return sections;
  const joined = sections.join("\n");
  if (joined.includes("seraphim-source-photo") || joined.includes(cleanBusinessData.sourceImageDataUrl.slice(0, 80))) return sections;

  const sourceFrame = `<figure class="seraphim-source-proof-frame">
  <img class="seraphim-generated-photo seraphim-source-photo" src="${cleanBusinessData.sourceImageDataUrl}" alt="${escapeAttribute(`${cleanBusinessData.companyName} supplied business screenshot`)}" loading="eager" decoding="async">
  <figcaption>Visual reference from the supplied business screenshot. Replace with approved brand photography before launch.</figcaption>
</figure>`;

  const targetIndex = sections.findIndex((section) => /<section\b[^>]*(?:id=["'](?:hero|showcase|signature|experience|atmosphere|visual|media)|class=["'][^"']*hero)/i.test(section));
  const index = targetIndex >= 0 ? targetIndex : 0;
  return sections.map((section, sectionIndex) => {
    if (sectionIndex !== index) return section;
    return section.replace(/<\/section>\s*$/i, `${sourceFrame}\n</section>`);
  });
}

function buildReferenceQualityCss() {
  return `
/* Local premium reference primitives: these are reusable CSS foundations, not fixed templates. */
.seraphim-premium-shell{position:relative;isolation:isolate;overflow:hidden;background:
  radial-gradient(circle at 12% 8%,color-mix(in srgb,var(--seraphim-secondary) 24%,transparent),transparent 32rem),
  radial-gradient(circle at 88% 12%,color-mix(in srgb,var(--seraphim-primary) 18%,transparent),transparent 36rem),
  linear-gradient(135deg,color-mix(in srgb,var(--seraphim-bg) 92%,white),var(--seraphim-bg));}
.seraphim-premium-shell::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:
  linear-gradient(color-mix(in srgb,var(--seraphim-border) 46%,transparent) 1px,transparent 1px),
  linear-gradient(90deg,color-mix(in srgb,var(--seraphim-border) 46%,transparent) 1px,transparent 1px);
  background-size:72px 72px;mask-image:linear-gradient(to bottom,black,transparent 72%);opacity:.38;}
.seraphim-editorial-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(1.25rem,3vw,3.5rem);align-items:center;}
.seraphim-editorial-grid[data-align="start"]{align-items:start;}
.seraphim-hero-editorial,.seraphim-hero-cinematic,.seraphim-hero-montage{position:relative;isolation:isolate;display:grid;gap:clamp(1.25rem,3vw,3.5rem);align-items:center;min-height:min(760px,calc(100svh - 5rem));padding-block:clamp(3.5rem,7vw,7rem);}
.seraphim-hero-editorial{grid-template-columns:minmax(0,1fr);}
.seraphim-hero-copy{display:grid;gap:clamp(.8rem,1.4vw,1.2rem);max-width:68ch;z-index:2;}
.seraphim-hero-visual{position:relative;min-height:clamp(18rem,38vw,34rem);border-radius:clamp(1.2rem,3vw,2.3rem);overflow:hidden;background:var(--seraphim-gradient-hero);box-shadow:0 28px 86px rgb(15 23 42 / .16);}
.seraphim-hero-cinematic{overflow:hidden;border-radius:0;background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-primary) 18%,var(--seraphim-bg)),var(--seraphim-bg));}
.seraphim-hero-cinematic .seraphim-hero-media,.seraphim-hero-montage .seraphim-hero-media{min-height:clamp(20rem,42vw,40rem);}
.seraphim-hero-overlay{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgb(0 0 0 / .44),transparent 68%);}
.seraphim-hero-montage{grid-template-columns:minmax(0,1fr);}
.seraphim-montage-tile{position:relative;overflow:hidden;min-height:11rem;border-radius:var(--seraphim-radius-xl);border:1px solid color-mix(in srgb,var(--seraphim-border) 82%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-primary) 14%,white),color-mix(in srgb,var(--seraphim-secondary) 14%,white));box-shadow:0 18px 58px rgb(15 23 42 / .08);}
.seraphim-copy-stack{display:grid;gap:clamp(.8rem,1.4vw,1.25rem);max-width:68ch;}
.seraphim-copy-stack>*,.seraphim-card>*{margin-block:0;}
.seraphim-kicker{display:inline-flex;width:max-content;align-items:center;gap:.5rem;border:1px solid color-mix(in srgb,var(--seraphim-primary) 25%,transparent);border-radius:999px;padding:.42rem .72rem;background:color-mix(in srgb,var(--seraphim-primary) 9%,white);color:var(--seraphim-primary);font-size:.72rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase;}
.seraphim-display{margin:0;font-family:var(--seraphim-heading-font);font-size:clamp(2.8rem,8vw,7.4rem);line-height:.93;letter-spacing:-.07em;text-wrap:balance;}
.seraphim-lede{max-width:62ch;color:var(--seraphim-muted);font-size:clamp(1.05rem,1.5vw,1.28rem);line-height:1.72;}
.seraphim-action-row{display:flex;flex-wrap:wrap;gap:.8rem;align-items:center;margin-top:clamp(.4rem,1vw,1rem);}
.seraphim-button,.seraphim-button-primary,.seraphim-button-secondary{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;min-height:46px;border-radius:999px;padding:.86rem 1.15rem;text-decoration:none;font-weight:850;line-height:1;border:1px solid transparent;transition:transform .22s ease,box-shadow .22s ease,background .22s ease,border-color .22s ease,color .22s ease;}
.seraphim-button-primary{background:var(--seraphim-primary);color:white;box-shadow:0 18px 46px color-mix(in srgb,var(--seraphim-primary) 28%,transparent);}
.seraphim-button-secondary{background:color-mix(in srgb,var(--seraphim-surface) 86%,transparent);color:var(--seraphim-text);border-color:color-mix(in srgb,var(--seraphim-border) 82%,transparent);}
.seraphim-button:hover,.seraphim-button-primary:hover,.seraphim-button-secondary:hover{transform:translateY(-2px);}
.seraphim-button:focus-visible,.seraphim-button-primary:focus-visible,.seraphim-button-secondary:focus-visible{outline:3px solid color-mix(in srgb,var(--seraphim-accent) 44%,transparent);outline-offset:3px;}
.seraphim-hero-media{position:relative;min-height:clamp(22rem,44vw,42rem);border-radius:clamp(1.3rem,3vw,2.6rem);overflow:hidden;background:linear-gradient(145deg,color-mix(in srgb,var(--seraphim-primary) 22%,#111827),color-mix(in srgb,var(--seraphim-accent) 20%,#020617));box-shadow:0 32px 90px rgb(2 6 23 / .22);}
.seraphim-hero-media::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 28% 20%,rgb(255 255 255 / .22),transparent 18rem),linear-gradient(135deg,transparent,color-mix(in srgb,var(--seraphim-secondary) 22%,transparent));mix-blend-mode:screen;}
.seraphim-hero-media::after{content:"";position:absolute;inset:auto 8% 8% 8%;height:34%;border-radius:1.5rem;background:linear-gradient(180deg,rgb(255 255 255 / .24),rgb(255 255 255 / .08));border:1px solid rgb(255 255 255 / .22);backdrop-filter:blur(18px);}
.seraphim-media-label{position:absolute;left:clamp(1rem,3vw,2rem);right:clamp(1rem,3vw,2rem);bottom:clamp(1rem,3vw,2rem);z-index:2;color:white;display:grid;gap:.45rem;}
.seraphim-media-label strong{font-family:var(--seraphim-heading-font);font-size:clamp(1.2rem,2.6vw,2.1rem);line-height:1;letter-spacing:-.04em;}
.seraphim-media-label span{max-width:42ch;color:rgb(255 255 255 / .78);}
.seraphim-divider-wave{position:relative;width:100%;height:clamp(2.5rem,6vw,5rem);overflow:hidden;color:var(--seraphim-secondary);}
.seraphim-divider-wave svg{display:block;width:100%;height:100%;fill:currentColor;}
.seraphim-divider-angle{width:100%;height:clamp(2rem,5vw,4rem);background:linear-gradient(135deg,var(--seraphim-primary),var(--seraphim-accent));clip-path:polygon(0 28%,100% 0,100% 100%,0 72%);}
.seraphim-texture-grain,.seraphim-texture-blueprint,.seraphim-bg-paper-grain,.seraphim-bg-noise-fine,.seraphim-bg-radial-light,.seraphim-bg-warm-local,.seraphim-bg-auto-dark,.seraphim-bg-blueprint-grid,.seraphim-bg-pet-soft,.seraphim-bg-beauty-pearl,.seraphim-bg-wellness-contour,.seraphim-bg-retail-fabric,.seraphim-bg-travel-map,.seraphim-bg-tech-nodes,.seraphim-bg-document-wash{position:relative;isolation:isolate;overflow:hidden;}
.seraphim-texture-grain::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(circle at 16% 18%,color-mix(in srgb,var(--seraphim-secondary) 24%,transparent),transparent 18rem),radial-gradient(circle at 84% 12%,color-mix(in srgb,var(--seraphim-primary) 14%,transparent),transparent 22rem),repeating-radial-gradient(circle at 0 0,rgb(15 23 42 / .055) 0 1px,transparent 1px 5px);opacity:.58;}
.seraphim-texture-blueprint::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(color-mix(in srgb,var(--seraphim-primary) 14%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--seraphim-primary) 14%,transparent) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(to bottom,black,transparent 82%);}
.seraphim-bg-paper-grain{background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-secondary) 10%,#fffaf0),color-mix(in srgb,var(--seraphim-bg) 90%,white));}
.seraphim-bg-paper-grain::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(circle at 18% 18%,rgb(255 255 255 / .42),transparent 18rem),repeating-radial-gradient(circle at 0 0,rgb(120 72 24 / .055) 0 1px,transparent 1px 5px),repeating-linear-gradient(115deg,rgb(120 72 24 / .035) 0 1px,transparent 1px 9px);opacity:.66;}
.seraphim-bg-noise-fine::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:repeating-radial-gradient(circle at 12% 18%,rgb(15 23 42 / .05) 0 1px,transparent 1px 4px),repeating-radial-gradient(circle at 78% 66%,rgb(255 255 255 / .06) 0 1px,transparent 1px 6px);opacity:.48;}
.seraphim-bg-radial-light{background:radial-gradient(circle at 18% 12%,color-mix(in srgb,var(--seraphim-secondary) 28%,transparent),transparent 28rem),radial-gradient(circle at 88% 18%,color-mix(in srgb,var(--seraphim-primary) 22%,transparent),transparent 34rem),linear-gradient(135deg,color-mix(in srgb,var(--seraphim-bg) 90%,white),var(--seraphim-bg));}
.seraphim-bg-radial-light::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(circle at 50% 0,rgb(255 255 255 / .52),transparent 24rem);opacity:.54;}
.seraphim-bg-warm-local{background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-secondary) 16%,#fff7ed),color-mix(in srgb,var(--seraphim-primary) 7%,#fffaf0));}
.seraphim-bg-warm-local::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(circle at 12% 18%,color-mix(in srgb,var(--seraphim-accent) 18%,transparent),transparent 18rem),radial-gradient(circle at 88% 72%,color-mix(in srgb,var(--seraphim-secondary) 20%,transparent),transparent 20rem),repeating-radial-gradient(circle at 0 0,rgb(92 48 12 / .05) 0 1px,transparent 1px 6px);}
.seraphim-bg-auto-dark{background:radial-gradient(circle at 18% 8%,color-mix(in srgb,var(--seraphim-primary) 38%,transparent),transparent 26rem),radial-gradient(circle at 82% 18%,color-mix(in srgb,var(--seraphim-accent) 24%,transparent),transparent 30rem),linear-gradient(135deg,#020617,#0b1220 44%,#111827);color:white;}
.seraphim-bg-auto-dark::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(112deg,transparent 0 38%,rgb(255 255 255 / .16) 39%,transparent 45%),repeating-linear-gradient(105deg,transparent 0 22px,rgb(255 255 255 / .045) 23px 24px,transparent 25px 50px);opacity:.86;}
.seraphim-bg-auto-dark :where(h1,h2,h3,p,.seraphim-body-text){color:inherit;}
.seraphim-bg-blueprint-grid{background:linear-gradient(180deg,color-mix(in srgb,var(--seraphim-bg) 88%,white),var(--seraphim-surface));}
.seraphim-bg-blueprint-grid::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(color-mix(in srgb,var(--seraphim-primary) 16%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--seraphim-primary) 16%,transparent) 1px,transparent 1px),radial-gradient(circle at 18% 16%,color-mix(in srgb,var(--seraphim-accent) 12%,transparent),transparent 18rem);background-size:52px 52px,52px 52px,auto;mask-image:linear-gradient(to bottom,black,transparent 88%);}
.seraphim-bg-pet-soft{background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-secondary) 18%,#fff),color-mix(in srgb,var(--seraphim-primary) 8%,#f8fbff));}
.seraphim-bg-pet-soft::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(circle at 14% 22%,color-mix(in srgb,var(--seraphim-accent) 18%,transparent),transparent 12rem),radial-gradient(circle at 84% 18%,color-mix(in srgb,var(--seraphim-primary) 14%,transparent),transparent 14rem),repeating-radial-gradient(circle at 0 0,color-mix(in srgb,var(--seraphim-primary) 16%,transparent) 0 2px,transparent 2px 18px);opacity:.7;}
.seraphim-bg-beauty-pearl{background:radial-gradient(circle at 18% 8%,color-mix(in srgb,var(--seraphim-secondary) 30%,white),transparent 24rem),linear-gradient(135deg,#fff7fb,color-mix(in srgb,var(--seraphim-accent) 8%,#fff),#fffdf7);}
.seraphim-bg-beauty-pearl::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(115deg,transparent 0 36%,rgb(255 255 255 / .72) 44%,transparent 54%),radial-gradient(circle at 82% 72%,color-mix(in srgb,var(--seraphim-primary) 10%,transparent),transparent 18rem);opacity:.72;}
.seraphim-bg-wellness-contour{background:linear-gradient(145deg,color-mix(in srgb,var(--seraphim-primary) 7%,#f8fffb),color-mix(in srgb,var(--seraphim-secondary) 7%,#f8fbff));}
.seraphim-bg-wellness-contour::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:repeating-radial-gradient(ellipse at 20% 24%,color-mix(in srgb,var(--seraphim-primary) 12%,transparent) 0 1px,transparent 1px 22px),radial-gradient(circle at 88% 20%,color-mix(in srgb,var(--seraphim-secondary) 14%,transparent),transparent 18rem);opacity:.42;}
.seraphim-bg-retail-fabric{background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-secondary) 8%,#fff),color-mix(in srgb,var(--seraphim-bg) 94%,white));}
.seraphim-bg-retail-fabric::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:repeating-linear-gradient(45deg,rgb(15 23 42 / .035) 0 1px,transparent 1px 7px),repeating-linear-gradient(-45deg,rgb(15 23 42 / .025) 0 1px,transparent 1px 9px);opacity:.62;}
.seraphim-bg-travel-map{background:radial-gradient(circle at 18% 12%,color-mix(in srgb,var(--seraphim-secondary) 34%,transparent),transparent 24rem),linear-gradient(135deg,#fff8ed,color-mix(in srgb,var(--seraphim-primary) 8%,#f7fbff));}
.seraphim-bg-travel-map::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(34deg,transparent 0 45%,color-mix(in srgb,var(--seraphim-primary) 20%,transparent) 46% 47%,transparent 48%),linear-gradient(112deg,transparent 0 60%,color-mix(in srgb,var(--seraphim-accent) 15%,transparent) 61% 62%,transparent 63%);opacity:.62;}
.seraphim-bg-tech-nodes{background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-neutral) 94%,#020617),#020617);color:white;}
.seraphim-bg-tech-nodes::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(rgb(255 255 255 / .075) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255 / .075) 1px,transparent 1px),radial-gradient(circle,rgb(255 255 255 / .22) 0 1px,transparent 2px);background-size:54px 54px,54px 54px,108px 108px;opacity:.58;}
.seraphim-bg-tech-nodes :where(h1,h2,h3,p,.seraphim-body-text){color:inherit;}
.seraphim-bg-document-wash{background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-bg) 92%,white),#fff);}
.seraphim-bg-document-wash::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:repeating-linear-gradient(180deg,transparent 0 30px,color-mix(in srgb,var(--seraphim-border) 38%,transparent) 31px 32px),radial-gradient(circle at 82% 18%,color-mix(in srgb,var(--seraphim-primary) 8%,transparent),transparent 22rem);opacity:.55;}
.seraphim-fact-badge{display:inline-flex;align-items:center;gap:.45rem;min-height:34px;width:max-content;max-width:100%;border:1px solid color-mix(in srgb,var(--seraphim-primary) 24%,transparent);border-radius:999px;padding:.42rem .72rem;background:color-mix(in srgb,var(--seraphim-primary) 8%,white);color:var(--seraphim-primary);font-size:.84rem;font-weight:850;line-height:1.15;}
.seraphim-frame-offset{position:relative;border-radius:var(--seraphim-radius-xl);overflow:hidden;box-shadow:0 26px 80px rgb(15 23 42 / .14);}
.seraphim-frame-offset::after{content:"";position:absolute;inset:.75rem -.75rem -.75rem .75rem;z-index:-1;border:1px solid color-mix(in srgb,var(--seraphim-accent) 55%,transparent);border-radius:inherit;}
.seraphim-frame-utility{position:relative;border:1px solid color-mix(in srgb,var(--seraphim-primary) 32%,var(--seraphim-border));border-radius:var(--seraphim-radius-lg);background:linear-gradient(180deg,var(--seraphim-surface),color-mix(in srgb,var(--seraphim-bg) 78%,white));padding:clamp(1rem,2.4vw,1.75rem);box-shadow:0 18px 54px rgb(15 23 42 / .1);}
.seraphim-frame-utility::before{content:"";position:absolute;inset:0 auto auto 0;width:4.5rem;height:4px;background:linear-gradient(90deg,var(--seraphim-primary),var(--seraphim-accent));border-radius:999px;}
.seraphim-icon-mark{display:inline-grid;place-items:center;flex:0 0 auto;width:2.55rem;aspect-ratio:1;border-radius:calc(var(--seraphim-radius-lg) * .8);background:color-mix(in srgb,var(--seraphim-primary) 10%,white);color:var(--seraphim-primary);border:1px solid color-mix(in srgb,var(--seraphim-primary) 18%,transparent);}
.seraphim-icon-mark svg{width:1.15rem;height:1.15rem;stroke:currentColor;stroke-width:2;fill:none;}
.seraphim-cta-band{position:relative;overflow:hidden;border-radius:clamp(1.5rem,4vw,3rem);padding:clamp(1.35rem,4vw,3.5rem);background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-primary) 94%,#020617),color-mix(in srgb,var(--seraphim-accent) 60%,#020617));color:white;box-shadow:0 30px 90px rgb(2 6 23 / .24);}
.seraphim-cta-band::before{content:"";position:absolute;inset:-30% auto auto 48%;width:46%;aspect-ratio:1;border-radius:999px;background:rgb(255 255 255 / .15);filter:blur(2px);}
.seraphim-cta-band :where(h2,h3,p){color:inherit;}
.seraphim-cta-band p{color:rgb(255 255 255 / .78);}
.seraphim-mask-arch{overflow:hidden;border-radius:999px 999px var(--seraphim-radius-xl) var(--seraphim-radius-xl);aspect-ratio:4/5;}
.seraphim-mask-diagonal{overflow:hidden;border-radius:var(--seraphim-radius-xl);clip-path:polygon(7% 0,100% 0,93% 100%,0 100%);}
.seraphim-mask-arch img,.seraphim-mask-diagonal img{width:100%;height:100%;object-fit:cover;}
.seraphim-proof-strip{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;padding:clamp(.85rem,1.8vw,1.15rem);border:1px solid color-mix(in srgb,var(--seraphim-border) 82%,transparent);border-radius:var(--seraphim-radius-xl);background:color-mix(in srgb,var(--seraphim-surface) 86%,transparent);box-shadow:0 16px 50px rgb(15 23 42 / .08);}
.seraphim-proof-item{display:grid;gap:.2rem;padding:.9rem;border-radius:var(--seraphim-radius-lg);background:linear-gradient(180deg,color-mix(in srgb,var(--seraphim-bg) 84%,white),color-mix(in srgb,var(--seraphim-bg) 96%,white));}
.seraphim-proof-item strong{font-family:var(--seraphim-heading-font);font-size:clamp(1rem,1.5vw,1.25rem);letter-spacing:-.03em;}
.seraphim-proof-item span{color:var(--seraphim-muted);font-size:.92rem;}
.seraphim-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:clamp(.9rem,2vw,1.4rem);}
.seraphim-card{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--seraphim-border) 86%,transparent);border-radius:var(--seraphim-radius-xl);padding:clamp(1.1rem,2.2vw,1.65rem);background:linear-gradient(180deg,color-mix(in srgb,var(--seraphim-surface) 98%,white),color-mix(in srgb,var(--seraphim-bg) 82%,white));box-shadow:0 18px 58px rgb(15 23 42 / .08);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease;}
.seraphim-card::before{content:"";position:absolute;inset:0 0 auto;height:4px;background:linear-gradient(90deg,var(--seraphim-primary),var(--seraphim-secondary),var(--seraphim-accent));opacity:.82;}
.seraphim-card:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--seraphim-primary) 32%,var(--seraphim-border));box-shadow:0 24px 70px rgb(15 23 42 / .12);}
.seraphim-card h3{margin:.2rem 0 .55rem;font-size:clamp(1.15rem,2vw,1.55rem);}
.seraphim-card p{color:var(--seraphim-muted);line-height:1.68;}
.seraphim-service-rail{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:.85rem;align-items:stretch;}
.seraphim-service-rail-item{position:relative;display:grid;gap:.45rem;align-content:start;border:1px solid color-mix(in srgb,var(--seraphim-border) 86%,transparent);border-radius:var(--seraphim-radius-lg);padding:1rem;background:linear-gradient(180deg,color-mix(in srgb,var(--seraphim-surface) 96%,white),color-mix(in srgb,var(--seraphim-bg) 90%,white));box-shadow:0 14px 42px rgb(15 23 42 / .07);}
.seraphim-service-rail-item::before{content:"";width:2.35rem;height:3px;border-radius:999px;background:linear-gradient(90deg,var(--seraphim-primary),var(--seraphim-secondary));}
.seraphim-service-rail-item h3{margin:0;font-size:clamp(1.05rem,1.7vw,1.35rem);}
.seraphim-service-rail-item p{margin:0;color:var(--seraphim-muted);}
.seraphim-service-card{position:relative;display:grid;gap:.75rem;border:1px solid color-mix(in srgb,var(--seraphim-border) 84%,transparent);border-radius:var(--seraphim-radius-xl);padding:clamp(1rem,2.2vw,1.65rem);background:linear-gradient(180deg,var(--seraphim-surface),color-mix(in srgb,var(--seraphim-bg) 86%,white));box-shadow:0 18px 58px rgb(15 23 42 / .08);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease;}
.seraphim-service-card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--seraphim-primary) 28%,var(--seraphim-border));box-shadow:0 24px 72px rgb(15 23 42 / .12);}
.seraphim-service-card-icon{display:grid;place-items:center;width:2.8rem;aspect-ratio:1;border-radius:var(--seraphim-radius-lg);background:color-mix(in srgb,var(--seraphim-primary) 11%,white);color:var(--seraphim-primary);}
.seraphim-service-card-action{margin-top:auto;display:inline-flex;align-items:center;width:max-content;gap:.45rem;color:var(--seraphim-primary);font-weight:850;text-decoration:none;}
.seraphim-service-rail-meta{display:flex;flex-wrap:wrap;gap:.4rem;color:var(--seraphim-muted);font-size:.86rem;font-weight:750;}
.seraphim-process-path{display:grid;gap:.9rem;counter-reset:process;}
.seraphim-process-step{counter-increment:process;position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:1rem;align-items:start;border:1px solid color-mix(in srgb,var(--seraphim-border) 82%,transparent);border-radius:var(--seraphim-radius-xl);padding:1rem;background:var(--seraphim-surface);box-shadow:0 14px 44px rgb(15 23 42 / .06);}
.seraphim-process-number{display:grid;place-items:center;width:2.75rem;aspect-ratio:1;border-radius:999px;background:var(--seraphim-primary);color:white;font-size:.82rem;font-weight:900;}
.seraphim-process-step>.seraphim-process-number:empty::before{content:counter(process,decimal-leading-zero);}
.seraphim-process-checklist{display:grid;gap:.75rem;border-radius:var(--seraphim-radius-xl);padding:clamp(1rem,2.4vw,1.75rem);background:color-mix(in srgb,var(--seraphim-surface) 92%,white);border:1px solid color-mix(in srgb,var(--seraphim-border) 84%,transparent);}
.seraphim-check-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.75rem;align-items:start;}
.seraphim-check-mark{display:grid;place-items:center;width:1.6rem;aspect-ratio:1;border-radius:999px;background:color-mix(in srgb,var(--seraphim-primary) 12%,white);color:var(--seraphim-primary);font-weight:900;}
.seraphim-contact-strip{display:grid;grid-template-columns:1fr;gap:.75rem;align-items:center;border:1px solid color-mix(in srgb,var(--seraphim-border) 82%,transparent);border-radius:var(--seraphim-radius-xl);padding:clamp(.9rem,2vw,1.25rem);background:color-mix(in srgb,var(--seraphim-surface) 92%,transparent);box-shadow:0 16px 50px rgb(15 23 42 / .08);}
.seraphim-contact-action{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:999px;padding:.8rem 1rem;background:var(--seraphim-primary);color:white;font-weight:900;text-decoration:none;box-shadow:0 18px 48px color-mix(in srgb,var(--seraphim-primary) 26%,transparent);}
.seraphim-contact-note{color:var(--seraphim-muted);font-size:.92rem;line-height:1.5;}
.seraphim-gallery-frame{display:grid;grid-template-columns:1fr;gap:1rem;}
.seraphim-gallery-tile{position:relative;overflow:hidden;min-height:14rem;border-radius:var(--seraphim-radius-xl);background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-primary) 14%,white),color-mix(in srgb,var(--seraphim-secondary) 14%,white));border:1px solid color-mix(in srgb,var(--seraphim-border) 84%,transparent);box-shadow:0 18px 58px rgb(15 23 42 / .08);}
.seraphim-gallery-caption{padding:.7rem .8rem;color:var(--seraphim-muted);font-size:.86rem;line-height:1.45;}
.seraphim-menu-card,.seraphim-mirror-card,.seraphim-care-path,.seraphim-learning-card,.seraphim-editorial-panel{position:relative;display:grid;gap:.75rem;border:1px solid color-mix(in srgb,var(--seraphim-border) 82%,transparent);border-radius:var(--seraphim-radius-xl);padding:clamp(1rem,2.4vw,1.75rem);background:linear-gradient(180deg,color-mix(in srgb,var(--seraphim-surface) 96%,white),color-mix(in srgb,var(--seraphim-bg) 88%,white));box-shadow:0 18px 58px rgb(15 23 42 / .08);}
.seraphim-menu-card::before{content:"";position:absolute;inset:.65rem;border:1px dashed color-mix(in srgb,var(--seraphim-secondary) 44%,transparent);border-radius:calc(var(--seraphim-radius-xl) - .35rem);pointer-events:none;}
.seraphim-plate-ring{position:relative;border-radius:999px;aspect-ratio:1;display:grid;place-items:center;background:radial-gradient(circle,color-mix(in srgb,var(--seraphim-surface) 94%,white) 0 46%,transparent 47%),conic-gradient(from 20deg,var(--seraphim-primary),var(--seraphim-secondary),var(--seraphim-accent),var(--seraphim-primary));box-shadow:0 20px 60px rgb(15 23 42 / .12);}
.seraphim-metal-panel{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--seraphim-primary) 32%,#fff);border-radius:var(--seraphim-radius-xl);background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-neutral) 92%,#020617),color-mix(in srgb,var(--seraphim-primary) 22%,#020617));color:white;box-shadow:0 28px 90px rgb(2 6 23 / .26);}
.seraphim-gloss-sweep::after,.seraphim-speed-lines::after{content:"";position:absolute;inset:-40% auto -40% 18%;width:26%;transform:rotate(18deg);background:linear-gradient(90deg,transparent,rgb(255 255 255 / .28),transparent);pointer-events:none;}
.seraphim-speed-lines{position:relative;overflow:hidden;}
.seraphim-speed-lines::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(110deg,transparent 0 18px,color-mix(in srgb,var(--seraphim-accent) 18%,transparent) 19px 21px,transparent 22px 44px);opacity:.44;}
.seraphim-paw-mark,.seraphim-tool-icon{display:inline-grid;place-items:center;width:2.65rem;aspect-ratio:1;border-radius:999px;background:color-mix(in srgb,var(--seraphim-secondary) 14%,white);color:var(--seraphim-primary);border:1px solid color-mix(in srgb,var(--seraphim-primary) 18%,transparent);}
.seraphim-paw-mark::before{content:"";width:1.15rem;aspect-ratio:1;border-radius:50% 50% 45% 45%;background:currentColor;box-shadow:-.55rem -.45rem 0 -.22rem currentColor,0 -.62rem 0 -.23rem currentColor,.55rem -.45rem 0 -.22rem currentColor;}
.seraphim-soft-blob,.seraphim-soft-gradient{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-secondary) 18%,white),color-mix(in srgb,var(--seraphim-primary) 10%,white));}
.seraphim-soft-blob::before{content:"";position:absolute;inset:auto -8% -22% auto;width:38%;aspect-ratio:1;border-radius:46% 54% 66% 34% / 42% 48% 52% 58%;background:color-mix(in srgb,var(--seraphim-accent) 16%,transparent);z-index:-1;}
.seraphim-map-panel{position:relative;overflow:hidden;border-radius:var(--seraphim-radius-xl);padding:clamp(1rem,2.4vw,1.75rem);background:linear-gradient(180deg,color-mix(in srgb,var(--seraphim-bg) 86%,white),var(--seraphim-surface));border:1px solid color-mix(in srgb,var(--seraphim-border) 84%,transparent);}
.seraphim-map-panel::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 0 40%,color-mix(in srgb,var(--seraphim-primary) 18%,transparent) 41% 42%,transparent 43%),linear-gradient(35deg,transparent 0 52%,color-mix(in srgb,var(--seraphim-secondary) 18%,transparent) 53% 54%,transparent 55%);opacity:.7;}
.seraphim-tool-icon{border-radius:var(--seraphim-radius-lg);}
.seraphim-tool-icon::before{content:"";width:1.15rem;height:.28rem;border-radius:999px;background:currentColor;transform:rotate(-35deg);box-shadow:.45rem .45rem 0 -.06rem currentColor;}
.seraphim-product-shelf{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr));gap:1rem;align-items:end;border-bottom:4px solid color-mix(in srgb,var(--seraphim-primary) 24%,var(--seraphim-border));padding-bottom:1rem;}
.seraphim-route-line{position:relative;display:grid;gap:.75rem;}
.seraphim-route-line::before{content:"";position:absolute;left:1.15rem;top:.5rem;bottom:.5rem;width:2px;background:linear-gradient(var(--seraphim-primary),var(--seraphim-secondary));opacity:.55;}
.seraphim-postcard{border:1px solid color-mix(in srgb,var(--seraphim-border) 80%,transparent);border-radius:var(--seraphim-radius-lg);padding:clamp(1rem,2vw,1.5rem);background:linear-gradient(180deg,#fff,color-mix(in srgb,var(--seraphim-secondary) 8%,white));box-shadow:0 18px 52px rgb(15 23 42 / .08);transform:rotate(-.4deg);}
.seraphim-interface-frame{overflow:hidden;border:1px solid color-mix(in srgb,var(--seraphim-primary) 26%,var(--seraphim-border));border-radius:var(--seraphim-radius-xl);background:linear-gradient(180deg,color-mix(in srgb,var(--seraphim-neutral) 94%,#020617),#020617);color:white;box-shadow:0 28px 90px rgb(2 6 23 / .25);}
.seraphim-interface-frame::before{content:"";display:block;height:2.4rem;background:linear-gradient(90deg,rgb(255 255 255 / .16),rgb(255 255 255 / .05));border-bottom:1px solid rgb(255 255 255 / .12);}
.seraphim-feature-band{position:relative;overflow:hidden;border-radius:clamp(1.5rem,4vw,3rem);padding:clamp(1.4rem,4vw,3.5rem);background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-primary) 92%,#111827),color-mix(in srgb,var(--seraphim-accent) 58%,#111827));color:white;box-shadow:0 30px 90px rgb(2 6 23 / .22);}
.seraphim-feature-band::after{content:"";position:absolute;inset:auto -8% -28% auto;width:42%;aspect-ratio:1;border-radius:999px;background:rgb(255 255 255 / .16);filter:blur(4px);}
.seraphim-feature-band .seraphim-body-text,.seraphim-feature-band p{color:rgb(255 255 255 / .78);}
.seraphim-timeline{display:grid;gap:.85rem;counter-reset:step;}
.seraphim-step{counter-increment:step;display:grid;grid-template-columns:auto minmax(0,1fr);gap:1rem;align-items:start;padding:1rem;border:1px solid color-mix(in srgb,var(--seraphim-border) 80%,transparent);border-radius:var(--seraphim-radius-lg);background:var(--seraphim-surface);}
.seraphim-step::before{content:counter(step,decimal-leading-zero);display:grid;place-items:center;width:2.5rem;aspect-ratio:1;border-radius:50%;background:var(--seraphim-primary);color:white;font-weight:900;font-size:.8rem;}
.seraphim-showcase-grid{display:grid;grid-template-columns:1fr;gap:1rem;}
.seraphim-showcase-tile{min-height:15rem;border-radius:var(--seraphim-radius-xl);overflow:hidden;background:linear-gradient(135deg,color-mix(in srgb,var(--seraphim-primary) 24%,white),color-mix(in srgb,var(--seraphim-secondary) 24%,white));border:1px solid color-mix(in srgb,var(--seraphim-border) 82%,transparent);box-shadow:0 18px 60px rgb(15 23 42 / .09);}
.seraphim-faq-list{display:grid;gap:.75rem;max-width:880px;margin-inline:auto;}
.seraphim-faq-list details,.seraphim-faq-item{border:1px solid color-mix(in srgb,var(--seraphim-border) 85%,transparent);border-radius:var(--seraphim-radius-lg);background:var(--seraphim-surface);box-shadow:0 14px 42px rgb(15 23 42 / .06);overflow:hidden;}
.seraphim-faq-list summary{cursor:pointer;padding:1rem 1.15rem;font-weight:850;list-style:none;}
.seraphim-faq-list summary::-webkit-details-marker{display:none;}
.seraphim-faq-list details p,.seraphim-faq-answer{padding:0 1.15rem 1.1rem;margin:0;color:var(--seraphim-muted);}
.seraphim-contact-panel{display:grid;gap:1rem;border-radius:clamp(1.4rem,4vw,2.6rem);padding:clamp(1.25rem,4vw,3rem);background:var(--seraphim-neutral);color:white;box-shadow:0 28px 90px rgb(2 6 23 / .28);}
.seraphim-contact-panel a{color:inherit;}
.seraphim-contact-methods{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr));gap:.8rem;}
.seraphim-contact-method{border:1px solid rgb(255 255 255 / .18);border-radius:var(--seraphim-radius-lg);padding:1rem;background:rgb(255 255 255 / .08);}
.seraphim-mobile-cta{position:fixed;left:1rem;right:1rem;bottom:max(1rem,env(safe-area-inset-bottom));z-index:30;display:none;align-items:center;justify-content:center;min-height:52px;border-radius:999px;background:var(--seraphim-primary);color:white;text-decoration:none;font-weight:900;box-shadow:0 20px 52px color-mix(in srgb,var(--seraphim-primary) 35%,transparent);}
.seraphim-source-proof-frame{width:min(1120px,calc(100% - 2rem));margin:clamp(1.5rem,4vw,3rem) auto 0;display:grid;gap:.65rem;border-radius:var(--seraphim-radius-xl);padding:clamp(.55rem,1.4vw,.85rem);background:linear-gradient(180deg,color-mix(in srgb,var(--seraphim-surface) 92%,white),color-mix(in srgb,var(--seraphim-bg) 90%,white));border:1px solid color-mix(in srgb,var(--seraphim-border) 82%,transparent);box-shadow:0 24px 80px rgb(15 23 42 / .12);}
.seraphim-source-proof-frame .seraphim-source-photo{max-height:clamp(22rem,54vw,42rem);object-fit:cover;object-position:top center;border-radius:calc(var(--seraphim-radius-xl) - .35rem);box-shadow:none;}
.seraphim-source-proof-frame figcaption{padding:.2rem .35rem .35rem;color:var(--seraphim-muted);font-size:.82rem;line-height:1.45;}
@media (min-width:760px){.seraphim-editorial-grid,.seraphim-hero-editorial,.seraphim-hero-montage{grid-template-columns:minmax(0,1.02fr) minmax(18rem,.98fr);}.seraphim-editorial-grid[data-flip="true"]>*:first-child{order:2}.seraphim-proof-strip{grid-template-columns:repeat(4,minmax(0,1fr));}.seraphim-contact-strip{grid-template-columns:minmax(0,1fr) auto;}.seraphim-gallery-frame{grid-template-columns:1.2fr .8fr;}.seraphim-gallery-tile:first-child{grid-row:span 2;min-height:30rem;}.seraphim-showcase-grid{grid-template-columns:1.2fr .8fr;}.seraphim-showcase-tile:nth-child(1){grid-row:span 2;min-height:32rem;}}
@media (max-width:720px){.seraphim-display{font-size:clamp(2.55rem,16vw,4.6rem);}.seraphim-proof-strip{grid-template-columns:1fr;}.seraphim-action-row>*{width:100%;}.seraphim-mobile-cta{display:flex;}body:has(.seraphim-mobile-cta){padding-bottom:5rem;}.seraphim-hero-media{min-height:22rem;border-radius:1.35rem;}.seraphim-feature-band{border-radius:1.35rem;}}
@media (prefers-reduced-motion:no-preference){.seraphim-reveal,.reveal{opacity:0;transform:translateY(18px);animation:seraphimRise .7s ease forwards;}.seraphim-card:hover .seraphim-generated-photo{transform:scale(1.025);}@keyframes seraphimRise{to{opacity:1;transform:translateY(0);}}}
`;
}

function buildTokenCss(tokens: DesignTokens, plan: WebsitePlan, designSystem?: DesignSystemContract, pageContract?: PageContract) {
  const neutral = tokens.colors.neutral;
  const contractColors = designSystem?.tokens.colors ?? {};
  const contractFonts = designSystem?.tokens.fonts ?? {};
  const contractSpacing = designSystem?.tokens.spacing ?? {};
  const contractRadius = designSystem?.tokens.radius ?? {};
  const contractShadows = designSystem?.tokens.shadows ?? {};
  const contractGradients = designSystem?.tokens.gradients ?? {};
  const contractBorders = designSystem?.tokens.borders ?? {};
  const componentCss = designSystem
    ? Object.values(designSystem.components).map((component) => component.css).filter(Boolean).join("\n")
    : "";

  return `:root {
  --color-primary: ${contractColors.primary || plan.colorPalette.primary || tokens.colors.primary};
  --color-secondary: ${contractColors.secondary || plan.colorPalette.secondary || tokens.colors.secondary};
  --color-accent: ${contractColors.accent || plan.colorPalette.accent || tokens.colors.accent};
  --color-neutral: ${contractColors.neutral || plan.colorPalette.neutral || neutral[900] || "#0F172A"};
  --color-bg: ${contractColors.bg || neutral[50] || "#F8FAFC"};
  --color-surface: ${contractColors.surface || "#ffffff"};
  --color-text: ${contractColors.text || neutral[900] || "#0F172A"};
  --color-muted: ${contractColors.muted || neutral[600] || "#475569"};
  --color-border: ${contractColors.border || neutral[200] || "#E2E8F0"};
  --seraphim-primary: var(--color-primary);
  --seraphim-secondary: var(--color-secondary);
  --seraphim-accent: var(--color-accent);
  --seraphim-neutral: var(--color-neutral);
  --seraphim-bg: var(--color-bg);
  --seraphim-surface: var(--color-surface);
  --seraphim-text: var(--color-text);
  --seraphim-muted: var(--color-muted);
  --seraphim-border: var(--color-border);
  --font-heading: ${contractFonts.heading || tokens.fonts.heading};
  --font-body: ${contractFonts.body || tokens.fonts.body};
  --seraphim-heading-font: var(--font-heading);
  --seraphim-body-font: var(--font-body);
  --radius-sm: ${contractRadius.sm || tokens.borderRadius.sm};
  --radius-md: ${contractRadius.md || tokens.borderRadius.md};
  --radius-lg: ${contractRadius.lg || tokens.borderRadius.lg};
  --radius-xl: ${contractRadius.xl || tokens.borderRadius.xl};
  --seraphim-radius-sm: var(--radius-sm);
  --seraphim-radius-md: var(--radius-md);
  --seraphim-radius-lg: var(--radius-lg);
  --seraphim-radius-xl: var(--radius-xl);
  --shadow-md: ${tokens.shadows.md};
  --shadow-lg: ${tokens.shadows.lg};
  --seraphim-shadow-card: ${contractShadows.card || tokens.shadows.lg || tokens.shadows.md};
  --seraphim-gradient-hero: ${contractGradients.hero || "linear-gradient(135deg, color-mix(in srgb, var(--seraphim-primary) 14%, white), white)"};
  --seraphim-border-subtle: ${contractBorders.subtle || "1px solid var(--seraphim-border)"};
  --space-base: ${contractSpacing.base || tokens.spacing.base};
  --seraphim-section-space: ${contractSpacing.section || "clamp(4rem, 8vw, 8rem)"};
  --seraphim-container: ${contractSpacing.container || "min(1120px, calc(100% - 2rem))"};
  --seraphim-gap: ${contractSpacing.gap || "clamp(1rem, 2vw, 2rem)"};
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
main > section {
  max-width: 100vw;
  overflow: hidden;
}
main > section:not(.seraphim-section) {
  padding-inline: clamp(1rem, 4vw, 3rem);
}
main > section > :where(div, article, header, figure):first-child:not(.seraphim-source-proof-frame) {
  max-width: min(1200px, 100%);
}
main :where(h1, h2, h3, p, a, button) {
  overflow-wrap: anywhere;
}
.seraphim-generated-photo {
  width: 100%;
  min-height: clamp(18rem, 38vw, 34rem);
  aspect-ratio: 16 / 11;
  object-fit: cover;
  border-radius: var(--seraphim-radius-xl);
  box-shadow: var(--seraphim-shadow-card);
  background: var(--seraphim-gradient-hero);
}
.seraphim-image-frame .seraphim-generated-photo,
picture .seraphim-generated-photo {
  height: 100%;
}
.seraphim-site { min-height: 100vh; }
.seraphim-skip-link { position: absolute; left: 1rem; top: 1rem; z-index: 999; transform: translateY(-140%); background: var(--seraphim-text); color: white; padding: .75rem 1rem; border-radius: .75rem; }
.seraphim-skip-link:focus { transform: translateY(0); }
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
.seraphim-reveal { opacity: 1; transform: none; }
@media (max-width: 720px) {
  .seraphim-header { align-items: flex-start; flex-direction: column; }
  .seraphim-header-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .seraphim-menu-toggle { display: inline-flex; align-items: center; justify-content: center; }
  .seraphim-nav { display: none; width: 100%; flex-direction: column; }
  .seraphim-nav[data-open="true"] { display: flex; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
${componentCss}
${buildReferenceQualityCss()}
${pageContract?.globalCss || ""}`;
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
  creativeContract: CreativeContract;
  designSystem: DesignSystemContract;
  pageContract: PageContract;
  sections: string[];
}) {
  const title = `${input.business.name} | ${input.cleanBusinessData.businessType}`;
  const description = compactText(
    input.creativeContract.businessIdentity.offerSummary ||
      input.business.description ||
      input.plan.conversionFlow ||
      input.cleanBusinessData.visibleDescription,
    155,
  );
  const bodyStyle = [
    `--seraphim-primary:${input.plan.colorPalette.primary || input.tokens.colors.primary}`,
    `--seraphim-secondary:${input.plan.colorPalette.secondary || input.tokens.colors.secondary}`,
    `--seraphim-accent:${input.plan.colorPalette.accent || input.tokens.colors.accent}`,
    `--seraphim-heading-font:${input.tokens.fonts.heading}`,
    `--seraphim-body-font:${input.tokens.fonts.body}`,
  ].join(";");
  const navLinks = input.pageContract.sections
    .slice(0, 6)
    .map((section) => {
      const id = slugify(section.id || section.name);
      return `<a href="#${id}">${escapeHtml(section.name)}</a>`;
    })
    .join("");
  const sections = ensureSourceImageFeatured(input.sections, input.cleanBusinessData);

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
  <style>${buildTokenCss(input.tokens, input.plan, input.designSystem, input.pageContract)}</style>
</head>
<body data-seraphim-generator="true" style="${escapeHtml(bodyStyle)}">
  <a class="seraphim-skip-link" href="#main-content">Skip to content</a>
  <div class="seraphim-site">
    <header class="seraphim-header">
      <div class="seraphim-header-row">
        <a class="seraphim-brand" href="#">${escapeHtml(input.business.name)}</a>
        <button class="seraphim-menu-toggle" type="button" aria-controls="seraphim-primary-nav" aria-expanded="false">Menu</button>
      </div>
      <nav id="seraphim-primary-nav" class="seraphim-nav" aria-label="Primary navigation">${navLinks}</nav>
    </header>
    <main id="main-content">
      ${sections.join("\n\n")}
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

function heuristicVisualIssues(input: {
  html: string;
  cleanBusinessData: CleanBusinessData;
  designSystem: DesignSystemContract;
  pageContract: PageContract;
  visualIdentity: VisualIdentityProfile;
  archetypeReconciliation: ArchetypeReconciliation;
  premiumReferenceBrief?: PremiumReferenceBrief;
  visualMotifs: PremiumVisualMotifRecommendation;
}) {
  const issues: string[] = [];
  const sectionIssues: VisualQAResult["sectionIssues"] = [];
  const visibleText = input.html
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const firstViewportText = visibleText.slice(0, 2600).toLowerCase();
  const leakedPlanningLanguage = [
    "orient and convert",
    "decision moment",
    "conversion story",
    "customer question",
    "section contract",
    "page contract",
    "creative contract",
    "design system contract",
    "required content",
    "must avoid",
    "verified business facts",
    "verified business details",
    "missing facts",
    "raw extracted data",
    "support the conversion path",
    "support the page conversion story",
  ].filter((phrase) => visibleText.toLowerCase().includes(phrase));
  const leakedPlanningSections = input.pageContract.sections.flatMap((section) => {
    const id = section.id || slugify(section.name);
    const match = input.html.match(new RegExp(`<section\\b[^>]*id=["']${escapeRegExp(id)}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i"));
    const sectionText = (match?.[1] || "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .toLowerCase();
    const phrases = leakedPlanningLanguage.filter((phrase) => sectionText.includes(phrase));
    return phrases.length ? [{ id, phrases }] : [];
  });
  const sectionCount = (input.html.match(/<section\b/gi) ?? []).length;
  const cssText = [...input.html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]).join("\n");
  const referenceBenchmark = input.premiumReferenceBrief?.benchmark;
  const minReferenceSections = Math.min(9, Math.max(7, referenceBenchmark?.minSections ?? 7));
  const minReferenceCssLength = Math.min(14000, Math.max(8500, referenceBenchmark?.minCssLength ?? 9000));
  const classNames = [...input.html.matchAll(/\bclass=["']([^"']+)["']/gi)]
    .flatMap((match) => match[1].split(/\s+/))
    .map((className) => className.trim())
    .filter(Boolean);
  const definedClassNames = new Set([
    ...[...cssText.matchAll(/\.([_a-zA-Z][-_a-zA-Z0-9]*)/g)].map((match) => match[1]),
    ...Object.values(input.designSystem.components).map((component) => component.className),
  ]);
  const motifClassMap: Record<string, string[]> = {
    "divider-organic-wave": ["seraphim-divider-wave"],
    "divider-precision-angle": ["seraphim-divider-angle"],
    "texture-tactile-grain": ["seraphim-texture-grain"],
    "texture-blueprint-grid": ["seraphim-texture-blueprint"],
    "badge-verified-facts": ["seraphim-fact-badge"],
    "frame-editorial-offset": ["seraphim-frame-offset"],
    "frame-rugged-utility": ["seraphim-frame-utility"],
    "icon-contained-line": ["seraphim-icon-mark"],
    "cta-ribbon-band": ["seraphim-cta-band"],
    "mask-arched-window": ["seraphim-mask-arch"],
    "mask-diagonal-crop": ["seraphim-mask-diagonal"],
    "proof-strip-verified": ["seraphim-proof-strip"],
    "service-rail-intent": ["seraphim-service-rail", "seraphim-service-rail-item"],
  };
  const assetPackClasses = input.visualMotifs.industryAssetPack.cssContractNotes
    .map((className) => className.replace(/^\./, ""))
    .filter((className) => /^seraphim-/.test(className));
  const recommendedMotifClasses = unique([
    ...input.visualMotifs.primitives.flatMap((motif) => motifClassMap[motif.id] ?? []),
    ...assetPackClasses,
  ]);
  const usedMotifClasses = recommendedMotifClasses.filter((className) =>
    classNames.includes(className) || cssText.includes(`.${className}`),
  );
  const deadMotifClasses = recommendedMotifClasses.filter((className) =>
    classNames.includes(className) && !definedClassNames.has(className),
  );
  const tailwindLikeClasses = classNames.filter((className) =>
    /^(sm:|md:|lg:|xl:|2xl:|flex|grid|block|hidden|inline-flex|items-|justify-|gap-|p[trblxy]?-\d|m[trblxy]?-\d|text-|bg-|rounded|shadow|w-|h-|max-w-|min-h-|mx-|my-|space-|border-|opacity-|translate-|scale-)/.test(className),
  );
  const deadTailwindClasses = tailwindLikeClasses.filter((className) => !definedClassNames.has(className.replace(/^[a-z0-9]+:/i, "")));
  const imageTags = [...input.html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const unreliableImages = imageTags
    .map((tag) => attributeValue(tag, "src"))
    .filter(isUnreliableImageSrc);
  const missingAltImages = imageTags.filter((tag) => !/\salt\s*=/i.test(tag));
  const representativeRemoteImages = imageTags
    .map((tag) => attributeValue(tag, "src"))
    .filter((src) => /^https:\/\//i.test(src))
    .filter((src) => /(unsplash|pexels|pixabay|images\.ctfassets|images\.restaurant|images\.squarespace|cdn)/i.test(src));
  const unlabeledRepresentativeMedia = representativeRemoteImages.length > 0 &&
    !/(representative imagery|representative image|replace with verified business photography|source image supplied|verified source material)/i.test(visibleText);
  const emptyInteractiveControls = [
    ...input.html.matchAll(/<(?:a|button)\b[^>]*>\s*<\/(?:a|button)>/gi),
  ];
  const expressiveCueText = input.visualIdentity.industryCues.join(" ").toLowerCase();
  const expressiveNiche = /(food|hospitality|pet|automotive|home services|trades|beauty|salon|wellness|retail|boutique|creative)/i.test(expressiveCueText);
  const usesCorporateDefaults = /#0f172a|#111827|#1e293b|#334155|#2b5e8c|blue-gray|slate/i.test(input.html) ||
    /font-family:\s*(?:var\(--font-body\),?\s*)?Inter\b/i.test(cssText);
  const extractedColorMisses = input.visualIdentity.extractedColors
    .filter((color) => /^#[0-9a-f]{6}$/i.test(color))
    .filter((color) => !input.html.toLowerCase().includes(color.toLowerCase()));
  const visualWords = unique([
    ...input.visualIdentity.dominantAccents,
    input.visualIdentity.logoMood,
    input.visualIdentity.imageEnergy,
    ...input.visualIdentity.industryCues,
  ]).join(" ").toLowerCase();
  const weakNicheCopy = expressiveNiche && !visualWords
    .split(/[^a-z]+/)
    .filter((word) => word.length > 4)
    .some((word) => visibleText.toLowerCase().includes(word));
  const genericCorporateLanguage = /(transform your business|solutions for every need|elevate your brand|modern solutions|unlock growth|trusted partner|comprehensive services|tailored solutions|seamless experience|best-in-class)/i.test(visibleText);
  const technicallyCompleteSignals = [
    /<title>/i.test(input.html),
    /meta\s+name=["']description/i.test(input.html),
    sectionCount >= 6,
    /@media/i.test(cssText),
    /(href=["']tel:|href=["']mailto:|contact|call|message|whatsapp)/i.test(input.html),
  ].filter(Boolean).length;
  const technicallyCompleteButBoring = technicallyCompleteSignals >= 4 &&
    (genericCorporateLanguage || usesCorporateDefaults && expressiveNiche || weakNicheCopy);

  if (!/<title>/i.test(input.html) || !/meta\s+name=["']description/i.test(input.html)) issues.push("Missing core SEO metadata.");
  if (!/<script[^>]+type=["']application\/ld\+json["']/i.test(input.html)) issues.push("Missing JSON-LD schema.");
  if (!/data-seraphim-generator=["']true["']/i.test(input.html)) issues.push("Missing Seraphim output signature.");
  if (!/<section\b/i.test(input.html)) issues.push("No meaningful sections were generated.");
  if (sectionCount < minReferenceSections) issues.push(`Generated page has ${sectionCount} sections, below the local premium reference floor of ${minReferenceSections}.`);
  if (cssText.length < minReferenceCssLength) issues.push(`Embedded CSS is too shallow (${cssText.length} chars), below the local premium reference floor of ${minReferenceCssLength} chars.`);
  if (input.html.length < 12000) issues.push("Generated HTML is too short to feel like a premium full landing page.");
  if (/<meta\s+name=["']keywords["']/i.test(input.html)) issues.push("Meta keywords are not allowed.");
  if (deadTailwindClasses.length) issues.push(`Dead Tailwind-style classes found without embedded CSS: ${unique(deadTailwindClasses).slice(0, 12).join(", ")}.`);
  if (deadMotifClasses.length) issues.push(`Dead visual motif classes found without embedded CSS: ${deadMotifClasses.slice(0, 12).join(", ")}.`);
  if (input.visualMotifs.primitives.length >= 3 && usedMotifClasses.length < Math.min(3, input.visualMotifs.primitives.length)) {
    issues.push(`Premium motif recommendations were mostly ignored: expected reusable primitives such as ${recommendedMotifClasses.slice(0, 8).join(", ")}.`);
  }
  if (unreliableImages.length) issues.push(`Unreliable or broken image sources found: ${unique(unreliableImages).slice(0, 6).join(", ")}.`);
  if (missingAltImages.length) issues.push("One or more image tags are missing alt text.");
  if (unlabeledRepresentativeMedia) issues.push("Representative remote imagery appears without an honest visible label or replacement note.");
  if (emptyInteractiveControls.length) issues.push("Empty anchor or button controls found.");
  if (input.archetypeReconciliation.mismatch) {
    issues.push(`Archetype mismatch corrected before generation: ${input.archetypeReconciliation.warnings.join(" ") || `${input.archetypeReconciliation.selectedArchetypeId} did not fit ${input.archetypeReconciliation.recommendedArchetypeId}`}`);
  }
  if (input.archetypeReconciliation.finalArchetypeId === "professional-services" && expressiveNiche) {
    issues.push("Archetype mismatch risk: expressive local niche still resembles generic professional/business services.");
  }
  if (usesCorporateDefaults && expressiveNiche) {
    issues.push("Corporate-default risk: page uses navy/blue-gray/Inter-style defaults for a niche that needs stronger visual identity.");
  }
  if (extractedColorMisses.length >= Math.min(2, input.visualIdentity.extractedColors.length)) {
    issues.push(`Palette mismatch: extracted visual colors are not clearly carried into the final HTML (${extractedColorMisses.slice(0, 4).join(", ")}).`);
  }
  if (weakNicheCopy) {
    issues.push("Weak niche cues: visible copy and visual language do not strongly reflect the extracted industry mood or image energy.");
  }
  if (!/(warm|flavor|fresh|care|comfort|finish|detail|repair|quick|local|island|home|pet|groom|shine|style|visit|book|call)/i.test(visibleText) && expressiveNiche) {
    issues.push("Missing emotional hook: page does not make the niche-specific feeling obvious to the visitor.");
  }
  if (technicallyCompleteButBoring) {
    issues.push("Technically complete but boring: the page has required structure but feels generic, emotionally flat, or transferable to another business.");
  }
  if (/(five-star|5-star|award-winning|guaranteed|certified|\b(?!0\b)\d+ reviews\b|\b\d+\+ customers\b|trusted by thousands|best-in-class)/i.test(input.html)) {
    issues.push("Potential fabricated proof, generic hype, or unsupported metrics found.");
  }
  if (/\bplaceholder\b|lorem ipsum|TODO|your image here|\[[A-Z][^\]]{2,60}\]/i.test(visibleText)) issues.push("Placeholder content found.");
  if (/(transform your business|solutions for every need|private concept)/i.test(visibleText)) issues.push("Generic AI/template wording found.");
  if (leakedPlanningLanguage.length) {
    issues.push(`Internal planning language leaked into visible copy: ${unique(leakedPlanningLanguage).slice(0, 8).join(", ")}.`);
  }
  if (!new RegExp(escapeRegExp(input.cleanBusinessData.companyName), "i").test(firstViewportText)) {
    issues.push("Business name is missing from the first viewport text.");
  }
  if (!/(href=["']tel:|href=["']mailto:|contact|call|message|enquir|inquir|whatsapp)/i.test(input.html)) {
    issues.push("No clear contact path or CTA was found.");
  }
  if (!/(hero|gallery|media|visual|showcase|image-frame|figure|object-fit|aspect-ratio|seraphim-generated-photo)/i.test(input.html)) {
    issues.push("No clear industry-specific visual/media moment was found.");
  }
  if (!/(faq|<details\b|aria-expanded)/i.test(input.html)) {
    issues.push("No FAQ or accordion-style decision support was found.");
  }
  if (!/(reveal|intersectionobserver|data-reveal|@keyframes|transition:|animation:)/i.test(input.html)) {
    issues.push("No interaction or reveal layer was found.");
  }
  if (sectionCount >= 6 && input.pageContract.sections.length >= 6) {
    const sectionNames = input.pageContract.sections.map((section) => section.name.toLowerCase());
    if (new Set(sectionNames).size < Math.min(5, sectionNames.length)) issues.push("Section variety is too low.");
  }

  if (deadTailwindClasses.length) {
    sectionIssues.push({
      sectionId: input.pageContract.sections[0]?.id || "global",
      severity: "high",
      issue: "Section HTML includes Tailwind-style classes that are not defined in embedded CSS.",
      revisionInstruction: "Regenerate the affected sections using only design-system classes or scoped CSS for every new class.",
    });
  }
  if (deadMotifClasses.length || usedMotifClasses.length < Math.min(3, input.visualMotifs.primitives.length)) {
    sectionIssues.push({
      sectionId: input.pageContract.sections[0]?.id || "hero",
      severity: "high",
      issue: "The page is not using the recommended premium visual motif primitives reliably.",
      revisionInstruction: `Regenerate the hero, service, proof, and CTA sections using selected motif primitives with embedded CSS definitions. Recommended classes include ${recommendedMotifClasses.slice(0, 10).join(", ")}. Keep motifs primitive-level and factual; do not add fake proof.`,
    });
  }
  if (unreliableImages.length) {
    sectionIssues.push({
      sectionId: input.pageContract.sections[0]?.id || "global",
      severity: "high",
      issue: "Generated HTML includes unreliable image sources that can break in standalone previews.",
      revisionInstruction: "Regenerate media-heavy sections without local filenames, placeholder image services, or relative screenshot paths. Use reliable inline SVG/data-URI visual compositions or verified remote image URLs only.",
    });
  }
  if (missingAltImages.length || unlabeledRepresentativeMedia) {
    sectionIssues.push({
      sectionId: input.pageContract.sections[0]?.id || "global",
      severity: "high",
      issue: "Generated media does not follow Seraphim photo-direction safety rules.",
      revisionInstruction: "Regenerate media sections so every image has honest alt text. Use uploaded source imagery when verified, CSS/SVG art when safer, and visibly label representative imagery with 'Representative imagery - replace with verified business photography before launch' when it may be mistaken for actual business material.",
    });
  }
  if (cssText.length < minReferenceCssLength) {
    sectionIssues.push({
      sectionId: input.pageContract.sections[0]?.id || "global",
      severity: "high",
      issue: "The generated page does not have enough embedded CSS depth to match the local premium references.",
      revisionInstruction: "Regenerate sections with richer design-system usage, varied compositions, responsive media treatment, hover/focus states, layered surfaces, and scoped CSS only where needed.",
    });
  }
  if (technicallyCompleteButBoring || usesCorporateDefaults && expressiveNiche || weakNicheCopy) {
    sectionIssues.push({
      sectionId: input.pageContract.sections[0]?.id || "hero",
      severity: "high",
      issue: "The page is structurally complete but creatively generic for the extracted niche.",
      revisionInstruction: `Regenerate the hero and strongest visual sections around this identity: ${input.visualIdentity.imageEnergy}; ${input.visualIdentity.paletteRationale}; ${input.visualIdentity.layoutImplications.join(" ")} Avoid generic corporate language and default navy/gray styling.`,
    });
  }
  if (emptyInteractiveControls.length) {
    sectionIssues.push({
      sectionId: input.pageContract.sections[0]?.id || "global",
      severity: "medium",
      issue: "Generated HTML contains empty links or buttons.",
      revisionInstruction: "Regenerate CTA sections so every link and button has visible, accessible text and clear contrast.",
    });
  }
  for (const leakedSection of leakedPlanningSections.length
    ? leakedPlanningSections
    : leakedPlanningLanguage.length
      ? [{ id: input.pageContract.sections[0]?.id || "global", phrases: leakedPlanningLanguage }]
      : []) {
    sectionIssues.push({
      sectionId: leakedSection.id,
      severity: "high",
      issue: "Visible copy contains internal planning language instead of customer-facing website copy.",
      revisionInstruction: `Regenerate this section because it contains ${unique(leakedSection.phrases).slice(0, 8).join(", ")}. Replace every internal goal, contract label, or QA phrase with polished public-facing headlines and body copy for the actual business.`,
    });
  }

  return { issues, sectionIssues };
}

function qaFromHeuristics(heuristic: ReturnType<typeof heuristicVisualIssues>): SectionQAResult {
  const issueText = heuristic.issues.join(" ").toLowerCase();
  const maxScore = issueText.includes("technically complete but boring")
    ? 7.1
    : issueText.includes("corporate-default risk") || issueText.includes("archetype mismatch")
      ? 7.4
      : issueText.includes("palette mismatch") || issueText.includes("weak niche cues") || issueText.includes("missing emotional hook") || issueText.includes("premium motif")
        ? 7.8
        : 8.5;
  const rawScore = heuristic.issues.length === 0 ? 8.7 : Math.max(4.5, 8 - heuristic.issues.length * 0.45);
  return {
    passed: heuristic.issues.length === 0,
    score: Math.min(rawScore, maxScore),
    issues: heuristic.issues,
    sectionIssues: heuristic.sectionIssues,
    globalRevisionInstruction: heuristic.issues.length
      ? `Fix visual QA issues: ${heuristic.issues.join(" ")}`
      : "Passed heuristic visual QA.",
  };
}

async function runVisualQA(input: {
  html: string;
  creativeContract: CreativeContract;
  designSystem: DesignSystemContract;
  pageContract: PageContract;
  cleanBusinessData: CleanBusinessData;
  visualIdentity: VisualIdentityProfile;
  archetypeReconciliation: ArchetypeReconciliation;
  premiumReferenceBrief: PremiumReferenceBrief;
  visualMotifs: PremiumVisualMotifRecommendation;
  generationDepth?: "fast-draft" | "premium-final";
}) {
  const heuristic = heuristicVisualIssues(input);
  const renderQa = await runRenderQA(input.html);
  const renderIssues = renderQa.findings
    .filter((finding) => finding.severity !== "low")
    .map((finding) => `Render QA ${finding.viewport}: ${finding.issue}`);
  const combinedHeuristic = {
    issues: unique([...heuristic.issues, ...renderIssues]),
    sectionIssues: [
      ...heuristic.sectionIssues,
      ...renderQa.findings
        .filter((finding) => finding.severity === "high")
        .map((finding) => ({
          sectionId: input.pageContract.sections[0]?.id || "global",
          severity: "high" as const,
          issue: `Render QA ${finding.viewport}: ${finding.issue}`,
          revisionInstruction: "Regenerate affected sections with mobile-safe layout, stable media sizing, and no horizontal overflow.",
        })),
    ],
  };
  const heuristicQa = qaFromHeuristics(combinedHeuristic);
  const errors: string[] = [];
  if (renderQa.warnings.length) errors.push(...renderQa.warnings);
  const mode = generationModeSummary(normalizeGenerationDepth(input.generationDepth));

  if (!mode.visualModelQa) {
    return {
      qa: {
        ...heuristicQa,
        renderQA: {
          available: renderQa.available,
          findings: renderQa.findings,
          warnings: renderQa.warnings,
        },
      },
      metadata: { stage: "visual-qa", provider: "local", model: "fast-draft-heuristic-render-qa", fallback: true } satisfies StageMetadata,
      errors,
    };
  }

  for (const route of getRoutesForStage("visual-qa")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        generateTextWithRoute(buildVisualQAPrompt(input), route, {
          temperature: 0.05,
          maxOutputTokens: 5000,
          responseMimeType: "application/json",
        }),
      );
      const modelQa = parseVisualQAResult(text, heuristicQa);
      const usedHeuristicFallback = modelQa === heuristicQa;
      if (usedHeuristicFallback) errors.push(`${route.provider}:${route.model}: Visual QA returned invalid JSON; heuristic QA was used.`);
      const issues = unique([...combinedHeuristic.issues, ...(usedHeuristicFallback ? [] : modelQa.issues)]);
      const sectionIssues = [...combinedHeuristic.sectionIssues, ...(usedHeuristicFallback ? [] : modelQa.sectionIssues)];
      const issueText = issues.join(" ").toLowerCase();
      const scoreCap = issueText.includes("technically complete but boring")
        ? 7.1
        : issueText.includes("corporate-default risk") || issueText.includes("archetype mismatch")
          ? 7.4
          : issueText.includes("palette mismatch") || issueText.includes("weak niche cues") || issueText.includes("missing emotional hook") || issueText.includes("premium motif")
            ? 7.8
            : 8.2;
      return {
        qa: {
          ...modelQa,
          passed: (usedHeuristicFallback ? heuristicQa.passed : modelQa.passed) && issues.length === 0,
          score: issues.length ? Math.min(modelQa.score || heuristicQa.score, scoreCap) : (modelQa.score || heuristicQa.score),
          issues,
          sectionIssues,
          globalRevisionInstruction: usedHeuristicFallback
            ? heuristicQa.globalRevisionInstruction
            : modelQa.globalRevisionInstruction || "Revise sections to satisfy Creative Contract, Design System, and Page Contract.",
          renderQA: {
            available: renderQa.available,
            findings: renderQa.findings,
            warnings: renderQa.warnings,
          },
        } satisfies SectionQAResult,
        metadata: { stage: "visual-qa", provider: route.provider, model: route.model, fallback: route.fallback || usedHeuristicFallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  return {
    qa: {
      ...heuristicQa,
      renderQA: {
        available: renderQa.available,
        findings: renderQa.findings,
        warnings: renderQa.warnings,
      },
    },
    metadata: { stage: "visual-qa", provider: "local", model: "heuristic-visual-qa", fallback: true } satisfies StageMetadata,
    errors,
  };
}

function sectionContractsForIssues(sections: SectionContract[], qa: SectionQAResult) {
  const targeted = qa.sectionIssues
    .map((issue) => sections.find((section) => section.id === issue.sectionId || section.name.toLowerCase() === issue.sectionId.toLowerCase()))
    .filter((section): section is SectionContract => Boolean(section));
  if (targeted.length) return Array.from(new Map(targeted.map((section) => [section.id, section])).values());

  const issues = qa.issues;
  const issueText = issues.join(" ").toLowerCase();
  const matched = sections.filter((section) => issueText.includes(section.name.toLowerCase()) || issueText.includes(section.id.toLowerCase()));
  return matched.length ? matched : sections.slice(0, Math.min(3, sections.length));
}

function qualityGateFromSectionQA(qa: SectionQAResult): QualityGate {
  const score = qa.score || (qa.passed ? 9 : Math.max(5, 8 - qa.issues.length * 0.4));
  return {
    score: Number(score.toFixed(1)),
    passed: qa.passed,
    dimensionScores: {
      visualPremiumFeel: qa.passed ? 9 : 7,
      desktopLayout: qa.issues.some((issue) => /desktop|render qa/i.test(issue)) ? 6 : 9,
      mobileLayout: qa.issues.some((issue) => /mobile|overflow/i.test(issue)) ? 6 : 9,
      visualMagnetism: qa.passed ? 9 : 7,
      brandSpecificity: qa.passed ? 9 : 7,
      sectionDepth: qa.passed ? 9 : 7,
      conversionClarity: qa.passed ? 9 : 7,
      seoCompleteness: qa.issues.some((issue) => /seo|meta/i.test(issue)) ? 6 : 9,
      mobileResponsiveness: qa.issues.some((issue) => /mobile|overflow/i.test(issue)) ? 6 : 9,
      imageQuality: qa.passed ? 9 : 7,
      imageSafety: qa.issues.some((issue) => /image|media|alt/i.test(issue)) ? 6 : 9,
      interactionQuality: qa.passed ? 9 : 7,
      factualSafety: qa.issues.some((issue) => /fake|fabricated|unsupported/i.test(issue)) ? 5 : 9,
      technicalCompleteness: qa.issues.some((issue) => /empty|broken|overflow|html/i.test(issue)) ? 6 : 9,
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
  creativeContract?: CreativeContract;
  designSystem?: DesignSystemContract;
  pageContract?: PageContract;
  archetype?: Archetype;
  premiumReferenceBrief?: PremiumReferenceBrief;
  visualIdentity?: VisualIdentityProfile;
  archetypeReconciliation?: ArchetypeReconciliation;
  visualMotifs?: PremiumVisualMotifRecommendation;
  qualityGate?: QualityGate;
  revisionCount?: number;
}): GenerationPlanResponse {
  return {
    generationId: input.generationId,
    stage: "planning",
    summary: input.plan.layoutPhilosophy,
    sectionIds: input.pageContract?.sections.map((section) => section.name) ?? input.plan.sections.map((section) => section.name),
    premiumPlan: input.plan,
    creativeContract: input.creativeContract,
    designSystem: input.designSystem,
    pageContract: input.pageContract,
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
    premiumReferenceBrief: input.premiumReferenceBrief,
    visualIdentity: input.visualIdentity,
    archetypeReconciliation: input.archetypeReconciliation,
    visualMotifs: input.visualMotifs,
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
    creativeContract: input.pipeline.creativeContract,
    designSystem: input.pipeline.designSystem,
    pageContract: input.pipeline.pageContract,
    archetype: input.pipeline.archetype,
    premiumReferenceBrief: input.pipeline.premiumReferenceBrief,
    visualIdentity: input.pipeline.visualIdentity,
    archetypeReconciliation: input.pipeline.archetypeReconciliation,
    visualMotifs: input.pipeline.visualMotifs,
    qualityGate,
    revisionCount: input.pipeline.revisionCount,
  });

  return {
    generationId: input.generationId,
    html: input.pipeline.html,
    creativeContract: input.pipeline.creativeContract,
    designSystem: input.pipeline.designSystem,
    pageContract: input.pipeline.pageContract,
    plan: input.pipeline.plan,
    qa: input.pipeline.qa,
    designTokens: input.pipeline.tokens,
    visualIdentity: input.pipeline.visualIdentity,
    archetypeReconciliation: input.pipeline.archetypeReconciliation,
    visualMotifs: input.pipeline.visualMotifs,
    generationDepth: input.pipeline.generationDepth,
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
    premiumReferenceBrief: input.pipeline.premiumReferenceBrief,
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
  industryBrief: SeraphimIndustryBrief;
  generationId: string;
}) {
  const mode = generationModeSummary(normalizeGenerationDepth(input.data.generationDepth));
  const { visualIdentity, archetype, reconciliation } = resolveTasteLayer(input.data, input.cleanBusinessData);
  const tokens = buildTokensForGeneration(archetype, input.data.visualPreferences, visualIdentity);
  const business = businessDataFromCleanData(input.cleanBusinessData, input.data.business);
  const premiumReferenceBrief = getPremiumReferenceBrief(input.cleanBusinessData.businessType);
  const visualMotifs = resolveVisualMotifs({ cleanBusinessData: input.cleanBusinessData, archetype, visualIdentity });
  const creativeResult = await generateCreativeContract({
    cleanBusinessData: input.cleanBusinessData,
    industryBrief: input.industryBrief,
    visualPreferences: input.data.visualPreferences,
    generationMode: input.data.generationMode,
    archetype,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    generationId: input.generationId,
    premiumReferenceBrief,
    visualMotifs,
  });
  const designSystemResult = await generateDesignSystemContract({
    creativeContract: creativeResult.creativeContract,
    tokens,
    visualPreferences: input.data.visualPreferences,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    generationId: input.generationId,
    premiumReferenceBrief,
    visualMotifs,
  });
  const inspiration = await fetchDesignInspiration(input.cleanBusinessData.businessType);
  const planResult = await generateWebsitePlanFromPrompt(
    business,
    tokens,
    inspiration,
    input.generationId,
    archetype,
    creativeResult.creativeContract,
    designSystemResult.designSystem,
    premiumReferenceBrief,
    visualMotifs,
  );
  const pageContractResult = await generatePageContract({
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    websitePlan: planResult.plan,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    generationId: input.generationId,
    premiumReferenceBrief,
    visualMotifs,
  });
  const basePageContract = pageContractResult.pageContract.sections.length
    ? pageContractResult.pageContract
    : fallbackPageContract(creativeResult.creativeContract, designSystemResult.designSystem, planResult.plan);
  const pageContract = strengthenPageContractWithReferences(basePageContract, premiumReferenceBrief);
  const sectionContracts = pageContract.sections.length
    ? pageContract.sections
    : fallbackPageContract(creativeResult.creativeContract, designSystemResult.designSystem, planResult.plan).sections;
  const metadata: StageMetadata[] = [
    creativeResult.metadata,
    designSystemResult.metadata,
    planResult.metadata,
    pageContractResult.metadata,
  ];
  const sectionResults = new Map<string, string>();

  for (const [index, section] of sectionContracts.entries()) {
    const result = await generateSectionHtmlFromPrompt({
      business,
      cleanBusinessData: input.cleanBusinessData,
      section,
      plan: planResult.plan,
      tokens,
      inspiration,
      creativeContract: creativeResult.creativeContract,
      designSystem: designSystemResult.designSystem,
      pageContract,
      previousSectionSummary: index > 0 ? internalSectionSummary(sectionContracts[index - 1]) : "",
      nextSectionSummary: index < sectionContracts.length - 1 ? internalSectionSummary(sectionContracts[index + 1]) : "",
      archetype,
      visualIdentity,
      archetypeReconciliation: reconciliation,
      premiumReferenceBrief,
      visualMotifs,
    });
    sectionResults.set(section.id, result.html);
    metadata.push(result.metadata);
  }

  let html = assembleFullHtml({
    business,
    cleanBusinessData: input.cleanBusinessData,
    tokens,
    plan: planResult.plan,
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    pageContract,
    sections: sectionContracts.map((section) => sectionResults.get(section.id) || fallbackSectionHtml(section, business)),
  });
  let qaResult = await runVisualQA({
    html,
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    pageContract,
    cleanBusinessData: input.cleanBusinessData,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    premiumReferenceBrief,
    visualMotifs,
    generationDepth: mode.generationDepth,
  });
  metadata.push(qaResult.metadata);
  let revisionCount = 0;

  while (!qaResult.qa.passed && revisionCount < mode.expensiveRevisionPasses && qaResult.qa.issues.length) {
    revisionCount += 1;
    const sectionsToRegenerate = sectionContractsForIssues(sectionContracts, qaResult.qa);
    for (const section of sectionsToRegenerate) {
      const sectionIndex = sectionContracts.findIndex((candidate) => candidate.id === section.id);
      const sectionFeedback = qaResult.qa.sectionIssues
        .filter((issue) => issue.sectionId === section.id || issue.sectionId === section.name)
        .map((issue) => issue.revisionInstruction);
      const result = await generateSectionHtmlFromPrompt({
        business,
        cleanBusinessData: input.cleanBusinessData,
        section,
        plan: planResult.plan,
        tokens,
        inspiration,
        creativeContract: creativeResult.creativeContract,
        designSystem: designSystemResult.designSystem,
        pageContract,
        previousSectionSummary: sectionIndex > 0 ? internalSectionSummary(sectionContracts[sectionIndex - 1]) : "",
        nextSectionSummary: sectionIndex < sectionContracts.length - 1 ? internalSectionSummary(sectionContracts[sectionIndex + 1]) : "",
        archetype,
        visualIdentity,
        archetypeReconciliation: reconciliation,
        correctiveFeedback: unique([
          ...qaResult.qa.issues,
          qaResult.qa.globalRevisionInstruction,
          ...sectionFeedback,
        ]),
        premiumReferenceBrief,
        visualMotifs,
      });
      sectionResults.set(section.id, result.html);
      metadata.push({ ...result.metadata, stage: `revision:${section.id}` });
    }
    html = assembleFullHtml({
      business,
      cleanBusinessData: input.cleanBusinessData,
      tokens,
      plan: planResult.plan,
      creativeContract: creativeResult.creativeContract,
      designSystem: designSystemResult.designSystem,
      pageContract,
      sections: sectionContracts.map((section) => sectionResults.get(section.id) || fallbackSectionHtml(section, business)),
    });
    qaResult = await runVisualQA({
      html,
      creativeContract: creativeResult.creativeContract,
      designSystem: designSystemResult.designSystem,
      pageContract,
      cleanBusinessData: input.cleanBusinessData,
      visualIdentity,
      archetypeReconciliation: reconciliation,
      premiumReferenceBrief,
      visualMotifs,
      generationDepth: mode.generationDepth,
    });
    metadata.push({ ...qaResult.metadata, stage: `visual-qa:retry-${revisionCount}` });
  }

  return {
    html,
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    pageContract,
    plan: planResult.plan,
    qa: qaResult.qa,
    metadata,
    revisionCount,
    business,
    tokens,
    archetype,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    inspiration,
    premiumReferenceBrief,
    visualMotifs,
    generationDepth: mode.generationDepth,
  };
}

async function streamSectionGenerationPipeline(input: {
  data: z.infer<typeof requestSchema>;
  cleanBusinessData: CleanBusinessData;
  industryBrief: SeraphimIndustryBrief;
  generationId: string;
  send: (event: Record<string, unknown>) => void;
}) {
  const mode = generationModeSummary(normalizeGenerationDepth(input.data.generationDepth));
  const { visualIdentity, archetype, reconciliation } = resolveTasteLayer(input.data, input.cleanBusinessData);
  const tokens = buildTokensForGeneration(archetype, input.data.visualPreferences, visualIdentity);
  const business = businessDataFromCleanData(input.cleanBusinessData, input.data.business);
  const premiumReferenceBrief = getPremiumReferenceBrief(input.cleanBusinessData.businessType);
  const visualMotifs = resolveVisualMotifs({ cleanBusinessData: input.cleanBusinessData, archetype, visualIdentity });
  const creativeResult = await generateCreativeContract({
    cleanBusinessData: input.cleanBusinessData,
    industryBrief: input.industryBrief,
    visualPreferences: input.data.visualPreferences,
    generationMode: input.data.generationMode,
    archetype,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    generationId: input.generationId,
    premiumReferenceBrief,
    visualMotifs,
  });
  const designSystemResult = await generateDesignSystemContract({
    creativeContract: creativeResult.creativeContract,
    tokens,
    visualPreferences: input.data.visualPreferences,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    generationId: input.generationId,
    premiumReferenceBrief,
    visualMotifs,
  });
  const inspiration = await fetchDesignInspiration(input.cleanBusinessData.businessType);
  input.send({
    type: "creative-contract",
    creativeContract: creativeResult.creativeContract,
    modelMetadata: creativeResult.metadata,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    visualMotifs,
  });
  input.send({
    type: "design-system",
    designSystem: designSystemResult.designSystem,
    designTokens: tokens,
    modelMetadata: designSystemResult.metadata,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    visualMotifs,
  });
  const planResult = await generateWebsitePlanFromPrompt(
    business,
    tokens,
    inspiration,
    input.generationId,
    archetype,
    creativeResult.creativeContract,
    designSystemResult.designSystem,
    premiumReferenceBrief,
    visualMotifs,
  );
  const pageContractResult = await generatePageContract({
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    websitePlan: planResult.plan,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    generationId: input.generationId,
    premiumReferenceBrief,
    visualMotifs,
  });
  const basePageContract = pageContractResult.pageContract.sections.length
    ? pageContractResult.pageContract
    : fallbackPageContract(creativeResult.creativeContract, designSystemResult.designSystem, planResult.plan);
  const pageContract = strengthenPageContractWithReferences(basePageContract, premiumReferenceBrief);
  const sectionContracts = pageContract.sections.length
    ? pageContract.sections
    : fallbackPageContract(creativeResult.creativeContract, designSystemResult.designSystem, planResult.plan).sections;
  const metadata: StageMetadata[] = [
    creativeResult.metadata,
    designSystemResult.metadata,
    planResult.metadata,
    pageContractResult.metadata,
  ];
  const sectionResults = new Map<string, string>();
  const earlyGenerationPlan = buildGenerationPlanResponse({
    generationId: input.generationId,
    plan: planResult.plan,
    industryBrief: input.industryBrief,
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    pageContract,
    archetype,
    premiumReferenceBrief,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    visualMotifs,
  });

  input.send({
    type: "plan",
    plan: planResult.plan,
    generationPlan: earlyGenerationPlan,
    designTokens: tokens,
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    premiumReferenceBrief,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    visualMotifs,
    archetype: {
      id: archetype.id,
      name: archetype.name,
      tone: archetype.tone,
      sectionOrder: archetype.sectionOrder,
      qaChecks: archetype.qaChecks,
    },
  });
  input.send({
    type: "page-contract",
    pageContract,
    modelMetadata: pageContractResult.metadata,
  });

  for (const [index, section] of sectionContracts.entries()) {
    const result = await generateSectionHtmlFromPrompt({
      business,
      cleanBusinessData: input.cleanBusinessData,
      section,
      plan: planResult.plan,
      tokens,
      inspiration,
      creativeContract: creativeResult.creativeContract,
      designSystem: designSystemResult.designSystem,
      pageContract,
      previousSectionSummary: index > 0 ? internalSectionSummary(sectionContracts[index - 1]) : "",
      nextSectionSummary: index < sectionContracts.length - 1 ? internalSectionSummary(sectionContracts[index + 1]) : "",
      archetype,
      visualIdentity,
      archetypeReconciliation: reconciliation,
      premiumReferenceBrief,
      visualMotifs,
    });
    sectionResults.set(section.id, result.html);
    metadata.push(result.metadata);
    input.send({
      type: "section",
      index,
      html: result.html,
      sectionName: section.name,
      sectionId: section.id,
      modelMetadata: result.metadata,
    });
  }

  let html = assembleFullHtml({
    business,
    cleanBusinessData: input.cleanBusinessData,
    tokens,
    plan: planResult.plan,
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    pageContract,
    sections: sectionContracts.map((section) => sectionResults.get(section.id) || fallbackSectionHtml(section, business)),
  });
  let qaResult = await runVisualQA({
    html,
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    pageContract,
    cleanBusinessData: input.cleanBusinessData,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    premiumReferenceBrief,
    visualMotifs,
    generationDepth: mode.generationDepth,
  });
  metadata.push(qaResult.metadata);
  let revisionCount = 0;
  input.send({
    type: "qa",
    result: qaResult.qa,
    qualityGate: qualityGateFromSectionQA(qaResult.qa),
    modelMetadata: qaResult.metadata,
  });

  while (!qaResult.qa.passed && revisionCount < mode.expensiveRevisionPasses && qaResult.qa.issues.length) {
    revisionCount += 1;
    const sectionsToRegenerate = sectionContractsForIssues(sectionContracts, qaResult.qa);
    for (const section of sectionsToRegenerate) {
      const index = sectionContracts.findIndex((candidate) => candidate.id === section.id);
      const sectionFeedback = qaResult.qa.sectionIssues
        .filter((issue) => issue.sectionId === section.id || issue.sectionId === section.name)
        .map((issue) => issue.revisionInstruction);
      const result = await generateSectionHtmlFromPrompt({
        business,
        cleanBusinessData: input.cleanBusinessData,
        section,
        plan: planResult.plan,
        tokens,
        inspiration,
        creativeContract: creativeResult.creativeContract,
        designSystem: designSystemResult.designSystem,
        pageContract,
        previousSectionSummary: index > 0 ? internalSectionSummary(sectionContracts[index - 1]) : "",
        nextSectionSummary: index < sectionContracts.length - 1 ? internalSectionSummary(sectionContracts[index + 1]) : "",
        archetype,
        visualIdentity,
        archetypeReconciliation: reconciliation,
        correctiveFeedback: unique([
          ...qaResult.qa.issues,
          qaResult.qa.globalRevisionInstruction,
          ...sectionFeedback,
        ]),
        premiumReferenceBrief,
        visualMotifs,
      });
      sectionResults.set(section.id, result.html);
      metadata.push({ ...result.metadata, stage: `revision:${section.id}` });
      input.send({
        type: "section",
        index,
        html: result.html,
        sectionName: section.name,
        sectionId: section.id,
        revision: revisionCount,
        modelMetadata: result.metadata,
      });
    }
    html = assembleFullHtml({
      business,
      cleanBusinessData: input.cleanBusinessData,
      tokens,
      plan: planResult.plan,
      creativeContract: creativeResult.creativeContract,
      designSystem: designSystemResult.designSystem,
      pageContract,
      sections: sectionContracts.map((section) => sectionResults.get(section.id) || fallbackSectionHtml(section, business)),
    });
    qaResult = await runVisualQA({
      html,
      creativeContract: creativeResult.creativeContract,
      designSystem: designSystemResult.designSystem,
      pageContract,
      cleanBusinessData: input.cleanBusinessData,
      visualIdentity,
      archetypeReconciliation: reconciliation,
      premiumReferenceBrief,
      visualMotifs,
      generationDepth: mode.generationDepth,
    });
    metadata.push({ ...qaResult.metadata, stage: `visual-qa:retry-${revisionCount}` });
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
    creativeContract: creativeResult.creativeContract,
    designSystem: designSystemResult.designSystem,
    pageContract,
    plan: planResult.plan,
    qa: qaResult.qa,
    metadata,
    revisionCount,
    business,
    tokens,
    archetype,
    visualIdentity,
    archetypeReconciliation: reconciliation,
    inspiration,
    premiumReferenceBrief,
    visualMotifs,
    generationDepth: mode.generationDepth,
  };
}

export async function POST(request: Request) {
  const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };
  let user;
  let requestId="";
  let reservation:UsageReservation|undefined;

  try {
    user=await requireServerUser();
    requestId=guardApiRequest(request,{userId:user.userId,route:"generate-website",maxBytes:10_000_000,limit:4,windowMs:60_000}).requestId;
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status, headers: noStoreHeaders });
    }
    const safe=userSafeError(error,"The generation request could not be accepted.");
    return NextResponse.json({...safe.body,requestId},{status:safe.status,headers:noStoreHeaders});
  }

  const body = await request.json().catch(() => null);
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

  try {
    reservation=await reserveUsage(user!,operationForGeneration(parsed.data.generationDepth),idempotencyKey(request,`${generationId}:${parsed.data.generationDepth}`),requestId);
    await startGenerationJob(user!,generationId,requestId);
  } catch(error) {
    const safe=userSafeError(error,"Usage could not be verified. No website generation was started.");
    return NextResponse.json({generationId,requestId,...safe.body},{status:safe.status,headers:noStoreHeaders});
  }

  if (wantsStream) {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: Record<string, unknown>) => {
          const customerEvent={...event};
          delete customerEvent.modelMetadata;
          delete customerEvent.pipelineModelMetadata;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(customerEvent)}\n\n`));
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
          const streamTaste = resolveTasteLayer(normalizedData, cleanBusinessData);
          safeDebug(generationId, "taste-layer", {
            visualMood: streamTaste.visualIdentity.imageEnergy,
            colors: streamTaste.visualIdentity.extractedColors,
            finalArchetype: streamTaste.reconciliation.finalArchetypeId,
            warnings: [...streamTaste.visualIdentity.warnings, ...streamTaste.reconciliation.warnings],
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
          await completeUsage(reservation!,"succeeded",{provider:responsePayload.modelMetadata?.provider,model:responsePayload.modelMetadata?.model});
          await finishGenerationJob(user!,generationId,"succeeded");
          send({ type: "complete", ...responsePayload,requestId,usage:{used:reservation!.used,limit:reservation!.limit} });
        } catch (error) {
          await completeUsage(reservation!,"failed",{errorCode:error instanceof ApiError?error.code:"GENERATION_FAILED"});
          await finishGenerationJob(user!,generationId,"failed","GENERATION_FAILED");
          send({
            type: "error",
            generationId,
            requestId,
            error: "Website generation could not complete. Your previous saved version is unchanged.",
            code:"GENERATION_FAILED",
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
    const taste = resolveTasteLayer(normalizedData, cleanBusinessData);
    safeDebug(generationId, "taste-layer", {
      visualMood: taste.visualIdentity.imageEnergy,
      colors: taste.visualIdentity.extractedColors,
      finalArchetype: taste.reconciliation.finalArchetypeId,
      warnings: [...taste.visualIdentity.warnings, ...taste.reconciliation.warnings],
    });

    const pipeline = await runSectionGenerationPipeline({
      data: normalizedData,
      cleanBusinessData,
      industryBrief,
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

    await completeUsage(reservation,"succeeded",{provider:responsePayload.modelMetadata?.provider,model:responsePayload.modelMetadata?.model});
    await finishGenerationJob(user!,generationId,"succeeded");

    const customerPayload:Record<string,unknown>={...responsePayload};
    delete customerPayload.modelMetadata;
    delete customerPayload.pipelineModelMetadata;
    return NextResponse.json(
      {...customerPayload,requestId,usage:{used:reservation.used,limit:reservation.limit}},
      { headers: noStoreHeaders },
    );
  } catch (error) {
    await completeUsage(reservation,"failed",{errorCode:error instanceof ApiError?error.code:"GENERATION_FAILED"});
    await finishGenerationJob(user!,generationId,"failed","GENERATION_FAILED");
    const safe=userSafeError(error,"Website generation could not complete. Your previous saved version is unchanged.");
    return NextResponse.json(
      {
        generationId,
        requestId,
        ...safe.body,
        pipelineModelMetadata: pipelineMetadata,
      },
      { status:safe.status, headers: noStoreHeaders },
    );
  }
}
