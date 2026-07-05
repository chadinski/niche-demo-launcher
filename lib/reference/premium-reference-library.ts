import fs from "node:fs";
import path from "node:path";

type ReferenceProfile = {
  id: string;
  name: string;
  path: string;
  matchedIndustries: string[];
  title: string;
  description: string;
  lineCount: number;
  htmlLength: number;
  cssLength: number;
  sectionCount: number;
  imageCount: number;
  remoteImageCount: number;
  localImageCount: number;
  navLinkCount: number;
  ctaCount: number;
  faqCount: number;
  sectionIds: string[];
  headings: string[];
  colors: string[];
  componentClasses: string[];
  patterns: string[];
};

const REFERENCE_CANDIDATES = [
  {
    id: "johnsons-premium-finish",
    name: "Johnsons Premium Finish",
    relativePath: "../johnsons-premium-finish/index.html",
    matchedIndustries: ["auto", "automotive", "detailing", "car", "vehicle", "luxury service"],
  },
  {
    id: "happyfeet-petworld-kingston",
    name: "HappyFeet PetWorld Kingston",
    relativePath: "../happyfeet-petworld-kingston/index.html",
    matchedIndustries: ["pet", "pet store", "grooming", "family service", "retail"],
  },
  {
    id: "mechanic-connect-ja",
    name: "Mechanic Connect JA",
    relativePath: "../mechanic-connect-ja/index.html",
    matchedIndustries: ["mechanic", "auto repair", "marketplace", "app", "automotive", "platform"],
  },
  {
    id: "island-spice-kitchen-kingston",
    name: "Island Spice Kitchen Kingston",
    relativePath: "../island-spice-kitchen-kingston/index.html",
    matchedIndustries: ["restaurant", "food", "hospitality", "kitchen", "jamaican"],
  },
  {
    id: "handyhub",
    name: "HandyHub",
    relativePath: "../handyhub/index.html",
    matchedIndustries: ["home service", "trades", "contractor", "plumber", "electrician", "repair"],
  },
  {
    id: "dream-windows-and-doors-awning",
    name: "Dream Windows and Doors Awning",
    relativePath: "../dream-windows-and-doors-awning/index.html",
    matchedIndustries: ["windows", "doors", "awning", "construction", "home improvement", "contractor"],
  },
  {
    id: "elite-tools-electrical-and-plumbing-supplies",
    name: "Elite Tools Electrical and Plumbing Supplies",
    relativePath: "../elite-tools-electrical-and-plumbing-supplies/index.html",
    matchedIndustries: ["hardware", "supplies", "electrical", "plumbing", "retail", "tools"],
  },
];

let cachedProfiles: ReferenceProfile[] | null = null;

function stripTags(value: string) {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function attrValues(html: string, attr: string) {
  return [...html.matchAll(new RegExp(`\\b${attr}=["']([^"']+)["']`, "gi"))].map((match) => match[1] ?? "");
}

function extractCss(html: string) {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1] ?? "").join("\n");
}

