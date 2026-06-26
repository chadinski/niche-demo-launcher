import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getRoutesForStage, type ModelRoute } from "@/lib/ai/modelRouter";
import { selectTemplatePack, type SelectedTemplatePack } from "@/lib/generation/template-packs";

const businessInfoSchema = z.object({
  rawInfo: z.string().default(""),
  businessName: z.string().default(""),
  category: z.string().default(""),
  location: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  websiteUrl: z.string().default(""),
  socialUrl: z.string().default(""),
  services: z.string().default(""),
  brandColors: z.string().default(""),
  notes: z.string().default(""),
  painPoints: z.string().default(""),
  packagePrice: z.string().default(""),
  demoUrl: z.string().default(""),
});

const requestSchema = z.object({
  generationId: z.string().min(1).max(80),
  info: businessInfoSchema,
  generationMode: z.string().max(80).optional().default("standard"),
  businessUnderstanding: z.unknown().optional(),
});

type InspirationReference = {
  title: string;
  url: string;
  description: string;
  summary: string;
};

type CleanBusinessData = {
  companyName: string;
  businessType: string;
  visibleDescription: string;
  services: string[];
  products: string[];
  phone: string;
  email: string;
  websiteUrl: string;
  address: string;
  city: string;
  country: string;
  socialLinks: string[];
  visibleColors: string[];
  logoDescription: string;
  targetAudience: string;
  brandTone: string;
  missingFields: string[];
  dataConfidence: number;
  unsafeOrUnverifiedClaims: string[];
  verifiedFacts: string[];
  rawExtractedData: string;
};

type PremiumWebsitePlan = {
  businessPositioning: string;
  targetCustomer: string;
  emotionalHook: string;
  conversionGoal: string;
  visualHook: string;
  visualDirection: string;
  colorSystem: string;
  typographyDirection: string;
  imageDirection: string;
  compositionRhythm: string;
  signatureInteraction: string;
  sectionList: Array<{
    id: string;
    title: string;
    purpose: string;
    visualTreatment: string;
    conversionJob: string;
  }>;
  ctaStrategy: string;
  trustStrategy: string;
  missingDataPlaceholderStrategy: string;
  seoKeywordStrategy: string;
  animationMicrointeractionStrategy: string;
  mobileLayoutStrategy: string;
};

type QualityGate = {
  score: number;
  passed: boolean;
  dimensionScores: Record<string, number>;
  rejectionReasons: string[];
  revisionBrief: string;
  source: "model" | "heuristic" | "combined";
};

type StageMetadata = {
  stage: string;
  provider: string;
  model: string;
  fallback: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function splitList(value: string, limit = 12) {
  return unique(value.split(/[,;\n|]+/).map((item) => item.replace(/^[\-*]\s*/, "").trim())).slice(0, limit);
}

function stringList(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];
  return unique(value.filter((item): item is string => typeof item === "string")).slice(0, limit);
}

