import { buildDesignTokensFromArchetype, type DesignTokens } from "@/lib/design/tokens";
import { reconcileArchetype, buildVisualIdentityProfile } from "@/lib/generation/taste-profile";
import type { GenerationBudget } from "./generation-budget";
import { callConfiguredModel } from "./model-call";
import { unifiedSiteBriefSchema, type NormalizedGenerationInput, type UnifiedSiteBrief } from "./types";

const claimPattern = /\b(?:best|leading|award[- ]winning|#1|rated|reviews?|guarantee(?:d)?|certified|licensed|years? of experience|trusted by|satisfaction|results?)\b/i;

function unique(values: string[]) { return [...new Set(values.map((value) => value.trim()).filter(Boolean))]; }
function split(value: string) { return value.split(/[\n,;|]+/).map((item) => item.trim()).filter(Boolean); }

export type BusinessContext = {
  name: string; category: string; location: string; description: string; services: string[]; phone: string; email: string;
  websiteUrl: string; socialUrl: string; colors: string[]; verifiedFacts: string[]; uncertainFacts: string[]; sourceImageDataUrl: string;
  tokens: DesignTokens; archetype: { id: string; name: string; tone: string; sectionOrder: string[]; qaChecks: string[] }; visualIdentity: ReturnType<typeof buildVisualIdentityProfile>;
};

export function buildBusinessContext(input: NormalizedGenerationInput): BusinessContext {
  const raw = [input.info.rawInfo, input.info.notes, input.business.description].filter(Boolean).join("\n");
  const services = unique([...split(input.info.services), ...input.business.differentiators]).slice(0, 12);
  const facts = unique([
    input.business.name, input.info.businessName, input.info.category && `Business category: ${input.info.category}`,
    input.info.location && `Location: ${input.info.location}`, input.info.phone && `Phone: ${input.info.phone}`,
    input.info.email && `Email: ${input.info.email}`, input.info.websiteUrl && `Website: ${input.info.websiteUrl}`,
    ...services.map((service) => `Offers: ${service}`), ...split(raw).filter((item) => item.length > 8 && !claimPattern.test(item)),
  ]).slice(0, 24);
  const uncertain = unique([...split(raw).filter((item) => claimPattern.test(item)), "Do not infer unprovided proof, prices, availability, hours, credentials, reviews, or guarantees."]);
  const source = { companyName: input.business.name || input.info.businessName || "Local business", businessType: input.info.category || "Local business", visibleDescription: input.business.description || raw, services, targetAudience: input.business.targetAudience, brandTone: input.business.brandPersonality, visibleColors: split(input.info.brandColors), visualEvidence: input.sourceImageDataUrl ? ["business-provided source image"] : [], logoDescription: "", rawExtractedData: raw, phone: input.info.phone, email: input.info.email };
  const visualIdentity = buildVisualIdentityProfile(source);
  const { archetype } = reconcileArchetype({ cleanBusinessData: source, visualIdentity, selectedArchetypeId: input.archetypeId });
  const colors = {
    ...(visualIdentity.extractedColors[0] ? { primary: visualIdentity.extractedColors[0] } : {}),
    ...(visualIdentity.extractedColors[1] ? { secondary: visualIdentity.extractedColors[1] } : {}),
    ...(visualIdentity.dominantAccents[0] ? { accent: visualIdentity.dominantAccents[0] } : {}),
  };
  const tokens = buildDesignTokensFromArchetype(archetype, { colors });
  return { name: input.business.name || input.info.businessName || "Local business", category: input.info.category || "Local business", location: input.info.location, description: input.business.description || raw, services, phone: input.info.phone, email: input.info.email, websiteUrl: input.info.websiteUrl, socialUrl: input.info.socialUrl, colors: visualIdentity.extractedColors, verifiedFacts: facts, uncertainFacts: uncertain, sourceImageDataUrl: input.sourceImageDataUrl || "", tokens, archetype: { id: archetype.id, name: archetype.name, tone: archetype.tone, sectionOrder: archetype.sectionOrder, qaChecks: archetype.qaChecks }, visualIdentity };
}

function parseJson(text: string) { const candidate = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || text; const start = candidate.indexOf("{"); const end = candidate.lastIndexOf("}"); if (start < 0 || end < start) throw new Error("Planner did not return JSON."); return JSON.parse(candidate.slice(start, end + 1)); }

export function unifiedBriefPrompt(context: BusinessContext) {
  return `You are Seraphim's senior web strategist. Return ONLY one JSON object matching this exact shape: {businessSummary,verifiedFacts,missingOrUncertainFacts,targetAudience,primaryConversionAction,visualThesis,brandPersonality,colorAndTypographyDirection,imageAssetStrategy,pageNarrative,sectionOutline:[{name,purpose}],copyDirection,seoRequirements,accessibilityRequirements,factualRestrictions,responsiveBehavior}.\n\nVerified business information (use exactly; never invent beyond it):\n${context.verifiedFacts.join("\n")}\n\nUncertain/restricted information:\n${context.uncertainFacts.join("\n")}\n\nVisual inputs: colors=${context.colors.join(", ") || "choose industry-appropriate, non-generic palette"}; archetype=${context.archetype.name} (${context.archetype.tone}); services=${context.services.join(", ") || "not verified"}; source image=${context.sourceImageDataUrl ? "business-owned image supplied" : "none"}.\n\nProduce an original, premium, factual complete-page strategy. Use 5-9 purposeful sections. Include no fake proof. Require standalone HTML, embedded CSS/JS, semantic landmarks, noindex/nofollow, responsive behavior, focus states, metadata, and honest asset choices.`;
}

export async function generateUnifiedBrief(context: BusinessContext, budget: GenerationBudget) {
  const model = await callConfiguredModel({ stage: "planning", prompt: unifiedBriefPrompt(context), maxOutputTokens: 7000, json: true, budget });
  const brief = unifiedSiteBriefSchema.parse(parseJson(model.text));
  return { brief: brief satisfies UnifiedSiteBrief, metadata: model.metadata };
}
