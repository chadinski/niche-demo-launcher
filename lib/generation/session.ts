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

export const WORKSPACE_STORAGE_KEYS = [
  ...GENERATION_STORAGE_KEYS,
  "niche-demo-launcher-prospects",
  "niche-demo-launcher-settings",
] as const;

export type SectionType = "full-page" | "hero" | "services" | "proof" | "cta" | "custom";

export type GenerationPlan = {
  generationId: string;
  stage: "planning";
  summary: string;
  sectionIds: string[];
  premiumPlan?: unknown;
  creativeContract?: unknown;
  designSystem?: unknown;
  pageContract?: unknown;
  archetype?: {
    id: string;
    name: string;
    tone: string;
    sectionOrder: string[];
    qaChecks: string[];
  };
  seraphimGenerator?: unknown;
  qualityGate?: {
    /** Omitted when a quality dimension cannot be measured honestly. */
    score?: number;
    passed: boolean;
    rejectionReasons: string[];
    revisionBrief?: string;
  };
  revisionCount?: number;
};

export type SectionOutput = {
  generationId: string;
  sectionId: string;
  type: SectionType;
  html: string;
  status: "success" | "failed" | "skipped" | "loading";
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

export function clearWorkspaceStorage() {
  if (typeof window === "undefined") return;

  for (const key of WORKSPACE_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}