function compactBusinessFacts(info: z.infer<typeof businessInfoSchema>) {
  const rows = [
    ["Business", info.businessName],
    ["Category", info.category],
    ["Location", info.location],
    ["Phone", info.phone],
    ["Email", info.email],
    ["Website", info.websiteUrl],
    ["Social", info.socialUrl],
    ["Services", info.services],
    ["Brand colors", info.brandColors],
    ["Observed opportunity", info.painPoints],
    ["Internal notes", info.notes],
    ["Package price", info.packagePrice],
    ["Demo URL", info.demoUrl],
  ]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`);

  if (info.rawInfo.trim()) rows.push(`Raw source notes:\n${info.rawInfo.trim().slice(0, 6000)}`);

  return rows.join("\n") || "No business facts supplied.";
}

function modeDirection(mode: string) {
  switch (mode) {
    case "more-luxury":
      return "Push the result more editorial, spacious, refined, and luxury-service. Use restraint, strong typography, composed imagery, and premium proof framing.";
    case "more-local":
      return "Make the result warmer, more neighborhood-rooted, practical, and easy to contact while preserving polish.";
    case "more-bold":
      return "Make the result more dramatic, modern, energetic, and visually confident without becoming gimmicky.";
    default:
      return "Balanced premium: custom, polished, conversion-focused, and industry-specific.";
  }
}

function compactText(value: string, maxLength = 800) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function inspirationQuery(info: z.infer<typeof businessInfoSchema>) {
  const category = info.category.trim() || "premium local service";
  const location = info.location.trim();
  const serviceKeywords = info.services
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  return compactText(
    [category, serviceKeywords, location, "premium landing page design inspiration photography"].filter(Boolean).join(" "),
    480,
  );
}

function photoDirection(info: z.infer<typeof businessInfoSchema>) {
  const category = info.category.trim() || "the business niche";
  const services = info.services.trim() || "the core service or product";
  const location = info.location.trim() || "the service area";

  return [
    `Hero image: cinematic, above-the-fold photography showing ${category} in context for ${location}; the image should explain the offer before the visitor reads the copy.`,
    `Service imagery: close-up details of ${services}, materials, tools, finished results, or the customer experience; use real photographic texture instead of abstract gradients.`,
    `Trust imagery: location, team, workspace, storefront, treatment room, job site, product shelf, or craft process when verified; otherwise label as representative imagery.`,
    "Composition: use full-bleed crops, layered image cards, editorial captions, and image-led proof sections rather than text-only panels.",
  ].join("\n");
}

function fallbackDesignInspiration(info: z.infer<typeof businessInfoSchema>) {
  return [
    "Live inspiration research: not configured or unavailable. Use this premium fallback brief instead.",
    "Reference mindset: study patterns from Land-book, Lapa Ninja, Awwwards, Godly, Vercel, Stripe, Aesop, Apple, Studio Freight, Instrument, Collins, and high-end hospitality/editorial sites as abstract inspiration only.",
    "Do not copy reference layouts, copy, trademarks, branded imagery, screenshots, or distinctive compositions.",
    "Design cues to apply: one memorable first-viewport visual idea; real photography or photo-real scene direction; sharp editorial type scale; asymmetric section rhythm; fewer but stronger modules; image captions that build trust; proof slots that are honest when facts are missing.",
    "Avoid: text-only hero, repeated generic card grids, decorative blobs, fake dashboards, vague badges, stock-photo mismatch, and interchangeable SaaS styling.",
    "Photography/art direction:",
    photoDirection(info),
  ].join("\n");
}

function formatReferences(references: InspirationReference[], info: z.infer<typeof businessInfoSchema>) {
  if (!references.length) return fallbackDesignInspiration(info);

  const referenceLines = references
    .map((reference, index) => {
      const details = [reference.description, reference.summary].filter(Boolean).join(" ");
      return `${index + 1}. ${reference.title} — ${reference.url}\n   Cues: ${compactText(details, 520) || "premium landing-page reference; infer composition, image strategy, and section rhythm without copying."}`;
    })
    .join("\n");

  return [
    "Live inspiration research: Firecrawl found premium landing-page references for this niche.",
    "Use these only as abstract visual, photographic, and conversion-pattern inspiration. Do not copy layouts, copy, trademarks, branded imagery, screenshots, or distinctive compositions.",
    referenceLines,
    "Extracted design mandate:",
    "- The generated site must have a premium visual thesis before copy: a hero image or image-led composition that matches the niche.",
    "- Translate recurring reference patterns into original components: editorial hero, proof-led visual strip, services with photography, process/story section, and final CTA.",
    "- If a real business image is not supplied, use representative HTTPS photography that matches the category and label it honestly.",
    "Photography/art direction:",
    photoDirection(info),
  ].join("\n");
}

async function buildDesignInspirationBrief(info: z.infer<typeof businessInfoSchema>) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return fallbackDesignInspiration(info);

  try {
    const response = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: inspirationQuery(info),
        limit: 5,
        sources: ["web"],
        includeDomains: ["land-book.com", "lapa.ninja", "awwwards.com", "godly.website"],
        country: "US",
        timeout: 15000,
        ignoreInvalidURLs: true,
        scrapeOptions: {
          formats: [{ type: "summary" }],
          onlyMainContent: true,
        },
      }),
      signal: AbortSignal.timeout(18000),
    });

    const payload = (await response.json().catch(() => null)) as {
      success?: boolean;
      data?: { web?: unknown[] };
    } | null;

    if (!response.ok || !payload?.success || !Array.isArray(payload.data?.web)) {
      return fallbackDesignInspiration(info);
    }

    const references = payload.data.web
      .filter(isRecord)
      .map((item) => ({
        title: compactText(asString(item.title) || "Premium landing reference", 120),
        url: compactText(asString(item.url), 220),
        description: compactText(asString(item.description), 360),
        summary: compactText(asString(item.markdown) || asString(item.summary), 520),
      }))
      .filter((item) => item.url)
      .slice(0, 5);

    return formatReferences(references, info);
  } catch {
    return fallbackDesignInspiration(info);
  }
}

function buildCleanBusinessData(input: z.infer<typeof requestSchema>): CleanBusinessData {
  const { info, businessUnderstanding } = input;
  const understanding = isRecord(businessUnderstanding) ? businessUnderstanding : {};
  const industry = isRecord(understanding.industry) ? understanding.industry : {};
  const theme = isRecord(understanding.theme) ? understanding.theme : {};
  const contact = isRecord(understanding.contact) ? understanding.contact : {};
  const services = unique([...splitList(info.services), ...stringList(understanding.services)]).slice(0, 14);
  const visibleColors = unique([...splitList(info.brandColors, 8), ...stringList(theme.palette, 8)]).slice(0, 8);
  const missingFromUnderstanding = stringList(understanding.missingInformation, 12);
  const assumptions = stringList(understanding.assumptions, 12);
  const category = info.category.trim() || asString(industry.primaryIndustry) || asString(industry.businessModel);
  const location = info.location.trim() || asString(contact.location);
  const locationParts = location.split(",").map((part) => part.trim()).filter(Boolean);
  const phone = info.phone.trim() || asString(contact.phone);
  const email = info.email.trim() || asString(contact.email);
  const websiteUrl = info.websiteUrl.trim() || asString(contact.website);
  const socialLinks = unique([info.socialUrl.trim(), asString(contact.social)]).filter((item) => /^https?:\/\//i.test(item));
  const confidenceValues = [
    typeof understanding.businessNameConfidence === "number" ? understanding.businessNameConfidence : null,
    isRecord(understanding.industry) && typeof understanding.industry.confidence === "number" ? understanding.industry.confidence : null,
  ].filter((item): item is number => typeof item === "number");
  const dataConfidence = confidenceValues.length
    ? Math.round(confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length)
    : Math.max(45, Math.min(88, 45 + [info.businessName, category, location, phone || email, services.join(", ")].filter(Boolean).length * 8));

  const missingFields = unique([
    ...missingFromUnderstanding,
    !phone ? "phone" : "",
    !email ? "email" : "",
    !location ? "service area or location" : "",
    !services.length ? "services or products" : "",
    !visibleColors.length ? "brand colors" : "",
    "verified reviews/testimonials",
    "verified awards/certifications",
    "verified business photography",
  ]);

  const verifiedFacts = [
    info.businessName.trim() ? `Business name: ${info.businessName.trim()}` : "",
    category ? `Business type: ${category}` : "",
    location ? `Location/service area: ${location}` : "",
    phone ? "Phone available" : "",
    email ? "Email available" : "",
    websiteUrl ? "Website URL available" : "",
    socialLinks.length ? "Social profile available" : "",
    services.length ? `Visible services/products: ${services.join(", ")}` : "",
    visibleColors.length ? `Visible colors: ${visibleColors.join(", ")}` : "",
  ].filter(Boolean);

  return {
    companyName: info.businessName.trim() || asString(understanding.selectedBusinessName) || "Demo Business",
    businessType: category || "Local business",
    visibleDescription: compactText([info.notes, info.painPoints, info.rawInfo].filter(Boolean).join(" "), 900),
    services,
    products: [],
    phone,
    email,
    websiteUrl,
    address: location,
    city: locationParts[0] || "",
    country: locationParts.length > 1 ? locationParts[locationParts.length - 1] : "",
    socialLinks,
    visibleColors,
    logoDescription: compactText([asString(theme.logo), ...stringList(theme.visualClues, 6)].filter(Boolean).join("; "), 420),
    targetAudience: location ? `Customers in or near ${location} looking for ${category || "this service"}.` : `Customers looking for ${category || "this service"}.`,
    brandTone: compactText([asString(theme.mood), asString(theme.variation), modeDirection(input.generationMode)].filter(Boolean).join(" "), 520),
    missingFields,
    dataConfidence,
    unsafeOrUnverifiedClaims: unique([
      ...assumptions,
      "Do not invent testimonials, ratings, awards, certifications, prices, guarantees, customer counts, or years in business.",
      "Do not present representative imagery or placeholder proof as verified business evidence.",
    ]),
    verifiedFacts,
    rawExtractedData: compactBusinessFacts(info).slice(0, 8000),
  };
}

function safeDebug(generationId: string, label: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[premium-generation:${generationId}] ${label}`, data);
}

