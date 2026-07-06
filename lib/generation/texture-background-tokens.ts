import type { Archetype } from "@/lib/archetypes";
import type { VisualIdentityProfile } from "@/lib/generation/taste-profile";

export type TextureBackgroundToken = {
  id: string;
  name: string;
  cssClass: string;
  industries: string[];
  archetypeIds: string[];
  moodTags: string[];
  description: string;
  bestFor: string[];
  cssRecipe: string[];
  intensity: "subtle" | "medium" | "bold";
  accessibilityNotes: string[];
  avoidWhen: string[];
};

export type TextureBackgroundTokenRecommendation = {
  primaryTokens: TextureBackgroundToken[];
  supportingTokens: TextureBackgroundToken[];
  summary: string;
  cssClassNames: string[];
  usageRules: string[];
  qaChecks: string[];
};

type CleanBusinessLike = {
  businessType?: string;
  services?: string[];
  products?: string[];
  visibleDescription?: string;
  brandTone?: string;
};

const allArchetypeIds = [
  "friendly-local",
  "professional-services",
  "saas-tech",
  "ecommerce-retail",
  "restaurant-hospitality",
  "health-wellness",
  "real-estate",
  "creative-agency",
  "education-tutoring",
  "automotive",
  "home-services",
  "nonprofit-charity",
  "fitness-sports",
  "travel-tourism",
  "beauty-salon",
  "tech-consulting",
];

