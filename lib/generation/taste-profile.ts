import { getArchetypeById, getArchetypeForIndustry, type Archetype } from "@/lib/archetypes";
import type { DesignTokenPreferences } from "@/lib/design/tokens";

export type VisualIdentityProfile = {
  extractedColors: string[];
  dominantAccents: string[];
  logoMood: string;
  shapeLanguage: string;
  typographyFeel: string;
  brandTemperature: "warm" | "cool" | "neutral" | "mixed";
  imageEnergy: string;
  industryCues: string[];
  layoutImplications: string[];
  paletteRationale: string;
  fallbackUsed: boolean;
  warnings: string[];
};

export type ArchetypeReconciliation = {
  extractedIndustry: string;
  visualMood: string;
  audience: string;
  offerType: string;
  conversionAction: string;
  selectedArchetypeId?: string;
  recommendedArchetypeId: string;
  finalArchetypeId: string;
  mismatch: boolean;
  confidence: number;
  rejectedArchetypes: Array<{ id: string; reason: string }>;
  warnings: string[];
};

type CleanBusinessLike = {
  companyName?: string;
  businessType?: string;
  visibleDescription?: string;
  services?: string[];
  products?: string[];
  targetAudience?: string;
  brandTone?: string;
  visibleColors?: string[];
  visualEvidence?: string[];
  logoDescription?: string;
  rawExtractedData?: string;
  phone?: string;
  email?: string;
};

const corporateDefaultColors = new Set([
  "#0f172a",
  "#111827",
  "#1e293b",
  "#334155",
  "#2b5e8c",
  "#2563eb",
  "#4f46e5",
]);

const expressiveIndustryPattern =
  /\b(food|restaurant|cafe|kitchen|dining|grill|jerk|pet|groom|animal|beauty|salon|spa|wellness|barber|nails|lashes|home service|in-home|plumb|electric|handy|repair|painting|cleaning|locksmith|contractor|automotive|auto|detailing|car wash|hospitality|hotel|event|creative|boutique|retail|store)\b/i;

const professionalPattern = /\b(law|legal|attorney|accounting|finance|insurance|advisor|professional services)\b/i;

const colorSignals: Array<{ pattern: RegExp; name: string; hex: string; temperature: VisualIdentityProfile["brandTemperature"] }> = [
  { pattern: /\b(yellow|sun|sunny|gold|golden)\b/i, name: "sunny gold", hex: "#F6C343", temperature: "warm" },
  { pattern: /\b(red|crimson|ruby|cherry)\b/i, name: "confident red", hex: "#D72638", temperature: "warm" },
  { pattern: /\b(orange|amber|copper|spice)\b/i, name: "warm orange", hex: "#F97316", temperature: "warm" },
  { pattern: /\b(green|lime|leaf|fresh)\b/i, name: "fresh green", hex: "#168A4A", temperature: "warm" },
  { pattern: /\b(blue|navy|ocean|aqua|teal)\b/i, name: "clear blue", hex: "#2563EB", temperature: "cool" },
  { pattern: /\b(pink|rose|blush|magenta)\b/i, name: "expressive pink", hex: "#DB2777", temperature: "warm" },
  { pattern: /\b(purple|violet|lavender)\b/i, name: "creative purple", hex: "#7C3AED", temperature: "cool" },
  { pattern: /\b(black|dark|charcoal)\b/i, name: "deep charcoal", hex: "#111827", temperature: "cool" },
  { pattern: /\b(white|cream|ivory)\b/i, name: "soft cream", hex: "#FFF7ED", temperature: "warm" },
];

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeHex(value: string) {
  const match = value.trim().match(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return "";
  const hex = value.trim();
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
  }
  return hex.toUpperCase();
}

function textSource(cleanBusinessData: CleanBusinessLike) {
  return [
    cleanBusinessData.companyName,
    cleanBusinessData.businessType,
    cleanBusinessData.visibleDescription,
    cleanBusinessData.services?.join(" "),
    cleanBusinessData.products?.join(" "),
    cleanBusinessData.targetAudience,
    cleanBusinessData.brandTone,
    cleanBusinessData.visibleColors?.join(" "),
    cleanBusinessData.visualEvidence?.join(" "),
    cleanBusinessData.logoDescription,
    cleanBusinessData.rawExtractedData,
  ].filter(Boolean).join(" ");
}