function buildMagicUiReferenceBrief(cleanBusinessData: CleanBusinessData) {
  return [
    "Reference library: Magic UI (https://github.com/magicuidesign/magicui).",
    "Use Magic UI as aesthetic and interaction inspiration only. Do not copy source code, imports, React components, Tailwind classes, package names, registry commands, or Magic UI branding into the generated website.",
    "Translate the strongest ideas into original single-file HTML/CSS/JS patterns that work without React, Tailwind, Framer Motion, shadcn, npm packages, or external JavaScript.",
    `Business fit: choose only effects that support ${cleanBusinessData.companyName} as a ${cleanBusinessData.businessType}. Local service, hospitality, beauty, trade, care, retail, and professional businesses should feel polished and alive, not like generic AI/SaaS demos.`,
    "Useful Magic UI pattern families to adapt:",
    "- Hero depth: warp-background, animated-grid-pattern, retro-grid, dot/grid/hex/striped patterns, light-rays, noise-texture, and particles translated into CSS pseudo-elements, gradients, masks, and subtle keyframes.",
    "- Layout systems: bento-grid, animated-list, progressive-blur, and visual montage translated into varied section rhythm, layered cards, asymmetric feature/service groups, and polished reveal states.",
    "- Trust/proof movement: marquee and avatar-circles translated into slow, optional, accessible proof rails only when real logos/reviews/people exist; otherwise use static verified fact rails or clearly labeled placeholders.",
    "- Card polish: magic-card, border-beam, shine-border, glare-hover, neon-gradient-card, and backlight translated into tasteful hover highlights, moving border sheens, light sweeps, and depth tied to the brand palette.",
    "- Text emphasis: blur-fade, text-animate, aurora-text, line-shadow-text, text-reveal, highlighter, and animated-gradient-text translated into restrained headline accents, staggered reveals, and highlighted phrases.",
    "- CTA polish: shiny-button, shimmer-button, ripple-button, interactive-hover-button, and pulsating-button translated into one consistent primary CTA treatment with focus-visible states and no layout shift.",
    "Selection rules:",
    "- Pick one primary Magic UI-inspired pattern and one supporting effect per page. Do not stack many effects in one viewport.",
    "- Motion must clarify hierarchy or make the page feel premium; never hide essential content until JavaScript runs.",
    "- Use CSS-only or tiny guarded vanilla JS. Include prefers-reduced-motion support.",
    "- Effects must preserve contrast, readability, mobile performance, and no-horizontal-overflow behavior.",
    "- Avoid confetti, cursor replacements, comic text, fake social proof, fake avatars, and developer-product visuals unless the business context truly calls for them.",
  ].join("\n");
}

function fallbackPremiumWebsitePlan(
  cleanBusinessData: CleanBusinessData,
  designInspiration: string,
  generationMode: string,
  templatePack: SelectedTemplatePack,
): PremiumWebsitePlan {
  const serviceLabel = cleanBusinessData.services.slice(0, 3).join(", ") || cleanBusinessData.businessType;
  const imageDirection = photoDirection({
    ...businessInfoSchema.parse({}),
    category: cleanBusinessData.businessType,
    services: serviceLabel,
    location: cleanBusinessData.address,
  });

  return {
    businessPositioning: `${cleanBusinessData.companyName} should feel like a credible, composed ${cleanBusinessData.businessType} choice with a custom local presence instead of a generic brochure. Use the ${templatePack.name} internal template pack as the structural starting point, then customize it to the verified business data.`,
    targetCustomer: cleanBusinessData.targetAudience,
    emotionalHook: `Make the visitor feel that ${cleanBusinessData.companyName} is organized, trustworthy, and worth contacting before they compare alternatives.`,
    conversionGoal: cleanBusinessData.phone || cleanBusinessData.email ? "Drive a direct call, email, or enquiry using verified contact paths." : "Drive a low-friction enquiry with clearly labeled demo placeholders for missing contact details.",
    visualHook: `Create one poster-worthy first-screen idea for ${cleanBusinessData.businessType}: oversized editorial type, niche-matched hero photography, layered service detail cards, and a visible motif that could only belong to this business category.`,
    visualDirection: `${modeDirection(generationMode)} Make the first 5 seconds visually magnetic: bold but tasteful scale contrast, asymmetric media, rich section rhythm, and one memorable motif tied to ${cleanBusinessData.businessType}; avoid generic card grids and text-only sections. Internal template direction: ${compactText(templatePack.brief, 850)} ${compactText(designInspiration, 700)}`,
    colorSystem: cleanBusinessData.visibleColors.length
      ? `Elevate the visible palette (${cleanBusinessData.visibleColors.join(", ")}) with deep neutrals, soft surfaces, and one disciplined accent.`
      : "Create a refined palette from industry cues: deep neutral base, warm surface colors, and one confident accent.",
    typographyDirection: "Use editorial display type for major headings, a highly readable sans-serif for interface/copy, generous line-height, balanced headings, and a controlled type scale.",
    imageDirection,
    compositionRhythm: "Alternate high-impact visual sections with tighter proof and decision sections: hero montage, trust strip, asymmetric services, full-bleed showcase, process timeline, CTA band. No two consecutive sections should share the same centered-heading/card-grid pattern.",
    signatureInteraction: "Use restrained but memorable motion: reveal layers in the hero, tactile hover states on service cards, FAQ accordion, mobile nav, and reduced-motion support. Do not hide essential content behind animation.",
    sectionList: [
      { id: "header", title: "Sticky premium navigation", purpose: "Orient the visitor and keep contact available.", visualTreatment: "Transparent-to-solid sticky bar with compact anchors.", conversionJob: "Make the primary CTA reachable at all times." },
      { id: "hero", title: "Cinematic hero", purpose: "Explain what the business does, for whom, and why it is worth contacting.", visualTreatment: "Poster-quality first viewport with oversized type, layered niche photography, proof cue, and one memorable visual motif.", conversionJob: "Earn attention within five seconds and make the first click or scroll feel obvious." },
      { id: "trust", title: "Trust bridge", purpose: "Show verified facts and honest proof placeholders.", visualTreatment: "Premium stat/fact strip with restrained borders.", conversionJob: "Reduce uncertainty without fake claims." },
      { id: "services", title: "Service architecture", purpose: "Group visible services by customer intent.", visualTreatment: "Asymmetric service cards with photography, numbered priorities, or tactile material/detail treatments instead of equal bland boxes.", conversionJob: "Help visitors find the relevant offer." },
      { id: "difference", title: "Why this experience feels better", purpose: "Translate the business context into a differentiated customer journey.", visualTreatment: "Split editorial section with material or process imagery.", conversionJob: "Create preference." },
      { id: "showcase", title: "Visual showcase", purpose: "Make the niche tangible through representative, honestly labeled photography.", visualTreatment: "High-impact gallery with varied image ratios, overlap, captions, and one full-bleed or near-full-bleed visual moment.", conversionJob: "Replace abstract promises with visual confidence." },
      { id: "process", title: "Process and expectations", purpose: "Explain how to enquire, confirm availability, or book.", visualTreatment: "Numbered timeline with mobile-friendly cards.", conversionJob: "Remove friction." },
      { id: "faq", title: "Decision-support FAQ", purpose: "Answer realistic questions using only supplied facts or clear placeholders.", visualTreatment: "Accessible accordion.", conversionJob: "Resolve objections." },
      { id: "contact", title: "Final CTA and contact", purpose: "Give the visitor a clear next step.", visualTreatment: "High-contrast CTA band plus contact card/footer.", conversionJob: "Convert intent into contact." },
    ],
    ctaStrategy: "Use one primary CTA consistently, plus a secondary CTA for viewing services or confirming availability. Use tel/mailto links only when verified.",
    trustStrategy: "Use verified facts first. Where proof is missing, show clearly labeled slots such as 'Verified reviews to add' or 'Replace with business photography'.",
    missingDataPlaceholderStrategy: `Missing fields: ${cleanBusinessData.missingFields.join(", ")}. Use professional demo placeholders and labels; never present placeholders as real facts.`,
    seoKeywordStrategy: unique([cleanBusinessData.companyName, cleanBusinessData.businessType, cleanBusinessData.city, ...cleanBusinessData.services.slice(0, 5)]).join(", "),
    animationMicrointeractionStrategy: "Use scroll reveal, accordion interactions, mobile nav, subtle hover transforms, and reduced-motion support. Animate only opacity and transform.",
    mobileLayoutStrategy: "Mobile-first with no horizontal overflow, strong first viewport, 44px tap targets, sticky CTA access, readable typography at 360px and 430px.",
  };
}

