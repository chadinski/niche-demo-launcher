import type { CopyAngleName } from "@/lib/generators/copy-angles";
import type { WebsitePresetName } from "@/lib/generators/website-presets";

export type IndustryDesignId =
  | "restaurant"
  | "auto-detailing"
  | "auto-repair"
  | "clinic"
  | "wellness"
  | "salon"
  | "trades"
  | "real-estate"
  | "memorial"
  | "product-studio"
  | "artist"
  | "florist"
  | "pet-care"
  | "professional"
  | "local-service";

export interface IndustryDesign {
  id: IndustryDesignId;
  label: string;
  match: RegExp;
  preset: WebsitePresetName;
  copyAngle: CopyAngleName;
  primary: string;
  accent: string;
  colorPath: string;
  composition: string;
  navPrimary: string;
  trustCue: string;
  cssClass: string;
}

export const industryDesigns: IndustryDesign[] = [
  {
    id: "restaurant",
    label: "Restaurant / hospitality",
    match: /(restaurant|cafe|coffee|food|bakery|catering|bar|grill|dining|menu|chef)/,
    preset: "Restaurant Experience",
    copyAngle: "hospitality experience",
    primary: "#7c2d12",
    accent: "#fb923c",
    colorPath: "ember, clay, cream, and warm hospitality contrast",
    composition: "Immersive food-and-atmosphere hero, menu-forward service cards, large sensory gallery, then visit details.",
    navPrimary: "Menu",
    trustCue: "Atmosphere, current menu options, visit details, and reservation/order path.",
    cssClass: "industry-restaurant",
  },
  {
    id: "auto-detailing",
    label: "Auto detailing",
    match: /(auto detailing|detailing|car care|vehicle appearance|ceramic coating|paint correction)/,
    preset: "Luxury Editorial",
    copyAngle: "craftsmanship",
    primary: "#0f172a",
    accent: "#38bdf8",
    colorPath: "midnight graphite, chrome blue, and high-gloss contrast",
    composition: "High-impact finish imagery, detail-led proof blocks, premium service cards, and quote-ready contact.",
    navPrimary: "Services",
    trustCue: "Finish quality, service scope, care process, and estimate path.",
    cssClass: "industry-auto-detailing",
  },
  {
    id: "auto-repair",
    label: "Auto repair / mechanic",
    match: /(auto repair|mechanic|vehicle repair|car repair|garage|diagnostic|brakes|servicing)/,
    preset: "Industrial Premium",
    copyAngle: "technical precision",
    primary: "#1f2937",
    accent: "#f97316",
    colorPath: "charcoal, safety orange, steel, and practical contrast",
    composition: "Capability-first hero, service diagnostics, process clarity, and direct estimate request.",
    navPrimary: "Repairs",
    trustCue: "Diagnostics, service process, direct contact, and quote path.",
    cssClass: "industry-auto-repair",
  },
  {
    id: "clinic",
    label: "Clinic / healthcare",
    match: /(dental|dentist|clinic|medical|health|doctor|patient|care)/,
    preset: "Soft Wellness",
    copyAngle: "care clarity",
    primary: "#0f766e",
    accent: "#38bdf8",
    colorPath: "clean teal, clinical blue, soft white, and calm contrast",
    composition: "Reassuring split hero, care categories, patient guidance, and appointment-oriented FAQ.",
    navPrimary: "Care",
    trustCue: "Care options, appointment clarity, patient guidance, and comfort.",
    cssClass: "industry-clinic",
  },
  {
    id: "wellness",
    label: "Wellness / spa",
    match: /(wellness|therapy|massage|spa|holistic|yoga|meditation|healing)/,
    preset: "Soft Wellness",
    copyAngle: "booking simplicity",
    primary: "#52796f",
    accent: "#d4a373",
    colorPath: "sage, sand, cream, and gentle wellness warmth",
    composition: "Soft editorial hero, calm service guidance, comfort proof, and low-pressure booking.",
    navPrimary: "Services",
    trustCue: "Comfort, appointment options, preparation details, and gentle contact.",
    cssClass: "industry-wellness",
  },
  {
    id: "salon",
    label: "Salon / beauty",
    match: /(salon|barber|beauty|makeup|hair|styling|lashes|nails)/,
    preset: "Luxury Editorial",
    copyAngle: "booking simplicity",
    primary: "#9f1239",
    accent: "#e8b4a2",
    colorPath: "deep rose, blush, ivory, and polished editorial contrast",
    composition: "Style-led hero, appointment services, transformation imagery, and easy booking route.",
    navPrimary: "Appointments",
    trustCue: "Style, services, booking, and occasion-ready presentation.",
    cssClass: "industry-salon",
  },
  {
    id: "trades",
    label: "Trades / construction",
    match: /(construction|contractor|builder|roofing|plumbing|electrical|hardware|supplies|renovation|repair service)/,
    preset: "Industrial Premium",
    copyAngle: "technical precision",
    primary: "#334155",
    accent: "#f59e0b",
    colorPath: "slate, hazard amber, concrete, and structured contrast",
    composition: "Capability grid, process-first sections, project imagery, and scope/quote CTA.",
    navPrimary: "Capabilities",
    trustCue: "Service scope, materials, process, service area, and quote path.",
    cssClass: "industry-trades",
  },
  {
    id: "real-estate",
    label: "Property / interiors",
    match: /(real estate|interior|architect|property|home staging|decor|furniture)/,
    preset: "Luxury Editorial",
    copyAngle: "transformation",
    primary: "#57534e",
    accent: "#c08457",
    colorPath: "stone, walnut, ivory, and architectural warmth",
    composition: "Editorial property hero, portfolio-style gallery, transformation story, and consultation CTA.",
    navPrimary: "Portfolio",
    trustCue: "Portfolio, approach, property goals, and consultation path.",
    cssClass: "industry-real-estate",
  },
  {
    id: "memorial",
    label: "Memorial / funeral care",
    match: /(funeral|memorial|tribute|urn|cremation|remembrance)/,
    preset: "Memorial Tribute",
    copyAngle: "emotional memorial tone",
    primary: "#465649",
    accent: "#b8a47a",
    colorPath: "soft evergreen, muted gold, parchment, and dignified restraint",
    composition: "Gentle hero, private guidance, careful process, and calm support sections.",
    navPrimary: "Support",
    trustCue: "Respectful support, private contact, options, and remembrance.",
    cssClass: "industry-memorial",
  },
  {
    id: "product-studio",
    label: "3D printing / product studio",
    match: /(3d|printing|prototype|custom product|fabrication|sign|laser|cnc)/,
    preset: "3D Printing Studio",
    copyAngle: "technical precision",
    primary: "#6d28d9",
    accent: "#06b6d4",
    colorPath: "violet, cyan, midnight, and technical glow",
    composition: "Technical hero, capability modules, process path, product gallery, and custom quote CTA.",
    navPrimary: "Capabilities",
    trustCue: "Capabilities, materials, production process, and custom quote path.",
    cssClass: "industry-product-studio",
  },
  {
    id: "artist",
    label: "Music / artist portfolio",
    match: /(music|musician|artist|band|violin|performer|recording studio|entertainment|dj|creative)/,
    preset: "Music / Artist Portfolio",
    copyAngle: "creative portfolio tone",
    primary: "#581c87",
    accent: "#f43f5e",
    colorPath: "night violet, stage rose, black, and cinematic energy",
    composition: "Cinematic portfolio hero, media-first gallery, booking availability, and collaboration path.",
    navPrimary: "Work",
    trustCue: "Featured work, creative identity, availability, and booking route.",
    cssClass: "industry-artist",
  },
  {
    id: "florist",
    label: "Florist / events",
    match: /(flor|flower|wedding|event|arrangement|bouquet)/,
    preset: "Soft Wellness",
    copyAngle: "craftsmanship",
    primary: "#9d174d",
    accent: "#84cc16",
    colorPath: "berry, botanical green, petal cream, and fresh contrast",
    composition: "Beautiful occasion-led hero, visual arrangements, service occasions, and custom order CTA.",
    navPrimary: "Occasions",
    trustCue: "Arrangements, occasions, visual portfolio, and enquiry route.",
    cssClass: "industry-florist",
  },
  {
    id: "pet-care",
    label: "Pet care",
    match: /(pet|veterinary|animal|grooming|dog|cat|pet store)/,
    preset: "Clean Local Business",
    copyAngle: "booking simplicity",
    primary: "#166534",
    accent: "#f59e0b",
    colorPath: "leaf green, warm amber, clean white, and friendly local contrast",
    composition: "Approachable local hero, care categories, helpful process, and easy contact.",
    navPrimary: "Care",
    trustCue: "Care services, pet owner guidance, availability, and contact.",
    cssClass: "industry-pet-care",
  },
  {
    id: "professional",
    label: "Professional services",
    match: /(law|legal|attorney|accounting|accountant|finance|consulting|consultant|professional service|realty)/,
    preset: "Professional Trust",
    copyAngle: "trust and credibility",
    primary: "#1e3a5f",
    accent: "#64748b",
    colorPath: "deep blue, slate, white, and measured professional contrast",
    composition: "Trust-led split hero, expertise sections, process clarity, and consultation CTA.",
    navPrimary: "Expertise",
    trustCue: "Expertise, service clarity, process, and confidential enquiry.",
    cssClass: "industry-professional",
  },
];

export const fallbackIndustryDesign: IndustryDesign = {
  id: "local-service",
  label: "Local service",
  match: /$a/,
  preset: "Professional Trust",
  copyAngle: "local authority",
  primary: "#4f46e5",
  accent: "#14b8a6",
  colorPath: "indigo, teal, white, and polished local-service contrast",
  composition: "Clear hero, practical services, proof-ready sections, and direct contact path.",
  navPrimary: "Services",
  trustCue: "Services, customer guidance, contact, and verified proof.",
  cssClass: "industry-local-service",
};

export function resolveIndustryDesign(value: string): IndustryDesign {
  const lower = value.toLowerCase();
  return industryDesigns.find((design) => design.match.test(lower)) ?? fallbackIndustryDesign;
}
