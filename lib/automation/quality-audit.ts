import type { BusinessInfo, Prospect, QualityAudit, QualityAuditItem } from "@/lib/types";
import { isExpressiveNiche } from "@/lib/generation/taste-profile";

function includesAny(html: string, values: string[]) {
  const lower = html.toLowerCase();
  return values.filter(Boolean).some((value) => lower.includes(value.toLowerCase()));
}

function item(label: string, passed: boolean, detail: string): QualityAuditItem {
  return { label, passed, detail };
}

function scoreWithCaps(items: QualityAuditItem[], caps: number[]) {
  const baseScore = Math.round((items.filter((check) => check.passed).length / items.length) * 100);
  return Math.min(baseScore, ...caps);
}

function textOnly(html: string) {
  return html
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function colorsFrom(value: string) {
  return Array.from(new Set([
    ...(value.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi) ?? []),
    ...value.split(/[,;\n|]+/).filter((part) => /\b(red|yellow|gold|orange|green|blue|teal|pink|purple|black|cream|white|brown)\b/i.test(part)),
  ].map((color) => color.trim()).filter(Boolean)));
}

export function auditWebsite(html: string, input: BusinessInfo | Prospect): QualityAudit {
  const name = "businessName" in input ? input.businessName : input.business_name;
  const category = "businessName" in input ? input.category : input.category;
  const phone = "businessName" in input ? input.phone : input.phone;
  const email = "businessName" in input ? input.email : input.email;
  const services = "businessName" in input ? input.services : input.extracted_summary;
  const rawInfo = "businessName" in input ? input.rawInfo : input.pasted_raw_info;
  const brandColors = "businessName" in input ? input.brandColors : "";
  const contactPresent = Boolean(phone || email || includesAny(html, ["wa.me", "mailto:", "contact"]));
  const lower = html.toLowerCase();
  const visibleText = textOnly(html);
  const sourceText = [name, category, services, rawInfo, brandColors].filter(Boolean).join(" ");
  const expressiveNiche = isExpressiveNiche(sourceText);
  const suppliedColors = colorsFrom(brandColors || sourceText);
  const carriedColors = suppliedColors.filter((color) => lower.includes(color.toLowerCase()));
  const corporateDefaultRisk = expressiveNiche &&
    (/#0f172a|#111827|#1e293b|#334155|#2b5e8c|blue-gray|slate/i.test(html) ||
      /font-family:\s*(?:var\(--font-body\),?\s*)?Inter\b/i.test(html));
  const archetypeMismatchRisk = expressiveNiche &&
    /professional, finance & business services|professional services|practice areas|consultation strategy/i.test(visibleText) &&
    !/\b(law|legal|attorney|accounting|finance|insurance|advisor)\b/i.test(sourceText);
  const genericLanguageRisk = /(transform your business|solutions for every need|elevate your brand|modern solutions|unlock growth|trusted partner|comprehensive services|tailored solutions|seamless experience|best-in-class)/i.test(visibleText);
  const nicheCueWords = sourceText.toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 5 && !["business", "service", "services", "kingston", "jamaica", "followers", "following"].includes(word))
    .slice(0, 14);
  const nicheCueMatches = nicheCueWords.filter((word) => visibleText.toLowerCase().includes(word));
  const weakNicheCues = expressiveNiche && nicheCueMatches.length < Math.min(3, nicheCueWords.length);
  const paletteMismatch = suppliedColors.length >= 2 && carriedColors.length === 0;
  const missingEmotionalHook = expressiveNiche &&
    !/(warm|flavor|fresh|care|comfort|finish|detail|repair|quick|local|island|home|pet|groom|shine|style|visit|book|call|crafted|friendly|appetite|tactile|trusted)/i.test(visibleText);
  const technicallyCompleteSignals = [
    includesAny(html, ["<title", "description", "og:title"]),
    includesAny(html, ["@media", "viewport"]),
    (html.match(/<section\b/gi) ?? []).length >= 6,
    contactPresent,
    includesAny(html, ["faq", "questions"]),
  ].filter(Boolean).length;
  const technicallyCompleteButBoring = technicallyCompleteSignals >= 4 &&
    (corporateDefaultRisk || genericLanguageRisk || weakNicheCues || missingEmotionalHook);
  const motifClasses = [
    "seraphim-divider-wave",
    "seraphim-divider-angle",
    "seraphim-texture-grain",
    "seraphim-texture-blueprint",
    "seraphim-fact-badge",
    "seraphim-frame-offset",
    "seraphim-frame-utility",
    "seraphim-icon-mark",
    "seraphim-cta-band",
    "seraphim-mask-arch",
    "seraphim-mask-diagonal",
    "seraphim-proof-strip",
    "seraphim-service-rail",
    "seraphim-menu-card",
    "seraphim-plate-ring",
    "seraphim-metal-panel",
    "seraphim-gloss-sweep",
    "seraphim-speed-lines",
    "seraphim-paw-mark",
    "seraphim-soft-blob",
    "seraphim-map-panel",
    "seraphim-tool-icon",
    "seraphim-soft-gradient",
    "seraphim-mirror-card",
    "seraphim-care-path",
    "seraphim-product-shelf",
    "seraphim-route-line",
    "seraphim-postcard",
    "seraphim-learning-card",
    "seraphim-interface-frame",
    "seraphim-editorial-panel",
    "seraphim-bg-paper-grain",
    "seraphim-bg-noise-fine",
    "seraphim-bg-radial-light",
    "seraphim-bg-warm-local",
    "seraphim-bg-auto-dark",
    "seraphim-bg-blueprint-grid",
    "seraphim-bg-pet-soft",
    "seraphim-bg-beauty-pearl",
    "seraphim-bg-wellness-contour",
    "seraphim-bg-retail-fabric",
    "seraphim-bg-travel-map",
    "seraphim-bg-tech-nodes",
    "seraphim-bg-document-wash",
    "seraphim-hero-editorial",
    "seraphim-hero-cinematic",
    "seraphim-hero-montage",
    "seraphim-service-card",
    "seraphim-process-path",
    "seraphim-process-checklist",
    "seraphim-faq-list",
    "seraphim-contact-strip",
    "seraphim-gallery-frame",
  ];
  const motifUsageCount = motifClasses.filter((className) => lower.includes(className)).length;
  const weakMotifUsage = expressiveNiche && motifUsageCount < 3;

  const items = [
    item("Business name present", includesAny(html, [name]), name ? "Business name appears in the HTML." : "Business name is missing from the profile."),
    item("Contact info present", contactPresent, contactPresent ? "A contact path is present." : "Add phone, WhatsApp, email, or a clear contact CTA."),
    item("Clear CTA", includesAny(html, ["request", "book", "call", "contact", "quote", "availability"]), "CTA language should guide visitors to the next step."),
    item("Mobile responsive", includesAny(html, ["@media", "viewport"]), "Viewport metadata and responsive CSS should be present."),
    item("SEO metadata", includesAny(html, ["<title", "description", "og:title"]), "SEO title, description, and Open Graph tags should exist."),
    item("No fake claims", !/(rated #1|award-winning|guaranteed|5-star|trusted by \d|years of experience)/i.test(html), "Avoid unsupported reviews, awards, guarantees, and statistics."),
    item("Correct category", includesAny(html, [category]), category ? "Business category appears in the site." : "Category is missing from the profile."),
    item("Strong hero", includesAny(html, ["<section class=\"hero", "hero"]), "Hero section should be present and visually prominent."),
    item("Seraphim output signature", includesAny(html, ["data-seraphim-generator=\"true\"", "name=\"generator\" content=\"Seraphim Generator\""]), "Generated site should come from the Seraphim API pipeline."),
    item("Industry-specific visual thesis", includesAny(html, [category, "visual", "showcase", "gallery", "story", "experience"]), "Generated site should express the business category through copy, imagery, and section rhythm."),
    item("No old generator leakage", !/(template pack|selected template|website blueprint|data-website-blueprint|private concept)/i.test(html), "Generated site should not include old template, blueprint, or private-concept language."),
    item("Services section", includesAny(html, ["id=\"services\"", "service-card", "services"]), "Services/products should be visible."),
    item("Contact section", includesAny(html, ["id=\"contact\"", "contact"]), "Contact section should be available."),
    item("FAQ section", includesAny(html, ["faq", "questions"]), "FAQ or objection-handling content should be present."),
    item("Restrained demo disclosure", !/(private concept|private review|demo badge|concept seal)/i.test(html), "Client-facing pages should avoid prominent generic demo branding."),
    item("Representative imagery labeled", includesAny(html, ["representative imagery", "replace with verified business photography"]), "Placeholder imagery should be labeled honestly."),
    item("Visual polish", html.length > 25000 && includesAny(html, ["gallery", "reveal", "shadow", "border-radius"]), "Generated file should include rich structure and refined CSS."),
    item("Brand mood alignment", !missingEmotionalHook, missingEmotionalHook ? "Missing emotional hook: the page does not make the niche-specific feeling obvious." : "The page carries an emotional cue appropriate to the business."),
    item("Archetype fit", !archetypeMismatchRisk, archetypeMismatchRisk ? "Archetype mismatch: expressive local-service business reads as generic professional/business services." : "The visible category language does not show an obvious archetype mismatch."),
    item("Palette alignment", !paletteMismatch, paletteMismatch ? "Palette mismatch: supplied/extracted colors are not clearly carried into the final HTML." : suppliedColors.length ? "Supplied/extracted colors appear to influence the HTML." : "No explicit brand colors were supplied; fallback palette is acceptable but should be justified."),
    item("Typography personality", !corporateDefaultRisk, corporateDefaultRisk ? "Corporate-default risk: expressive niche is using navy/blue-gray/Inter-style defaults." : "Typography and palette do not trigger the corporate-default risk check."),
    item("Weak niche cues", !weakNicheCues, weakNicheCues ? "Weak niche cues: the output could be swapped onto another business with little change." : "Enough source-specific terms appear in visible copy."),
    item("Premium visual motifs", !weakMotifUsage, weakMotifUsage ? "Premium motif usage is weak: expressive niches should use reusable visual primitives such as proof strips, service rails, frames, masks, texture, or CTA bands." : "Reusable premium visual primitives are present."),
    item("Generic language avoidance", !genericLanguageRisk, genericLanguageRisk ? "Generic corporate filler language is present." : "No major generic corporate filler phrases were detected."),
    item("Technically complete but boring", !technicallyCompleteButBoring, technicallyCompleteButBoring ? "The page has required structure but still feels generic, emotionally flat, or interchangeable." : "The page is not being passed on technical completeness alone."),
  ];

  const warnings = items.filter((check) => !check.passed).map((check) => check.detail);
  const caps = [
    technicallyCompleteButBoring ? 72 : 100,
    archetypeMismatchRisk ? 74 : 100,
    corporateDefaultRisk ? 76 : 100,
    paletteMismatch ? 80 : 100,
    weakNicheCues ? 82 : 100,
    weakMotifUsage ? 82 : 100,
    missingEmotionalHook ? 82 : 100,
  ];
  const score = scoreWithCaps(items, caps);

  if (lower.includes("representative imagery")) {
    warnings.push("Representative imagery should be replaced with verified business photography before final publication.");
  }

  return {
    score,
    passed: score >= 85,
    items,
    warnings,
  };
}
