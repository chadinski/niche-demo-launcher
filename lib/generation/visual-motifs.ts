import type { Archetype } from "@/lib/archetypes";
import { recommendIndustryAssetPacks, type IndustryAssetPackRecommendation } from "@/lib/generation/industry-asset-packs";
import type { VisualIdentityProfile } from "@/lib/generation/taste-profile";

export type PremiumVisualMotifCategory =
  | "svg-divider"
  | "texture-overlay"
  | "badge-system"
  | "section-frame"
  | "icon-treatment"
  | "cta-band"
  | "image-mask"
  | "proof-strip"
  | "service-rail";

export type PremiumVisualMotifPrimitive = {
  id: string;
  name: string;
  category: PremiumVisualMotifCategory;
  industries: string[];
  archetypeIds: string[];
  moodTags: string[];
  description: string;
  usage: string;
  sectionFit: string[];
  cssContract: string[];
  htmlHint: string;
  accessibilityNotes: string[];
  factualSafetyNotes: string[];
  avoidWhen: string[];
};

export type PremiumVisualMotifRecommendation = {
  summary: string;
  selectedPrimitiveIds: string[];
  primitives: PremiumVisualMotifPrimitive[];
  industryAssetPack: IndustryAssetPackRecommendation;
  requiredUsage: string[];
  rejectedDefaults: string[];
  cssContractNotes: string[];
  qaChecks: string[];
};

type CleanBusinessLike = {
  businessType?: string;
  services?: string[];
  products?: string[];
  visibleDescription?: string;
  brandTone?: string;
};

