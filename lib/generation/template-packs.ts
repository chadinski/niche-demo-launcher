export type TemplatePackSourceMode = "import-candidate" | "adapt-candidate" | "inspiration-only";

export type TemplatePackSource = {
  name: string;
  url: string;
  demoUrl?: string;
  licenseSignal: string;
  mode: TemplatePackSourceMode;
  role: string;
};

export type TemplatePack = {
  id: string;
  name: string;
  industries: string[];
  matchKeywords: string[];
  qualityTier: "approved-seed" | "visual-reference" | "fallback";
  positioning: string;
  visualDNA: string[];
  sectionArchitecture: string[];
  componentMotifs: string[];
  imageStrategy: string[];
  copyStrategy: string[];
  qaPriorities: string[];
  sources: TemplatePackSource[];
};

export type SelectedTemplatePack = {
  id: string;
  name: string;
  qualityTier: TemplatePack["qualityTier"];
  industries: string[];
  matchedKeywords: string[];
  sources: TemplatePackSource[];
  brief: string;
};

type TemplatePackBusinessProfile = {
  businessType: string;
  visibleDescription: string;
  services: string[];
  products: string[];
  targetAudience: string;
};

const templatePacks: TemplatePack[] = [
  {
    id: "restaurant-hospitality-experience",
    name: "Restaurant Hospitality Experience",
    industries: ["restaurant", "cafe", "bar", "grill", "catering", "bakery", "food"],
    matchKeywords: ["restaurant", "cafe", "bar", "grill", "catering", "bakery", "food", "menu", "dining", "meal", "kitchen"],
    qualityTier: "visual-reference",
    positioning: "Make the business feel like a destination: sensory, atmospheric, easy to visit, and visually appetizing from the first screen.",
    visualDNA: [
      "Large photographic hero with food, interior, or service atmosphere as the dominant subject.",
      "Warm, tactile palette with dark surfaces, glowing accents, and menu-style editorial typography.",
      "Section rhythm should move from appetite to practical action: hero, menu/service highlights, atmosphere, visit/contact.",
    ],
    sectionArchitecture: [
      "Cinematic hero with one primary action such as Book a Table, Order, Call, or View Menu.",
      "Compact trust/visit bridge with location, contact, cuisine/offer, and availability placeholders only when missing.",
      "Menu or services section grouped by customer intent instead of generic three-card blocks.",
      "Atmosphere/gallery section with captions explaining that imagery is representative when not verified.",
      "Visit/process section that explains reservation, ordering, catering, or enquiry steps.",
    ],
    componentMotifs: [
      "Editorial menu cards with item/category hierarchy.",
      "Layered image montage with a hero detail crop and smaller atmosphere cards.",
      "Warm CTA band styled like an invitation, not a SaaS banner.",
    ],
    imageStrategy: [
      "Use food, dining room, service, prep, or local hospitality images that match the business category.",
      "Avoid random luxury dining imagery if the business is casual or local.",
      "Never imply images show the actual restaurant unless supplied by the user.",
    ],
    copyStrategy: [
      "Write sensory but believable copy; avoid fake chef awards, ratings, reservation systems, or signature dishes unless supplied.",
      "Frame unknown menu items as current options to confirm directly.",
    ],
    qaPriorities: ["first-screen appetite", "menu clarity", "visit/contact path", "no fake reviews"],
    sources: [
      {
        name: "Restaurant Website",
        url: "https://github.com/YaninaTrekhleb/restaurant-website",
        demoUrl: "https://yaninatrekhleb.github.io/restaurant-website/",
        licenseSignal: "No license detected; use only as visual inspiration.",
        mode: "inspiration-only",
        role: "Cinematic hospitality hero and atmosphere direction.",
      },
      {
        name: "Restoran",
        url: "https://github.com/codewithshabbir/Restoran",
        demoUrl: "https://codewithshabbir.github.io/Restoran/",
        licenseSignal: "No license detected; use only as visual inspiration.",
        mode: "inspiration-only",
        role: "Food-forward hero and direct booking CTA pattern.",
      },
    ],
  },
  {
    id: "dental-clinic-trust",
    name: "Dental / Clinic Trust",
    industries: ["dentist", "dental", "clinic", "medical", "doctor", "health", "healthcare", "orthodontist", "med spa"],
    matchKeywords: ["dentist", "dental", "clinic", "medical", "doctor", "health", "healthcare", "orthodontist", "medspa", "med spa", "patient"],
    qualityTier: "approved-seed",
    positioning: "Make the business feel clinically trustworthy, calm, appointment-ready, and modern without inventing credentials.",
    visualDNA: [
      "Clean professional surfaces with blue/green/soft neutral healthcare cues adapted to visible brand colors.",
      "Hero should show patient comfort, treatment room, care detail, or polished clinical environment.",
      "Trust must come from verified contact paths, service clarity, process expectations, and honest placeholders.",
    ],
    sectionArchitecture: [
      "Appointment-led hero with contact CTA and calm proof bridge.",
      "Care/service cards grouped by patient concern or treatment family.",
      "Comfort/process section explaining what happens when a visitor contacts the clinic.",
      "Trust section with verified facts only: location, phone, email, services, social links.",
      "FAQ focused on booking, availability, consultation, insurance/payment only when verified.",
    ],
    componentMotifs: [
      "Clinical feature cards with icons and subtle glass/surface depth.",
      "Appointment panel beside hero or contact section.",
      "Before/after-style framing only when it avoids fake outcomes and uses representative labels.",
    ],
    imageStrategy: [
      "Use niche-matched dental/clinic/patient-comfort images.",
      "Avoid fake doctors, staff portraits, certifications, or patient outcomes.",
      "Label representative imagery clearly when real business photography is not supplied.",
    ],
    copyStrategy: [
      "Use reassuring, clear language focused on comfort, next steps, and service clarity.",
      "Avoid medical guarantees, diagnoses, cure claims, awards, or fake doctor names.",
    ],
    qaPriorities: ["factual safety", "appointment clarity", "calm mobile layout", "schema without fake physicians"],
    sources: [
      {
        name: "DiwaDental",
        url: "https://github.com/gridtemplate/DiwaDental-HTML5-and-Bootstrap5-Template-For-Dentist-and-Medical-Clinics",
        demoUrl: "https://www.gridtemplate.com/templates/diwadental-html5-and-bootstrap5-template-for-dentist-and-medical-clinics/",
        licenseSignal: "MIT verified by GitHub/raw license.",
        mode: "adapt-candidate",
        role: "Dental/clinic section taxonomy and appointment-oriented structure.",
      },
      {
        name: "MediLab",
        url: "https://github.com/themewagon/MediLab",
        demoUrl: "https://themewagon.github.io/MediLab/",
        licenseSignal: "Verify before import; use as structure reference until confirmed.",
        mode: "inspiration-only",
        role: "Clinic navigation, service, department, and appointment flow reference.",
      },
    ],
  },
  {
    id: "auto-service-performance",
    name: "Auto / Tire Service Performance",
    industries: ["auto repair", "mechanic", "tire", "car wash", "automotive", "garage", "vehicle"],
    matchKeywords: ["auto", "automotive", "mechanic", "repair", "tire", "tyre", "garage", "vehicle", "car wash", "oil change", "brake"],
    qualityTier: "approved-seed",
    positioning: "Make the business feel capable, fast, practical, and trustworthy for drivers who need service without friction.",
    visualDNA: [
      "Industrial premium surfaces with strong contrast, sharp CTA treatment, and real service imagery.",
      "Hero should communicate vehicle care, tires, tools, diagnostics, shop environment, or road-readiness.",
      "Layout should be direct and high-confidence: services, process, trust, contact, service area.",
    ],
    sectionArchitecture: [
      "Hero with direct call/quote CTA and service-area or availability cue.",
      "Service grid grouped by driver need: tires, repair, maintenance, inspection, emergency support when visible.",
      "Process timeline: call, describe issue, confirm availability, service/quote.",
      "Visual proof/showcase using tools, bays, tire detail, vehicle work, or representative shop imagery.",
      "FAQ around appointments, availability, quotes, parts, pickup/drop-off only when verified.",
    ],
    componentMotifs: [
      "Angled service cards or inspection checklist cards.",
      "Shop-floor visual montage with captions.",
      "High-contrast CTA strip with phone-first action.",
    ],
    imageStrategy: [
      "Use mechanic, tire, vehicle, tool, diagnostic, or shop photography.",
      "Do not imply manufacturer certifications, fleet accounts, warranties, or emergency coverage unless supplied.",
    ],
    copyStrategy: [
      "Write practical copy around safety, clarity, speed, and contact.",
      "Avoid fake guarantees, same-day claims, or certified technician claims.",
    ],
    qaPriorities: ["phone-first CTA", "service clarity", "no fake certifications", "strong industrial visual system"],
    sources: [
      {
        name: "Car Mechanic Shop",
        url: "https://github.com/saaqi/car-mechanic-shop",
        demoUrl: "https://saaqi.github.io/car-mechanic-shop/",
        licenseSignal: "MIT verified by GitHub/raw license.",
        mode: "adapt-candidate",
        role: "Auto-service structure seed for service, process, and contact flow.",
      },
    ],
  },
  {
    id: "premium-landing-system",
    name: "Premium Landing System",
    industries: ["general", "professional services", "local business", "home services", "retail", "agency"],
    matchKeywords: ["service", "services", "professional", "consult", "agency", "local", "retail", "studio", "contractor", "home"],
    qualityTier: "approved-seed",
    positioning: "Use a premium landing-page framework that feels custom to the business rather than template-derived.",
    visualDNA: [
      "Editorial hero, strong visual thesis, varied section rhythm, and restrained premium components.",
      "Use Uisual-like spacing restraint and Awesome Landing Pages-like conversion anatomy as abstract guidance.",
      "Every section needs a different job and composition, not repeated title-plus-card blocks.",
    ],
    sectionArchitecture: [
      "Hero with brand-specific emotional hook and one clear CTA.",
      "Trust bridge from verified facts or clearly labeled placeholder proof.",
      "Offer/services architecture grouped by customer intent.",
      "Differentiator/story section with one strong visual treatment.",
      "Showcase/process/FAQ/contact sequence to turn interest into action.",
    ],
    componentMotifs: [
      "Bento-like service rhythm only when content hierarchy supports it.",
      "Editorial split sections, proof rails, comparison rows, and CTA panels.",
      "Subtle Magic UI-inspired sheen or reveal translated into original CSS.",
    ],
    imageStrategy: [
      "Choose images from the actual industry, service environment, product, craft, or customer experience.",
      "Avoid generic startup illustrations and irrelevant stock photos.",
    ],
    copyStrategy: [
      "Write concise, concrete copy from verified facts and safe placeholders.",
      "Make the offer legible in five seconds.",
    ],
    qaPriorities: ["brand specificity", "section variety", "image relevance", "conversion clarity"],
    sources: [
      {
        name: "Awesome Landing Pages",
        url: "https://github.com/PaulleDemon/awesome-landing-pages",
        demoUrl: "https://awesome-landing-pages.netlify.app/",
        licenseSignal: "MIT reported by GitHub API.",
        mode: "adapt-candidate",
        role: "Modern landing-page pack anatomy and conversion section patterns.",
      },
      {
        name: "Uisual Freebies",
        url: "https://github.com/uisual/freebies",
        demoUrl: "https://uisual.com/freebies/",
        licenseSignal: "MIT reported by GitHub API.",
        mode: "adapt-candidate",
        role: "Premium spacing, typography, and restrained section architecture.",
      },
    ],
  },
];

