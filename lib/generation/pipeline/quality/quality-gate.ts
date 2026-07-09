import type { GenerationDepth } from "@/lib/generation/pipeline/types";

export type QualityDimensionScores = {
  visualPremiumFeel: number;
  mobileLayout: number;
  desktopLayout: number;
  brandSpecificity: number;
  conversionClarity: number;
  imageSafety: number;
  factualSafety: number;
  technicalCompleteness: number;
};

export type CombinedQualityGate = {
  score: number;
  passed: boolean;
  dimensionScores: QualityDimensionScores;
  rejectionReasons: string[];
  warnings: string[];
  source: "heuristic" | "render" | "visual-model" | "combined";
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Number(value.toFixed(1))));
}

export function buildQualityGate(input: {
  generationDepth: GenerationDepth;
  heuristicIssues: string[];
  renderWarnings?: string[];
  renderFailed?: boolean;
  visualModelScore?: number;
}): CombinedQualityGate {
  const issueText = input.heuristicIssues.join(" ").toLowerCase();
  const renderWarnings = input.renderWarnings ?? [];
  const base = input.visualModelScore ?? (input.heuristicIssues.length ? 7.2 : 8.8);
  const genericCap = /technically complete but boring|generic|corporate-default|weak niche/i.test(issueText) ? 7.1 : 10;
  const imageCap = /image|media|alt|representative/i.test(issueText) ? 7.8 : 10;
  const renderCap = input.renderFailed ? 8.2 : 10;
  const premiumRequired = input.generationDepth === "premium-final" ? 8.5 : 7.6;
  const score = clampScore(Math.min(base - input.heuristicIssues.length * 0.2, genericCap, imageCap, renderCap));

  const dimensionScores: QualityDimensionScores = {
    visualPremiumFeel: clampScore(/generic|boring|premium motif|corporate-default/i.test(issueText) ? score - 1.2 : score),
    mobileLayout: clampScore(/mobile|overflow/i.test(issueText + renderWarnings.join(" ")) ? score - 1 : score),
    desktopLayout: clampScore(input.renderFailed ? score - 0.6 : score),
    brandSpecificity: clampScore(/weak niche|palette mismatch|archetype/i.test(issueText) ? score - 1.1 : score),
    conversionClarity: clampScore(/cta|contact/i.test(issueText) ? score - 0.8 : score),
    imageSafety: clampScore(/image|media|alt|representative/i.test(issueText) ? score - 1.1 : score),
    factualSafety: clampScore(/fake|unsupported|fabricated|claim/i.test(issueText) ? score - 1.5 : score),
    technicalCompleteness: clampScore(input.renderFailed ? score - 0.7 : score),
  };

  return {
    score,
    passed: score >= premiumRequired && input.heuristicIssues.length === 0,
    dimensionScores,
    rejectionReasons: input.heuristicIssues,
    warnings: renderWarnings,
    source: renderWarnings.length ? "combined" : "heuristic",
  };
}
