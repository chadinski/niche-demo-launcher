export const GENERATION_STORAGE_KEYS = [
  "currentGeneration",
  "businessData",
  "generatedHtml",
  "generationPlan",
  "sectionOutputs",
  "qaReport",
  "skippedSections",
  "generationErrors",
  "uploadedImage",
  "previewHtml",
] as const;

export type SectionType = "full-page" | "hero" | "services" | "proof" | "cta" | "custom";

export type GenerationPlan = {
  generationId: string;
  stage: "planning";
  summary: string;
  sectionIds: string[];
};

export type SectionOutput = {
  generationId: string;
  sectionId: string;
  type: SectionType;
  html: string;
  status: "success" | "failed" | "skipped";
  error?: string;
};

export type GenerationError = {
  generationId: string;
  stage: string;
  message: string;
};

export function createGenerationId() {
  return crypto.randomUUID();
}

export function clearGenerationStorage() {
  if (typeof window === "undefined") return;

  for (const key of GENERATION_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}
