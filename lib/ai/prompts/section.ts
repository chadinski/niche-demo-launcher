import type {
  CreativeContract,
  DesignSystemContract,
  PageContract,
  SectionContract,
} from "@/lib/ai/site-contract-schema";
import type { BusinessData } from "@/lib/ai/prompts/planner";

export type SectionPromptDefinition = SectionContract & {
  correctiveFeedback?: string[];
};

function redactLargeDataUrls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactLargeDataUrls);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      typeof item === "string" && /^data:image\//i.test(item)
        ? `[supplied image data URL omitted from prompt: ${item.length} chars]`
        : redactLargeDataUrls(item),
    ]));
  }
  return value;
}

export function buildSectionPrompt(input: {
  business: BusinessData;
  cleanBusinessData: unknown;
  creativeContract: CreativeContract;
  designSystem: DesignSystemContract;
  pageContract: PageContract;
  sectionContract: SectionPromptDefinition;
  previousSectionSummary?: string;
  nextSectionSummary?: string;
  correctiveFeedback?: string[];
  premiumReferenceBrief?: unknown;
  visualIdentity?: unknown;
  archetypeReconciliation?: unknown;
}): string {
  return `You are Seraphim Generator's elite section designer, conversion copywriter, and frontend engineer.

Generate exactly one section fragment.

BUSINESS:
${JSON.stringify(input.business, null, 2)}

CLEAN BUSINESS DATA:
${JSON.stringify(redactLargeDataUrls(input.cleanBusinessData), null, 2)}

CREATIVE CONTRACT:
${JSON.stringify(input.creativeContract, null, 2)}

DESIGN SYSTEM CONTRACT:
${JSON.stringify(input.designSystem, null, 2)}

PAGE CONTRACT:
${JSON.stringify(input.pageContract, null, 2)}

LOCAL PREMIUM REFERENCE INTELLIGENCE:
${JSON.stringify(input.premiumReferenceBrief ?? {}, null, 2)}

VISUAL IDENTITY PROFILE:
${JSON.stringify(input.visualIdentity ?? {}, null, 2)}

ARCHETYPE RECONCILIATION:
${JSON.stringify(input.archetypeReconciliation ?? {}, null, 2)}

CURRENT SECTION CONTRACT:
${JSON.stringify(input.sectionContract, null, 2)}

PREVIOUS SECTION SUMMARY:
${input.previousSectionSummary || "This is the first section or no previous summary is available."}

NEXT SECTION SUMMARY:
${input.nextSectionSummary || "This is the final section or no next summary is available."}

CORRECTIVE FEEDBACK:
${[...(input.sectionContract.correctiveFeedback ?? []), ...(input.correctiveFeedback ?? [])].length
    ? [...(input.sectionContract.correctiveFeedback ?? []), ...(input.correctiveFeedback ?? [])].map((item) => `- ${item}`).join("\n")
    : "No corrective feedback."}

STRICT OUTPUT:
Return only HTML for one <section>.
No markdown.
No explanation.
No full document.
No <html>, <head>, or <body>.

SECTION RULES:
- The root element must be one <section> with id="${input.sectionContract.id}".
- Use only CSS classes defined by the Design System Contract, or include scoped CSS inside this section only if absolutely necessary.
- Prefer existing generated component classes.
- No Tailwind-only utility classes unless the embedded CSS defines them.
- No fake proof.
- No unsupported claims.
- No placeholder text.
- Use factual, business-specific copy.
- The section must visually obey the Creative Contract.
- The section must serve the Page Contract.
- The section must preserve the Visual Identity Profile: extracted colors, logo mood, shape language, typography feel, image energy, and niche cues should show up in composition, copy rhythm, media treatment, and class choices.
- If the Visual Identity Profile warns about corporate-default risk, do not use bland navy/gray business language, Inter-only corporate tone, centered generic headings, or interchangeable service cards.
- The section must respect the Local Premium Reference Intelligence as a quality floor for composition, visual depth, media treatment, interaction polish, and responsiveness. Do not copy reference code, copy, exact layouts, branded artwork, or complete compositions.
- Add a distinct visual/compositional idea to this section when appropriate. Avoid plain text blocks and generic equal-card grids unless the section contract specifically calls for them.
- Treat section goals, customer questions, visual treatments, ctaRole values, mustAvoid items, page contract notes, and QA language as INTERNAL INSTRUCTIONS ONLY.
- Do not copy or paraphrase internal planning language into visible text. Forbidden visible phrases include "orient and convert", "decision moment", "conversion story", "customer question", "section contract", "page contract", "creative contract", "required content", "must avoid", "verified business facts", "verified business details", "missing facts", "raw extracted data", and "support the conversion path".
- Write customer-facing headlines, subheads, labels, and CTAs as if this is a real business website. The visitor should never see how the page was planned.
- The section heading must be a polished public-facing statement about ${input.business.name}, its offer, its customer value, or the current section topic, not the internal goal.
- If the section uses imagery or visual media, it must be reliable in a standalone HTML file. Do not use local filenames, relative screenshot paths, placeholder image services, empty image frames, or blank mockup boxes.
- If CLEAN BUSINESS DATA says a supplied image data URL was omitted from the prompt, visual-heavy sections may use <img src="__SERAPHIM_SOURCE_IMAGE__" alt="..."> to request the verified uploaded screenshot/photo. The backend will replace that token with the safe embedded image.
- Prefer polished CSS art panels, inline SVG/data-URI visuals, gradients, texture layers, and business-specific visual compositions when verified photography is not available.
- Any representative visual must feel specific to the business category and must not imply real staff, customers, facilities, reviews, awards, or outcomes.
- Use verified contact details only. If contact data is missing, use safe language such as "Contact to confirm details" without inventing the detail.
- Do not invent testimonials, ratings, awards, certifications, years in business, guarantees, prices, staff names, client names, case studies, emergency availability, delivery, booking, payment, or platform features.
- Keep the section mobile-safe, accessible, and semantically meaningful.
- If you introduce a <style> tag, scope selectors to #${input.sectionContract.id} and keep the CSS small.`;
}