function compactList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function packSearchText(profile: TemplatePackBusinessProfile) {
  return [
    profile.businessType,
    profile.visibleDescription,
    profile.targetAudience,
    ...profile.services,
    ...profile.products,
  ].join(" ").toLowerCase();
}

function scorePack(pack: TemplatePack, profile: TemplatePackBusinessProfile) {
  const searchText = packSearchText(profile);
  const matchedKeywords = compactList(
    pack.matchKeywords.filter((keyword) => searchText.includes(keyword.toLowerCase())),
  );
  const score = matchedKeywords.length * 5 + (pack.qualityTier === "approved-seed" ? 2 : 0);
  return { score, matchedKeywords };
}

function formatTemplatePackBrief(pack: TemplatePack, matchedKeywords: string[]) {
  const sourceLines = pack.sources
    .map((source) => `- ${source.name} (${source.mode}): ${source.role} License: ${source.licenseSignal} Source: ${source.url}${source.demoUrl ? ` Demo: ${source.demoUrl}` : ""}`)
    .join("\n");

  return [
    `Selected Seraphim template pack: ${pack.name} (${pack.id}).`,
    `Quality tier: ${pack.qualityTier}.`,
    `Matched industry keywords: ${matchedKeywords.length ? matchedKeywords.join(", ") : "fallback/general"}.`,
    `Positioning: ${pack.positioning}`,
    "Visual DNA:",
    ...pack.visualDNA.map((item) => `- ${item}`),
    "Section architecture:",
    ...pack.sectionArchitecture.map((item) => `- ${item}`),
    "Component motifs:",
    ...pack.componentMotifs.map((item) => `- ${item}`),
    "Image strategy:",
    ...pack.imageStrategy.map((item) => `- ${item}`),
    "Copy strategy:",
    ...pack.copyStrategy.map((item) => `- ${item}`),
    "QA priorities:",
    ...pack.qaPriorities.map((item) => `- ${item}`),
    "Source policy:",
    "- Treat source templates as references for structure, mood, and component ideas only.",
    "- Do not copy proprietary code, branded assets, exact copy, distinctive compositions, or unsupported claims.",
    "- Rebuild the pattern as original single-file semantic HTML/CSS/JS using Seraphim standards.",
    "Approved/reference sources:",
    sourceLines,
  ].join("\n");
}

export function selectTemplatePack(profile: TemplatePackBusinessProfile): SelectedTemplatePack {
  const scored = templatePacks
    .map((pack) => ({ pack, ...scorePack(pack, profile) }))
    .sort((a, b) => b.score - a.score);

  const best = scored.find((item) => item.score > 0) ?? scored.find((item) => item.pack.id === "premium-landing-system") ?? scored[0];

  return {
    id: best.pack.id,
    name: best.pack.name,
    qualityTier: best.pack.qualityTier,
    industries: best.pack.industries,
    matchedKeywords: best.matchedKeywords,
    sources: best.pack.sources,
    brief: formatTemplatePackBrief(best.pack, best.matchedKeywords),
  };
}
