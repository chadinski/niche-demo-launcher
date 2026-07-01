import type { DesignTokens } from "@/lib/design/tokens";
import type { WebsitePlan, WebsitePlanSection } from "@/lib/ai/prompts/planner";
import type { Archetype } from "@/lib/archetypes";

export type SectionPromptDefinition = WebsitePlanSection & {
  correctiveFeedback?: string[];
};

export function buildSectionPrompt(
  sectionDef: SectionPromptDefinition,
  plan: WebsitePlan,
  tokens: DesignTokens,
  inspiration = "",
  archetype?: Archetype,
): string {
  return `You are Seraphim Generator's elite section designer and frontend engineer.

SYSTEM NOTE:
Use the same level of polish as the HappyFeet PetWorld site: clear visual hierarchy, engaging copy, interactive elements (mobile menu, accordion, scroll-reveal), and mobile responsiveness. The HTML must be self-contained, accessible, and include appropriate micro-interactions.

Generate one complete website section fragment for the section below.

SECTION:
${JSON.stringify(sectionDef, null, 2)}

FULL WEBSITE PLAN:
${JSON.stringify(plan, null, 2)}

DESIGN TOKENS:
${JSON.stringify(tokens, null, 2)}

ARCHETYPE:
${archetype ? JSON.stringify({
    id: archetype.id,
    name: archetype.name,
    sectionOrder: archetype.sectionOrder,
    tone: archetype.tone,
    qaChecks: archetype.qaChecks,
  }, null, 2) : "No explicit archetype selected. Follow the plan, tokens, and business facts."}

AVAILABLE CSS CUSTOM PROPERTIES IN THE FINAL PAGE:
- var(--seraphim-primary)
- var(--seraphim-secondary)
- var(--seraphim-accent)
- var(--seraphim-neutral)
- var(--seraphim-bg)
- var(--seraphim-surface)
- var(--seraphim-text)
- var(--seraphim-muted)
- var(--seraphim-heading-font)
- var(--seraphim-body-font)

VISUAL THESIS:
${plan.visualThesis || plan.layoutPhilosophy}

INSPIRATION EXAMPLES:
${inspiration || "No external examples supplied. Use the plan and tokens only."}

STRICT OUTPUT:
Return only HTML for this section. No markdown. No explanation.

SECTION RULES:
- Use semantic HTML with one root <section> element.
- Use Tailwind-style utility classes where useful for spacing, typography, grid, color, and responsive behavior.
- You may include a scoped <style> tag inside the section only for custom effects that Tailwind-style classes cannot express.
- Prefer the available CSS custom properties for colors and fonts so regenerated sections stay aligned with user design preferences.
- Keep class names and CSS original; do not copy any external template.
- Include accessible headings, alt text for images, and keyboard-safe interactive controls if needed.
- Use verified-safe wording only. No fake testimonials, fake metrics, fake review counts, fake awards, fake guarantees, fake prices, or fake certifications.
- Do not include <html>, <head>, <body>, external scripts, external CSS links, or markdown fences.
- Make this section visually premium and specific to the business plan.`;
}
