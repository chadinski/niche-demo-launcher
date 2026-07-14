import type { GenerationBudget } from "./generation-budget";
import { callConfiguredModel } from "./model-call";
import { extractHtml } from "./generate-complete-page";
import type { ValidationResult, StageMetadata, UnifiedSiteBrief } from "./types";
import type { BusinessContext } from "./unified-brief";

export async function repairCompletePage(context: BusinessContext, brief: UnifiedSiteBrief, html: string, validation: ValidationResult, budget: GenerationBudget): Promise<{ html: string; metadata: StageMetadata }> {
  const exact = validation.findings.filter((item) => item.severity === "fatal").map((item) => `- ${item.code}: ${item.message}`).join("\n");
  const prompt = `Repair this complete standalone index.html. Return ONLY the entire corrected HTML document. Preserve its visual system and all valid content. Apply ONLY these exact deterministic fixes:\n${exact}\n\nVerified business facts: ${context.verifiedFacts.join(" | ")}\nUnified brief: ${JSON.stringify(brief)}\n\nHTML TO REPAIR:\n${html}`;
  const result = await callConfiguredModel({ stage: "complete-page", prompt, maxOutputTokens: Math.min(32_000, budget.maxOutputTokens), repair: true, budget });
  return { html: extractHtml(result.text), metadata: { ...result.metadata, stage: "repairing-output" } };
}