export const TEXTURE_BACKGROUND_TOKENS: TextureBackgroundToken[] = [
  {
    id: "paper-grain-subtle",
    name: "Subtle paper grain",
    cssClass: ".seraphim-bg-paper-grain",
    industries: ["food", "restaurant", "beauty", "retail", "creative", "nonprofit", "education", "professional"],
    archetypeIds: ["restaurant-hospitality", "beauty-salon", "ecommerce-retail", "creative-agency", "nonprofit-charity", "education-tutoring", "professional-services"],
    moodTags: ["warm", "editorial", "handmade", "local", "soft", "tactile"],
    description: "A quiet paper-like grain for printed menus, local-business warmth, boutique cards, and editorial panels.",
    bestFor: ["hero surfaces", "menu cards", "service cards", "CTA bands with warm palette", "footer backgrounds"],
    cssRecipe: [
      "Use layered radial gradients and repeating-radial-gradient at very low opacity.",
      "Blend with cream, ivory, warm white, or extracted warm brand colors.",
    ],
    intensity: "subtle",
    accessibilityNotes: ["Keep opacity low enough that body text remains high contrast.", "Use behind solid content surfaces, not directly behind dense paragraphs when contrast is marginal."],
    avoidWhen: ["The brand should feel clinical, technical, or glossy rather than tactile."],
  },
  {
    id: "noise-overlay-fine",
    name: "Fine noise overlay",
    cssClass: ".seraphim-bg-noise-fine",
    industries: ["all"],
    archetypeIds: allArchetypeIds,
    moodTags: ["premium", "depth", "subtle", "polished"],
    description: "A fine CSS-only noise layer that prevents flat digital surfaces without requiring texture images.",
    bestFor: ["large hero backgrounds", "dark panels", "soft gradient sections", "empty local-business surfaces"],
    cssRecipe: [
      "Use repeating-radial-gradient or repeating-linear-gradient noise with opacity under .08.",
      "Apply through ::before with pointer-events:none and isolation:isolate.",
    ],
    intensity: "subtle",
    accessibilityNotes: ["Do not animate noise.", "Never reduce focus-ring or text contrast."],
    avoidWhen: ["The section already has detailed photography or busy illustration."],
  },
  {
    id: "radial-light-map",
    name: "Radial light map",
    cssClass: ".seraphim-bg-radial-light",
    industries: ["all"],
    archetypeIds: allArchetypeIds,
    moodTags: ["premium", "depth", "cinematic", "polished"],
    description: "Layered radial highlights that create a subtle sense of light direction and focus around the main offer.",
    bestFor: ["hero sections", "CTA bands", "showcase sections", "premium shells"],
    cssRecipe: [
      "Use two or three radial-gradient layers tied to --seraphim-primary, --seraphim-secondary, and --seraphim-accent.",
      "Keep the strongest highlight away from paragraph-heavy areas.",
    ],
    intensity: "medium",
    accessibilityNotes: ["Ensure the brightest highlights do not sit under body copy.", "Use solid overlays for text when needed."],
    avoidWhen: ["A calm professional page needs strict editorial restraint."],
  },
  {
    id: "warm-local-surface",
    name: "Warm local-business surface",
    cssClass: ".seraphim-bg-warm-local",
    industries: ["local", "food", "restaurant", "pet", "home service", "beauty", "retail", "nonprofit", "education"],
    archetypeIds: ["friendly-local", "restaurant-hospitality", "home-services", "beauty-salon", "ecommerce-retail", "nonprofit-charity", "education-tutoring"],
    moodTags: ["warm", "local", "welcoming", "community", "friendly"],
    description: "A friendly local-business background that mixes warm neutrals, extracted brand color, and a small amount of atmospheric depth.",
    bestFor: ["local service hero", "trust bridge", "service overview", "closing CTA"],
    cssRecipe: [
      "Use warm linear gradients plus small radial color blooms.",
      "Keep surface colors close to cream, warm gray, or brand-tinted white.",
    ],
    intensity: "medium",
    accessibilityNotes: ["Pair with dark text and clear CTA contrast.", "Avoid low-contrast tan-on-cream text."],
    avoidWhen: ["Automotive gloss, tech interface, or serious legal/finance contexts require cooler precision."],
  },
  {
    id: "dark-automotive-premium",
    name: "Dark premium automotive surface",
    cssClass: ".seraphim-bg-auto-dark",
    industries: ["auto", "automotive", "detailing", "mechanic", "garage", "vehicle", "tire", "tyre"],
    archetypeIds: ["automotive"],
    moodTags: ["dark", "gloss", "metallic", "precision", "premium", "kinetic"],
    description: "A dark metallic surface with gloss sweep, subtle noise, and accent glints for premium auto detailing, repair, and car-care demos.",
    bestFor: ["automotive hero", "finish showcase", "quote CTA", "service rail background"],
    cssRecipe: [
      "Use dark radial gradients, diagonal gloss bands, fine noise, and extracted accent-color glints.",
      "Use white text and high-contrast buttons on top.",
    ],
    intensity: "bold",
    accessibilityNotes: ["Use high-contrast foreground colors.", "Avoid placing muted gray text directly on dark gradients."],
    avoidWhen: ["Pet, beauty, wellness, and food brands where dark mechanical mood feels wrong."],
  },
  {
    id: "blueprint-grid-utility",
    name: "Blueprint utility grid",
    cssClass: ".seraphim-bg-blueprint-grid",
    industries: ["home service", "trades", "construction", "repair", "real estate", "tech"],
    archetypeIds: ["home-services", "real-estate", "tech-consulting", "saas-tech"],
    moodTags: ["structured", "technical", "practical", "sturdy", "mapped"],
    description: "A measured grid background for service areas, quote process panels, property/location blocks, and technical service pages.",
    bestFor: ["service-area sections", "process panels", "quote-prep cards", "map-inspired blocks"],
    cssRecipe: [
      "Use two linear-gradient grid layers with color-mix and low alpha.",
      "Mask the grid so it fades before dense copy.",
    ],
    intensity: "subtle",
    accessibilityNotes: ["Keep grid lines decorative.", "Use solid cards for forms and important links."],
    avoidWhen: ["Food, pet, beauty, and hospitality pages need warmth over technical measurement."],
  },
  {
    id: "soft-pet-play-bg",
    name: "Soft pet play background",
    cssClass: ".seraphim-bg-pet-soft",
    industries: ["pet", "grooming", "animal", "pet store", "pet care"],
    archetypeIds: ["friendly-local", "health-wellness"],
    moodTags: ["playful", "soft", "friendly", "warm", "rounded"],
    description: "Rounded color blobs and dotted paw-like rhythm that makes pet pages feel warm and reassuring without cartoon clutter.",
    bestFor: ["pet hero", "care/service sections", "FAQ backgrounds", "friendly CTA"],
    cssRecipe: [
      "Use large radial blobs plus a tiny dotted repeating-radial pattern.",
      "Tie colors to extracted brand colors and keep opacity soft.",
    ],
    intensity: "medium",
    accessibilityNotes: ["Keep blobs out of text-heavy areas.", "Avoid over-saturated backgrounds under long copy."],
    avoidWhen: ["Serious medical/wellness pet-care pages need calmer clinical trust."],
  },
  {
    id: "beauty-pearl-gradient",
    name: "Beauty pearl gradient",
    cssClass: ".seraphim-bg-beauty-pearl",
    industries: ["beauty", "salon", "spa", "nails", "lashes", "makeup", "hair"],
    archetypeIds: ["beauty-salon"],
    moodTags: ["soft", "editorial", "polished", "pearl", "glow"],
    description: "A pearl/blush gradient surface with subtle sheen for salons, beauty bars, and booking-forward editorial sections.",
    bestFor: ["beauty hero", "service menu", "portfolio frame", "appointment CTA"],
    cssRecipe: [
      "Use soft radial gradients and a linear sheen overlay.",
      "Keep the palette delicate and avoid neon glow unless the brand explicitly supports it.",
    ],
    intensity: "medium",
    accessibilityNotes: ["Use dark foreground text and strong button contrast.", "Avoid low-contrast blush text."],
    avoidWhen: ["Trades, automotive, and professional services where pearl softness weakens credibility."],
  },
  {
    id: "wellness-contour-calm",
    name: "Wellness contour calm",
    cssClass: ".seraphim-bg-wellness-contour",
    industries: ["health", "wellness", "clinic", "therapy", "dental", "medical", "care"],
    archetypeIds: ["health-wellness"],
    moodTags: ["calm", "clinical", "gentle", "breathing", "trust"],
    description: "Soft contour/breathing-line background for calm care and wellness pages.",
    bestFor: ["care hero", "process section", "FAQ", "preparation guidance"],
    cssRecipe: [
      "Use soft radial gradients plus repeating curved/linear contour hints.",
      "Keep contrast calm and avoid decorative medical symbolism.",
    ],
    intensity: "subtle",
    accessibilityNotes: ["Prefer solid text panels over patterned areas.", "Keep motion-free and reduced-noise."],
    avoidWhen: ["High-energy fitness or glossy auto pages."],
  },
  {
    id: "retail-fabric-paper",
    name: "Retail fabric-paper surface",
    cssClass: ".seraphim-bg-retail-fabric",
    industries: ["retail", "shop", "store", "boutique", "ecommerce", "product"],
    archetypeIds: ["ecommerce-retail"],
    moodTags: ["curated", "tactile", "shelf", "boutique"],
    description: "A fabric/paper surface for product shelves, boutique collection rails, and tactile retail cards.",
    bestFor: ["product showcase", "collection rail", "category cards", "boutique CTA"],
    cssRecipe: [
      "Use crosshatch linear gradients at very low opacity.",
      "Blend with warm or brand-tinted surfaces rather than pure white.",
    ],
    intensity: "subtle",
    accessibilityNotes: ["Do not put small product labels directly over busy texture.", "Use cards for dense details."],
    avoidWhen: ["SaaS dashboards, auto gloss, and clinical wellness pages."],
  },
  {
    id: "travel-sun-map",
    name: "Travel sun and map wash",
    cssClass: ".seraphim-bg-travel-map",
    industries: ["travel", "tour", "tourism", "hotel", "villa", "resort", "adventure", "hospitality"],
    archetypeIds: ["travel-tourism", "restaurant-hospitality"],
    moodTags: ["place", "sun", "map", "atmosphere", "warm"],
    description: "A scenic background wash that combines sunlit radial atmosphere with subtle route/map lines.",
    bestFor: ["travel hero", "itinerary section", "location/contact block"],
    cssRecipe: [
      "Use warm radial light plus soft diagonal/route line overlays.",
      "Avoid fake maps; use abstract route energy unless exact map data exists.",
    ],
    intensity: "medium",
    accessibilityNotes: ["Keep route lines decorative.", "Do not imply exact location pins unless verified."],
    avoidWhen: ["Precise legal, finance, or automotive pages."],
  },
  {
    id: "tech-node-grid",
    name: "Tech node grid",
    cssClass: ".seraphim-bg-tech-nodes",
    industries: ["saas", "software", "app", "platform", "technology", "tech", "ai"],
    archetypeIds: ["saas-tech", "tech-consulting"],
    moodTags: ["technical", "interface", "system", "digital"],
    description: "A subtle node/grid background for product, SaaS, AI, and technical consulting pages without fake dashboards.",
    bestFor: ["interface hero", "feature sections", "workflow panels"],
    cssRecipe: [
      "Use grid lines plus small radial node dots at intersections.",
      "Keep opacity low and use real/representative UI frames separately.",
    ],
    intensity: "medium",
    accessibilityNotes: ["Avoid busy node maps behind forms.", "Do not animate nodes."],
    avoidWhen: ["Local food, pet, beauty, or hospitality pages."],
  },
  {
    id: "professional-document-wash",
    name: "Professional document wash",
    cssClass: ".seraphim-bg-document-wash",
    industries: ["professional", "legal", "law", "finance", "accounting", "insurance", "consulting"],
    archetypeIds: ["professional-services"],
    moodTags: ["composed", "trust", "document", "editorial", "restrained"],
    description: "Restrained document-paper wash for professional services that need texture without expressive local-business styling.",
    bestFor: ["professional hero", "service/practice sections", "consultation CTA"],
    cssRecipe: [
      "Use faint paper gradient, document-line hints, and restrained neutral palette.",
      "Keep surfaces crisp and avoid playful blobs.",
    ],
    intensity: "subtle",
    accessibilityNotes: ["Maintain formal contrast and line-height.", "Avoid decorative marks that look like seals/certifications."],
    avoidWhen: ["Food, pet, and beauty pages where stronger emotion is appropriate."],
  },
];

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function sourceText(input: {
  cleanBusinessData: CleanBusinessLike;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
}) {
  return [
    input.cleanBusinessData.businessType,
    input.cleanBusinessData.visibleDescription,
    input.cleanBusinessData.services?.join(" "),
    input.cleanBusinessData.products?.join(" "),
    input.cleanBusinessData.brandTone,
    input.archetype.id,
    input.archetype.name,
    input.visualIdentity.logoMood,
    input.visualIdentity.shapeLanguage,
    input.visualIdentity.imageEnergy,
    input.visualIdentity.industryCues.join(" "),
    input.visualIdentity.dominantAccents.join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
}

function scoreToken(
  token: TextureBackgroundToken,
  input: {
    cleanBusinessData: CleanBusinessLike;
    archetype: Archetype;
    visualIdentity: VisualIdentityProfile;
  },
) {
  const source = sourceText(input);
  let score = 0;
  if (token.archetypeIds.includes(input.archetype.id)) score += 10;
  if (token.industries.includes("all")) score += 4;
  score += token.industries.filter((industry) => source.includes(industry)).length * 4;
  score += token.moodTags.filter((tag) => source.includes(tag)).length * 2;
  if (token.intensity === "subtle") score += 1;
  if (input.visualIdentity.brandTemperature === "warm" && /warm|paper|pet|beauty|travel|retail/i.test(token.id)) score += 2;
  if (input.visualIdentity.brandTemperature === "cool" && /auto|tech|blueprint|wellness|document/i.test(token.id)) score += 2;
  if (token.avoidWhen.some((avoid) => source.includes(avoid.toLowerCase()))) score -= 5;
  return score;
}

export function getTextureBackgroundTokens() {
  return TEXTURE_BACKGROUND_TOKENS;
}

export function recommendTextureBackgroundTokens(input: {
  cleanBusinessData: CleanBusinessLike;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
}): TextureBackgroundTokenRecommendation {
  const ranked = TEXTURE_BACKGROUND_TOKENS
    .map((token) => ({ token, score: scoreToken(token, input) }))
    .sort((a, b) => b.score - a.score);
  const primaryTokens = ranked.slice(0, 3).map(({ token }) => token);
  const supportingTokens = ranked
    .slice(3)
    .filter(({ token }) => token.industries.includes("all") || token.intensity === "subtle")
    .slice(0, 2)
    .map(({ token }) => token);
  const allTokens = [...primaryTokens, ...supportingTokens];

  return {
    primaryTokens,
    supportingTokens,
    summary: `Recommended background tokens: ${primaryTokens.map((token) => token.name).join(", ")}.`,
    cssClassNames: unique(allTokens.map((token) => token.cssClass)),
    usageRules: [
      "Use background tokens as section-level atmosphere, not as full templates.",
      "Prefer one primary texture per section and pair it with solid readable content surfaces.",
      "All texture/background treatments must be CSS-only or inline SVG; do not require image files.",
      "Use extracted brand colors through CSS custom properties instead of unrelated stock palettes.",
      "Textures must never imply proof, locations, facilities, staff, awards, or exact maps.",
    ],
    qaChecks: [
      "At least one recommended background token should appear in the hero, showcase, CTA, or service rhythm for expressive niches.",
      "Background token classes must be defined in embedded CSS.",
      "Textures must remain low-noise enough for readable text and accessible focus states.",
      "Dark automotive or tech surfaces must keep foreground contrast strong.",
    ],
  };
}
