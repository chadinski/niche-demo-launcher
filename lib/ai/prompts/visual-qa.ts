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

export function buildVisualQAPrompt(input: {
  html: string;
  creativeContract: unknown;
  designSystem: unknown;
  pageContract: unknown;
  cleanBusinessData: unknown;
  premiumReferenceBrief?: unknown;
  visualIdentity?: unknown;
  archetypeReconciliation?: unknown;
}): string {
  return `You are Seraphim's strict visual, code, and factual QA auditor.

Return exactly one strict JSON object only.
No markdown.
No prose.
No comments.
No trailing text.
The response must parse with JSON.parse.

Required JSON shape:
{
  "passed": false,
  "score": 0,
  "issues": [],
  "sectionIssues": [
    {
      "sectionId": "hero",
      "severity": "high",
      "issue": "specific issue",
      "revisionInstruction": "specific instruction for regenerating this section"
    }
  ],
  "globalRevisionInstruction": "specific global fix"
}

CLEAN BUSINESS DATA:
${JSON.stringify(redactLargeDataUrls(input.cleanBusinessData), null, 2)}

CREATIVE CONTRACT:
${JSON.stringify(input.creativeContract, null, 2)}

DESIGN SYSTEM CONTRACT:
${JSON.stringify(input.designSystem, null, 2)}

PAGE CONTRACT:
${JSON.stringify(input.pageContract, null, 2)}

VISUAL IDENTITY PROFILE:
${JSON.stringify(input.visualIdentity ?? {}, null, 2)}

ARCHETYPE RECONCILIATION:
${JSON.stringify(input.archetypeReconciliation ?? {}, null, 2)}

LOCAL PREMIUM REFERENCE INTELLIGENCE:
${JSON.stringify(input.premiumReferenceBrief ?? {}, null, 2)}

QA RULES:
- Judge visual consistency.
- Judge premium feel.
- Judge brand specificity, emotional fit, niche appropriateness, visual memorability, identity preservation, screenshot/color/logo alignment, and archetype accuracy.
- Compare the result against the Local Premium Reference Intelligence as a quality benchmark. Do not require copied layouts, but reject pages that are clearly less complete, less visually dense, or less compositionally intentional than the references.
- Judge business specificity.
- Judge factual safety.
- Reject fake claims, fake testimonials, fake reviews, fake ratings, fake awards, fake certifications, fake years in business, fake prices, fake guarantees, fake client names, fake staff names, fake case studies, fake emergency availability, and fake delivery/booking/payment features.
- Reject placeholder text, lorem ipsum, TODO, "your image here", unresolved bracketed content, and production-looking fake proof.
- Reject dead Tailwind-only classes or utility classes that are not defined in embedded CSS.
- Reject broken or unreliable media: local image filenames, relative screenshot paths, placeholder image services, empty image frames, blank mockup boxes, or image alt text visibly appearing because the image failed.
- Reject leaked internal planning language in visible copy, including "orient and convert", "decision moment", "conversion story", "customer question", "section contract", "page contract", "creative contract", "design system contract", "required content", "must avoid", "verified business facts", "verified business details", "missing facts", "raw extracted data", "support the conversion path", and "support the page conversion story".
- Check contact clarity and CTA clarity.
- Check mobile responsiveness, no horizontal overflow, section rhythm, and varied layouts.
- Reject shallow CSS, repeated generic section structures, weak first viewport composition, missing industry-specific visual moments, or pages that feel like prompt-written content wrapped in basic cards.
- Reject "technically complete but boring" output. A page can have metadata, sections, responsive CSS, and CTAs but still fail because it feels generic, emotionally flat, or transferable to another business with minor text swaps.
- If the page ignores extracted colors, logo mood, image energy, or archetype reconciliation, cap the score at 7.4 and return passed=false.
- If the design uses #0f172a, #111827, Inter-only typography, blue-gray corporate surfaces, or generic SaaS spacing for an expressive niche without explicit fallback justification, cap the score at 7.2 and return passed=false.
- If the assigned archetype is mismatched or the page feels like generic professional services for food, pet, beauty, wellness, home services, trades, boutique retail, hospitality, events, or automotive, cap the score at 7.0 and return passed=false.
- Judge whether the page feels like a real business website, not an AI demo.
- Judge whether the design follows the Creative Contract.
- Judge whether the HTML follows the Design System Contract.
- Reject generic wording such as "transform your business", "solutions for every need", "trusted by thousands", "award-winning", "best-in-class", "lorem ipsum", "placeholder", and "your image here".
- Score 8.5 or above only when the page is premium, custom, factual, standalone, CSS-reliable, emotionally right for the niche, visually memorable, and clearly aligned with the supplied visual identity.

HTML:
${input.html.slice(0, 100000)}`;
}
