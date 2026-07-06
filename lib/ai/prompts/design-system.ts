import { DEFAULT_DESIGN_SYSTEM_CONTRACT } from "@/lib/ai/site-contract-schema";

export function buildDesignSystemPrompt(input: {
  creativeContract: unknown;
  designTokens: unknown;
  visualPreferences?: unknown;
  premiumReferenceBrief?: unknown;
  visualIdentity?: unknown;
  archetypeReconciliation?: unknown;
}): string {
  return `You are Seraphim's design systems architect.

Create a strict design system contract for a standalone index.html.

Return strict JSON only.
No markdown.
No HTML sections yet.

CREATIVE CONTRACT:
${JSON.stringify(input.creativeContract, null, 2)}

BASE DESIGN TOKENS:
${JSON.stringify(input.designTokens, null, 2)}

VISUAL PREFERENCES:
${JSON.stringify(input.visualPreferences ?? {}, null, 2)}

VISUAL IDENTITY PROFILE:
${JSON.stringify(input.visualIdentity ?? {}, null, 2)}

ARCHETYPE RECONCILIATION:
${JSON.stringify(input.archetypeReconciliation ?? {}, null, 2)}

LOCAL PREMIUM REFERENCE INTELLIGENCE:
${JSON.stringify(input.premiumReferenceBrief ?? {}, null, 2)}

REQUIRED JSON SHAPE:
${JSON.stringify(DEFAULT_DESIGN_SYSTEM_CONTRACT, null, 2)}

RULES:
- The final generated site will not load Tailwind.
- Do not rely on Tailwind utility classes unless their CSS is explicitly defined in the embedded CSS.
- Generate embedded CSS rules for every component class you name.
- Use a consistent class prefix such as seraphim-.
- Define reusable CSS classes for sections, containers, cards, buttons, image frames, proof blocks, contact blocks, and FAQ items.
- Make the generated CSS premium, responsive, and mobile-safe.
- Use CSS custom properties for colors, typography, spacing, radius, shadows, gradients, and borders.
- Respect the Creative Contract.
- Respect the Visual Identity Profile as binding evidence for colors, typography feel, shape language, brand temperature, and image energy.
- If the visual identity has meaningful color or mood signals, do not fall back to #0f172a, #111827, Inter-only typography, blue-gray corporate surfaces, or generic SaaS spacing.
- If an expressive niche is detected, the tokens and component CSS must create a niche-appropriate emotional feel before any section-specific styling is added.
- Respect the Local Premium Reference Intelligence as a quality floor for CSS depth, component completeness, media framing, mobile behavior, and section rhythm. Do not copy reference code.
- Do not include external CSS links.
- Do not use external scripts.
- Do not create a static template.
- Avoid dead utility classes. If a class appears in section HTML, it must either be defined in this design system or scoped inside that section.
- Component CSS should include hover/focus states where appropriate, reduced-motion-friendly transitions, and no horizontal overflow traps.
- Include at least one reusable class or token choice that expresses the business-specific visual thesis, such as a food/photo frame, pet-friendly rounded proof item, trades service rail, automotive finish panel, beauty editorial frame, or hospitality atmosphere band.`;
}