function buildPlanPrompt(
  cleanBusinessData: CleanBusinessData,
  designInspiration: string,
  generationMode: string,
  templatePack: SelectedTemplatePack,
) {
  return `You are a senior creative director and conversion strategist for premium local-business website demos.

Create a business-specific PremiumWebsitePlan as JSON only. Do not return markdown.

Clean business data:
${JSON.stringify(cleanBusinessData, null, 2)}

Premium landing-page inspiration research:
${designInspiration}

SERAPHIM INTERNAL TEMPLATE PACK:
${templatePack.brief}

Generation direction: ${modeDirection(generationMode)}

Return exactly this JSON shape:
{
  "businessPositioning": "specific positioning",
  "targetCustomer": "specific target customer",
  "emotionalHook": "specific emotional hook",
  "conversionGoal": "primary conversion goal",
  "visualHook": "one poster-worthy first-screen visual idea that fits this exact business",
  "visualDirection": "custom visual thesis",
  "colorSystem": "specific color system",
  "typographyDirection": "specific type direction",
  "imageDirection": "specific photography/art direction",
  "compositionRhythm": "how section layouts vary so the page feels custom and eye-catching",
  "signatureInteraction": "one restrained but memorable interaction or motion idea",
  "sectionList": [
    {"id":"header","title":"...","purpose":"...","visualTreatment":"...","conversionJob":"..."}
  ],
  "ctaStrategy": "...",
  "trustStrategy": "...",
  "missingDataPlaceholderStrategy": "...",
  "seoKeywordStrategy": "...",
  "animationMicrointeractionStrategy": "...",
  "mobileLayoutStrategy": "..."
}

Rules:
- Include at least 9 meaningful sections, including header, cinematic hero, trust bridge, services/products, differentiator/story, visual showcase, process, FAQ, contact/footer.
- Use the selected Seraphim template pack as the structure and design DNA for this plan, but make the final plan specific to this business. Do not copy external template code or exact layouts.
- Do not invent reviews, awards, prices, certifications, addresses, phone numbers, years in business, or guarantees.
- Make the plan specific to the business type, visible colors, services, audience, and missing data.
- The plan should force a custom, expensive, image-led website rather than a generic template.
- The visual hook must be bold enough to make the page impressive in the first 5 seconds, while still believable for the business.
- Avoid safe defaults: centered hero plus cards, bland white sections, generic blue/purple gradients, and identical section layouts.`;
}

function parseJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object found.");
  return JSON.parse(fenced.slice(start, end + 1)) as unknown;
}

function normalizePlan(value: unknown, fallback: PremiumWebsitePlan): PremiumWebsitePlan {
  if (!isRecord(value)) return fallback;
  const sectionList = Array.isArray(value.sectionList)
    ? value.sectionList
        .filter(isRecord)
        .map((section, index) => ({
          id: asString(section.id) || `section-${index + 1}`,
          title: asString(section.title) || `Section ${index + 1}`,
          purpose: asString(section.purpose) || "Support the conversion story.",
          visualTreatment: asString(section.visualTreatment) || "Premium editorial layout.",
          conversionJob: asString(section.conversionJob) || "Move the visitor toward contact.",
        }))
        .slice(0, 14)
    : fallback.sectionList;

  return {
    businessPositioning: asString(value.businessPositioning) || fallback.businessPositioning,
    targetCustomer: asString(value.targetCustomer) || fallback.targetCustomer,
    emotionalHook: asString(value.emotionalHook) || fallback.emotionalHook,
    conversionGoal: asString(value.conversionGoal) || fallback.conversionGoal,
    visualHook: asString(value.visualHook) || fallback.visualHook,
    visualDirection: asString(value.visualDirection) || fallback.visualDirection,
    colorSystem: asString(value.colorSystem) || fallback.colorSystem,
    typographyDirection: asString(value.typographyDirection) || fallback.typographyDirection,
    imageDirection: asString(value.imageDirection) || fallback.imageDirection,
    compositionRhythm: asString(value.compositionRhythm) || fallback.compositionRhythm,
    signatureInteraction: asString(value.signatureInteraction) || fallback.signatureInteraction,
    sectionList: sectionList.length >= 8 ? sectionList : fallback.sectionList,
    ctaStrategy: asString(value.ctaStrategy) || fallback.ctaStrategy,
    trustStrategy: asString(value.trustStrategy) || fallback.trustStrategy,
    missingDataPlaceholderStrategy: asString(value.missingDataPlaceholderStrategy) || fallback.missingDataPlaceholderStrategy,
    seoKeywordStrategy: asString(value.seoKeywordStrategy) || fallback.seoKeywordStrategy,
    animationMicrointeractionStrategy: asString(value.animationMicrointeractionStrategy) || fallback.animationMicrointeractionStrategy,
    mobileLayoutStrategy: asString(value.mobileLayoutStrategy) || fallback.mobileLayoutStrategy,
  };
}

