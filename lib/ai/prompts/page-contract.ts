import { DEFAULT_PAGE_CONTRACT } from "@/lib/ai/site-contract-schema";

export function buildPageContractPrompt(input: {
  creativeContract: unknown;
  designSystem: unknown;
  websitePlan: unknown;
  premiumReferenceBrief?: unknown;
  visualIdentity?: unknown;
  archetypeReconciliation?: unknown;
  visualMotifs?: unknown;
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

PREMIUM VISUAL MOTIF LIBRARY RECOMMENDATION:
${JSON.stringify(input.visualMotifs ?? {}, null, 2)}

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
- Use the Premium Visual Motif Library Recommendation to assign primitive-level treatments to sections. For example: proof strip near hero, service rail for service-heavy offers, CTA band after persuasion, image mask or section frame for the strongest visual moment, and a texture or SVG divider only where it supports the visual thesis.
- Use visualMotifs.industryAssetPack.sectionApplications to choose section-specific treatments. Adapt them to the business facts instead of copying them as fixed layouts.
- Assign texture/background tokens from visualMotifs.industryAssetPack.textureBackgroundTokens to sections intentionally. Hero, services, proof/showcase, and CTA sections may each use different surfaces to create rhythm, but avoid stacking every background class at once.
- Assign component primitives from visualMotifs.industryAssetPack.componentPrimitives to sections intentionally. Use them as composable structure: hero composition, service card or rail, process timeline, FAQ block, contact strip, and gallery frame.
- Assign photo direction from visualMotifs.industryAssetPack.photoDirection to media-heavy sections. Decide where uploaded screenshot/source image, representative imagery, CSS/SVG art, or no image is safest and most premium.
- Motifs are reusable primitives, not section templates. Each section contract should state which motif family to use and why it fits that section's conversion job.
- If Archetype Reconciliation reports a mismatch, the page contract must make the corrected archetype visible through section order and visual treatment.
- globalCss must contain any additional page-level CSS needed beyond component CSS, including base reset, root variables, responsive media queries, reduced-motion rules, nav/menu behavior, and reveal states.
- qaChecklist must include visual consistency, business specificity, factual safety, contact clarity, CTA clarity, mobile responsiveness, section rhythm, and no dead Tailwind-only styling.
- qaChecklist must include brand specificity, emotional fit, niche appropriateness, visual memorability, screenshot/color/logo alignment, archetype accuracy, corporate-default risk, and "technically complete but boring" rejection.
- qaChecklist must include selected motif usage, embedded CSS reliability for motif classes, verified-only badge/proof strip content, and service rail factual safety.
- qaChecklist must reject leaked planning language such as "orient and convert", "decision moment", "conversion story", "section contract", "required content", "verified business facts", "verified business details", "missing facts", "raw extracted data", or "support the conversion path" when visible in HTML.
- Do not add unsupported claims or template sections just to make the page longer.`;
}
