import type { DesignTokens } from "@/lib/design/tokens";

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
): string {
  return `You are Seraphim Generator's senior website strategist.

Create a premium, business-specific website plan as strict JSON only. Do not return markdown.

BUSINESS:
${JSON.stringify(business, null, 2)}

DESIGN TOKENS:
${JSON.stringify(tokens, null, 2)}

DESIGN INSPIRATION:
${inspiration || "No external inspiration supplied. Build from the business facts and design tokens."}

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
- Include sections only when they support the business facts, customer decision, or conversion path.
- Do not invent testimonials, reviews, ratings, metrics, awards, prices, certifications, guarantees, years in business, or unsupported locations.
- Avoid generic SaaS/template language.
- Preserve the provided business identity exactly.
- Design for a custom, premium single-page demo that can become standalone HTML.`;
}
