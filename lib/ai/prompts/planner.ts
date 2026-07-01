import type { DesignTokens } from "@/lib/design/tokens";
import type { Archetype } from "@/lib/archetypes";

export interface BusinessData {
  name: string;
  description: string;
  targetAudience: string;
  differentiators: string[];
  brandPersonality?: string;
}

export interface WebsitePlanSection {
  name: string;
  goal: string;
  order: number;
}

export interface WebsitePlan {
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    rationale: string;
  };
  typography: {
    heading: string;
    body: string;
    rationale: string;
  };
  layoutPhilosophy: string;
  visualThesis?: string;
  sections: WebsitePlanSection[];
  conversionFlow: string;
}

export function buildPlannerPrompt(
  business: BusinessData,
  tokens: DesignTokens,
  inspiration = "",
  archetype?: Archetype,
): string {
  return `You are Seraphim Generator's senior website strategist.

Create a premium, business-specific website plan as strict JSON only. Do not return markdown.

BUSINESS:
${JSON.stringify(business, null, 2)}

DESIGN TOKENS:
${JSON.stringify(tokens, null, 2)}

ARCHETYPE:
${archetype ? JSON.stringify({
    id: archetype.id,
    name: archetype.name,
    industries: archetype.industries,
    preferredSectionOrder: archetype.sectionOrder,
    tone: archetype.tone,
    qaChecks: archetype.qaChecks,
  }, null, 2) : "No explicit archetype selected. Use the business facts and design tokens to create a custom plan."}

DESIGN INSPIRATION:
${inspiration || "No external inspiration supplied. Build from the business facts and design tokens."}

REFERENCE QUALITY:
Follow the structure and quality of the HappyFeet PetWorld example (a friendly local business). Adapt content to the given business and archetype.

Return exactly this JSON shape:
{
  "colorPalette": {
    "primary": "hex or token value",
    "secondary": "hex or token value",
    "accent": "hex or token value",
    "neutral": "hex or token value",
    "rationale": "why this palette fits the business"
  },
  "typography": {
    "heading": "heading direction",
    "body": "body direction",
    "rationale": "why this typography fits the business"
  },
  "layoutPhilosophy": "the custom visual and spacing philosophy",
  "visualThesis": "one clear visual thesis for the page",
  "sections": [
    {"name": "Hero", "goal": "orient and convert", "order": 1}
  ],
  "conversionFlow": "how the page moves from attention to action"
}

Rules:
- Plan 6 to 9 meaningful sections, not filler.
- When an archetype is supplied, use its preferred section order as the structural spine, but adapt or rename sections for the actual business.
- Match the supplied archetype tone without turning it into generic template copy.
- Include sections only when they support the business facts, customer decision, or conversion path.
- Do not invent testimonials, reviews, ratings, metrics, awards, prices, certifications, guarantees, years in business, or unsupported locations.
- Avoid generic SaaS/template language.
- Preserve the provided business identity exactly.
- Design for a custom, premium single-page demo that can become standalone HTML.`;
}
