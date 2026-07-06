import { DEFAULT_PAGE_CONTRACT } from "@/lib/ai/site-contract-schema";

export function buildPageContractPrompt(input: {
  creativeContract: unknown;
  designSystem: unknown;
  websitePlan: unknown;
  premiumReferenceBrief?: unknown;
  visualIdentity?: unknown;
  archetypeReconciliation?: unknown;
}): string {
  return `You are Seraphim's page contract strategist.

Create the final page-level contract that controls section generation.

Return strict JSON only.
No markdown.
No HTML.

CREATIVE CONTRACT:
${JSON.stringify(input.creativeContract, null, 2)}

DESIGN SYSTEM CONTRACT:
${JSON.stringify(input.designSystem, null, 2)}

WEBSITE PLAN:
${JSON.stringify(input.websitePlan, null, 2)}

VISUAL IDENTITY PROFILE:
${JSON.stringify(input.visualIdentity ?? {}, null, 2)}

ARCHETYPE RECONCILIATION:
${JSON.stringify(input.archetypeReconciliation ?? {}, null, 2)}

LOCAL PREMIUM REFERENCE INTELLIGENCE:
${JSON.stringify(input.premiumReferenceBrief ?? {}, null, 2)}

REQUIRED JSON SHAPE:
${JSON.stringify(DEFAULT_PAGE_CONTRACT, null, 2)}

RULES:
- Define exact section order.
- Use the Local Premium Reference Intelligence as a concrete completeness benchmark. Do not copy reference section names blindly; translate the standard into a unique page story for this business.
- Define stable section IDs that section HTML must use.
- Define section goals, visual treatment, CTA placement, copy angle, factual constraints, mobile behavior, and what each section must avoid.
- Section goals, customerQuestionAnswered, visualTreatment, ctaRole, and mustAvoid are internal controls for the generator. They must never be written as public page copy.
- For each section, requiredContent should include a customer-facing headline direction or copy angle that can become polished public copy without exposing planning language.
- Each section must name the design-system components it should use through requiredContent or visualTreatment.
- Use the Creative Contract as the source of truth for tone, visual direction, factual safety, and premium standard.
- Use the Design System Contract as the source of truth for CSS classes and component behavior.
- Use the Visual Identity Profile to decide section rhythm, visual motifs, media placement, and emotional pacing. A pet, food, beauty, trades, hospitality, or automotive business must not receive a generic corporate service-page rhythm.
- If Archetype Reconciliation reports a mismatch, the page contract must make the corrected archetype visible through section order and visual treatment.
- globalCss must contain any additional page-level CSS needed beyond component CSS, including base reset, root variables, responsive media queries, reduced-motion rules, nav/menu behavior, and reveal states.
- qaChecklist must include visual consistency, business specificity, factual safety, contact clarity, CTA clarity, mobile responsiveness, section rhythm, and no dead Tailwind-only styling.
- qaChecklist must include brand specificity, emotional fit, niche appropriateness, visual memorability, screenshot/color/logo alignment, archetype accuracy, corporate-default risk, and "technically complete but boring" rejection.
- qaChecklist must reject leaked planning language such as "orient and convert", "decision moment", "conversion story", "section contract", "required content", "verified business facts", "verified business details", "missing facts", "raw extracted data", or "support the conversion path" when visible in HTML.
- Do not add unsupported claims or template sections just to make the page longer.`;
}