function colorsFromText(text: string, explicitColors: string[] = []) {
  const hexColors = unique([
    ...explicitColors.map(normalizeHex),
    ...[...text.matchAll(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi)].map((match) => normalizeHex(match[0])),
  ]).filter(Boolean);
  const namedColors = colorSignals.filter((signal) => signal.pattern.test(text)).map((signal) => signal.hex);
  return unique([...hexColors, ...namedColors]).slice(0, 6);
}

function dominantAccentNames(text: string) {
  return colorSignals.filter((signal) => signal.pattern.test(text)).map((signal) => signal.name).slice(0, 4);
}

export function hasCorporateDefaultColor(colors: string[]) {
  return colors.map((color) => normalizeHex(color).toLowerCase()).some((color) => corporateDefaultColors.has(color));
}

export function isExpressiveNiche(value: string) {
  return expressiveIndustryPattern.test(value) && !professionalPattern.test(value);
}

function inferBrandTemperature(text: string, colors: string[]): VisualIdentityProfile["brandTemperature"] {
  const warm = /\b(yellow|gold|orange|amber|red|pink|rose|spice|food|restaurant|pet|friendly|warm|family|home)\b/i.test(text) ||
    colors.some((color) => ["#F6C343", "#D72638", "#F97316", "#168A4A", "#DB2777", "#FFF7ED"].includes(color));
  const cool = /\b(blue|navy|teal|clinical|professional|precision|auto|tech|cool)\b/i.test(text) ||
    colors.some((color) => ["#2563EB", "#7C3AED", "#111827"].includes(color));
  if (warm && cool) return "mixed";
  if (warm) return "warm";
  if (cool) return "cool";
  return "neutral";
}

function inferLogoMood(text: string) {
  if (/\b(pet|happy|friendly|family|kid|playful|cartoon|round|paw)\b/i.test(text)) return "friendly, rounded, approachable";
  if (/\b(food|restaurant|kitchen|spice|jerk|grill|cafe|bakery)\b/i.test(text)) return "sensory, local, appetite-led";
  if (/\b(auto|detailing|premium finish|vehicle|car|garage)\b/i.test(text)) return "polished, precise, reflective";
  if (/\b(handy|home service|plumb|electric|repair|locksmith|painting|cleaning)\b/i.test(text)) return "practical, capable, quick-response";
  if (/\b(beauty|salon|spa|lashes|nails|barber)\b/i.test(text)) return "expressive, tactile, confidence-building";
  return "understated local business identity";
}

function inferImageEnergy(text: string) {
  if (/\b(jamaican|island|spice|food|grill|jerk|dining|kitchen)\b/i.test(text)) return "bright, tactile, flavorful, place-specific";
  if (/\b(pet|groom|animal|happy|care)\b/i.test(text)) return "bright, warm, reassuring, playful";
  if (/\b(auto|detailing|premium finish|vehicle|car)\b/i.test(text)) return "glossy, precise, high-contrast, finish-focused";
  if (/\b(handy|home service|plumb|electric|repair|painting|cleaning|locksmith)\b/i.test(text)) return "direct, useful, energetic, service-ready";
  if (/\b(beauty|salon|spa|lashes|nails)\b/i.test(text)) return "tactile, elegant, expressive, polished";
  if (/\b(clinic|medical|dental|health|therapy)\b/i.test(text)) return "calm, clean, reassuring, readable";
  return "clear, business-specific, not generic corporate";
}

function inferLayoutImplications(text: string) {
  const implications: string[] = [];
  if (/\b(food|restaurant|kitchen|dining)\b/i.test(text)) implications.push("lead with appetite and atmosphere before service explanation");
  if (/\b(pet|groom|animal)\b/i.test(text)) implications.push("use warm rounded proof blocks and comfort-led service grouping");
  if (/\b(auto|detailing|vehicle|car)\b/i.test(text)) implications.push("use cinematic finish/detail panels and direct quote/call routes");
  if (/\b(handy|home service|repair|plumb|electric|painting|cleaning|locksmith)\b/i.test(text)) implications.push("use quick booking, service-area clarity, and practical problem/solution rhythm");
  if (/\b(beauty|salon|spa|nails|lashes|barber)\b/i.test(text)) implications.push("use signature-style editorial sections and booking-forward CTAs");
  if (!implications.length) implications.push("vary section rhythm around the verified offer instead of repeating generic card grids");
  return implications;
}

