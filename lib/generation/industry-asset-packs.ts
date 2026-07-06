import type { Archetype } from "@/lib/archetypes";
import {
  recommendComponentPrimitives,
  type ComponentPrimitiveRecommendation,
} from "@/lib/generation/component-primitives";
import {
  recommendPhotoDirection,
  type PhotoDirectionRecommendation,
} from "@/lib/generation/photo-direction";
import {
  recommendTextureBackgroundTokens,
  type TextureBackgroundTokenRecommendation,
} from "@/lib/generation/texture-background-tokens";
import type { VisualIdentityProfile } from "@/lib/generation/taste-profile";

export type IndustryAssetPack = {
  id: string;
  name: string;
  industries: string[];
  archetypeIds: string[];
  visualThesis: string;
  textureSystem: string[];
  motifSystem: string[];
  frameSystem: string[];
  iconSystem: string[];
  imageDirection: string[];
  sectionApplications: Array<{
    section: string;
    treatment: string;
  }>;
  cssPrimitives: string[];
  copyTone: string[];
  avoid: string[];
  factualSafety: string[];
};

export type IndustryAssetPackRecommendation = {
  primaryPack: IndustryAssetPack;
  supportingPacks: IndustryAssetPack[];
  textureBackgroundTokens: TextureBackgroundTokenRecommendation;
  photoDirection: PhotoDirectionRecommendation;
  componentPrimitives: ComponentPrimitiveRecommendation;
  summary: string;
  requiredApplications: string[];
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

export const INDUSTRY_ASSET_PACKS: IndustryAssetPack[] = [
  {
    id: "food-hospitality-sensory",
    name: "Food and hospitality sensory pack",
    industries: ["food", "restaurant", "cafe", "kitchen", "grill", "bakery", "catering", "dining", "hospitality"],
    archetypeIds: ["restaurant-hospitality", "travel-tourism"],
    visualThesis: "Warm appetite-first composition with tactile surfaces, plate/menu rhythm, local atmosphere, and fast call/order/visit clarity.",
    textureSystem: [
      "warm paper texture using low-opacity radial grain and cream-tinted surfaces",
      "subtle char, spice, steam, or table-shadow overlays created with CSS gradients",
      "sun-washed hospitality backgrounds that use extracted warm colors instead of default slate",
    ],
    motifSystem: [
      "menu card frames with clipped corners, small price-free item rows, and verified category labels",
      "spice scatter or plate-ring SVG accents used decoratively around hero/showcase moments",
      "service occasion chips such as lunch, dinner, catering, or call-to-confirm only when supplied or safely phrased",
    ],
    frameSystem: [
      "arched or rounded food photography masks",
      "offset menu-card borders that feel printed, not corporate",
      "gallery tiles with consistent crops and honest representative-image captions",
    ],
    iconSystem: [
      "single-line utensil, plate, location, phone, and social icons in contained warm badges",
      "no emoji food icons as the main visual system",
    ],
    imageDirection: [
      "prioritize supplied food/profile images; use the uploaded screenshot as proof when available",
      "representative imagery should show cuisine texture, plate close-ups, counter details, or atmosphere without implying actual staff",
      "avoid generic fine-dining photography for casual local restaurants unless the brand supports it",
    ],
    sectionApplications: [
      { section: "hero", treatment: "large appetite/media composition, warm texture, verified fact badges, one call/order/visit CTA" },
      { section: "services", treatment: "menu-card rail grouped by meal occasion or visible offer categories without invented menu items or prices" },
      { section: "showcase", treatment: "plate/gallery frame with captioned representative or uploaded imagery" },
      { section: "cta", treatment: "warm ribbon CTA band with phone/location reassurance" },
    ],
    cssPrimitives: [
      ".seraphim-texture-grain",
      ".seraphim-menu-card",
      ".seraphim-plate-ring",
      ".seraphim-mask-arch",
      ".seraphim-divider-wave",
    ],
    copyTone: [
      "sensory but factual",
      "local and welcoming",
      "specific about cuisine, location, and how to contact",
    ],
    avoid: [
      "invented menu items, prices, delivery, reservations, reviews, hours, or chef claims",
      "generic SaaS hero language",
      "cold blue-gray corporate sections",
    ],
    factualSafety: [
      "Use 'Call to confirm today's menu' when menu details are missing.",
      "Label representative food imagery honestly when it is not supplied by the business.",
    ],
  },
  {
    id: "automotive-gloss-performance",
    name: "Automotive gloss and performance pack",
    industries: ["auto", "automotive", "detailing", "mechanic", "garage", "car wash", "vehicle", "tire", "tyre"],
    archetypeIds: ["automotive"],
    visualThesis: "Glossy precision with reflective panels, diagonal motion, service confidence, and direct quote/call conversion.",
    textureSystem: [
      "soft gloss highlights using diagonal linear gradients and controlled specular bands",
      "dark metallic panel surfaces with extracted accent color glints",
      "subtle speed-line overlays for movement without implying racing or guaranteed speed",
    ],
    motifSystem: [
      "finish panels for detailing or car wash businesses",
      "diagnostic/service rails for repair, tire, or mechanic businesses",
      "road-line dividers and metallic proof strips for contact/service-area facts",
    ],
    frameSystem: [
      "diagonal image masks for vehicle/action imagery",
      "metallic cards with sharp alignment, thin borders, and restrained highlights",
      "before/after frames only when images are real or clearly representative",
    ],
    iconSystem: [
      "consistent line icons for vehicle, tire, wash, wrench, calendar, phone, and location",
      "icons should be technical and sharp, not playful",
    ],
    imageDirection: [
      "use vehicle close-ups, paint reflections, wheels, tools, workshop details, or road-ready compositions",
      "avoid stock imagery that implies a facility, employees, certifications, or brand partnerships not verified",
    ],
    sectionApplications: [
      { section: "hero", treatment: "cinematic dark or high-contrast hero with gloss highlight, diagonal crop, and call/quote CTA" },
      { section: "services", treatment: "service rail grouped by customer need: clean, repair, protect, inspect, replace, or ask-about" },
      { section: "process", treatment: "precision timeline with durable panels and clear next-step expectations" },
      { section: "proof", treatment: "verified contact/service facts in a metallic proof strip, no fake rating badges" },
    ],
    cssPrimitives: [
      ".seraphim-metal-panel",
      ".seraphim-gloss-sweep",
      ".seraphim-speed-lines",
      ".seraphim-mask-diagonal",
      ".seraphim-divider-angle",
    ],
    copyTone: [
      "precise, confident, and direct",
      "focused on pride of ownership, safety, finish, or convenience based on verified service type",
    ],
    avoid: [
      "fake warranties, certifications, emergency claims, turnaround promises, racing language, or review counts",
      "soft boutique shapes that dilute automotive precision",
    ],
    factualSafety: [
      "Use quote/contact language when pricing, warranties, or booking are unknown.",
      "Do not imply brand authorization or certified service without verified proof.",
    ],
  },
  {
    id: "pet-friendly-care",
    name: "Pet friendly care pack",
    industries: ["pet", "grooming", "animal", "pet store", "veterinary", "pet care"],
    archetypeIds: ["friendly-local", "health-wellness"],
    visualThesis: "Soft trust and playful clarity with rounded shapes, warm proof, comfort-led service grouping, and easy call/contact actions.",
    textureSystem: [
      "soft blob backgrounds in extracted playful colors",
      "gentle dotted texture inspired by paws or playful movement",
      "light cream or sky-tinted surfaces that keep pet care readable and cheerful",
    ],
    motifSystem: [
      "rounded paw motifs as decorative SVG marks",
      "playful badges for verified service categories, location, and contact options",
      "comfort cards that explain grooming, supplies, travel, protection, or ask-about services safely",
    ],
    frameSystem: [
      "rounded image bubbles and arched frames",
      "soft proof strips with pill separators",
      "friendly service cards with generous radius and clear text labels",
    ],
    iconSystem: [
      "rounded line icons for paw, leash, grooming, carrier, phone, location, and care",
      "avoid mixed emoji/icon systems",
    ],
    imageDirection: [
      "use supplied pet logo/profile imagery first",
      "representative pet imagery must not imply actual customers, medical outcomes, or staff",
      "use cheerful animal/object compositions over fake testimonial portraits",
    ],
    sectionApplications: [
      { section: "hero", treatment: "friendly rounded hero with paw/blob accents, verified fact badges, and one call/message CTA" },
      { section: "services", treatment: "rounded service rail grouped by owner intent: protect, groom, travel, shop, ask-about" },
      { section: "trust", treatment: "gentle proof strip built from location, category, phone, and social link only" },
      { section: "faq", treatment: "calm details cards answering preparation and contact questions without medical claims" },
    ],
    cssPrimitives: [
      ".seraphim-paw-mark",
      ".seraphim-soft-blob",
      ".seraphim-fact-badge",
      ".seraphim-proof-strip",
      ".seraphim-mask-arch",
    ],
    copyTone: [
      "warm, reassuring, and plainspoken",
      "owner-centered rather than cute for its own sake",
    ],
    avoid: [
      "fake veterinarian claims, health guarantees, reviews, staff names, or customer stories",
      "overly corporate language",
    ],
    factualSafety: [
      "Phrase unknown services as 'Ask about current availability.'",
      "Do not imply medical care unless the business data verifies it.",
    ],
  },
  {
    id: "home-services-utility",
    name: "Home services utility pack",
    industries: ["home service", "in-home", "handy", "plumbing", "electrical", "painting", "cleaning", "locksmith", "repair", "contractor", "hvac", "roofing"],
    archetypeIds: ["home-services"],
    visualThesis: "Practical neighborhood competence with sturdy geometric panels, service-area clarity, tool-led scanning, and quote-ready contact flow.",
    textureSystem: [
      "blueprint or measurement grid overlay for process/service-area sections",
      "durable neutral surfaces with accent corner markers",
      "subtle map-line or route-line backgrounds for service coverage",
    ],
    motifSystem: [
      "tool icons for verified service categories",
      "service-area map panels made from CSS lines and location chips rather than fake maps",
      "quote-prep checklists that request scope/location/timing without pretending a form is live",
    ],
    frameSystem: [
      "rugged utility panels with squared rhythm and accent bars",
      "service rails grouped by household problem or job type",
      "sticky-looking contact blocks for phone/WhatsApp/email when verified",
    ],
    iconSystem: [
      "single-stroke tool, house, wrench, bolt, brush, lock, phone, map, and message icons",
      "icons should be sturdy, consistent, and paired with labels",
    ],
    imageDirection: [
      "use tools, materials, finished work, job-site details, or the supplied screenshot/logo",
      "avoid implying licensed, insured, emergency, same-day, or guaranteed service without proof",
    ],
    sectionApplications: [
      { section: "hero", treatment: "direct service promise, local badges, tool/house visual motif, and call/WhatsApp CTA" },
      { section: "services", treatment: "customer-intent rail: fix, install, clean, paint, unlock, ask-about" },
      { section: "service-area", treatment: "CSS map-panel with verified place chips and contact route" },
      { section: "process", treatment: "sturdy three or four step quote path: describe job, confirm area, arrange visit/contact" },
    ],
    cssPrimitives: [
      ".seraphim-texture-blueprint",
      ".seraphim-frame-utility",
      ".seraphim-service-rail",
      ".seraphim-map-panel",
      ".seraphim-tool-icon",
    ],
    copyTone: [
      "clear, local, helpful, and action-oriented",
      "more practical than luxury corporate",
    ],
    avoid: [
      "professional-services tone unless the source is actually a professional firm",
      "fake licenses, guarantees, emergency availability, or project counts",
    ],
    factualSafety: [
      "Only list verified services or safe ask-about categories.",
      "Use verified service areas exactly; do not add nearby cities without support.",
    ],
  },
  {
    id: "beauty-editorial-soft",
    name: "Beauty editorial soft pack",
    industries: ["beauty", "salon", "spa", "barber", "nails", "lashes", "makeup", "esthetician", "hair"],
    archetypeIds: ["beauty-salon"],
    visualThesis: "Editorial confidence with soft gradients, mirror/card motifs, tactile frames, and booking-forward elegance.",
    textureSystem: [
      "soft blush, pearl, champagne, or brand-color gradients with restrained contrast",
      "subtle sheen overlays that suggest mirrors, glass, or polished product surfaces",
      "gentle grain for editorial warmth without dusty vintage effects",
    ],
    motifSystem: [
      "mirror card motifs for services, transformation education, or booking steps",
      "signature-style editorial frames around visual proof or representative imagery",
      "soft badge system for location, social profile, and booking/contact methods",
    ],
    frameSystem: [
      "offset editorial frames and arched masks",
      "stacked service cards with refined spacing and tactile borders",
      "CTA bands that feel like a salon appointment card, not a SaaS banner",
    ],
    iconSystem: [
      "thin-line sparkle, mirror, brush, scissors, calendar, phone, and location icons",
      "icons must stay restrained and label-supported",
    ],
    imageDirection: [
      "use real portfolio/work images when supplied",
      "representative visuals should focus on texture, tools, products, or atmosphere rather than fake clients",
      "avoid before/after or transformation claims unless supplied",
    ],
    sectionApplications: [
      { section: "hero", treatment: "editorial split with mirror/card motif, soft gradient, and booking/contact CTA" },
      { section: "services", treatment: "refined service menu cards grouped by treatment type, without invented prices" },
      { section: "showcase", treatment: "gallery or editorial frame with representative-image labels when needed" },
      { section: "cta", treatment: "appointment-card style CTA with one clear next step" },
    ],
    cssPrimitives: [
      ".seraphim-soft-gradient",
      ".seraphim-mirror-card",
      ".seraphim-frame-offset",
      ".seraphim-mask-arch",
      ".seraphim-cta-band",
    ],
    copyTone: [
      "confident, sensory, and refined",
      "focused on readiness to book or ask about availability",
    ],
    avoid: [
      "fake transformations, client names, review quotes, celebrity claims, prices, or availability",
      "hard automotive/trades geometry",
    ],
    factualSafety: [
      "Use 'Ask about current services and availability' when service menu is incomplete.",
      "Do not imply medical or cosmetic outcomes unless verified.",
    ],
  },
  {
    id: "health-wellness-calm",
    name: "Health and wellness calm pack",
    industries: ["health", "wellness", "clinic", "dental", "therapy", "medical", "care", "massage", "counseling"],
    archetypeIds: ["health-wellness"],
    visualThesis: "Calm authority with soft clinical clarity, generous reading space, preparation guidance, and conservative trust language.",
    textureSystem: [
      "clean ambient gradients in muted blue, green, cream, or extracted wellness colors",
      "subtle contour or breathing-line backgrounds that remain calm and readable",
    ],
    motifSystem: [
      "care-path cards for preparation and next steps",
      "gentle proof strips using verified location/contact/service facts only",
      "quiet FAQ accordions for decision support",
    ],
    frameSystem: [
      "soft rectangular frames with restrained shadow",
      "calm split layouts with plenty of line length control",
    ],
    iconSystem: [
      "gentle line icons for care, appointment, phone, location, preparation, and questions",
    ],
    imageDirection: [
      "use facility, product, calm environment, or abstract care imagery without implying actual clinicians or outcomes",
      "avoid stock patient faces if they imply treatment relationships",
    ],
    sectionApplications: [
      { section: "hero", treatment: "quiet hero with clear service/audience/location and low-stress contact CTA" },
      { section: "services", treatment: "care options grouped by verified service type or ask-about language" },
      { section: "process", treatment: "preparation and what-to-expect panels" },
      { section: "faq", treatment: "accessible decision-support details" },
    ],
    cssPrimitives: [".seraphim-care-path", ".seraphim-soft-gradient", ".seraphim-proof-strip", ".seraphim-faq-list"],
    copyTone: ["calm, conservative, supportive, and precise"],
    avoid: ["medical outcomes, credentials, diagnoses, guarantees, reviews, or emergency claims unless verified"],
    factualSafety: ["All health-adjacent claims must be conservative and based on supplied facts."],
  },
  {
    id: "retail-boutique-product",
    name: "Retail and boutique product pack",
    industries: ["retail", "shop", "store", "boutique", "ecommerce", "product", "market"],
    archetypeIds: ["ecommerce-retail"],
    visualThesis: "Curated product confidence with shelf/gallery rhythm, tactile product cards, and clear shop/contact next steps.",
    textureSystem: ["paper, fabric, shelf, or product-surface inspired CSS texture based on brand mood"],
    motifSystem: ["collection chips", "product shelf rails", "editorial product frames", "verified stock/contact badges"],
    frameSystem: ["clean product cards with consistent crops", "wide shelf rows", "boutique editorial feature panels"],
    iconSystem: ["bag, tag, product, location, phone, social, and delivery icons only when verified"],
    imageDirection: ["use product or storefront imagery first; avoid fake product claims or invented inventory"],
    sectionApplications: [
      { section: "hero", treatment: "product/category-led hero with clear shopping/contact action" },
      { section: "services", treatment: "collection or category rail with verified product categories" },
      { section: "showcase", treatment: "gallery/shelf grid with honest labels" },
    ],
    cssPrimitives: [".seraphim-product-shelf", ".seraphim-frame-offset", ".seraphim-fact-badge"],
    copyTone: ["curated, concrete, and purchase-aware"],
    avoid: ["fake prices, availability, shipping, discounts, reviews, or inventory counts"],
    factualSafety: ["Use 'Ask about current availability' for stock details."],
  },
  {
    id: "travel-tourism-atmosphere",
    name: "Travel and tourism atmosphere pack",
    industries: ["travel", "tour", "tourism", "hotel", "villa", "resort", "airbnb", "hospitality", "adventure"],
    archetypeIds: ["travel-tourism", "restaurant-hospitality"],
    visualThesis: "Place-led atmosphere with scenic layers, itinerary rhythm, and booking/contact clarity without fake availability.",
    textureSystem: ["sun, map, wave, terrain, or paper-ticket inspired CSS overlays"],
    motifSystem: ["route lines", "destination chips", "itinerary cards", "scenic CTA bands"],
    frameSystem: ["wide cinematic image frames", "postcard cards", "map-inspired service-area panels"],
    iconSystem: ["map, pin, calendar, phone, route, and stay/activity icons"],
    imageDirection: ["use supplied place images or broad scenic representative imagery without implying owned property/facilities"],
    sectionApplications: [
      { section: "hero", treatment: "cinematic place-first hero with booking/contact CTA" },
      { section: "process", treatment: "itinerary or what-to-expect cards" },
      { section: "contact", treatment: "destination/contact proof strip" },
    ],
    cssPrimitives: [".seraphim-route-line", ".seraphim-postcard", ".seraphim-cta-band", ".seraphim-divider-wave"],
    copyTone: ["inviting, atmospheric, and specific to place"],
    avoid: ["fake availability, prices, ratings, room counts, amenities, or guarantees"],
    factualSafety: ["Use contact-to-confirm phrasing for schedule, amenities, and rates."],
  },
  {
    id: "fitness-sports-energy",
    name: "Fitness and sports energy pack",
    industries: ["fitness", "gym", "training", "sports", "coach", "yoga", "pilates", "dance"],
    archetypeIds: ["fitness-sports", "health-wellness"],
    visualThesis: "Active motivation with kinetic section rhythm, bold progress panels, and honest class/contact conversion.",
    textureSystem: ["motion lines, court/track grid, mat texture, or breath-line overlays depending on intensity"],
    motifSystem: ["class cards", "training rails", "progress-path panels without fake results"],
    frameSystem: ["bold diagonal frames for high energy, soft rounded frames for yoga/wellness"],
    iconSystem: ["movement, calendar, location, contact, class, and coaching icons"],
    imageDirection: ["avoid fake transformation photos; use equipment, space, movement detail, or representative class atmosphere"],
    sectionApplications: [
      { section: "hero", treatment: "action-forward hero with class/contact CTA" },
      { section: "services", treatment: "class/training rail grouped by verified offering" },
      { section: "faq", treatment: "beginner, schedule, and contact expectation support" },
    ],
    cssPrimitives: [".seraphim-speed-lines", ".seraphim-mask-diagonal", ".seraphim-service-rail"],
    copyTone: ["energizing, direct, and realistic"],
    avoid: ["fake body outcomes, guarantees, member counts, reviews, or transformation claims"],
    factualSafety: ["Use 'Ask about current schedule' where class times are unknown."],
  },
  {
    id: "real-estate-spatial",
    name: "Real estate spatial pack",
    industries: ["real estate", "realtor", "property", "homes", "apartment", "rental", "broker"],
    archetypeIds: ["real-estate"],
    visualThesis: "Spatial confidence with architectural frames, map/location clarity, property-card rhythm, and consult/contact conversion.",
    textureSystem: ["subtle architectural grid, blueprint linework, or warm residential surfaces"],
    motifSystem: ["property cards, neighborhood chips, map panels, consultation proof strips"],
    frameSystem: ["architectural image frames, crisp listing cards, location panels"],
    iconSystem: ["home, key, map, phone, calendar, listing, and neighborhood icons"],
    imageDirection: ["avoid implying listed properties, sold results, or brokerage credentials unless verified"],
    sectionApplications: [
      { section: "hero", treatment: "area/service-led hero with contact CTA" },
      { section: "services", treatment: "buyer/seller/rental service rail where verified" },
      { section: "service-area", treatment: "map-inspired verified location panel" },
    ],
    cssPrimitives: [".seraphim-texture-blueprint", ".seraphim-map-panel", ".seraphim-frame-utility"],
    copyTone: ["composed, local, and advisory"],
    avoid: ["fake listings, sales volume, awards, certifications, or client outcomes"],
    factualSafety: ["Keep property and market claims conservative unless supplied."],
  },
  {
    id: "education-learning",
    name: "Education and tutoring pack",
    industries: ["education", "tutoring", "school", "course", "learning", "teacher", "academy", "training"],
    archetypeIds: ["education-tutoring"],
    visualThesis: "Clear learning path with friendly structure, progress cues, and enrollment/contact guidance.",
    textureSystem: ["notebook lines, soft grid, lesson-card backgrounds, or calm academic paper texture"],
    motifSystem: ["lesson cards", "progress steps", "subject chips", "question-support panels"],
    frameSystem: ["friendly cards, timeline panels, reading-width content blocks"],
    iconSystem: ["book, pencil, subject, calendar, phone, location, and progress icons"],
    imageDirection: ["avoid fake student outcomes, names, school partnerships, or certifications"],
    sectionApplications: [
      { section: "hero", treatment: "student/parent-oriented hero with subject and contact clarity" },
      { section: "services", treatment: "subject or program rail based on verified topics" },
      { section: "process", treatment: "how enrollment or first contact works" },
    ],
    cssPrimitives: [".seraphim-learning-card", ".seraphim-service-rail", ".seraphim-proof-strip"],
    copyTone: ["encouraging, clear, and parent/student friendly"],
    avoid: ["fake pass rates, scholarships, accreditations, outcomes, or testimonials"],
    factualSafety: ["Use 'Contact to confirm current subjects and schedule' when missing."],
  },
  {
    id: "saas-tech-interface",
    name: "SaaS and tech interface pack",
    industries: ["saas", "software", "app", "platform", "technology", "tech", "ai", "dashboard"],
    archetypeIds: ["saas-tech", "tech-consulting"],
    visualThesis: "Interface-led clarity with product panels, system diagrams, and conversion flow grounded in verified features.",
    textureSystem: ["subtle grid, code-line, node, or interface surface overlays"],
    motifSystem: ["feature panels, product cards, workflow diagrams, status chips"],
    frameSystem: ["browser-like interface frames only when representative and clearly not fake data proof"],
    iconSystem: ["interface, automation, data, security, support, and contact icons"],
    imageDirection: ["use real screenshots when supplied; representative UI must not show fake metrics or client data"],
    sectionApplications: [
      { section: "hero", treatment: "product/value hero with real or representative interface panel" },
      { section: "services", treatment: "feature rail grouped by user task" },
      { section: "process", treatment: "workflow or adoption path" },
    ],
    cssPrimitives: [".seraphim-interface-frame", ".seraphim-texture-blueprint", ".seraphim-service-rail"],
    copyTone: ["clear, technical, and benefit-specific"],
    avoid: ["fake dashboards, fake analytics, fake client logos, invented integrations, or security claims"],
    factualSafety: ["Label representative UI and avoid unsupported metrics."],
  },
  {
    id: "professional-trust-editorial",
    name: "Professional trust editorial pack",
    industries: ["professional", "legal", "law", "finance", "accounting", "insurance", "consulting", "advisor"],
    archetypeIds: ["professional-services", "tech-consulting"],
    visualThesis: "Composed trust with editorial restraint, crisp hierarchy, verified credentials only, and consultation-forward flow.",
    textureSystem: ["paper, document, architectural grid, or calm neutral surface textures"],
    motifSystem: ["consultation cards, practice/service rails, verified detail badges"],
    frameSystem: ["crisp editorial panels, narrow reading columns, structured process blocks"],
    iconSystem: ["document, shield, calendar, phone, location, consultation, and question icons"],
    imageDirection: ["avoid fake staff, courthouse, client, or office imagery that implies unsupported relationships"],
    sectionApplications: [
      { section: "hero", treatment: "measured authority with clear consultation CTA" },
      { section: "services", treatment: "service/practice rail grouped by verified areas" },
      { section: "faq", treatment: "decision support for fit, first conversation, and contact" },
    ],
    cssPrimitives: [".seraphim-editorial-panel", ".seraphim-fact-badge", ".seraphim-proof-strip"],
    copyTone: ["measured, exact, and reassuring"],
    avoid: ["case results, awards, guarantees, client names, licenses, or credentials unless verified"],
    factualSafety: ["Never imply regulated credentials or outcomes from inference."],
  },
  {
    id: "creative-agency-portfolio",
    name: "Creative agency and portfolio pack",
    industries: ["creative", "agency", "studio", "photography", "design", "marketing", "branding", "artist", "events"],
    archetypeIds: ["creative-agency"],
    visualThesis: "Taste-forward portfolio energy with editorial contrast, distinctive frames, and inquiry conversion discipline.",
    textureSystem: ["studio-paper, subtle grain, poster edge, or gallery-wall overlays"],
    motifSystem: ["portfolio tiles, project cards, process ribbons, inquiry CTA bands"],
    frameSystem: ["asymmetric editorial frames, gallery mosaics, dramatic but readable surfaces"],
    iconSystem: ["minimal icons; use typography and composition before icon decoration"],
    imageDirection: ["real portfolio images first; otherwise use representative style boards without fake client claims"],
    sectionApplications: [
      { section: "hero", treatment: "taste-led statement with one strong visual composition and inquiry CTA" },
      { section: "showcase", treatment: "portfolio/gallery frame with honest labels" },
      { section: "process", treatment: "collaboration path without invented clients or results" },
    ],
    cssPrimitives: [".seraphim-frame-offset", ".seraphim-texture-grain", ".seraphim-showcase-grid"],
    copyTone: ["distinctive, confident, and specific"],
    avoid: ["fake clients, fake press, fake awards, fake case-study metrics, or copied reference compositions"],
    factualSafety: ["Separate style direction from verified portfolio proof."],
  },
  {
    id: "nonprofit-community",
    name: "Nonprofit and community pack",
    industries: ["nonprofit", "charity", "community", "church", "foundation", "volunteer", "donation"],
    archetypeIds: ["nonprofit-charity", "friendly-local"],
    visualThesis: "Human community clarity with warm proof, mission-first hierarchy, and honest volunteer/donation/contact routes.",
    textureSystem: ["soft paper, community noticeboard, or warm local texture"],
    motifSystem: ["mission cards, impact path panels without fake metrics, volunteer/contact badges"],
    frameSystem: ["warm community panels, photo/story frames, accessible CTA blocks"],
    iconSystem: ["heart, hands, location, calendar, phone, message, and volunteer icons"],
    imageDirection: ["avoid fake beneficiary or volunteer photos; use supplied images or neutral representative community visuals"],
    sectionApplications: [
      { section: "hero", treatment: "mission and location clarity with contact/donate/volunteer CTA only if verified" },
      { section: "services", treatment: "program rail from verified initiatives" },
      { section: "contact", treatment: "clear contact and involvement path" },
    ],
    cssPrimitives: [".seraphim-proof-strip", ".seraphim-soft-blob", ".seraphim-cta-band"],
    copyTone: ["warm, respectful, and concrete"],
    avoid: ["fake impact numbers, partners, donor logos, urgency, or beneficiary stories"],
    factualSafety: ["Do not create donation/payment claims unless a real route is supplied."],
  },
  {
    id: "local-default-specific",
    name: "Local business specificity pack",
    industries: ["local", "business", "service"],
    archetypeIds: allArchetypeIds,
    visualThesis: "Identity-preserving local clarity using extracted colors, logo mood, verified facts, and one memorable section treatment.",
    textureSystem: ["use extracted color atmosphere only when no stronger industry pack matches"],
    motifSystem: ["verified fact badges, proof strip, service rail, CTA band, and one image/frame treatment"],
    frameSystem: ["balanced local-business cards and contact panels"],
    iconSystem: ["minimal contained icons paired with text"],
    imageDirection: ["use supplied screenshot/image first; otherwise rely on CSS art rather than fake proof imagery"],
    sectionApplications: [
      { section: "hero", treatment: "clear offer, business name, verified facts, and one visual motif tied to the logo mood" },
      { section: "services", treatment: "service rail or editorial list based on verified offer" },
      { section: "contact", treatment: "direct contact block with verified details" },
    ],
    cssPrimitives: [".seraphim-fact-badge", ".seraphim-proof-strip", ".seraphim-cta-band"],
    copyTone: ["specific, useful, and locally grounded"],
    avoid: ["generic corporate language, fake proof, repeated card grids, or unrelated luxury styling"],
    factualSafety: ["Use fallback only when stronger industry signals are weak."],
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

function scorePack(
  pack: IndustryAssetPack,
  input: {
    cleanBusinessData: CleanBusinessLike;
    archetype: Archetype;
    visualIdentity: VisualIdentityProfile;
  },
) {
  const source = sourceText(input);
  let score = 0;
  if (pack.archetypeIds.includes(input.archetype.id)) score += 12;
  score += pack.industries.filter((industry) => source.includes(industry)).length * 5;
  score += input.visualIdentity.industryCues.filter((cue) => pack.industries.some((industry) => cue.toLowerCase().includes(industry))).length * 4;
  score += pack.copyTone.filter((tone) => source.includes(tone.split(/[,\s]+/)[0]?.toLowerCase() ?? "")).length;
  if (pack.id === "local-default-specific") score += 1;
  return score;
}

export function getIndustryAssetPacks() {
  return INDUSTRY_ASSET_PACKS;
}

export function recommendIndustryAssetPacks(input: {
  cleanBusinessData: CleanBusinessLike;
  archetype: Archetype;
  visualIdentity: VisualIdentityProfile;
}): IndustryAssetPackRecommendation {
  const ranked = INDUSTRY_ASSET_PACKS
    .map((pack) => ({ pack, score: scorePack(pack, input) }))
    .sort((a, b) => b.score - a.score);
  const primaryPack = ranked[0]?.pack ?? INDUSTRY_ASSET_PACKS[INDUSTRY_ASSET_PACKS.length - 1];
  const supportingPacks = ranked
    .filter(({ pack }) => pack.id !== primaryPack.id && pack.id !== "local-default-specific")
    .slice(0, 2)
    .map(({ pack }) => pack);
  const allPacks = [primaryPack, ...supportingPacks];
  const textureBackgroundTokens = recommendTextureBackgroundTokens(input);
  const photoDirection = recommendPhotoDirection(input);
  const componentPrimitives = recommendComponentPrimitives(input);

  return {
    primaryPack,
    supportingPacks,
    textureBackgroundTokens,
    photoDirection,
    componentPrimitives,
    summary: `Primary asset pack: ${primaryPack.name}. Supporting references: ${supportingPacks.map((pack) => pack.name).join(", ") || "none"}. ${textureBackgroundTokens.summary} ${photoDirection.summary} ${componentPrimitives.summary}`,
    requiredApplications: [
      `Use the primary visual thesis: ${primaryPack.visualThesis}`,
      "Use asset-pack details as visual vocabulary only; do not create static full-page templates.",
      "Pick section treatments from the pack that match verified business facts and conversion needs.",
      "When supplied imagery is missing, use CSS art, abstract texture, or clearly labeled representative imagery rather than fake proof.",
      ...textureBackgroundTokens.usageRules,
      ...photoDirection.cssSvgArtRules,
      ...photoDirection.labelingRules,
      ...componentPrimitives.usageRules,
    ],
    cssContractNotes: unique([
      ...allPacks.flatMap((pack) => pack.cssPrimitives),
      ...textureBackgroundTokens.cssClassNames,
      ...componentPrimitives.cssClassNames,
    ]),
    qaChecks: unique([
      "The final page should visibly reflect the primary industry asset pack, not just generic business styling.",
      "Asset-pack proof elements must use verified facts only.",
      "Textures, frames, and motifs must be embedded CSS/SVG and must not require external assets.",
      "The hero, services, and CTA/contact sections should each use an asset-pack-appropriate treatment.",
      ...textureBackgroundTokens.qaChecks,
      ...photoDirection.qaChecks,
      ...componentPrimitives.qaChecks,
      ...primaryPack.factualSafety,
    ]),
  };
}
