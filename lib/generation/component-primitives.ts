import type { Archetype } from "@/lib/archetypes";
import type { VisualIdentityProfile } from "@/lib/generation/taste-profile";

export type ComponentPrimitiveCategory =
  | "hero-composition"
  | "service-card"
  | "process-timeline"
  | "faq-block"
  | "contact-strip"
  | "gallery-frame";

export type ComponentPrimitive = {
  id: string;
  name: string;
  category: ComponentPrimitiveCategory;
  cssClasses: string[];
  industries: string[];
  archetypeIds: string[];
  description: string;
  bestFor: string[];
  compositionRules: string[];
  contentRules: string[];
  accessibilityRules: string[];
  avoid: string[];
};

export type ComponentPrimitiveRecommendation = {
  summary: string;
  selectedPrimitiveIds: string[];
  primitives: ComponentPrimitive[];
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

export const COMPONENT_PRIMITIVES: ComponentPrimitive[] = [
  {
    id: "hero-editorial-split",
    name: "Editorial split hero",
    category: "hero-composition",
    cssClasses: ["seraphim-hero-editorial", "seraphim-hero-copy", "seraphim-hero-visual"],
    industries: ["professional", "beauty", "wellness", "retail", "creative", "local"],
    archetypeIds: ["professional-services", "beauty-salon", "health-wellness", "ecommerce-retail", "creative-agency", "friendly-local"],
    description: "A premium split hero with a focused copy stack, one visual object, verified fact badges, and clear CTA hierarchy.",
    bestFor: ["brands with a strong message plus one visual proof/composition", "local businesses that need polish without fake imagery"],
    compositionRules: ["Use one dominant visual panel.", "Keep the H1, lede, proof badges, and CTA close together.", "Do not add more than two CTAs."],
    contentRules: ["H1 must state business value plainly.", "Proof badges must use verified facts only.", "Visual may be uploaded image, CSS/SVG art, or labeled representative imagery."],
    accessibilityRules: ["Keep logical source order with text first.", "Ensure CTA links are descriptive and keyboard visible."],
    avoid: ["generic centered SaaS hero", "fake badges", "dashboard mockups for non-software businesses"],
  },
  {
    id: "hero-cinematic-media",
    name: "Cinematic media hero",
    category: "hero-composition",
    cssClasses: ["seraphim-hero-cinematic", "seraphim-hero-media", "seraphim-hero-overlay"],
    industries: ["food", "restaurant", "auto", "travel", "fitness", "creative"],
    archetypeIds: ["restaurant-hospitality", "automotive", "travel-tourism", "fitness-sports", "creative-agency"],
    description: "A visually immersive hero for image-led businesses, using strong media framing or CSS art with a protected text area.",
    bestFor: ["food atmosphere", "automotive finish", "travel/place mood", "portfolio energy"],
    compositionRules: ["Use a large media field with overlay only when text contrast is safe.", "Anchor one primary CTA above the fold.", "Use texture/motif classes to prevent a flat stock-photo look."],
    contentRules: ["Media must be verified, representative-labeled, or CSS/SVG art.", "Do not imply actual facilities or customers from stock imagery."],
    accessibilityRules: ["Use real text over/near media, not text baked into images.", "Keep mobile crop safe with stable aspect ratio."],
    avoid: ["unlabeled representative stock", "low-contrast text over busy images", "oversized empty hero"],
  },
  {
    id: "hero-service-montage",
    name: "Service montage hero",
    category: "hero-composition",
    cssClasses: ["seraphim-hero-montage", "seraphim-montage-tile", "seraphim-proof-strip"],
    industries: ["home service", "pet", "auto", "retail", "education", "fitness"],
    archetypeIds: ["home-services", "friendly-local", "automotive", "ecommerce-retail", "education-tutoring", "fitness-sports"],
    description: "A disciplined grid of service/object tiles that communicates range without using fake project proof.",
    bestFor: ["service-heavy businesses", "apps/local services with multiple offers", "brands without a single hero photo"],
    compositionRules: ["Use three to five varied tiles, not a random collage.", "Each tile should map to verified services or safe ask-about categories.", "Keep one clear focal tile."],
    contentRules: ["No fake before/after, ratings, or service claims.", "Use icons/CSS art/source image crops for tiles."],
    accessibilityRules: ["Tiles need headings or hidden labels if informative.", "Avoid horizontal scrolling on mobile."],
    avoid: ["busy image walls", "fake portfolio montage", "uncaptioned stock thumbnails"],
  },
  {
    id: "service-intent-card",
    name: "Customer-intent service card",
    category: "service-card",
    cssClasses: ["seraphim-service-card", "seraphim-service-card-icon", "seraphim-service-card-action"],
    industries: ["all"],
    archetypeIds: allArchetypeIds,
    description: "A service card that explains what the service is, who it helps, and what to do next.",
    bestFor: ["most service/product sections", "verified service lists"],
    compositionRules: ["Use consistent icon/heading/body/action rhythm.", "Cards can vary width/importance but not become unrelated styles."],
    contentRules: ["Only list verified services or safe ask-about categories.", "Avoid invented outcomes, prices, guarantees, or availability."],
    accessibilityRules: ["Use article/list semantics.", "Clickable cards still need clear internal links."],
    avoid: ["three bland identical cards with filler copy", "icons without labels"],
  },
  {
    id: "service-rail-detailed",
    name: "Detailed service rail",
    category: "service-card",
    cssClasses: ["seraphim-service-rail", "seraphim-service-rail-item", "seraphim-service-rail-meta"],
    industries: ["home service", "auto", "beauty", "food", "pet", "wellness", "education"],
    archetypeIds: ["home-services", "automotive", "beauty-salon", "restaurant-hospitality", "friendly-local", "health-wellness", "education-tutoring"],
    description: "A richer rail for grouping multiple services by customer intent instead of repeating plain cards.",
    bestFor: ["service-heavy businesses", "offer sections that need rhythm and scan speed"],
    compositionRules: ["Group by customer need.", "Use compact metadata only when verified.", "Allow alternating emphasis for key services."],
    contentRules: ["Use 'Ask about...' for uncertain services.", "Do not invent package names or prices."],
    accessibilityRules: ["If interactive, use real buttons and aria-selected states.", "Otherwise use list/article markup."],
    avoid: ["horizontal overflow", "fake tabs", "unsupported service bundles"],
  },
  {
    id: "process-numbered-path",
    name: "Numbered path timeline",
    category: "process-timeline",
    cssClasses: ["seraphim-process-path", "seraphim-process-step", "seraphim-process-number"],
    industries: ["all"],
    archetypeIds: allArchetypeIds,
    description: "A clear, mobile-safe timeline for reducing uncertainty around first contact, quote, visit, booking, or purchase.",
    bestFor: ["how-it-works", "quote process", "booking expectations", "first-contact guidance"],
    compositionRules: ["Use three to five steps.", "Make customer involvement explicit.", "Keep connectors decorative and robust on mobile."],
    contentRules: ["No guaranteed timing, outcomes, or availability unless verified.", "Use conservative expectation language."],
    accessibilityRules: ["Use ordered list markup when possible.", "Do not rely on connector lines to communicate sequence."],
    avoid: ["fake instant booking/payment workflows", "overcomplicated timelines"],
  },
  {
    id: "process-split-checklist",
    name: "Split checklist process",
    category: "process-timeline",
    cssClasses: ["seraphim-process-checklist", "seraphim-check-row", "seraphim-check-mark"],
    industries: ["home service", "professional", "health", "education", "auto"],
    archetypeIds: ["home-services", "professional-services", "health-wellness", "education-tutoring", "automotive"],
    description: "A practical checklist showing what visitors should prepare before contacting.",
    bestFor: ["quote prep", "consultation prep", "appointment prep", "service request clarity"],
    compositionRules: ["Pair checklist with one supporting explanation panel.", "Use verified contact path nearby."],
    contentRules: ["Ask for scope, area, timing, photos, or questions without implying a live form if none exists."],
    accessibilityRules: ["Use list markup and visible labels.", "Keep check marks decorative."],
    avoid: ["fake submission flows", "overasking for personal information"],
  },
  {
    id: "faq-premium-accordion",
    name: "Premium FAQ accordion",
    category: "faq-block",
    cssClasses: ["seraphim-faq-list", "seraphim-faq-item", "seraphim-faq-answer"],
    industries: ["all"],
    archetypeIds: allArchetypeIds,
    description: "Accessible decision-support FAQ using native details/summary and carefully scoped answers.",
    bestFor: ["objection handling", "contact expectations", "availability/pricing unknowns"],
    compositionRules: ["Use four to six useful questions.", "Prioritize questions a real buyer would ask before contacting."],
    contentRules: ["Do not add trivial SEO questions.", "Use contact-to-confirm phrasing for missing facts."],
    accessibilityRules: ["Prefer native details/summary.", "Keep answer content in the DOM and keyboard accessible."],
    avoid: ["invented policies", "fake guarantees", "auto-rotating accordions"],
  },
  {
    id: "contact-action-strip",
    name: "Contact action strip",
    category: "contact-strip",
    cssClasses: ["seraphim-contact-strip", "seraphim-contact-action", "seraphim-contact-note"],
    industries: ["all"],
    archetypeIds: allArchetypeIds,
    description: "A compact strip with verified contact routes and one clear next step.",
    bestFor: ["hero proof bridge", "mid-page conversion", "sticky-ish mobile CTA support", "footer lead-in"],
    compositionRules: ["Use phone, email, WhatsApp, social, location, or directions only when verified.", "Make one action visually primary."],
    contentRules: ["No fake booking, payment, or form submission.", "Use 'Contact to confirm details' if needed."],
    accessibilityRules: ["Use real tel/mailto/https links when data exists.", "Maintain 44px tap targets."],
    avoid: ["empty buttons", "multiple equal CTAs", "unverified booking links"],
  },
  {
    id: "gallery-proof-frame",
    name: "Gallery proof frame",
    category: "gallery-frame",
    cssClasses: ["seraphim-gallery-frame", "seraphim-gallery-tile", "seraphim-gallery-caption"],
    industries: ["food", "auto", "beauty", "retail", "creative", "travel", "home service", "pet"],
    archetypeIds: ["restaurant-hospitality", "automotive", "beauty-salon", "ecommerce-retail", "creative-agency", "travel-tourism", "home-services", "friendly-local"],
    description: "A gallery/showcase primitive that can hold uploaded source imagery, CSS art, or labeled representative visuals.",
    bestFor: ["showcase sections", "visual proof", "representative media sections"],
    compositionRules: ["Use one strong lead tile and two to four supporting tiles.", "Use consistent aspect ratios and captions where needed."],
    contentRules: ["Label representative visuals.", "Do not fake portfolio work, before/after proof, customers, or facilities."],
    accessibilityRules: ["Provide useful alt text for informative images.", "Decorative CSS art should be aria-hidden."],
    avoid: ["unlabeled stock image walls", "broken image slots", "fake case-study visuals"],
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
    input.visualIdentity.imageEnergy,
    input.visualIdentity.industryCues.join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
}

function scorePrimitive(
  primitive: ComponentPrimitive,
  input: {
    cleanBusinessData: CleanBusinessLike;
    archetype: Archetype;
    visualIdentity: VisualIdentityProfile;
  },
) {
  const source = sourceText(input);
  let score = 0;
  if (primitive.archetypeIds.includes(input.archetype.id)) score += 10;
  if (primitive.industries.includes("all")) score += 4;
  score += primitive.industries.filter((industry) => source.includes(industry)).length * 4;
  if (primitive.category === "service-card" && (input.cleanBusinessData.services?.length ?? 0) >= 3) score += 3;
  if (primitive.category === "gallery-frame" && /\b(food|auto|beauty|retail|travel|creative|pet)\b/i.test(source)) score += 3;
  return score;
}

export function getComponentPrimitives() {
  return COMPONENT_PRIMITIVES;
}

export function recommendComponentPrimitives(input: {
  cleanBusinessData: CleanBusinessLike;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
}): ComponentPrimitiveRecommendation {
  const categories: ComponentPrimitiveCategory[] = [
    "hero-composition",
    "service-card",
    "process-timeline",
    "faq-block",
    "contact-strip",
    "gallery-frame",
  ];
  const selected = categories
    .map((category) =>
      COMPONENT_PRIMITIVES
        .filter((primitive) => primitive.category === category)
        .map((primitive) => ({ primitive, score: scorePrimitive(primitive, input) }))
        .sort((a, b) => b.score - a.score)
        .at(0)?.primitive,
    )
    .filter((primitive): primitive is ComponentPrimitive => Boolean(primitive));

  return {
    summary: `Recommended component primitives: ${selected.map((primitive) => primitive.name).join(", ")}.`,
    selectedPrimitiveIds: selected.map((primitive) => primitive.id),
    primitives: selected,
    cssClassNames: unique(selected.flatMap((primitive) => primitive.cssClasses.map((className) => `.${className}`))),
    usageRules: [
      "Use component primitives as premium Lego pieces, not fixed templates.",
      "A generated section may combine primitives, but each section should still have one clear conversion job.",
      "Do not repeat the same primitive rhythm across every section.",
      "Every primitive class used in HTML must be defined in embedded CSS or scoped section CSS.",
      "Primitive content must obey verified facts and photo-direction rules.",
    ],
    qaChecks: [
      "Hero, services, process/FAQ, contact, and gallery/showcase sections should use appropriate component primitives when those sections exist.",
      "Component primitive classes must be embedded CSS reliable.",
      "Primitives must not leak internal planning labels into visible copy.",
      "Primitives must vary section rhythm and avoid generic repeated card grids.",
    ],
  };
}