function industryCues(text: string) {
  const cues = [
    ["food/hospitality", /\b(food|restaurant|kitchen|dining|grill|jerk|cafe|bakery|catering)\b/i],
    ["pet care", /\b(pet|groom|animal|paw|store)\b/i],
    ["automotive", /\b(auto|automotive|detailing|vehicle|car wash|garage|mechanic|tire|tyre)\b/i],
    ["home services/trades", /\b(home service|in-home|handy|plumb|electric|repair|painting|cleaning|locksmith|contractor|hvac)\b/i],
    ["beauty/salon", /\b(beauty|salon|barber|nails|lashes|makeup|esthetician|spa)\b/i],
    ["health/wellness", /\b(health|wellness|clinic|medical|dental|therapy|care)\b/i],
    ["retail/boutique", /\b(retail|shop|store|boutique|product)\b/i],
  ] as const;
  return cues.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

export function buildVisualIdentityProfile(cleanBusinessData: CleanBusinessLike): VisualIdentityProfile {
  const source = textSource(cleanBusinessData);
  const extractedColors = colorsFromText(source, cleanBusinessData.visibleColors);
  const expressive = isExpressiveNiche(source);
  const defaultOnly = !extractedColors.length || (hasCorporateDefaultColor(extractedColors) && expressive);
  const fallbackColors = expressive
    ? colorsFromText(source, [])
    : [];
  const finalColors = defaultOnly && fallbackColors.length
    ? unique(fallbackColors)
    : extractedColors;
  const cues = industryCues(source);
  const warnings: string[] = [];

  if (!extractedColors.length) {
    warnings.push("No explicit brand colors were extracted; visual identity must be inferred from niche, logo mood, and imagery.");
  }
  if (hasCorporateDefaultColor(extractedColors) && expressive) {
    warnings.push("Extracted palette leans toward corporate defaults for an expressive niche; generator must not stop at navy/blue-gray styling.");
  }
  if (!cues.length) {
    warnings.push("Industry visual cues are weak; require a clearly stated visual thesis before HTML generation.");
  }

  return {
    extractedColors: finalColors,
    dominantAccents: dominantAccentNames(source),
    logoMood: inferLogoMood(source),
    shapeLanguage: /\b(round|circle|friendly|pet|happy|family)\b/i.test(source)
      ? "soft radii, rounded badges, friendly illustration cues"
      : /\b(auto|premium finish|detailing|professional|precision)\b/i.test(source)
        ? "crisp frames, reflective surfaces, precise alignment"
        : /\b(handy|repair|trade|plumb|electric|locksmith)\b/i.test(source)
          ? "sturdy geometry, clear service blocks, practical icon panels"
          : "brand-specific shapes derived from the supplied logo and category",
    typographyFeel: /\b(food|restaurant|island|spice|beauty|salon|boutique)\b/i.test(source)
      ? "expressive display typography balanced with readable body copy"
      : /\b(auto|handy|repair|home service|tech)\b/i.test(source)
        ? "confident, sturdy sans display with practical readable body copy"
        : "readable with one characterful heading voice if the brand supports it",
    brandTemperature: inferBrandTemperature(source, finalColors),
    imageEnergy: inferImageEnergy(source),
    industryCues: cues,
    layoutImplications: inferLayoutImplications(source),
    paletteRationale: finalColors.length
      ? `Palette must elevate extracted/derived colors (${finalColors.join(", ")}) and avoid drifting into generic corporate defaults.`
      : "Palette may use safe defaults only because no meaningful identity colors were extracted.",
    fallbackUsed: !extractedColors.length,
    warnings,
  };
}

function recommendedArchetypeId(text: string) {
  if (/\b(restaurant|cafe|bar|grill|bakery|catering|hotel|hospitality|food|dining|kitchen|jerk)\b/i.test(text)) return "restaurant-hospitality";
  if (/\b(auto|automotive|mechanic|garage|tire|tyre|car wash|detailing|vehicle)\b/i.test(text)) return "automotive";
  if (/\b(home service|in-home|handy|plumb|electric|hvac|roofing|construction|contractor|landscaping|repair|installation|painting|cleaning|locksmith)\b/i.test(text)) return "home-services";
  if (/\b(beauty|salon|hair|barber|nails|makeup|esthetician|lashes|spa)\b/i.test(text)) return "beauty-salon";
  if (/\b(health|wellness|clinic|dental|medical|therapy|counseling)\b/i.test(text)) return "health-wellness";
  if (/\b(pet|pet care|grooming|animal|pet store)\b/i.test(text)) return "friendly-local";
  if (/\b(retail|shop|store|boutique|product|ecommerce)\b/i.test(text)) return "ecommerce-retail";
  if (/\b(event|creative|agency|design|studio|photography|marketing|branding)\b/i.test(text)) return "creative-agency";
  return getArchetypeForIndustry(text).id;
}

function offerType(text: string) {
  if (/\b(book|appointment|reservation)\b/i.test(text)) return "booking/enquiry";
  if (/\b(call now|phone|whatsapp|message)\b/i.test(text)) return "call/message";
  if (/\b(shop|store|product|retail)\b/i.test(text)) return "shopping/enquiry";
  if (/\b(quote|estimate|repair|service)\b/i.test(text)) return "quote/service request";
  return "contact enquiry";
}

export function reconcileArchetype(input: {
  cleanBusinessData: CleanBusinessLike;
  visualIdentity: VisualIdentityProfile;
  selectedArchetypeId?: string;
}): { archetype: Archetype; reconciliation: ArchetypeReconciliation } {
  const source = textSource(input.cleanBusinessData);
  const selected = input.selectedArchetypeId ? getArchetypeById(input.selectedArchetypeId) : undefined;
  const recommendedId = recommendedArchetypeId(source);
  const recommended = getArchetypeById(recommendedId) ?? getArchetypeForIndustry(source);
  const selectedIsGenericProfessional = selected?.id === "professional-services";
  const expressive = isExpressiveNiche(source);
  const shouldCorrect = !selected || (selected.id !== recommended.id && (selectedIsGenericProfessional || expressive));
  const final = shouldCorrect ? recommended : selected ?? recommended;
  const mismatch = Boolean(selected && selected.id !== final.id);
  const warnings: string[] = [];

  if (mismatch) {
    warnings.push(`Archetype corrected from ${selected?.name} to ${final.name} because the extracted business signals fit ${recommended.name}.`);
  }
  if (selectedIsGenericProfessional && expressive) {
    warnings.push("Generic professional/business routing was rejected for an expressive local-service niche.");
  }

  return {
    archetype: final,
    reconciliation: {
      extractedIndustry: input.cleanBusinessData.businessType || "Local business",
      visualMood: input.visualIdentity.imageEnergy,
      audience: input.cleanBusinessData.targetAudience || "Local customers",
      offerType: offerType(source),
      conversionAction: input.cleanBusinessData.phone ? "call" : input.cleanBusinessData.email ? "email" : "contact",
      selectedArchetypeId: selected?.id,
      recommendedArchetypeId: recommended.id,
      finalArchetypeId: final.id,
      mismatch,
      confidence: expressive || recommended.id !== "friendly-local" ? 86 : 68,
      rejectedArchetypes: selected && selected.id !== final.id
        ? [{ id: selected.id, reason: `Rejected because source signals indicate ${recommended.name}, not ${selected.name}.` }]
        : [],
      warnings,
    },
  };
}

export function visualTokenOverrides(profile: VisualIdentityProfile): DesignTokenPreferences {
  if (!profile.extractedColors.length || profile.fallbackUsed) return {};
  const [primary, secondary, accent] = profile.extractedColors;
  return {
    colors: {
      primary,
      secondary: secondary || primary,
      accent: accent || secondary || primary,
    },
  };
}
