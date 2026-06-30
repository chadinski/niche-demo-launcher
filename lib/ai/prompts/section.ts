import type { DesignTokens } from "@/lib/design/tokens";
import type { WebsitePlan, WebsitePlanSection } from "@/lib/ai/prompts/planner";

export type SectionPromptDefinition = WebsitePlanSection & {
  correctiveFeedback?: string[];
};

export function buildSectionPrompt(
  sectionDef: SectionPromptDefinition,
  plan: WebsitePlan,
  tokens: DesignTokens,
  inspiration = "",
): string {
  return `You are Seraphim Generator's elite section designer and frontend engineer.

Generate one complete website section fragment for the section below.

SECTION:
${JSON.stringify(sectionDef, null, 2)}

FULL WEBSITE PLAN:
${JSON.stringify(plan, null, 2)}

DESIGN TOKENS:
${JSON.stringify(tokens, null, 2)}

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
- Keep class names and CSS original; do not copy any external template.
- Include accessible headings, alt text for images, and keyboard-safe interactive controls if needed.
- Use verified-safe wording only. No fake testimonials, fake metrics, fake review counts, fake awards, fake guarantees, fake prices, or fake certifications.
- Do not include <html>, <head>, <body>, external scripts, external CSS links, or markdown fences.
- Make this section visually premium and specific to the business plan.`;
}