function buildPremiumWebsitePrompt(
  cleanBusinessData: CleanBusinessData,
  premiumWebsitePlan: PremiumWebsitePlan,
  options: { designInspiration: string; generationMode: string; templatePack: SelectedTemplatePack },
) {
  return `You are a senior creative director, conversion copywriter, and elite frontend engineer.

Create a complete ultra-premium single-file legacy \`index.html\` website for the business below.

This website must look like a custom $1,000+ website demo, not a generic AI template.

BUSINESS DATA:
${JSON.stringify(cleanBusinessData, null, 2)}

PREMIUM WEBSITE PLAN:
${JSON.stringify(premiumWebsitePlan, null, 2)}

PREMIUM REFERENCE AND PHOTO RESEARCH:
${options.designInspiration}

SERAPHIM INTERNAL TEMPLATE PACK:
${options.templatePack.brief}

GENERATION DIRECTION:
${modeDirection(options.generationMode)}

STRICT OUTPUT:
Return only the complete \`index.html\` code.
No markdown.
No explanation.
No partial snippets.

TECH RULES:
- Single file only.
- Use HTML, CSS inside \`<style>\`, and lightweight JS inside \`<script>\`.
- No React.
- No build tools.
- No external CSS.
- No external JavaScript.
- Remote images are allowed from reliable royalty-free sources.
- Must open directly in a browser.
- The selected template pack is an internal blueprint for section architecture, image direction, and component motifs. Do not copy external template source code, class names, branded assets, exact copy, or distinctive compositions.

DESIGN STANDARD:
The page must feel custom, expensive, modern, high-converting, and specific to this business.
It should also feel immediately eye-catching: a prospect should understand the offer and feel impressed within the first five seconds.

Avoid:
- generic SaaS template look
- basic Bootstrap/card layout
- plain white sections with simple cards
- random stock images
- fake testimonials
- fake phone numbers
- fake reviews
- fake prices
- fake addresses
- fake awards
- filler copy
- repeated layouts
- weak hero sections
- safe-but-boring compositions
- centered heading plus three cards repeated across the page
- decorative effects that do not connect to the niche

Required premium elements:
- strong SEO head
- Open Graph/Twitter metadata
- JSON-LD schema using verified info only
- inline favicon
- CSS variables for brand design tokens
- sticky responsive navigation
- mobile hamburger menu
- cinematic hero section
- high-quality industry-specific hero imagery or custom visual composition
- premium CTA buttons
- trust/credibility strip
- services/products cards
- strong visual showcase section
- conversion-focused CTA band
- FAQ accordion
- contact section
- footer
- scroll reveal animation
- hover microinteractions
- responsive layout
- no horizontal overflow
- readable mobile typography

COPY RULES:
- Use verified business details exactly.
- Use placeholders only where data is missing.
- Clearly label demo placeholders.
- Never present placeholder testimonials as real.
- Do not claim services/products that are not visible unless framed carefully as "ask about current availability."
- Make the business sound elevated but believable.

VISUAL RULES:
Create a custom visual identity based on:
- business type
- visible brand colors
- logo style
- audience
- local market
- industry mood
- customer pain points
- selected Seraphim template pack: ${options.templatePack.name}

The CSS must include:
- design tokens
- fluid typography
- strong spacing
- premium shadows
- gradients or layered backgrounds where appropriate
- card hover states
- responsive grid logic
- mobile nav styles
- animation classes
- reduced-motion support if possible

VISUAL MAGNETISM STANDARD:
- Build around the plan's visualHook, compositionRhythm, and signatureInteraction.
- The hero must feel like a designed poster or magazine opener, not a normal landing-page block.
- Use bold scale contrast: the h1 should be substantially larger than body text while still wrapping well on mobile.
- Use at least one distinctive niche-specific visual motif such as layered service photos, material textures, product/service detail crops, editorial captions, map/service-area framing, before/after style framing with no fake claims, or a crafted split composition.
- Use varied section compositions: asymmetric services, full-bleed or near-full-bleed showcase, split editorial story, process timeline, CTA band, and FAQ.
- Include depth that feels intentional: overlapping media, image masks, tasteful gradients, inset borders, surface contrast, strong shadows, or blend treatments where appropriate.
- Make hover states tactile and visible, but keep content stable.
- Do not let every section share the same background, padding, heading alignment, or card style.
- Use real HTTPS photography that visually corresponds to the business category; no random adjacent stock.

QUALITY BAR:
Before finalizing, mentally compare the result to premium reference \`index.html\` files.
If it feels basic, rewrite it until it feels premium.
If it feels merely clean but not eye-catching, rewrite the hero, showcase, and service section until they have stronger visual energy.
If it ignores the selected Seraphim template pack's industry-specific structure, rebuild the page around that pack while preserving verified facts.
The result should feel like a serious designer and senior frontend engineer built it.

Hard requirements:
- Include at least ${Math.max(9, premiumWebsitePlan.sectionList.length)} meaningful sections from the plan.
- Include at least four niche-matched HTTPS images or rich visual treatments, with representative captions when not verified.
- Include at least one visually distinctive first-screen motif and at least one high-impact showcase section.
- Use every supplied verified contact path correctly: tel: for phone, mailto: for email, HTTPS links for website/social.
- Use robots noindex,nofollow because this is a private demo.
- Footer must disclose that this is a website concept/private demo for review.
- Do not include local filesystem paths, API keys, or private implementation details.`;
}

function extractHtml(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced || text).trim();
  const start = candidate.search(/<!doctype html|<html/i);
  return start >= 0 ? candidate.slice(start).trim() : candidate;
}

function normalizeHtml(html: string) {
  let output = extractHtml(html);

  if (!/<!doctype html/i.test(output)) {
    output = `<!DOCTYPE html>\n${output}`;
  }

  if (!/<meta\s+name=["']robots["']/i.test(output)) {
    output = output.replace(/<head[^>]*>/i, (match) => `${match}\n  <meta name="robots" content="noindex, nofollow">`);
  }

  if (!/<\/html>\s*$/i.test(output)) {
    throw new Error("AI website generator did not return a complete HTML document.");
  }

  if (!/<style[\s>]/i.test(output) || !/<body[\s>]/i.test(output)) {
    throw new Error("AI website generator returned incomplete HTML.");
  }

  return output;
}

async function generateTextWithGemini(
  prompt: string,
  route: ModelRoute,
  options: { temperature?: number; maxOutputTokens?: number } = {},
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(route.model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.78,
          topP: 0.92,
          maxOutputTokens: options.maxOutputTokens ?? 50000,
          responseMimeType: "text/plain",
        },
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Gemini website generation failed.");
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text.trim()) throw new Error("Gemini did not return output.");

  return text;
}

async function generateWithGemini(prompt: string, route: ModelRoute) {
  const text = await generateTextWithGemini(prompt, route, { temperature: 0.82, maxOutputTokens: 60000 });
  return normalizeHtml(text);
}

async function generateTextWithOpenAI(prompt: string, route: ModelRoute, maxOutputTokens = 30000) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: route.model,
    input: prompt,
    max_output_tokens: maxOutputTokens,
  });

  if (!response.output_text?.trim()) {
    throw new Error("OpenAI did not return output.");
  }

  return response.output_text;
}

async function generateWithOpenAI(prompt: string, route: ModelRoute) {
  const text = await generateTextWithOpenAI(prompt, route, 50000);
  return normalizeHtml(text);
}

async function generateTextWithRoute(prompt: string, route: ModelRoute, options: { temperature?: number; maxOutputTokens?: number } = {}) {
  return route.provider === "gemini"
    ? generateTextWithGemini(prompt, route, options)
    : generateTextWithOpenAI(prompt, route, options.maxOutputTokens ?? 30000);
}

