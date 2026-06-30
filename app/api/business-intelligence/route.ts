import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  openAIBusinessIntelligenceRequestSchema,
  type OpenAIBusinessInfo,
  type OpenAIBusinessUnderstanding,
  openAIBusinessUnderstandingSchema,
  sanitizeOpenAIUnderstanding,
} from "@/lib/openai-business-intelligence";
import {
  analyzeBusinessScreenshot,
  generalWebsiteCategories,
  type ThemeVariation,
} from "@/lib/industry-theme-engine";
import {
  getRoutesForStage,
  logModelRoute,
  runWithModelRouteRetry,
  type ModelRoute,
} from "@/lib/ai/modelRouter";
import type { BusinessInfo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUSINESS_INTELLIGENCE_PROMPT = `You are the business understanding engine for Niche Demo Launcher.

Analyze the supplied screenshot and OCR text before any website is generated.

You must:
- Extract all visible business facts without inventing unsupported claims.
- Use the image itself for visual context: logos, menu/product/service layouts, social profiles, Google listings, photos, icons, uniforms, maps, reviews, and page category labels.
- Rank business name candidates using logo/header/profile/domain/email/contact evidence.
- Detect industry from OCR, visual clues, services/products, page labels, and imagery.
- Assign exactly one of the seven website categories:
  1. Food, Hospitality & Entertainment
  2. Health, Wellness & Beauty
  3. Trades, Repairs & Local Services
  4. Professional, Finance & Business Services
  5. Retail, Products & E-commerce
  6. Creative, Events & Personal Brands
  7. Memorial, Community & Special Purpose
- Select a category-fit theme and variation.
- Populate enrichedInfo with empty strings for unknown business fields.
- Use "Your Business Name" only if no business name can be found.
- Mark weak OCR or low confidence in missingInformation and assumptions.
- Build reportMarkdown as a complete business-intelligence-report.md document.

Do not create testimonials, awards, ratings, prices, credentials, years in business, guarantees, addresses, or claims unless visible or supplied.`;

const themeVariations: ThemeVariation[] = [
  "premium",
  "modern",
  "local-community",
  "luxury",
  "bold-high-energy",
  "soft-elegant",
  "corporate",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asStringArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (isRecord(item)) return asString(item.value || item.label || item.name || item.text);
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,|;|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function confidence(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function parseLooseJson(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini did not return parseable JSON.");
    return JSON.parse(match[0]) as unknown;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(headers: Headers, message: string) {
  const retryAfter = headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(10_000, Math.max(1_000, seconds * 1000));
  }

  const retryIn = message.match(/retry in ([\d.]+)s/i);
  if (retryIn) return Math.min(10_000, Math.max(1_000, Number(retryIn[1]) * 1000));

  return null;
}

function shouldSwitchGeminiModel(status: number, message: string) {
  if (status === 429 && !/requests per minute|tokens per minute|\brpm\b|\btpm\b/i.test(message)) return true;
  if (/quota exceeded|rate-limits|high demand|overloaded|resource exhausted|limit: 0/i.test(message)) return true;
  return false;
}

function shouldRetryGeminiModel(status: number, message: string) {
  if ([500, 502, 503, 504].includes(status)) return true;
  if (/requests per minute|tokens per minute|\brpm\b|\btpm\b|try again|temporarily/i.test(message)) return true;
  return false;
}

function completeBusinessInfo(value: unknown, fallback: OpenAIBusinessInfo): OpenAIBusinessInfo {
  const source = isRecord(value) ? value : {};

  return {
    businessName: asString(source.businessName || source.name, fallback.businessName),
    category: asString(source.category || source.industry, fallback.category),
    location: asString(source.location || source.address, fallback.location),
    phone: asString(source.phone || source.phoneNumber, fallback.phone),
    email: asString(source.email, fallback.email),
    websiteUrl: asString(source.websiteUrl || source.website || source.url, fallback.websiteUrl),
    socialUrl: asString(source.socialUrl || source.social || source.instagram || source.facebook, fallback.socialUrl),
    services: asString(source.services || source.products, fallback.services),
    brandColors: asString(source.brandColors || source.colors, fallback.brandColors),
    notes: asString(source.notes, fallback.notes),
    painPoints: asString(source.painPoints, fallback.painPoints),
  };
}

function normalizeCategory(value: unknown, fallback: OpenAIBusinessUnderstanding["industry"]["category"]) {
  const rawCategory = isRecord(value) ? value : {};
  const rawId = asString(rawCategory.id || rawCategory.categoryId).toLowerCase();
  const rawLabel = asString(rawCategory.label || rawCategory.name || value).toLowerCase();
  const match =
    generalWebsiteCategories.find((category) => category.id === rawId) ||
    generalWebsiteCategories.find((category) => category.label.toLowerCase() === rawLabel) ||
    generalWebsiteCategories.find((category) => rawLabel.includes(category.label.toLowerCase()));

  return match || fallback;
}

function normalizeCandidates(value: unknown, fallback: OpenAIBusinessUnderstanding["businessNameCandidates"]) {
  if (!Array.isArray(value)) return fallback;

  const candidates = value
    .map((candidate, index) => {
      if (typeof candidate === "string") {
        return { value: candidate.trim(), score: Math.max(10, 80 - index * 10), evidence: ["Gemini supplied this as a business-name candidate."] };
      }
      if (!isRecord(candidate)) return null;

      const candidateValue = asString(candidate.value || candidate.name || candidate.businessName || candidate.text);
      if (!candidateValue) return null;

      return {
        value: candidateValue,
        score: confidence(candidate.score || candidate.confidence, Math.max(10, 80 - index * 10)),
        evidence: asStringArray(candidate.evidence || candidate.reason || candidate.reasons, ["Gemini supplied this candidate."]),
      };
    })
    .filter((candidate): candidate is OpenAIBusinessUnderstanding["businessNameCandidates"][number] => Boolean(candidate));

  return candidates.length ? candidates.slice(0, 8) : fallback;
}

function repairGeminiUnderstanding(value: unknown, input: {
  rawOcrText: string;
  imageName: string;
  brandColors: string;
  currentInfo: unknown;
}): OpenAIBusinessUnderstanding {
  const currentInfo = isRecord(input.currentInfo) ? input.currentInfo as Partial<BusinessInfo> : {};
  const fallback = analyzeBusinessScreenshot({
    rawOcrText: input.rawOcrText,
    parsedInfo: currentInfo,
    brandColors: input.brandColors,
    imageName: input.imageName,
  });
  const fallbackInfo = completeBusinessInfo(fallback.enrichedInfo, {
    businessName: fallback.selectedBusinessName || "Your Business Name",
    category: fallback.industry.primaryIndustry,
    location: fallback.contact.location,
    phone: fallback.contact.phone,
    email: fallback.contact.email,
    websiteUrl: fallback.contact.website,
    socialUrl: fallback.contact.social,
    services: fallback.services.join(", "),
    brandColors: fallback.theme.palette.join(", "),
    notes: "",
    painPoints: "",
  });
  const source = isRecord(value) ? value : {};
  const sourceIndustry = isRecord(source.industry) ? source.industry : {};
  const sourceTheme = isRecord(source.theme) ? source.theme : {};
  const sourceContact = isRecord(source.contact) ? source.contact : {};
  const category = normalizeCategory(sourceIndustry.category || source.category, fallback.industry.category);
  const variation = asString(sourceTheme.variation, fallback.theme.variation) as ThemeVariation;
  const safeVariation = themeVariations.includes(variation) ? variation : fallback.theme.variation;
  const selectedBusinessName = asString(
    source.selectedBusinessName || source.businessName || source.name || fallback.selectedBusinessName,
    fallback.selectedBusinessName || "Your Business Name",
  ) || "Your Business Name";
  const services = asStringArray(source.services || source.products, fallback.services);
  const contact = {
    phone: asString(sourceContact.phone || source.phone, fallback.contact.phone),
    email: asString(sourceContact.email || source.email, fallback.contact.email),
    website: asString(sourceContact.website || source.website || source.websiteUrl, fallback.contact.website),
    social: asString(sourceContact.social || source.social || source.socialUrl, fallback.contact.social),
    location: asString(sourceContact.location || source.location || source.address, fallback.contact.location),
  };
  const repaired: OpenAIBusinessUnderstanding = {
    rawOcrText: asString(source.rawOcrText, input.rawOcrText),
    cleanedText: asString(source.cleanedText || source.cleanedExtractedText, fallback.cleanedText),
    visualClues: asStringArray(source.visualClues || source.visualContext || source.visualEvidence, fallback.visualClues),
    businessNameCandidates: normalizeCandidates(source.businessNameCandidates || source.nameCandidates, fallback.businessNameCandidates),
    selectedBusinessName,
    businessNameConfidence: confidence(source.businessNameConfidence || source.nameConfidence, fallback.businessNameConfidence),
    businessNameReason: asString(source.businessNameReason || source.nameReason, fallback.businessNameReason),
    industry: {
      primaryIndustry: asString(sourceIndustry.primaryIndustry || sourceIndustry.industry || source.primaryIndustry, fallback.industry.primaryIndustry),
      secondaryIndustry: asString(sourceIndustry.secondaryIndustry, fallback.industry.secondaryIndustry),
      confidence: confidence(sourceIndustry.confidence || source.industryConfidence, fallback.industry.confidence),
      category,
      categoryConfidence: confidence(sourceIndustry.categoryConfidence || source.categoryConfidence, fallback.industry.categoryConfidence),
      explanation: asString(sourceIndustry.explanation || source.industryExplanation, fallback.industry.explanation),
      triggeredKeywords: asStringArray(sourceIndustry.triggeredKeywords || sourceIndustry.keywords || source.triggeredKeywords, fallback.industry.triggeredKeywords),
    },
    theme: {
      variation: safeVariation,
      mood: asString(sourceTheme.mood, fallback.theme.mood),
      palette: asStringArray(sourceTheme.palette || sourceTheme.colors || source.palette, fallback.theme.palette),
      typography: asString(sourceTheme.typography, fallback.theme.typography),
      animation: asString(sourceTheme.animation || sourceTheme.animationStyle, fallback.theme.animation),
      sectionPriorities: asStringArray(sourceTheme.sectionPriorities || source.recommendedSections, fallback.theme.sectionPriorities),
      cta: asString(sourceTheme.cta || source.cta || source.recommendedCta, fallback.theme.cta),
      imageStyle: asString(sourceTheme.imageStyle, fallback.theme.imageStyle),
      trustElements: asStringArray(sourceTheme.trustElements, fallback.theme.trustElements),
      layoutStyle: asString(sourceTheme.layoutStyle, fallback.theme.layoutStyle),
      notes: [
        ...asStringArray(sourceTheme.notes, fallback.theme.notes),
        "Gemini response was normalized to the business intelligence schema before website generation.",
      ].slice(0, 8),
    },
    services,
    contact,
    seoKeywords: asStringArray(source.seoKeywords || source.keywords, fallback.seoKeywords),
    missingInformation: [
      ...asStringArray(source.missingInformation || source.missingInfo, fallback.missingInformation),
      "Gemini response required schema repair; review extracted fields before mass production.",
    ].slice(0, 12),
    assumptions: asStringArray(source.assumptions, fallback.assumptions),
    enrichedInfo: completeBusinessInfo(source.enrichedInfo || source.businessInfo, {
      ...fallbackInfo,
      businessName: selectedBusinessName,
      category: asString(sourceIndustry.primaryIndustry, fallbackInfo.category),
      location: contact.location,
      phone: contact.phone,
      email: contact.email,
      websiteUrl: contact.website,
      socialUrl: contact.social,
      services: services.join(", "),
    }),
    reportMarkdown: asString(source.reportMarkdown, fallback.reportMarkdown),
  };

  const parsed = openAIBusinessUnderstandingSchema.safeParse(repaired);
  if (!parsed.success) {
    throw new Error("Gemini returned JSON that could not be repaired into the business intelligence schema.");
  }

  return parsed.data;
}

function hasImage(value: string) {
  return /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value);
}

function dataUrlToGeminiPart(value: string) {
  const match = value.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i);

  if (!match) return null;

  return {
    inline_data: {
      mime_type: match[1],
      data: match[2],
    },
  };
}

function geminiThinkingConfig(model: string) {
  if (model.startsWith("gemini-2.5")) return { thinkingBudget: 0 };
  if (model.startsWith("gemini-3")) return { thinkingLevel: "minimal" };
  return undefined;
}

function userContext(input: {
  rawOcrText: string;
  imageName: string;
  brandColors: string;
  currentInfo: unknown;
}) {
  return [
    `Image filename: ${input.imageName || "not supplied"}`,
    `Sampled brand colors: ${input.brandColors || "not supplied"}`,
    `Current app fields: ${JSON.stringify(input.currentInfo)}`,
    "Raw OCR text:",
    input.rawOcrText || "No OCR text supplied. Use the screenshot image as the main source.",
  ].join("\n\n");
}

async function generateWithGemini(input: {
  generationId: string;
  rawOcrText: string;
  imageDataUrl: string;
  imageName: string;
  brandColors: string;
  currentInfo: unknown;
}, route: ModelRoute) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return null;

  const imagePart = hasImage(input.imageDataUrl) ? dataUrlToGeminiPart(input.imageDataUrl) : null;
  const parts = [
    {
      text: `${BUSINESS_INTELLIGENCE_PROMPT}

Return only valid JSON matching this exact top-level shape. Do not wrap it in Markdown.
Required top-level keys:
rawOcrText, cleanedText, visualClues, businessNameCandidates, selectedBusinessName,
businessNameConfidence, businessNameReason, industry, theme, services, contact,
seoKeywords, missingInformation, assumptions, enrichedInfo, reportMarkdown.
Use arrays for all list fields. Use numbers from 0-100 for confidence fields.
Use empty strings for unknown contact/enrichedInfo fields instead of omitting them.

${userContext(input)}`,
    },
    ...(imagePart ? [imagePart] : []),
  ];
  const errors: string[] = [];
  const model = route.model;

  const thinkingConfig = geminiThinkingConfig(model);
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 5000,
      temperature: 0.1,
      ...(thinkingConfig ? { thinkingConfig } : {}),
    },
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body,
        cache: "no-store",
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.error ||
        "Gemini business intelligence request failed.";
      errors.push(`${model}: ${message}`);

      if (shouldSwitchGeminiModel(response.status, String(message))) break;
      if (attempt === 0 && shouldRetryGeminiModel(response.status, String(message))) {
        await sleep(retryAfterMs(response.headers, String(message)) ?? 1200);
        continue;
      }
      break;
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      errors.push(`${model}: Gemini did not return structured business intelligence.`);
      break;
    }

    const parsedJson = parseLooseJson(text);
    const parsed = openAIBusinessUnderstandingSchema.safeParse(parsedJson);

    if (!parsed.success) {
      const repaired = repairGeminiUnderstanding(parsedJson, input);
      logModelRoute(route, input.generationId);

      return {
        understanding: sanitizeOpenAIUnderstanding(repaired),
        model,
        provider: "gemini",
        route,
      };
    }

    logModelRoute(route, input.generationId);

    return {
      understanding: sanitizeOpenAIUnderstanding(parsed.data),
      model,
      provider: "gemini",
      route,
    };
  }

  throw new Error(`Gemini extraction failed for ${model}: ${errors.slice(-3).join(" | ")}`);
}

