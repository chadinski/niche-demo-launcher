import { GenerationBudget } from "./generation-budget";
import { generateCompletePage } from "./generate-complete-page";
import { repairCompletePage } from "./repair-output";
import { validateGeneratedHtml } from "./validate-output";
import { buildBusinessContext, generateUnifiedBrief } from "./unified-brief";
import type { EventSender } from "./events";
import type { NormalizedGenerationInput, PipelineResult } from "./types";

export async function runFastPipeline(input: NormalizedGenerationInput, send?: EventSender): Promise<PipelineResult> {
  const budget = new GenerationBudget("fast-draft"); const context = buildBusinessContext(input);
  send?.({ type: "understanding-business", generationId: input.generationId });
  const briefResult = await generateUnifiedBrief(context, budget);
  const generationPlan = { generationId: input.generationId, generationDepth: input.generationDepth, stage: "planning", summary: briefResult.brief.pageNarrative, sectionIds: briefResult.brief.sectionOutline.map((section) => section.name), premiumPlan: { sections: briefResult.brief.sectionOutline, layoutPhilosophy: briefResult.brief.visualThesis }, unifiedBrief: briefResult.brief, creativeContract: briefResult.brief, designSystem: { colorAndTypographyDirection: briefResult.brief.colorAndTypographyDirection }, pageContract: { sections: briefResult.brief.sectionOutline }, designTokens: context.tokens, archetype: context.archetype, visualIdentity: context.visualIdentity, seraphimGenerator: { authority: "only-website-generation-system", industryBrief: context.category, industryName: context.category, matchedSignals: context.services } };
  send?.({ type: "planning-site", generationId: input.generationId, unifiedBrief: briefResult.brief, generationPlan });
  send?.({ type: "generating-website", generationId: input.generationId });
  const page = await generateCompletePage(context, briefResult.brief, budget);
  let validation = validateGeneratedHtml(page.html, context); let revisionCount = 0; const metadata = [briefResult.metadata, page.metadata];
  send?.({ type: "checking-output", generationId: input.generationId, findings: validation.findings });
  if (validation.fatal) { send?.({ type: "repairing-output", generationId: input.generationId, findings: validation.findings }); const repaired = await repairCompletePage(context, briefResult.brief, validation.html, validation, budget); metadata.push(repaired.metadata); validation = validateGeneratedHtml(repaired.html, context); revisionCount = 1; }
  if (validation.fatal) throw new Error("The bounded repair did not produce a safe standalone website.");
  const qualityGate = { passed: !validation.fatal, findings: validation.findings, rejectionReasons: validation.findings.map((item) => item.message), measured: validation.quality.measured, notMeasured: validation.quality.notMeasured, revisionCount, budget: budget.snapshot() };
  return { html: validation.html, unifiedBrief: briefResult.brief, validation, metadata, generationPlan: { ...generationPlan, qualityGate, revisionCount }, qualityGate, revisionCount };
}