const motifLibrary: PremiumVisualMotifPrimitive[] = [
  {
    id: "divider-organic-wave",
    name: "Organic SVG wave divider",
    category: "svg-divider",
    industries: ["food", "restaurant", "hospitality", "pet", "beauty", "wellness"],
    archetypeIds: ["restaurant-hospitality", "friendly-local", "beauty-salon", "health-wellness", "travel-tourism"],
    moodTags: ["warm", "friendly", "sensory", "playful", "soft"],
    description: "A soft inline-SVG divider that lets warm and expressive brands move between sections without another plain rectangle.",
    usage: "Use between hero, offer, gallery, and CTA moments when the brand has warmth, movement, or hospitality energy.",
    sectionFit: ["hero", "showcase", "experience", "cta"],
    cssContract: [
      "Define .seraphim-divider-wave with block width, controlled height, and color via --seraphim-primary or --seraphim-accent.",
      "Keep the SVG decorative with aria-hidden when it does not convey information.",
    ],
    htmlHint: '<div class="seraphim-divider-wave" aria-hidden="true"><svg viewBox="0 0 1440 90" preserveAspectRatio="none">...</svg></div>',
    accessibilityNotes: ["Mark decorative dividers aria-hidden.", "Do not place important text inside divider SVGs."],
    factualSafetyNotes: ["Use as atmosphere only; do not imply place, awards, or verified venue details."],
    avoidWhen: ["The visual thesis requires sharp precision or serious professional restraint."],
  },
  {
    id: "divider-precision-angle",
    name: "Precision angled divider",
    category: "svg-divider",
    industries: ["automotive", "trades", "home service", "tech", "professional"],
    archetypeIds: ["automotive", "home-services", "tech-consulting", "saas-tech", "professional-services"],
    moodTags: ["precise", "kinetic", "sturdy", "technical"],
    description: "A crisp geometric divider for brands that should feel capable, engineered, or road-ready.",
    usage: "Use sparingly to separate high-intensity sections such as hero-to-service or proof-to-contact.",
    sectionFit: ["hero", "services", "process", "cta"],
    cssContract: [
      "Define .seraphim-divider-angle with clip-path or inline SVG polygon fallback.",
      "Use extracted brand colors rather than default slate unless no identity colors exist.",
    ],
    htmlHint: '<div class="seraphim-divider-angle" aria-hidden="true"></div>',
    accessibilityNotes: ["Keep the divider non-interactive.", "Ensure adjacent text contrast is not reduced by angled overlays."],
    factualSafetyNotes: ["Do not label the divider as certification, warranty, or performance proof."],
    avoidWhen: ["The brand is soft, calm, child-friendly, or hospitality-led."],
  },
  {
    id: "texture-tactile-grain",
    name: "Tactile grain overlay",
    category: "texture-overlay",
    industries: ["food", "restaurant", "beauty", "retail", "creative", "hospitality"],
    archetypeIds: ["restaurant-hospitality", "beauty-salon", "ecommerce-retail", "creative-agency", "travel-tourism"],
    moodTags: ["tactile", "warm", "editorial", "handmade", "sensory"],
    description: "A subtle CSS-only grain or radial texture layer that makes flat blocks feel photographed, tactile, and premium.",
    usage: "Use on hero surfaces, CTA bands, or gallery backgrounds at low opacity so readability remains excellent.",
    sectionFit: ["hero", "gallery", "cta", "footer"],
    cssContract: [
      "Define .seraphim-texture-grain::before with pointer-events:none and opacity below .18.",
      "Use layered radial gradients or data-free CSS textures; do not rely on external texture files.",
    ],
    htmlHint: '<section class="seraphim-section seraphim-texture-grain">...</section>',
    accessibilityNotes: ["Never reduce text contrast below readable levels.", "Disable heavy texture effects in print if needed."],
    factualSafetyNotes: ["Texture is decorative; do not use it as a substitute for verified product photography."],
    avoidWhen: ["Clinical, legal, financial, or highly minimal brands where texture would reduce trust."],
  },
  {
    id: "texture-blueprint-grid",
    name: "Blueprint service grid overlay",
    category: "texture-overlay",
    industries: ["trades", "home service", "automotive", "tech", "real estate"],
    archetypeIds: ["home-services", "automotive", "tech-consulting", "saas-tech", "real-estate"],
    moodTags: ["practical", "technical", "structured", "capable"],
    description: "A restrained CSS grid/measurement texture for service businesses that need practical competence rather than corporate polish.",
    usage: "Use behind process, service area, and quote sections to suggest planning, coverage, and readiness.",
    sectionFit: ["services", "process", "service-area", "contact"],
    cssContract: [
      "Define .seraphim-texture-blueprint with linear-gradient grid lines using color-mix and low alpha.",
      "Keep the grid aligned to the spacing scale and never let it overpower content.",
    ],
    htmlHint: '<div class="seraphim-panel seraphim-texture-blueprint">...</div>',
    accessibilityNotes: ["Use as a background only.", "Keep forms and links on solid or high-contrast surfaces."],
    factualSafetyNotes: ["Do not imply licensing, engineering credentials, or certified plans unless verified."],
    avoidWhen: ["Food, beauty, pet, and hospitality brands where warmth matters more than technical planning."],
  },
  {
    id: "badge-verified-facts",
    name: "Verified fact badge system",
    category: "badge-system",
    industries: ["all"],
    archetypeIds: [
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
    ],
    moodTags: ["credible", "honest", "local", "clear"],
    description: "A compact badge style for verified facts such as location, contact methods, service categories, or social profile availability.",
    usage: "Use near the hero or contact path to show real, verified business facts without inventing proof.",
    sectionFit: ["hero", "trust", "contact", "service-area"],
    cssContract: [
      "Define .seraphim-fact-badge with readable contrast, inline-flex alignment, and clear focus styles if linked.",
      "Support a .seraphim-fact-badge[data-tone] variant for warm, dark, outline, or accent contexts.",
    ],
    htmlHint: '<span class="seraphim-fact-badge">Kingston, Jamaica</span>',
    accessibilityNotes: ["Use text labels, not icon-only badges.", "If linked, make badges at least 44px tall on mobile."],
    factualSafetyNotes: ["Only put verified facts in badges.", "Never badge fake ratings, awards, years, or guarantees."],
    avoidWhen: ["There are no verified short facts; use a conservative note instead."],
  },
  {
    id: "frame-editorial-offset",
    name: "Editorial offset section frame",
    category: "section-frame",
    industries: ["beauty", "food", "restaurant", "creative", "retail", "hospitality"],
    archetypeIds: ["beauty-salon", "restaurant-hospitality", "creative-agency", "ecommerce-retail", "travel-tourism"],
    moodTags: ["editorial", "premium", "expressive", "visual"],
    description: "A layered frame with offset borders and asymmetric spacing for an editorial custom-site feel.",
    usage: "Use around the strongest image, showcase, signature service, or visual story block.",
    sectionFit: ["hero", "showcase", "gallery", "signature-service"],
    cssContract: [
      "Define .seraphim-frame-offset and ::after border layer using --seraphim-accent.",
      "Use aspect-ratio on media to prevent layout shift.",
    ],
    htmlHint: '<figure class="seraphim-frame-offset seraphim-image-frame">...</figure>',
    accessibilityNotes: ["Keep captions text-based and readable.", "Do not put essential text only in the frame decoration."],
    factualSafetyNotes: ["Representative visuals must be labeled if they are not verified business photography."],
    avoidWhen: ["The site has no visual asset or representative composition to frame."],
  },
  {
    id: "frame-rugged-utility",
    name: "Rugged utility section frame",
    category: "section-frame",
    industries: ["trades", "home service", "automotive"],
    archetypeIds: ["home-services", "automotive"],
    moodTags: ["sturdy", "direct", "capable", "local"],
    description: "A stronger frame language for trades and auto pages: squared rhythm, bold headers, service-ready panels.",
    usage: "Use for service rails, process panels, quote-prep blocks, and service-area maps.",
    sectionFit: ["services", "process", "service-area", "contact"],
    cssContract: [
      "Define .seraphim-frame-utility with sturdy border, low shadow, and accent corner marker.",
      "Avoid fragile glassmorphism; use solid surfaces and practical spacing.",
    ],
    htmlHint: '<div class="seraphim-frame-utility">...</div>',
    accessibilityNotes: ["Ensure strong contrast for labels and service lists.", "Keep mobile stacking clear and tap-friendly."],
    factualSafetyNotes: ["Do not imply emergency service, licensing, insurance, or warranty unless verified."],
    avoidWhen: ["Luxury beauty, wellness, or fine dining brands where the frame would feel too utilitarian."],
  },
  {
    id: "icon-contained-line",
    name: "Contained line icon treatment",
    category: "icon-treatment",
    industries: ["all"],
    archetypeIds: [
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
    ],
    moodTags: ["consistent", "scannable", "premium", "restrained"],
    description: "A coherent icon container treatment using one stroke style and one optical size across service and proof items.",
    usage: "Use for scanning services, process steps, and contact methods when icons clarify meaning.",
    sectionFit: ["services", "process", "proof", "contact", "faq"],
    cssContract: [
      "Define .seraphim-icon-mark with fixed size, border-radius tied to brand shape, and currentColor SVG support.",
      "Use inline SVG icons with aria-hidden plus adjacent text labels.",
    ],
    htmlHint: '<span class="seraphim-icon-mark" aria-hidden="true"><svg viewBox="0 0 24 24">...</svg></span>',
    accessibilityNotes: ["Pair unfamiliar icons with visible text.", "Do not use emoji as the main icon system."],
    factualSafetyNotes: ["Icons must represent verified services or general actions only."],
    avoidWhen: ["A section is already visually dense and icons would become decoration."],
  },
  {
    id: "cta-ribbon-band",
    name: "High-conversion ribbon CTA band",
    category: "cta-band",
    industries: ["all"],
    archetypeIds: [
      "friendly-local",
      "restaurant-hospitality",
      "health-wellness",
      "automotive",
      "home-services",
      "beauty-salon",
      "professional-services",
      "creative-agency",
    ],
    moodTags: ["decisive", "conversion", "polished", "clear"],
    description: "A distinct CTA band with one clear action, one reassurance, and a brand-specific surface.",
    usage: "Use after meaningful persuasion, not as a generic filler banner.",
    sectionFit: ["mid-page-cta", "closing-cta", "contact"],
    cssContract: [
      "Define .seraphim-cta-band with strong background, responsive grid, button hierarchy, and mobile-safe padding.",
      "Use one primary CTA and at most one secondary action.",
    ],
    htmlHint: '<section class="seraphim-section seraphim-cta-band">...</section>',
    accessibilityNotes: ["Make CTA links descriptive and keyboard-visible.", "Keep tap targets at least 44px."],
    factualSafetyNotes: ["No fake urgency, discounts, guarantees, or availability claims."],
    avoidWhen: ["The preceding section already ends with a strong contact block and another band would feel repetitive."],
  },
  {
    id: "mask-arched-window",
    name: "Arched image mask",
    category: "image-mask",
    industries: ["restaurant", "hospitality", "beauty", "wellness", "retail", "pet"],
    archetypeIds: ["restaurant-hospitality", "beauty-salon", "health-wellness", "ecommerce-retail", "friendly-local", "travel-tourism"],
    moodTags: ["warm", "boutique", "premium", "welcoming"],
    description: "An arched image or CSS-art mask that gives photography and representative compositions a warmer, more memorable shape.",
    usage: "Use for hero or showcase imagery when the brand is welcoming, tactile, or boutique.",
    sectionFit: ["hero", "showcase", "about", "gallery"],
    cssContract: [
      "Define .seraphim-mask-arch with border-radius: 999px 999px var(--seraphim-radius-xl) var(--seraphim-radius-xl).",
      "Set overflow:hidden, aspect-ratio, and object-fit for layout stability.",
    ],
    htmlHint: '<figure class="seraphim-image-frame seraphim-mask-arch">...</figure>',
    accessibilityNotes: ["Images need accurate alt text or empty alt when decorative.", "Important image subjects must not crop awkwardly on mobile."],
    factualSafetyNotes: ["Representative images must not imply actual staff, customers, or facilities."],
    avoidWhen: ["Precision, legal, and technical brands where an arch conflicts with the mood."],
  },
  {
    id: "mask-diagonal-crop",
    name: "Diagonal performance crop",
    category: "image-mask",
    industries: ["automotive", "trades", "fitness", "tech"],
    archetypeIds: ["automotive", "home-services", "fitness-sports", "tech-consulting", "saas-tech"],
    moodTags: ["kinetic", "precise", "bold", "active"],
    description: "A diagonal or clipped image treatment for movement, service momentum, and premium performance energy.",
    usage: "Use in hero or proof visuals for automotive, trades, fitness, or technology pages that need momentum.",
    sectionFit: ["hero", "showcase", "process", "proof"],
    cssContract: [
      "Define .seraphim-mask-diagonal using clip-path with a border-radius fallback.",
      "Keep text outside clipped media and ensure the crop does not hide key subjects.",
    ],
    htmlHint: '<figure class="seraphim-image-frame seraphim-mask-diagonal">...</figure>',
    accessibilityNotes: ["Do not clip meaningful text.", "Keep reduced-motion users unaffected."],
    factualSafetyNotes: ["Do not imply racing, emergency speed, or guaranteed turnaround unless verified."],
    avoidWhen: ["Soft care, pet, wellness, or restaurant brands where diagonal aggression feels wrong."],
  },
  {
    id: "proof-strip-verified",
    name: "Verified proof strip",
    category: "proof-strip",
    industries: ["all"],
    archetypeIds: [
      "friendly-local",
      "professional-services",
      "restaurant-hospitality",
      "health-wellness",
      "automotive",
      "home-services",
      "beauty-salon",
      "ecommerce-retail",
      "travel-tourism",
    ],
    moodTags: ["credible", "compact", "honest", "conversion"],
    description: "A horizontal or stacked proof strip made only from verified facts: location, contact, service area, social link, or visible service categories.",
    usage: "Use near hero and contact sections to replace fake review strips with honest, useful confidence signals.",
    sectionFit: ["hero", "trust", "contact", "footer"],
    cssContract: [
      "Define .seraphim-proof-strip with responsive wrapping, separators, and no marquee animation unless real logos exist.",
      "Define .seraphim-proof-strip strong and span text hierarchy.",
    ],
    htmlHint: '<ul class="seraphim-proof-strip"><li><strong>Service area</strong><span>Kingston</span></li></ul>',
    accessibilityNotes: ["Use list markup for grouped proof items.", "Keep separators decorative and not read as content."],
    factualSafetyNotes: ["Never include fake ratings, review counts, awards, certifications, or customer counts."],
    avoidWhen: ["There are fewer than two verified facts; use a single fact badge instead."],
  },
  {
    id: "service-rail-intent",
    name: "Customer-intent service rail",
    category: "service-rail",
    industries: ["trades", "home service", "automotive", "food", "beauty", "pet", "wellness"],
    archetypeIds: ["home-services", "automotive", "restaurant-hospitality", "beauty-salon", "friendly-local", "health-wellness"],
    moodTags: ["scannable", "specific", "conversion", "practical"],
    description: "A side rail or horizontal rail grouping services around customer intent instead of generic identical cards.",
    usage: "Use for service-heavy businesses to create richer rhythm and reduce repeated three-card grids.",
    sectionFit: ["services", "process", "offer", "service-area"],
    cssContract: [
      "Define .seraphim-service-rail, .seraphim-service-rail-item, and active/focus states if interactive.",
      "Use CSS grid with minmax(0,1fr), stable wrapping, and no horizontal scrolling on mobile.",
    ],
    htmlHint: '<div class="seraphim-service-rail"><article class="seraphim-service-rail-item">...</article></div>',
    accessibilityNotes: ["Use articles or list items with clear headings.", "If tabbed, use real buttons and aria-selected states."],
    factualSafetyNotes: ["Only list verified services or safe ask-about categories."],
    avoidWhen: ["The business has too few services to justify a rail."],
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
    input.visualIdentity.typographyFeel,
    input.visualIdentity.imageEnergy,
    input.visualIdentity.industryCues.join(" "),
    input.visualIdentity.dominantAccents.join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
}

function scoreMotif(
  motif: PremiumVisualMotifPrimitive,
  input: {
    cleanBusinessData: CleanBusinessLike;
    archetype: Archetype;
    visualIdentity: VisualIdentityProfile;
  },
) {
  const source = sourceText(input);
  let score = 0;
  if (motif.archetypeIds.includes(input.archetype.id)) score += 8;
  if (motif.industries.includes("all")) score += 4;
  score += motif.industries.filter((industry) => source.includes(industry)).length * 4;
  score += motif.moodTags.filter((tag) => source.includes(tag)).length * 2;
  score += motif.sectionFit.some((section) => source.includes(section)) ? 1 : 0;
  if (motif.avoidWhen.some((avoid) => source.includes(avoid.toLowerCase()))) score -= 4;
  return score;
}

function topByCategory(
  category: PremiumVisualMotifCategory,
  input: {
    cleanBusinessData: CleanBusinessLike;
    archetype: Archetype;
    visualIdentity: VisualIdentityProfile;
  },
) {
  return motifLibrary
    .filter((motif) => motif.category === category)
    .map((motif) => ({ motif, score: scoreMotif(motif, input) }))
    .sort((a, b) => b.score - a.score)
    .at(0)?.motif;
}

export function getPremiumVisualMotifLibrary() {
  return motifLibrary;
}

export function recommendPremiumVisualMotifs(input: {
  cleanBusinessData: CleanBusinessLike;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
}): PremiumVisualMotifRecommendation {
  const categories: PremiumVisualMotifCategory[] = [
    "badge-system",
    "proof-strip",
    "cta-band",
    "service-rail",
    "section-frame",
    "texture-overlay",
    "image-mask",
    "icon-treatment",
    "svg-divider",
  ];
  const source = sourceText(input);
  const expressive = /\b(food|restaurant|pet|beauty|salon|wellness|home service|trades|automotive|hospitality|retail|creative)\b/i.test(source);
  const industryAssetPack = recommendIndustryAssetPacks(input);
  const selected = unique(
    categories
      .map((category) => topByCategory(category, input)?.id ?? "")
      .filter(Boolean),
  )
    .map((id) => motifLibrary.find((motif) => motif.id === id))
    .filter((motif): motif is PremiumVisualMotifPrimitive => Boolean(motif))
    .slice(0, expressive ? 7 : 5);

  const selectedIds = selected.map((motif) => motif.id);
  const requiredUsage = [
    `Follow the selected industry asset pack: ${industryAssetPack.primaryPack.name}.`,
    "Use these primitives as reusable CSS/HTML vocabulary, not as full templates or fixed page layouts.",
    "The Design System Contract must define embedded CSS for selected motif classes before section HTML uses them.",
    "Every generated section should use at least one relevant motif when it improves clarity, proof, visual rhythm, or conversion.",
    "Motifs must adapt to the Creative Contract, extracted colors, logo mood, and archetype; they must not override verified identity.",
    ...industryAssetPack.requiredApplications,
  ];
  const rejectedDefaults = [
    "plain centered heading plus three generic cards repeated across sections",
    "blue-gray corporate surfaces for expressive local niches",
    "fake testimonial/rating/award badge systems",
    "empty image frames, placeholder photo services, or local-only image paths",
    "decorative SVGs that hide content, reduce contrast, or imply unverifiable facts",
  ];
  const cssContractNotes = unique([
    ...selected.flatMap((motif) => motif.cssContract),
    ...industryAssetPack.cssContractNotes.map((className) => `Provide embedded CSS for asset-pack primitive ${className} when used.`),
  ]);
  const qaChecks = [
    "At least three selected visual motif primitives should appear in the final HTML/CSS when the business has enough content.",
    "Selected motif classes must be defined in embedded CSS; no dead Tailwind-only or motif-only class names.",
    "Proof strips and badge systems must contain verified facts only.",
    "Service rails must list verified services or clearly safe ask-about categories only.",
    "Image masks and frames must use reliable media, inline SVG/CSS art, or verified uploaded imagery.",
    ...industryAssetPack.qaChecks,
  ];

  return {
    summary: `Recommended ${selected.length} premium visual primitives for ${input.archetype.name}: ${selected.map((motif) => motif.name).join(", ")}. ${industryAssetPack.summary}`,
    selectedPrimitiveIds: selectedIds,
    primitives: selected,
    industryAssetPack,
    requiredUsage,
    rejectedDefaults,
    cssContractNotes,
    qaChecks,
  };
}