async function generateWithOpenAI(input: {
  generationId: string;
  rawOcrText: string;
  imageDataUrl: string;
  imageName: string;
  brandColors: string;
  currentInfo: unknown;
}, route: ModelRoute) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const model = route.model;
  const text = userContext(input);
  const response = await client.responses.parse({
    model,
    instructions: BUSINESS_INTELLIGENCE_PROMPT,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text },
          ...(hasImage(input.imageDataUrl)
            ? [{ type: "input_image" as const, image_url: input.imageDataUrl, detail: "high" as const }]
            : []),
        ],
      },
    ],
    text: {
      format: zodTextFormat(openAIBusinessUnderstandingSchema, "business_understanding"),
    },
    max_output_tokens: 9000,
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI did not return structured business intelligence.");
  }

  return {
    understanding: sanitizeOpenAIUnderstanding(response.output_parsed),
    model,
    provider: "openai",
    route,
  };
}

export async function POST(request: Request) {
  const requestBody = await request.json().catch(() => null);
  const requestGenerationId = isRecord(requestBody) ? asString(requestBody.generationId) : "";
  const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };
  const parsedRequest = openAIBusinessIntelligenceRequestSchema.safeParse(requestBody);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        generationId: requestGenerationId,
        error: "Invalid business intelligence request.",
        details: parsedRequest.error.flatten(),
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const { generationId, rawOcrText, imageDataUrl, imageName, brandColors, currentInfo } = parsedRequest.data;

  if (!rawOcrText.trim() && !hasImage(imageDataUrl)) {
    return NextResponse.json(
      { generationId, error: "Supply OCR text or a valid image data URL." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  try {
    const providerInput = { generationId, rawOcrText, imageDataUrl, imageName, brandColors, currentInfo };
    const routes = getRoutesForStage("extraction", { hasImage: hasImage(imageDataUrl) });
    const routeErrors: string[] = [];
    let result = null;

    for (const route of routes) {
      try {
        result = await runWithModelRouteRetry(route, async () =>
          route.provider === "gemini"
            ? generateWithGemini(providerInput, route)
            : generateWithOpenAI(providerInput, route),
        );
      } catch (error) {
        routeErrors.push(error instanceof Error ? error.message : `${route.provider}:${route.model} failed`);
        result = null;
      }

      if (result) break;
    }

    if (!result) {
      return NextResponse.json(
        {
          generationId,
          error: routeErrors.length
            ? `AI extraction could not complete. Last errors: ${routeErrors.slice(-3).join(" | ")}`
            : "No AI extraction provider configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local, then restart the app.",
        },
        { status: 503, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      {
        generationId,
        understanding: result.understanding,
        modelMetadata: {
          stage: result.route.stage,
          provider: result.provider,
          model: result.model,
          fallback: result.route.fallback,
        },
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI business intelligence request failed.";
    return NextResponse.json({ generationId, error: message }, { status: 502, headers: noStoreHeaders });
  }
}
