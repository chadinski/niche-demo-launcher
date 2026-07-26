import { buildDesignTokensFromArchetype, type DesignTokens } from "@/lib/design/tokens";
import { reconcileArchetype, buildVisualIdentityProfile } from "@/lib/generation/taste-profile";
import { recommendPremiumVisualMotifs } from "@/lib/generation/visual-motifs";
import type { GenerationBudget } from "./generation-budget";
import { callConfiguredModel } from "./model-call";
import { unifiedSiteBriefSchema, type NormalizedGenerationInput, type UnifiedSiteBrief } from "./types";

const claimPattern = /\b(?:best|leading|award[- ]winning|#1|rated|reviews?|guarantee(?:d)?|certified|licensed|years? of experience|trusted by|satisfaction|results?)\b/i;

function unique(values: string[]) { return [...new Set(values.map((value) => value.trim()).filter(Boolean))]; }
function split(value: string) { return value.split(/[\n,;|]+/).map((item) => item.trim()).filter(Boolean); }

export type GenerationDesignDirection = {
  industryPack: { name: string; visualThesis: string; sectionApplications: Array<{ section: string; treatment: string }>; copyTone: string[]; avoid: string[] };
  motifs: Array<{ name: string; category: string; description: string; usage: string; cssContract: string[] }>;
  textures: Array<{ name: string; className: string; description: string; cssRecipe: string[] }>;
  components: Array<{ name: string; category: string; description: string; compositionRules: string[]; cssClasses: string[] }>;
  photoDirection: { summary: string; preferredMode: string; representativeImageryRules: string[]; remoteImageRules: string[]; labelingRules: string[] };
  requiredApplications: string[];
  rejectedDefaults: string[];
  qaChecks: string[];
};

export type BusinessContext = {
  name: string; category: string; location: string; description: string; services: string[]; phone: string; email: string;
  websiteUrl: string; socialUrl: string; colors: string[]; verifiedFacts: string[]; uncertainFacts: string[]; privateNotes: string[]; sourceImageDataUrl: string;
  tokens: DesignTokens; archetype: { id: string; name: string; tone: string; sectionOrder: string[]; qaChecks: string[] }; visualIdentity: ReturnType<typeof buildVisualIdentityProfile>;
  designDirection: GenerationDesignDirection;
};

export function buildBusinessContext(input: NormalizedGenerationInput): BusinessContext {
  const raw = [input.info.rawInfo, input.business.description].filter(Boolean).join("\n");
  const privateNotes = unique(split(input.info.notes)).slice(0, 20);
  const services = unique([...split(input.info.services), ...input.business.differentiators]).slice(0, 12);
  const facts = unique([
    input.business.name, input.info.businessName, input.info.category && `Business category: ${input.info.category}`,
    input.info.location && `Location: ${input.info.location}`, input.info.phone && `Phone: ${input.info.phone}`,
    input.info.email && `Email: ${input.info.email}`, input.info.websiteUrl && `Website: ${input.info.websiteUrl}`,
    ...services.map((service) => `Offers: ${service}`), ...split(raw).filter((item) => item.length > 8 && !claimPattern.test(item)),
  ]).slice(0, 24);
  const uncertain = unique([...split(raw).filter((item) => claimPattern.test(item)), "Do not infer unprovided proof, prices, availability, hours, credentials, reviews, or guarantees."]);
  const source = { companyName: input.business.name || input.info.businessName || "Local business", businessType: input.info.category || "Local business", visibleDescription: input.business.description || raw, services, targetAudience: input.business.targetAudience, brandTone: input.business.brandPersonality, visibleColors: split(input.info.brandColors), visualEvidence: input.sourceImageDataUrl ? ["business-provided source image"] : [], logoDescription: "", rawExtractedData: raw, phone: input.info.phone, email: input.info.email, sourceImageDataUrl: input.sourceImageDataUrl || "" };
  const visualIdentity = buildVisualIdentityProfile(source);
  const { archetype } = reconcileArchetype({ cleanBusinessData: source, visualIdentity, selectedArchetypeId: input.archetypeId });
  const recommendations = recommendPremiumVisualMotifs({ cleanBusinessData: source, archetype, visualIdentity });
  const assetPack = recommendations.industryAssetPack;
  const designDirection: GenerationDesignDirection = {
    industryPack: {
      name: assetPack.primaryPack.name,
      visualThesis: assetPack.primaryPack.visualThesis,
      sectionApplications: assetPack.primaryPack.sectionApplications,
      copyTone: assetPack.primaryPack.copyTone,
      avoid: assetPack.primaryPack.avoid,
    },
    motifs: recommendations.primitives.map((motif) => ({
      name: motif.name,
      category: motif.category,
      description: motif.description,
      usage: motif.usage,
      cssContract: motif.cssContract,
    })),
    textures: assetPack.textureBackgroundTokens.primaryTokens.map((token) => ({
      name: token.name,
      className: token.cssClass,
      description: token.description,
      cssRecipe: token.cssRecipe,
    })),
    components: assetPack.componentPrimitives.primitives.map((primitive) => ({
      name: primitive.name,
      category: primitive.category,
      description: primitive.description,
      compositionRules: primitive.compositionRules,
      cssClasses: primitive.cssClasses,
    })),
    photoDirection: {
      summary: assetPack.photoDirection.summary,
      preferredMode: assetPack.photoDirection.preferredMode,
      representativeImageryRules: assetPack.photoDirection.representativeImageryRules.slice(0, 3),
      remoteImageRules: assetPack.photoDirection.remoteImageRules.slice(0, 4),
      labelingRules: assetPack.photoDirection.labelingRules.slice(0, 3),
    },
    requiredApplications: recommendations.requiredUsage.slice(0, 12),
    rejectedDefaults: recommendations.rejectedDefaults,
    qaChecks: recommendations.qaChecks.slice(0, 14),
  };
  const colors = {
    ...(visualIdentity.extractedColors[0] ? { primary: visualIdentity.extractedColors[0] } : {}),
    ...(visualIdentity.extractedColors[1] ? { secondary: visualIdentity.extractedColors[1] } : {}),
    ...(visualIdentity.dominantAccents[0] ? { accent: visualIdentity.dominantAccents[0] } : {}),
  };
  const tokens = buildDesignTokensFromArchetype(archetype, { colors });
  return { name: input.business.name || input.info.businessName || "Local business", category: input.info.category || "Local business", location: input.info.location, description: input.business.description || raw, services, phone: input.info.phone, email: input.info.email, websiteUrl: input.info.websiteUrl, socialUrl: input.info.socialUrl, colors: visualIdentity.extractedColors, verifiedFacts: facts, uncertainFacts: uncertain, privateNotes, sourceImageDataUrl: input.sourceImageDataUrl || "", tokens, archetype: { id: archetype.id, name: archetype.name, tone: archetype.tone, sectionOrder: archetype.sectionOrder, qaChecks: archetype.qaChecks }, visualIdentity, designDirection };
}

function parseJson(text: string) { const candidate = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || text; const start = candidate.indexOf("{"); const end = candidate.lastIndexOf("}"); if (start < 0 || end < start) throw new Error("Planner did not return JSON."); return JSON.parse(candidate.slice(start, end + 1)); }

export function fallbackUnifiedBrief(context: BusinessContext): UnifiedSiteBrief {
  const primaryAction = context.phone ? `Call ${context.name}` : context.email ? `Email ${context.name}` : `Contact ${context.name}`;
  const sections = context.archetype.sectionOrder.slice(0, 7).map((name) => ({ name, purpose: name === "Hero" ? "Clarify the verified offer and primary contact action." : `Help visitors understand ${context.name} using verified information only.` }));
  return unifiedSiteBriefSchema.parse({
    businessSummary: context.description || `${context.name} is a ${context.category}.`, verifiedFacts: context.verifiedFacts,
    missingOrUncertainFacts: context.uncertainFacts, targetAudience: "Local customers seeking the business's verified services.",
    primaryConversionAction: primaryAction, visualThesis: `${context.archetype.name}: ${context.archetype.tone}`,
    brandPersonality: context.archetype.tone, colorAndTypographyDirection: `Use ${context.colors.join(", ") || "the selected archetype palette"} with ${context.tokens.fonts.heading} headings.`,
    imageAssetStrategy: context.sourceImageDataUrl ? "Use the supplied business-owned image only when it is appropriate; otherwise use industry-specific CSS composition or no image." : "Use industry-specific CSS composition or no image; do not fabricate visual proof.",
    pageNarrative: `Introduce ${context.name}, explain verified offerings, answer practical questions, and make contact easy.`,
    sectionOutline: sections.length >= 4 ? sections : [{ name: "Hero", purpose: "State the verified offer." }, { name: "Services", purpose: "Explain verified services." }, { name: "About", purpose: "Provide accurate context." }, { name: "Contact", purpose: "Make the primary action clear." }],
    copyDirection: "Specific, welcoming, and fact-closed. Every concrete claim must be supported by the verified facts; do not add production methods, availability, quality claims, or generic AI language.",
    seoRequirements: ["Unique title and meta description", "Open Graph title and description", "noindex, nofollow for this concept site"],
    accessibilityRequirements: ["Semantic landmarks", "Visible keyboard focus states", "Meaningful image alternative text"],
    factualRestrictions: ["Do not invent reviews, ratings, prices, awards, certifications, staff, results, production methods, freshness, quality, availability, or operating details.", "Use only verified contact details and verified service names.", "Do not expose internal notes; unknown specifics must use neutral ask-or-confirm wording."],
    responsiveBehavior: ["Use a single-column mobile layout where needed.", "Avoid fixed widths and horizontal overflow.", "Keep tap targets and contact actions accessible."],
  });
}

export function unifiedBriefPrompt(context: BusinessContext) {
  return `You are Seraphim's senior web strategist. Return ONLY one JSON object matching this exact shape: {businessSummary,verifiedFacts,missingOrUncertainFacts,targetAudience,primaryConversionAction,visualThesis,brandPersonality,colorAndTypographyDirection,imageAssetStrategy,pageNarrative,sectionOutline:[{name,purpose}],copyDirection,seoRequirements,accessibilityRequirements,factualRestrictions,responsiveBehavior}.\n\nVerified business information (use exactly; never invent beyond it):\n${context.verifiedFacts.join("\n")}\n\nUncertain/restricted information:\n${context.uncertainFacts.join("\n")}\n\nPRIVATE DATA BOUNDARY: Internal notes are intentionally omitted. Never request, infer, mention, quote, summarize, or expose internal notes in the strategy or website.\n\nFACT-CLOSED COPY RULE: Every concrete business claim must be directly supported by a verified fact above. Service names may be presented, but do not invent how they are made or delivered. Do not add freshness, quality, tradition, authenticity, availability, ordering status, consultation, operating, staff, process, ingredient, or production-method claims unless explicitly verified.\n\nVisual inputs: colors=${context.colors.join(", ") || "choose industry-appropriate, non-generic palette"}; archetype=${context.archetype.name} (${context.archetype.tone}); services=${context.services.join(", ") || "not verified"}; source image=${context.sourceImageDataUrl ? "business-owned image supplied" : "none"}.\n\nACTIVE INDUSTRY DESIGN DIRECTION:\n${JSON.stringify(context.designDirection)}\n\nProduce an original, premium, factual complete-page strategy. Use 5-9 purposeful sections whose order follows the business's actual conversion story, not a fixed template rhythm. Make the visual thesis explicitly apply the industry pack, palette, motifs, textures, component compositions, and honest photo direction above. Include no fake proof. Require standalone HTML, embedded CSS/JS, semantic landmarks, noindex/nofollow, responsive behavior, focus states, metadata, and honest asset choices.`;
}

function enforceFactualBoundary(context: BusinessContext, brief: UnifiedSiteBrief): UnifiedSiteBrief {
  const verifiedSummary = `${context.name} is a ${context.category}${context.location ? ` in ${context.location}` : ""}.`;
  const primaryAction = context.phone ? `Call ${context.name}` : context.email ? `Email ${context.name}` : `Contact ${context.name}`;
  return unifiedSiteBriefSchema.parse({
    ...brief,
    businessSummary: verifiedSummary,
    verifiedFacts: context.verifiedFacts,
    missingOrUncertainFacts: unique([...context.uncertainFacts, ...brief.missingOrUncertainFacts]).slice(0, 30),
    primaryConversionAction: primaryAction,
    copyDirection: `${brief.copyDirection} Keep visible copy fact-closed: service names may be presented, but unverified production methods, freshness, quality, availability, and operating details are prohibited.`.slice(0, 600),
    factualRestrictions: unique([
      "Use only the supplied verified facts for concrete business claims.",
      "Do not expose internal notes or internal planning language.",
      "Do not invent production methods, freshness, quality, tradition, authenticity, availability, ordering status, hours, staff, proof, or credentials.",
      ...brief.factualRestrictions,
    ]).slice(0, 20),
  });
}

export async function generateUnifiedBrief(context: BusinessContext, budget: GenerationBudget) {
  const model = await callConfiguredModel({ stage: "planning", prompt: unifiedBriefPrompt(context), maxOutputTokens: 7000, json: true, budget });
  try {
    const brief = enforceFactualBoundary(context, unifiedSiteBriefSchema.parse(parseJson(model.text)));
    return { brief: brief satisfies UnifiedSiteBrief, metadata: model.metadata };
  } catch {
    // A malformed planner response should not discard a viable complete-page
    // generation. This deterministic fallback preserves the same factual and
    // safety constraints without adding another paid call.
    return { brief: fallbackUnifiedBrief(context), metadata: { ...model.metadata, stage: "planning-fallback" } };
  }
}
