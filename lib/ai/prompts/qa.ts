export interface SectionQAResult {
  passed: boolean;
  issues: string[];
}

export function buildQAPrompt(fullHtml: string): string {
  return `You are Seraphim Generator's strict QA auditor.

Review the complete generated HTML below and return strict JSON only:
{
  "passed": true,
  "issues": []
}

QA RULES:
- No placeholders presented as final content.
- No fake testimonials, fake reviews, fake ratings, fake follower counts, fake metrics, fake awards, fake prices, fake guarantees, fake certifications, or unsupported years in business.
- No generic template-pack language, meta keywords, or fake proof badges.
- Business name and offer must be clear in the first viewport.
- Spacing, typography, colors, shadows, and radius should feel consistent.
- Text/background contrast must be readable.
- Mobile layout must be responsive with no horizontal overflow.
- Navigation, CTA, FAQ/decision support, and contact path should be usable.
- SEO basics must exist: title, description, robots noindex, Open Graph/Twitter metadata when practical, and JSON-LD using verified facts only.
- Images must be niche-relevant and must not imply actual business photography unless verified.
- Code should be complete standalone HTML with embedded CSS and minimal guarded JS.

HTML:
${fullHtml.slice(0, 90000)}`;
}
