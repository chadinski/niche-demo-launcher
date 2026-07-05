import { DEFAULT_CREATIVE_CONTRACT } from "@/lib/ai/site-contract-schema";

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

export function buildCreativeDirectorPrompt(input: {
  cleanBusinessData: unknown;
  industryBrief: unknown;
  visualPreferences?: unknown;
  generationMode?: string;
  premiumReferenceBrief?: unknown;
}): string {
  return `You are Seraphim's senior creative director.

Your job is not to generate HTML.
Your job is to produce a strict Creative Contract that will control the rest of the website generation.

Return strict JSON only.
Do not include markdown.
Do not write HTML.

BUSINESS DATA:
${JSON.stringify(redactLargeDataUrls(input.cleanBusinessData), null, 2)}

INDUSTRY BRIEF:
${JSON.stringify(input.industryBrief, null, 2)}

VISUAL PREFERENCES:
${JSON.stringify(input.visualPreferences ?? {}, null, 2)}

GENERATION MODE:
${input.generationMode || "standard"}

LOCAL PREMIUM REFERENCE INTELLIGENCE:
${JSON.stringify(input.premiumReferenceBrief ?? {}, null, 2)}

REQUIRED JSON SHAPE:
${JSON.stringify(DEFAULT_CREATIVE_CONTRACT, null, 2)}

RULES:
- Do not invent fake claims.
- Do not invent testimonials.
- Do not invent ratings.
- Do not invent years in business.
- Do not invent certifications.
- Do not invent prices.
- Do not invent guarantees.
- Do not invent staff names, client names, case studies, delivery/booking/payment features, emergency availability, or awards.
- Use only verified facts from the business data.
- If something is missing, put it in businessIdentity.missingFacts.
- Put all forbidden claims in businessIdentity.forbiddenClaims.
- All generated sites must feel custom, premium, and specific to the business.
- Avoid generic SaaS landing page language.
- Avoid template-pack language.
- Avoid "private concept" badges unless explicitly required.
- The contract must define the visual logic before any section is generated.
- Use the Local Premium Reference Intelligence as a concrete quality benchmark. Do not copy reference code, copy, exact layouts, branded artwork, or complete compositions.
- Translate the references into a unique creative thesis, section rhythm, media direction, and premium signals for this business.
- The contract must be specific enough that the finished site could stand beside the referenced index.html demos in completeness, visual depth, and conversion polish.
- The sectionRules array should contain 6 to 9 sections with stable id values that can become HTML section IDs.
- Each section rule must answer a real customer decision question and must state what it must avoid.
- Make the creativeThesis specific enough that a different business in the same industry would receive a noticeably different direction.`;
}
