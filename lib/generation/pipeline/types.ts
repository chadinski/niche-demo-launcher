export type GenerationDepth = "fast-draft" | "premium-final";

export type GenerationStreamEvent =
  | { type: "creative-contract"; generationId: string; creativeContract: unknown; modelMetadata?: unknown }
  | { type: "design-system"; generationId: string; designSystem: unknown; designTokens?: unknown; modelMetadata?: unknown }
  | { type: "plan"; generationId: string; plan: unknown; generationPlan?: unknown; modelMetadata?: unknown }
  | { type: "page-contract"; generationId: string; pageContract: unknown; modelMetadata?: unknown }
  | { type: "section"; generationId: string; index: number; html: string; sectionName?: string; revision?: number; modelMetadata?: unknown }
  | { type: "qa"; generationId: string; result?: unknown; qualityGate?: unknown; modelMetadata?: unknown; revision?: number }
  | { type: "complete"; generationId: string; html: string; [key: string]: unknown }
  | { type: "error"; generationId: string; error: string; pipelineModelMetadata?: unknown };

export type PipelineModeSummary = {
  generationDepth: GenerationDepth;
  label: string;
  expensiveRevisionPasses: number;
  visualModelQa: boolean;
  sectionStrategy: "single-pass" | "section-contract";
};

export function normalizeGenerationDepth(value: unknown): GenerationDepth {
  if (value === "premium-final") return "premium-final";
  return "fast-draft";
}

export function generationModeSummary(generationDepth: GenerationDepth): PipelineModeSummary {
  if (generationDepth === "premium-final") {
    return {
      generationDepth,
      label: "Premium Final",
      expensiveRevisionPasses: 2,
      visualModelQa: true,
      sectionStrategy: "section-contract",
    };
  }

  return {
    generationDepth,
    label: "Fast Draft",
    expensiveRevisionPasses: 0,
    visualModelQa: false,
    sectionStrategy: "single-pass",
  };
}