function classifyPatterns(html: string, css: string) {
  const source = `${html}\n${css}`.toLowerCase();
  const checks: Array<[string, RegExp]> = [
    ["sticky/persistent navigation", /position:\s*sticky|class=["'][^"']*(?:sticky|header)/i],
    ["mobile menu behavior", /aria-expanded|menu-toggle|hamburger|mobile-nav/i],
    ["mobile fixed CTA", /mobile-call|fixed\s*;[^}]*bottom|bottom:\s*(?:0|1|2|var)/i],
    ["scroll reveal animation", /reveal|intersectionobserver|data-reveal|@keyframes/i],
    ["FAQ accordion", /<details|faq|aria-expanded/i],
    ["cinematic media treatment", /hero-(?:visual|media|art)|gallery|figure|object-fit|aspect-ratio/i],
    ["layered backgrounds", /linear-gradient|radial-gradient|::before|::after|mix-blend|background-image/i],
    ["CSS design tokens", /:root|--[a-z0-9-]+:/i],
    ["fluid typography/spacing", /clamp\(|minmax\(|calc\(/i],
    ["responsive breakpoints", /@media/i],
    ["structured data", /application\/ld\+json/i],
    ["high-touch contact flow", /tel:|mailto:|wa\.me|whatsapp|contact/i],
  ];
  return checks.filter(([, regex]) => regex.test(source)).map(([label]) => label);
}

function analyzeReference(candidate: (typeof REFERENCE_CANDIDATES)[number]): ReferenceProfile | null {
  const absolutePath = path.resolve(/* turbopackIgnore: true */ process.cwd(), candidate.relativePath);
  if (!fs.existsSync(absolutePath)) return null;

  const html = fs.readFileSync(absolutePath, "utf8");
  const css = extractCss(html);
  const title = stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? candidate.name);
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] ?? "";
  const imageSources = attrValues(html, "src").filter((value) => /\.(?:avif|webp|png|jpe?g|svg)(?:[?#].*)?$/i.test(value) || /^https?:\/\//i.test(value));
  const sectionIds = unique(attrValues(html, "id").filter((id) => /hero|service|offer|proof|gallery|process|faq|contact|cta|story|value|trust/i.test(id))).slice(0, 14);
  const headings = unique([...html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)].map((match) => stripTags(match[1] ?? ""))).slice(0, 12);
  const colors = unique([...css.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((match) => match[0].toUpperCase())).slice(0, 14);
  const componentClasses = unique(
    attrValues(html, "class")
      .flatMap((value) => value.split(/\s+/))
      .filter((className) => /hero|card|btn|button|section|container|grid|split|proof|faq|gallery|media|visual|cta|footer|nav|brand|reveal/i.test(className)),
  ).slice(0, 24);

  return {
    id: candidate.id,
    name: candidate.name,
    path: absolutePath,
    matchedIndustries: candidate.matchedIndustries,
    title,
    description,
    lineCount: html.split(/\r?\n/).length,
    htmlLength: html.length,
    cssLength: css.length,
    sectionCount: (html.match(/<section\b/gi) ?? []).length,
    imageCount: imageSources.length,
    remoteImageCount: imageSources.filter((src) => /^https?:\/\//i.test(src)).length,
    localImageCount: imageSources.filter((src) => !/^https?:\/\//i.test(src)).length,
    navLinkCount: (html.match(/<nav\b[\s\S]*?<\/nav>/gi) ?? []).join("\n").match(/<a\b/gi)?.length ?? 0,
    ctaCount: (html.match(/class=["'][^"']*(?:btn|button|cta|call)[^"']*["']/gi) ?? []).length,
    faqCount: (html.match(/<summary\b|faq-question|faq-item/gi) ?? []).length,
    sectionIds,
    headings,
    colors,
    componentClasses,
    patterns: classifyPatterns(html, css),
  };
}

export function getPremiumReferenceProfiles() {
  cachedProfiles ??= REFERENCE_CANDIDATES.map(analyzeReference).filter((profile): profile is ReferenceProfile => Boolean(profile));
  return cachedProfiles;
}

function scoreProfile(profile: ReferenceProfile, industry: string) {
  const normalizedIndustry = industry.toLowerCase();
  const industryScore = profile.matchedIndustries.some((keyword) => normalizedIndustry.includes(keyword) || keyword.includes(normalizedIndustry))
    ? 8
    : 0;
  const qualityScore = Math.min(8, Math.round(profile.cssLength / 2500) + Math.round(profile.sectionCount / 2) + Math.min(2, profile.faqCount));
  return industryScore + qualityScore;
}

export function getPremiumReferenceBrief(industry = "") {
  const profiles = getPremiumReferenceProfiles();
  const selected = [...profiles]
    .sort((a, b) => scoreProfile(b, industry) - scoreProfile(a, industry))
    .slice(0, Math.min(4, profiles.length));
  const benchmark = selected.reduce(
    (acc, profile) => ({
      minSections: Math.max(acc.minSections, Math.min(9, profile.sectionCount)),
      minCssLength: Math.max(acc.minCssLength, Math.min(18000, profile.cssLength)),
      expectedPatterns: unique([...acc.expectedPatterns, ...profile.patterns]).slice(0, 16),
    }),
    { minSections: 7, minCssLength: 9000, expectedPatterns: [] as string[] },
  );

  return {
    source: "local-premium-index-html-files",
    instruction: "Use these files as a quality benchmark and pattern source only. Do not copy code, copy, branded artwork, exact layouts, or distinctive compositions.",
    selectedReferences: selected.map((profile) => ({
      id: profile.id,
      name: profile.name,
      industries: profile.matchedIndustries,
      title: profile.title,
      lineCount: profile.lineCount,
      htmlLength: profile.htmlLength,
      cssLength: profile.cssLength,
      sectionCount: profile.sectionCount,
      imageCount: profile.imageCount,
      navLinkCount: profile.navLinkCount,
      ctaCount: profile.ctaCount,
      faqCount: profile.faqCount,
      sectionIds: profile.sectionIds,
      headlinePatterns: profile.headings.slice(0, 8),
      componentClasses: profile.componentClasses,
      visualPatterns: profile.patterns,
      colorSignals: profile.colors,
    })),
    benchmark,
    enforceableLessons: [
      "Use a complete page architecture with a cinematic first viewport, trust bridge, offer/service depth, proof or honest representative media, decision support, FAQ, contact, and footer.",
      "Use dense embedded CSS with custom properties, responsive breakpoints, component classes, hover/focus states, layered surfaces, and mobile-specific CTA/navigation behavior.",
      "Create at least one industry-specific visual moment beyond text cards: editorial media, gallery, interface concept, sensory composition, process visual, or proof frame.",
      "Keep section compositions varied. Do not repeat centered headings above equal card grids.",
      "Make the first viewport feel designed: brand, offer, primary CTA, secondary action, and strong visual composition must be visible without relying on scroll.",
      "Every generated site should be able to stand next to the reference files in completeness and polish, while using its own visual thesis.",
    ],
  };
}

export function getPremiumReferencePrompt(industry = "") {
  return JSON.stringify(getPremiumReferenceBrief(industry), null, 2);
}
