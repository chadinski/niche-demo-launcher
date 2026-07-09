import { z } from "zod";

import type { BusinessInfo } from "@/lib/types";
import type { BusinessUnderstanding } from "@/lib/industry-theme-engine";

const confidence = z.number().min(0).max(100);
const fieldEvidenceSource = z.enum(["image", "ocr", "user_input", "inferred", "fallback"]);
const extractedFieldEvidenceSchema = z.object({
  value: z.union([z.string(), z.array(z.string())]),
  confidence,
  source: fieldEvidenceSource,
  evidence: z.array(z.string()),
  needsReview: z.boolean(),
});

export const openAIBusinessInfoSchema = z.object({
  businessName: z.string(),
  category: z.string(),
  location: z.string(),
  phone: z.string(),
  email: z.string(),
  websiteUrl: z.string(),
  socialUrl: z.string(),
  services: z.string(),
  brandColors: z.string(),
  notes: z.string(),
  painPoints: z.string(),
});

export const openAIBusinessUnderstandingSchema = z.object({
  rawOcrText: z.string(),
  cleanedText: z.string(),
  visualClues: z.array(z.string()),
  businessNameCandidates: z.array(
    z.object({
      value: z.string(),
      score: confidence,
      evidence: z.array(z.string()),
    }),
  ),
  selectedBusinessName: z.string(),
  businessNameConfidence: confidence,
  businessNameReason: z.string(),
  industry: z.object({
    primaryIndustry: z.string(),
    secondaryIndustry: z.string(),
    confidence,
    category: z.object({
      id: z.enum([
        "food-hospitality-entertainment",
        "health-wellness-beauty",
        "trades-repairs-local-services",
        "professional-finance-business",
        "retail-products-ecommerce",
        "creative-events-personal-brands",
        "memorial-community-special-purpose",
      ]),
      label: z.string(),
      examples: z.array(z.string()),
    }),
    categoryConfidence: confidence,
    explanation: z.string(),
    triggeredKeywords: z.array(z.string()),
  }),
  theme: z.object({
    variation: z.enum([
      "premium",
      "modern",
      "local-community",
      "luxury",
      "bold-high-energy",
      "soft-elegant",
      "corporate",
    ]),
    mood: z.string(),
    palette: z.array(z.string()),
    typography: z.string(),
    animation: z.string(),
    sectionPriorities: z.array(z.string()),
    cta: z.string(),
    imageStyle: z.string(),
    trustElements: z.array(z.string()),
    layoutStyle: z.string(),
    notes: z.array(z.string()),
  }),
  services: z.array(z.string()),
  contact: z.object({
    phone: z.string(),
    email: z.string(),
    website: z.string(),
    social: z.string(),
    location: z.string(),
  }),
  seoKeywords: z.array(z.string()),
  missingInformation: z.array(z.string()),
  assumptions: z.array(z.string()),
  enrichedInfo: openAIBusinessInfoSchema,
  fieldEvidence: z.object({
    businessName: extractedFieldEvidenceSchema,
    category: extractedFieldEvidenceSchema,
    location: extractedFieldEvidenceSchema,
    phone: extractedFieldEvidenceSchema,
    email: extractedFieldEvidenceSchema,
    websiteUrl: extractedFieldEvidenceSchema,
    socialUrl: extractedFieldEvidenceSchema,
    services: extractedFieldEvidenceSchema,
    brandColors: extractedFieldEvidenceSchema,
  }).optional(),
  reportMarkdown: z.string(),
});

export const openAIBusinessIntelligenceRequestSchema = z.object({
  generationId: z.string().min(1).max(80),
  rawOcrText: z.string().max(24000).optional().default(""),
  imageDataUrl: z.string().max(18_000_000).optional().default(""),
  imageName: z.string().max(180).optional().default(""),
  brandColors: z.string().max(500).optional().default(""),
  currentInfo: openAIBusinessInfoSchema.partial().optional().default({}),
});

export type OpenAIBusinessInfo = z.infer<typeof openAIBusinessInfoSchema>;
export type ExtractedFieldEvidence = z.infer<typeof extractedFieldEvidenceSchema>;
export type OpenAIBusinessUnderstanding = z.infer<typeof openAIBusinessUnderstandingSchema>;
export type OpenAIBusinessIntelligenceRequest = z.infer<typeof openAIBusinessIntelligenceRequestSchema>;

export function toOpenAIBusinessInfo(info: BusinessInfo): OpenAIBusinessInfo {
  return {
    businessName: info.businessName,
    category: info.category,
    location: info.location,
    phone: info.phone,
    email: info.email,
    websiteUrl: info.websiteUrl,
    socialUrl: info.socialUrl,
    services: info.services,
    brandColors: info.brandColors,
    notes: info.notes,
    painPoints: info.painPoints,
  };
}

export function sanitizeOpenAIUnderstanding(value: OpenAIBusinessUnderstanding): BusinessUnderstanding {
  const evidence = value.fieldEvidence;

  return {
    ...value,
    theme: {
      ...value.theme,
      palette: value.theme.palette.slice(0, 6),
      sectionPriorities: value.theme.sectionPriorities.slice(0, 8),
      trustElements: value.theme.trustElements.slice(0, 8),
      notes: value.theme.notes.slice(0, 8),
    },
    services: value.services.slice(0, 10),
    seoKeywords: value.seoKeywords.slice(0, 12),
    missingInformation: value.missingInformation.slice(0, 12),
    assumptions: value.assumptions.slice(0, 12),
    enrichedInfo: {
      ...value.enrichedInfo,
      businessName: value.enrichedInfo.businessName || value.selectedBusinessName || "Your Business Name",
      category: value.enrichedInfo.category || value.industry.primaryIndustry,
      services: value.enrichedInfo.services || value.services.join(", "),
      brandColors: value.enrichedInfo.brandColors || value.theme.palette.join(", "),
    },
    fieldEvidence: evidence,
  };
}