async function generatePremiumWebsitePlan(
  cleanBusinessData: CleanBusinessData,
  designInspiration: string,
  generationMode: string,
  generationId: string,
  templatePack: SelectedTemplatePack,
) {
  const fallback = fallbackPremiumWebsitePlan(cleanBusinessData, designInspiration, generationMode, templatePack);
  const prompt = buildPlanPrompt(cleanBusinessData, designInspiration, generationMode, templatePack);
  const errors: string[] = [];

  for (const route of getRoutesForStage("planning")) {
    try {
      const text = await generateTextWithRoute(prompt, route, { temperature: 0.55, maxOutputTokens: 12000 });
      const plan = normalizePlan(parseJsonObject(text), fallback);
      return {
        plan,
        metadata: { stage: "planning", provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  safeDebug(generationId, "planning-fallback", { errors: errors.slice(-3) });
  return {
    plan: fallback,
    metadata: { stage: "planning", provider: "local", model: "fallback-premium-plan", fallback: true } satisfies StageMetadata,
    errors,
  };
}

async function generateFinalHtml(prompt: string) {
  const errors: string[] = [];

  for (const route of getRoutesForStage("section")) {
    try {
      const html = route.provider === "gemini" ? await generateWithGemini(prompt, route) : await generateWithOpenAI(prompt, route);
      return {
        html,
        metadata: { stage: "section", provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  throw new Error(`AI website generation could not complete. Last errors: ${errors.slice(-3).join(" | ")}`);
}

function htmlCount(html: string, pattern: RegExp) {
  return html.match(pattern)?.length ?? 0;
}

function hardRejectionReasons(html: string, cleanBusinessData: CleanBusinessData) {
  const reasons: string[] = [];
  const sectionCount = htmlCount(html, /<section\b/gi);
  const imageCount = htmlCount(html, /<img\b[^>]*https?:\/\//gi);
  const visualMotifCount = [
    /hero/i.test(html),
    /(showcase|gallery|portfolio|visual)/i.test(html),
    /(mask-image|clip-path|mix-blend-mode|backdrop-filter|object-fit|aspect-ratio)/i.test(html),
    /(::before|::after|radial-gradient|linear-gradient)/i.test(html),
    /(overlap|layer|stack|collage|montage|editorial|cinematic|poster)/i.test(html),
  ].filter(Boolean).length;

  if (sectionCount < 8) reasons.push(`Only ${sectionCount} section elements found; premium output requires at least 8 meaningful sections.`);
  if (!/<script\b[^>]*type=["']application\/ld\+json["']/i.test(html)) reasons.push("Missing JSON-LD schema.");
  if (!/<meta\s+(?:name|property)=["'](?:description|og:title|twitter:card)/i.test(html)) reasons.push("SEO/Open Graph/Twitter metadata is incomplete.");
  if (!/<nav\b/i.test(html) || !/(hamburger|menu-toggle|aria-expanded|mobile-menu)/i.test(html)) reasons.push("Missing responsive premium navigation/mobile menu behavior.");
  if (!/(faq|accordion|details|aria-controls)/i.test(html)) reasons.push("Missing FAQ accordion or decision-support interaction.");
  if (!/(reveal|intersectionobserver|data-reveal|scroll)/i.test(html)) reasons.push("Missing scroll reveal or interaction layer.");
  if (imageCount < 3 && !/(showcase|gallery|visual)/i.test(html)) reasons.push("Missing rich niche-matched photography or visual showcase.");
  if (imageCount < 4) reasons.push(`Only ${imageCount} remote image elements found; eye-catching demos need at least four niche-matched visual moments.`);
  if (visualMotifCount < 4) reasons.push("Missing a distinctive visual motif or high-impact composition; the page may be premium but not eye-catching enough.");
  if (!/--[a-z0-9-]+\s*:/i.test(html)) reasons.push("Missing CSS custom-property design tokens.");
  if (/bootstrap|cdn\.jsdelivr\.net\/npm\/bootstrap|tailwind/i.test(html)) reasons.push("Looks like a framework/template instead of a bespoke single-file site.");
  if (!html.toLowerCase().includes(cleanBusinessData.companyName.toLowerCase().slice(0, Math.min(12, cleanBusinessData.companyName.length)))) {
    reasons.push("Business identity is not prominent enough in the generated HTML.");
  }
  if (/(five-star|5-star|hundreds of|award-winning|certified|guaranteed|since 19|since 20)/i.test(html)) {
    reasons.push("Potential unsupported claims detected; verified proof must not be invented.");
  }

  return reasons;
}

function heuristicQualityGate(html: string, cleanBusinessData: CleanBusinessData): QualityGate {
  const dimensions: Record<string, number> = {
    visualPremiumFeel: 5,
    visualMagnetism: 5,
    brandSpecificity: 5,
    sectionDepth: 5,
    conversionClarity: 5,
    seoCompleteness: 5,
    mobileResponsiveness: 5,
    imageQuality: 5,
    interactionQuality: 5,
    factualSafety: 8,
    codeCleanliness: 6,
  };

  const sectionCount = htmlCount(html, /<section\b/gi);
  const imageCount = htmlCount(html, /<img\b[^>]*https?:\/\//gi);
  const hasCssTokens = /--[a-z0-9-]+\s*:/i.test(html);
  const hasMedia = /@media\s*\(/i.test(html);
  const hasSeo = /<title>/i.test(html) && /meta\s+name=["']description/i.test(html) && /og:title|twitter:card/i.test(html);
  const hasSchema = /application\/ld\+json/i.test(html);
  const hasFaq = /(faq|accordion|details|aria-controls)/i.test(html);
  const hasReveal = /(intersectionobserver|data-reveal|reveal)/i.test(html);
  const hasNav = /<nav\b/i.test(html) && /(aria-expanded|menu-toggle|hamburger|mobile-menu)/i.test(html);
  const hasContact = Boolean((cleanBusinessData.phone && html.includes("tel:")) || (cleanBusinessData.email && html.includes("mailto:")) || /contact/i.test(html));
  const visualMotifs = [
    /(mask-image|clip-path|mix-blend-mode|backdrop-filter)/i.test(html),
    /(aspect-ratio|object-fit)/i.test(html),
    /(::before|::after)/i.test(html),
    /(radial-gradient|linear-gradient)/i.test(html),
    /(showcase|gallery|portfolio|visual)/i.test(html),
    /(overlap|layer|stack|collage|montage|editorial|cinematic|poster)/i.test(html),
    /font-size:\s*clamp\([^;]+(4rem|5rem|6rem|7rem|8rem|9rem|10rem)/i.test(html),
  ];
  const hardReasons = hardRejectionReasons(html, cleanBusinessData);

  dimensions.sectionDepth = Math.min(10, 3 + sectionCount);
  dimensions.imageQuality = Math.min(10, 3 + imageCount * 1.5 + (/(unsplash|images\.pexels|images\.food|images)/i.test(html) ? 1 : 0));
  dimensions.seoCompleteness = [hasSeo, hasSchema, /robots/i.test(html), /theme-color/i.test(html), /favicon/i.test(html)].filter(Boolean).length * 2;
  dimensions.mobileResponsiveness = [hasMedia, /overflow-x:\s*hidden/i.test(html), /clamp\(/i.test(html), hasNav].filter(Boolean).length * 2.5;
  dimensions.interactionQuality = [hasFaq, hasReveal, /addEventListener/i.test(html), /prefers-reduced-motion/i.test(html)].filter(Boolean).length * 2.5;
  dimensions.brandSpecificity = [cleanBusinessData.companyName && html.includes(cleanBusinessData.companyName), cleanBusinessData.businessType && html.toLowerCase().includes(cleanBusinessData.businessType.toLowerCase().split(" ")[0]), cleanBusinessData.services.some((service) => html.toLowerCase().includes(service.toLowerCase().split(" ")[0])), cleanBusinessData.visibleColors.some((color) => html.toLowerCase().includes(color.toLowerCase()))].filter(Boolean).length * 2.5;
  dimensions.conversionClarity = [hasContact, /cta|call|quote|book|enquiry|availability/i.test(html), /footer/i.test(html), /button|btn/i.test(html)].filter(Boolean).length * 2.5;
  dimensions.visualPremiumFeel = [hasCssTokens, imageCount >= 3, /hero/i.test(html), /(showcase|gallery|editorial|cinematic|surface|shadow|gradient)/i.test(html)].filter(Boolean).length * 2.5;
  dimensions.visualMagnetism = Math.min(10, 2 + visualMotifs.filter(Boolean).length * 1.35 + (imageCount >= 4 ? 1 : 0));
  dimensions.factualSafety = hardReasons.some((reason) => /unsupported/i.test(reason)) ? 5 : 9;
  dimensions.codeCleanliness = [/<style[\s>]/i.test(html), /<script[\s>]/i.test(html), !/file:\/\//i.test(html), !/console\.log/i.test(html)].filter(Boolean).length * 2.5;

  const average = Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.values(dimensions).length;
  const score = Math.max(1, Math.min(10, hardReasons.length ? Math.min(8.4, average) : average));

  return {
    score: Number(score.toFixed(1)),
    passed: score >= 8.5 && hardReasons.length === 0,
    dimensionScores: dimensions,
    rejectionReasons: hardReasons,
    revisionBrief: hardReasons.length
      ? `Revise the website to fix: ${hardReasons.join(" ")}`
      : "Improve premium polish, image-led composition, section depth, and conversion specificity.",
    source: "heuristic",
  };
}

function buildQaPrompt(
  html: string,
  cleanBusinessData: CleanBusinessData,
  premiumWebsitePlan: PremiumWebsitePlan,
  templatePack: SelectedTemplatePack,
) {
  return `You are a strict premium website QA reviewer.

Score this generated single-file website from 1-10 against the rubric. Return JSON only.

Business data:
${JSON.stringify(cleanBusinessData, null, 2)}

Premium plan:
${JSON.stringify(premiumWebsitePlan, null, 2)}

Selected Seraphim template pack:
${templatePack.brief}

HTML to review:
${html.slice(0, 70000)}

Rubric dimensions:
- visualPremiumFeel
- visualMagnetism
- brandSpecificity
- sectionDepth
- conversionClarity
- seoCompleteness
- mobileResponsiveness
- imageQuality
- interactionQuality
- factualSafety
- codeCleanliness

Hard reject if it looks like Bootstrap, generic SaaS, lacks business-specific visual identity, has fewer than 8 meaningful sections, misses SEO/schema/nav/FAQ/scroll reveal, invents fake proof, is placeholder-heavy when data exists, or feels clean but not visually memorable.
Hard reject if the page ignores the selected industry template pack and falls back to a generic landing-page structure.

Visual magnetism review:
- Score below 8 if the first viewport is a normal centered hero with no memorable image composition.
- Score below 8 if services/showcase/process all use the same card-grid rhythm.
- Score below 8 if imagery is present but not treated as a designed composition.
- Score below 8 if the page has no refined reference-library-inspired effect, such as a subtle animated background, border sheen, light-ray/noise layer, bento rhythm, progressive blur, shimmer CTA, or tactile card hover.
- Score 9+ only when the page has a strong visual hook, niche-specific photography direction, bold but controlled typography, varied section rhythm, and at least one distinctive motif inspired by the reference library but implemented as original single-file HTML/CSS/JS.

Return exactly:
{
  "score": 8.7,
  "passed": true,
  "dimensionScores": {"visualPremiumFeel": 9, "visualMagnetism": 9, "brandSpecificity": 9, "sectionDepth": 9, "conversionClarity": 9, "seoCompleteness": 9, "mobileResponsiveness": 9, "imageQuality": 9, "interactionQuality": 9, "factualSafety": 9, "codeCleanliness": 9},
  "rejectionReasons": [],
  "revisionBrief": "specific improvement brief"
}`;
}

function normalizeQualityGate(value: unknown, fallback: QualityGate): QualityGate {
  if (!isRecord(value)) return fallback;
  const dimensionScores = isRecord(value.dimensionScores)
    ? Object.fromEntries(
        Object.entries(value.dimensionScores).map(([key, score]) => [key, typeof score === "number" ? Math.max(1, Math.min(10, score)) : 5]),
      )
    : fallback.dimensionScores;
  const score = typeof value.score === "number" ? Math.max(1, Math.min(10, value.score)) : fallback.score;
  return {
    score: Number(score.toFixed(1)),
    passed: Boolean(value.passed) && score >= 8.5,
    dimensionScores,
    rejectionReasons: stringList(value.rejectionReasons, 12),
    revisionBrief: asString(value.revisionBrief) || fallback.revisionBrief,
    source: "model",
  };
}

async function scoreGeneratedWebsite(
  html: string,
  cleanBusinessData: CleanBusinessData,
  premiumWebsitePlan: PremiumWebsitePlan,
  templatePack: SelectedTemplatePack,
) {
  const heuristic = heuristicQualityGate(html, cleanBusinessData);
  const errors: string[] = [];

  for (const route of getRoutesForStage("qa")) {
    try {
      const text = await generateTextWithRoute(buildQaPrompt(html, cleanBusinessData, premiumWebsitePlan, templatePack), route, {
        temperature: 0.2,
        maxOutputTokens: 6000,
      });
      const modelGate = normalizeQualityGate(parseJsonObject(text), heuristic);
      const hardReasons = hardRejectionReasons(html, cleanBusinessData);
      const rejectionReasons = unique([...modelGate.rejectionReasons, ...heuristic.rejectionReasons, ...hardReasons]);
      const score = hardReasons.length ? Math.min(8.4, modelGate.score, heuristic.score) : Math.min(modelGate.score, Math.max(heuristic.score, modelGate.score - 0.6));
      return {
        gate: {
          ...modelGate,
          score: Number(score.toFixed(1)),
          passed: score >= 8.5 && rejectionReasons.length === 0,
          rejectionReasons,
          revisionBrief: rejectionReasons.length ? `Revise the website to fix: ${rejectionReasons.join(" ")}` : modelGate.revisionBrief,
          source: "combined" as const,
        },
        metadata: { stage: "qa", provider: route.provider, model: route.model, fallback: route.fallback } satisfies StageMetadata,
        errors,
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  return {
    gate: heuristic,
    metadata: { stage: "qa", provider: "local", model: "heuristic-premium-gate", fallback: true } satisfies StageMetadata,
    errors,
  };
}

async function reviseGeneratedWebsite(
  html: string,
  cleanBusinessData: CleanBusinessData,
  premiumWebsitePlan: PremiumWebsitePlan,
  qualityGate: QualityGate,
  templatePack: SelectedTemplatePack,
) {
  const prompt = `You are an elite frontend engineer revising a weak generated landing page.

Return only the complete revised index.html. No markdown.

Fix these premium QA failures:
${qualityGate.rejectionReasons.join("\n") || qualityGate.revisionBrief}

Business data:
${JSON.stringify(cleanBusinessData, null, 2)}

Premium plan:
${JSON.stringify(premiumWebsitePlan, null, 2)}

Selected Seraphim template pack:
${templatePack.brief}

Existing HTML:
${html.slice(0, 90000)}

Revision rules:
- Preserve verified facts exactly.
- Do not invent testimonials, ratings, awards, certifications, prices, guarantees, addresses, phone numbers, or years in business.
- Make it visibly more premium, custom, image-led, business-specific, and conversion-focused.
- Rebuild around the selected Seraphim template pack's industry structure, motifs, and image strategy if the existing HTML drifted into a generic layout.
- If visual magnetism is weak, rewrite the hero, services, and showcase sections with a stronger first-screen visual hook, bolder typography scale, layered niche photography, varied section rhythm, and a distinctive motif tied to the business category.
- Add exactly one primary Magic UI-inspired pattern translated into original CSS/JS, such as a subtle animated grid/noise/light layer, border-beam-style card highlight, shimmer CTA, bento service rhythm, progressive blur, or tactile glare hover. Do not add React, Tailwind, imports, external JavaScript, or Magic UI branding.
- Keep the result tasteful and credible; eye-catching should come from composition, imagery, type contrast, spacing, and craft rather than gimmicks.
- Ensure strong SEO head, JSON-LD, sticky responsive nav, cinematic hero, at least 8 sections, FAQ accordion, scroll reveal, polished footer, and no horizontal overflow.`;

  const result = await generateFinalHtml(prompt);
  return {
    html: result.html,
    metadata: { ...result.metadata, stage: "revision" },
    errors: result.errors,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        generationId: isRecord(body) ? asString(body.generationId) : "",
        error: "Invalid website generation request.",
        details: parsed.error.flatten(),
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const pipelineMetadata: StageMetadata[] = [];
  const generationId = parsed.data.generationId;

  try {
    const cleanBusinessData = buildCleanBusinessData(parsed.data);
    const selectedTemplatePack = selectTemplatePack({
      businessType: cleanBusinessData.businessType,
      visibleDescription: cleanBusinessData.visibleDescription,
      services: cleanBusinessData.services,
      products: cleanBusinessData.products,
      targetAudience: cleanBusinessData.targetAudience,
    });
    safeDebug(generationId, "clean-data", {
      companyName: cleanBusinessData.companyName,
      businessType: cleanBusinessData.businessType,
      services: cleanBusinessData.services.length,
      colors: cleanBusinessData.visibleColors.length,
      missingFields: cleanBusinessData.missingFields,
      dataConfidence: cleanBusinessData.dataConfidence,
    });
    safeDebug(generationId, "template-pack", {
      id: selectedTemplatePack.id,
      name: selectedTemplatePack.name,
      qualityTier: selectedTemplatePack.qualityTier,
      matchedKeywords: selectedTemplatePack.matchedKeywords,
      sourceModes: selectedTemplatePack.sources.map((source) => `${source.name}:${source.mode}`),
    });

    const liveDesignInspiration = await buildDesignInspirationBrief(parsed.data.info);
    const magicUiReference = buildMagicUiReferenceBrief(cleanBusinessData);
    const designInspiration = [liveDesignInspiration, magicUiReference].join("\n\n");
    safeDebug(generationId, "reference-library", {
      source: "magicuidesign/magicui",
      mode: "single-file-html-css-js-adaptation",
      promptLength: magicUiReference.length,
    });
    const planResult = await generatePremiumWebsitePlan(
      cleanBusinessData,
      designInspiration,
      parsed.data.generationMode,
      generationId,
      selectedTemplatePack,
    );
    pipelineMetadata.push(planResult.metadata);
    safeDebug(generationId, "premium-plan", {
      model: planResult.metadata.model,
      sectionCount: planResult.plan.sectionList.length,
      visualDirectionLength: planResult.plan.visualDirection.length,
    });

    const prompt = buildPremiumWebsitePrompt(cleanBusinessData, planResult.plan, {
      designInspiration,
      generationMode: parsed.data.generationMode,
      templatePack: selectedTemplatePack,
    });
    safeDebug(generationId, "final-prompt", {
      length: prompt.length,
      generationMode: parsed.data.generationMode,
      templatePack: selectedTemplatePack.id,
      sectionRoutes: getRoutesForStage("section").map((route) => `${route.provider}:${route.model}`),
    });

    let generation = await generateFinalHtml(prompt);
    pipelineMetadata.push(generation.metadata);

    let qa = await scoreGeneratedWebsite(generation.html, cleanBusinessData, planResult.plan, selectedTemplatePack);
    pipelineMetadata.push(qa.metadata);
    let revisionCount = 0;
    safeDebug(generationId, "quality-gate", {
      score: qa.gate.score,
      passed: qa.gate.passed,
      rejectionReasons: qa.gate.rejectionReasons,
    });

    if (!qa.gate.passed) {
      const revision = await reviseGeneratedWebsite(generation.html, cleanBusinessData, planResult.plan, qa.gate, selectedTemplatePack);
      generation = {
        html: revision.html,
        metadata: revision.metadata,
        errors: revision.errors,
      };
      pipelineMetadata.push(revision.metadata);
      revisionCount = 1;

      qa = await scoreGeneratedWebsite(generation.html, cleanBusinessData, planResult.plan, selectedTemplatePack);
      pipelineMetadata.push(qa.metadata);
      safeDebug(generationId, "quality-gate-after-revision", {
        score: qa.gate.score,
        passed: qa.gate.passed,
        rejectionReasons: qa.gate.rejectionReasons,
      });
    }

    return NextResponse.json(
      {
        generationId,
        html: generation.html,
        modelMetadata: generation.metadata,
        pipelineModelMetadata: pipelineMetadata,
        cleanedBusinessData: cleanBusinessData,
        generationPlan: {
          generationId,
          stage: "planning",
          summary: planResult.plan.businessPositioning,
          sectionIds: planResult.plan.sectionList.map((section) => section.id),
          premiumPlan: planResult.plan,
          selectedTemplatePack,
          qualityGate: qa.gate,
          revisionCount,
        },
        qualityGate: qa.gate,
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        generationId,
        error: error instanceof Error ? error.message : "AI website generation could not complete.",
        pipelineModelMetadata: pipelineMetadata,
      },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
