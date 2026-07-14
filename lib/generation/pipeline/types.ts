import { z } from "zod";

export type GenerationDepth = "fast-draft" | "premium-final";

export type StageMetadata = {
  stage: string;
  provider: "gemini" | "openai" | "local";
  model: string;
  fallback: boolean;
  attempt: number;
  latencyMs: number;
};

export type GenerationStreamEvent =
  | { type: "understanding-business"; generationId: string }
  | { type: "planning-site"; generationId: string; unifiedBrief: UnifiedSiteBrief; generationPlan: unknown }
  | { type: "generating-website"; generationId: string }
  | { type: "checking-output"; generationId: string; findings: unknown }
  | { type: "repairing-output"; generationId: string; findings: unknown }
  | { type: "complete"; generationId: string; html: string; [key: string]: unknown }
  | { type: "error"; generationId: string; error: string; code?: string };

export const unifiedSiteBriefSchema = z.object({
  businessSummary: z.string().min(1).max(1200),
  verifiedFacts: z.array(z.string().min(1).max(300)).max(30),
  missingOrUncertainFacts: z.array(z.string().min(1).max(300)).max(30),
  targetAudience: z.string().min(1).max(600),
  primaryConversionAction: z.string().min(1).max(240),
  visualThesis: z.string().min(1).max(800),
  brandPersonality: z.string().min(1).max(400),
  colorAndTypographyDirection: z.string().min(1).max(600),
  imageAssetStrategy: z.string().min(1).max(800),
  pageNarrative: z.string().min(1).max(1000),
  sectionOutline: z.array(z.object({ name: z.string().min(1).max(100), purpose: z.string().min(1).max(300) })).min(4).max(12),
  copyDirection: z.string().min(1).max(600),
  seoRequirements: z.array(z.string().min(1).max(240)).min(2).max(12),
  accessibilityRequirements: z.array(z.string().min(1).max(240)).min(3).max(12),
  factualRestrictions: z.array(z.string().min(1).max(300)).min(3).max(20),
  responsiveBehavior: z.array(z.string().min(1).max(240)).min(3).max(12),
});

export type UnifiedSiteBrief = z.infer<typeof unifiedSiteBriefSchema>;

export type NormalizedGenerationInput = {
  generationId: string;
  generationDepth: GenerationDepth;
  generationMode: string;
  business: {
    name: string;
    description: string;
    targetAudience: string;
    differentiators: string[];
    brandPersonality: string;
  };
  info: {
    rawInfo: string; businessName: string; category: string; location: string; phone: string; email: string;
    websiteUrl: string; socialUrl: string; services: string; brandColors: string; notes: string;
  };
  visualPreferences?: unknown;
  archetypeId?: string;
  sourceImageDataUrl?: string;
  businessUnderstanding?: unknown;
};

export type GenerationQualityFinding = {
  code: string;
  severity: "fatal" | "warning" | "info";
  message: string;
};

export type ValidationResult = {
  html: string;
  findings: GenerationQualityFinding[];
  fatal: boolean;
  quality: { measured: string[]; notMeasured: string[]; findings: number };
};

export type PipelineResult = {
  html: string;
  unifiedBrief: UnifiedSiteBrief;
  validation: ValidationResult;
  metadata: StageMetadata[];
  generationPlan: Record<string, unknown>;
  qualityGate: Record<string, unknown>;
  revisionCount: number;
};

export function normalizeGenerationDepth(value: unknown): GenerationDepth {
  return value === "premium-final" ? "premium-final" : "fast-draft";
}

export function generationModeSummary(generationDepth: GenerationDepth) {
  return generationDepth === "premium-final"
    ? { generationDepth, label: "Premium Final", maxNormalAiCalls: 3, maxRepairCalls: 1 }
    : { generationDepth, label: "Fast Draft", maxNormalAiCalls: 2, maxRepairCalls: 1 };
}
