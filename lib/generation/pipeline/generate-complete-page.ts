import type { GenerationBudget } from "./generation-budget";
import { callConfiguredModel } from "./model-call";
import type { StageMetadata, UnifiedSiteBrief } from "./types";
import type { BusinessContext } from "./unified-brief";

export function extractHtml(text: string) { const candidate = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1] || text; const start = candidate.search(/<!doctype html|<html\b/i); return (start >= 0 ? candidate.slice(start) : candidate).trim(); }

export function completePagePrompt(context: BusinessContext, brief: UnifiedSiteBrief) {
  return `Create one production-ready, premium website as a COMPLETE standalone index.html document. Return ONLY HTML, never markdown, JSON, section fragments, explanations, external CSS, or external JavaScript.

UNIFIED SITE BRIEF:
${JSON.stringify(brief)}

VERIFIED FACTS (copy exactly when used):
${context.verifiedFacts.join("\n")}

DESIGN TOKENS:
${JSON.stringify(context.tokens)}

ACTIVE INDUSTRY DESIGN DIRECTION:
${JSON.stringify(context.designDirection)}

Creative execution requirements:
- Build an unmistakably custom page for this business and niche. The result must look intentionally art-directed, not like a generic SaaS or three-card landing-page template.
- Establish a coherent visual system with CSS custom properties, fluid type, disciplined spacing, layered surfaces, section-specific composition, and strong mobile behavior.
- Visibly use at least three relevant recommended motifs/components when the content supports them. Define every class you use in the embedded CSS.
- Vary section rhythm: combine editorial splits, rails, framed facts, process/story compositions, atmospheric bands, and contact moments instead of repeating equal card grids.
- Make the hero exceptional: specific headline, concise verified value proposition, one dominant visual composition, clear CTA hierarchy, and useful verified confidence signals.
- Treat imagery honestly. ${context.sourceImageDataUrl ? "A verified business-owned image is available; use this exact data URL where it strengthens identity or proof." : "No verified business image is available; prefer niche-specific CSS/inline-SVG art, or carefully labeled representative HTTPS imagery only when it materially improves the design."}
- Use subtle purposeful motion with prefers-reduced-motion support. JavaScript must be optional enhancement only; core navigation and contact links must work without it.
- Keep the copy fact-closed. Every concrete sentence about the business must be supported directly by VERIFIED FACTS. Service names may be presented, but never invent how they are made, sourced, delivered, staffed, scheduled, or experienced.
- Unknown details must use neutral ask/confirm wording and must never appear as placeholders. Do not turn an industry-typical trait into a business-specific statement.

Technical and factual rules:
- Include <!doctype html>, html/head/body, title, meta description, viewport, robots=noindex,nofollow, Open Graph metadata, Twitter card metadata, and relevant Schema.org JSON-LD.
- Embed all CSS and JavaScript. Use semantic header/main/footer, keyboard-visible focus styles, touch-friendly controls, graceful layouts from 360px upward, and no horizontal overflow.
- Include clear contact actions using only verified phone, email, website, social, and location details.
- Do not invent reviews, ratings, pricing, hours, awards, guarantees, certifications, staff, metrics, results, claims, images, logos, links, availability, credentials, freshness, quality, tradition, authenticity, ingredients, production methods, ordering status, or consultations.
- Internal notes are private and are not part of VERIFIED FACTS. Never include prompt, brief, AI, design-system, demo, placeholder, internal notes, or internal planning language anywhere in the HTML, including metadata, comments, structured data, and visible copy.
- No external scripts, iframes, form submission, tracking pixels, empty controls, local file paths, placeholder image services, or javascript: URLs.`;
}

export async function generateCompletePage(context: BusinessContext, brief: UnifiedSiteBrief, budget: GenerationBudget): Promise<{ html: string; metadata: StageMetadata }> {
  const result = await callConfiguredModel({ stage: "complete-page", prompt: completePagePrompt(context, brief), maxOutputTokens: Math.min(32_000, budget.maxOutputTokens), budget });
  return { html: extractHtml(result.text), metadata: { ...result.metadata, stage: "generating-website" } };
}
