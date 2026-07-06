import { DEFAULT_DESIGN_SYSTEM_CONTRACT } from "@/lib/ai/site-contract-schema";

export function buildDesignSystemPrompt(input: {
  creativeContract: unknown;
  designTokens: unknown;
  visualPreferences?: unknown;
  premiumReferenceBrief?: unknown;
  visualIdentity?: unknown;
  archetypeReconciliation?: unknown;
  visualMotifs?: unknown;
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

PREMIUM VISUAL MOTIF LIBRARY RECOMMENDATION:
${JSON.stringify(input.visualMotifs ?? {}, null, 2)}

REQUIRED JSON SHAPE:
${JSON.stringify(DEFAULT_DESIGN_SYSTEM_CONTRACT, null, 2)}

RULES:
- The final generated site will not load Tailwind.
- Do not rely on Tailwind utility classes unless their CSS is explicitly defined in the embedded CSS.
- Generate embedded CSS rules for every component class you name.
- Use a consistent class prefix such as seraphim-.
- Define reusable CSS classes for sections, containers, cards, buttons, image frames, proof blocks, contact blocks, and FAQ items.
- Define reusable embedded CSS classes for the selected visual motifs where relevant: SVG dividers, texture overlays, badge systems, section frames, icon treatments, CTA bands, image masks, proof strips, and service rails.
- Translate visualMotifs.industryAssetPack.cssPrimitives into embedded CSS primitives when they fit the Creative Contract. Examples include menu cards, plate rings, gloss sweeps, speed lines, paw marks, soft blobs, map panels, tool icons, mirror cards, and care-path panels.
- Translate visualMotifs.industryAssetPack.textureBackgroundTokens into reusable background classes. Define CSS for recommended token classes such as .seraphim-bg-paper-grain, .seraphim-bg-noise-fine, .seraphim-bg-radial-light, .seraphim-bg-warm-local, .seraphim-bg-auto-dark, .seraphim-bg-blueprint-grid, .seraphim-bg-pet-soft, .seraphim-bg-beauty-pearl, .seraphim-bg-wellness-contour, .seraphim-bg-retail-fabric, .seraphim-bg-travel-map, .seraphim-bg-tech-nodes, and .seraphim-bg-document-wash when relevant.
- Translate visualMotifs.industryAssetPack.componentPrimitives into reusable component classes when relevant. Define CSS for selected classes such as .seraphim-hero-editorial, .seraphim-hero-cinematic, .seraphim-hero-montage, .seraphim-service-card, .seraphim-process-path, .seraphim-process-checklist, .seraphim-contact-strip, and .seraphim-gallery-frame when used.
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
- Avoid dead motif classes. If the motif library recommends .seraphim-proof-strip, .seraphim-service-rail, .seraphim-cta-band, .seraphim-frame-offset, .seraphim-frame-utility, .seraphim-mask-arch, .seraphim-mask-diagonal, .seraphim-texture-grain, .seraphim-texture-blueprint, .seraphim-icon-mark, or a divider class, define the class before any section uses it.
- Motif CSS must remain primitive-level: reusable surfaces, frames, dividers, rails, masks, proof rows, and CTA bands. Do not generate a fixed page template.
- Asset-pack CSS must stay reusable and business-adaptive. Do not create a hardcoded restaurant, auto, pet, home-service, or beauty template.
- Background tokens must use CSS gradients, masks, color-mix, and low-opacity generated texture only. Do not depend on external texture image files.
- Component primitives must remain composable. They should provide layout, spacing, states, and responsive behavior, not a hardcoded full-page layout.
- Proof strips, fact badges, and service rails must be visually premium but factually conservative.
- Component CSS should include hover/focus states where appropriate, reduced-motion-friendly transitions, and no horizontal overflow traps.
- Include at least one reusable class or token choice that expresses the business-specific visual thesis, such as a food/photo frame, pet-friendly rounded proof item, trades service rail, automotive finish panel, beauty editorial frame, or hospitality atmosphere band.`;
}
