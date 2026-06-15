import type { CopyAngleName } from "@/lib/generators/copy-angles";
import type { WebsitePresetName } from "@/lib/generators/website-presets";

export interface VisualProfile {
  mood: string;
  hero: string;
  feature: string;
  gallery: [string, string, string, string, string, string];
  alt: string;
  preferredPreset: WebsitePresetName;
  copyAngle: CopyAngleName;
  ctaLanguage: string;
  sectionEmphasis: [string, string, string, string];
}

interface MatchedVisualProfile extends VisualProfile {
  match: RegExp;
}

const profiles: MatchedVisualProfile[] = [
  {
    match: /(auto detailing|detailing|car care|vehicle appearance)/,
    mood: "Precision, surface care, and a finish worth noticing.",
    hero: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Premium vehicle presented in refined light",
    preferredPreset: "Luxury Editorial",
    copyAngle: "craftsmanship",
    ctaLanguage: "Ask about detailing options",
    sectionEmphasis: ["finish quality", "service options", "care process", "booking"],
  },
  {
    match: /(funeral|memorial|tribute|urn|cremation)/,
    mood: "Quiet guidance, respectful presentation, and support handled with care.",
    hero: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Quiet natural setting with soft, respectful light",
    preferredPreset: "Memorial Tribute",
    copyAngle: "emotional memorial tone",
    ctaLanguage: "Request private guidance",
    sectionEmphasis: ["support options", "careful process", "remembrance", "private contact"],
  },
  {
    match: /(3d|printing|prototype|custom product|fabrication|sign)/,
    mood: "Ideas shaped into precise, useful, and memorable physical products.",
    hero: "https://images.unsplash.com/photo-1631004191764-4c60c34e2313?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1611117775350-ac3950990985?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1631004191764-4c60c34e2313?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1611117775350-ac3950990985?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1581093458791-9d42cc5484a3?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1581091215367-59ab6f01d339?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Modern fabrication and product prototyping workspace",
    preferredPreset: "3D Printing Studio",
    copyAngle: "technical precision",
    ctaLanguage: "Discuss a custom project",
    sectionEmphasis: ["capabilities", "materials", "production process", "quote request"],
  },
  {
    match: /(restaurant|cafe|food|bakery|catering)/,
    mood: "An inviting experience shaped by flavor, atmosphere, and thoughtful service.",
    hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1481833761820-0509d3217039?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Welcoming restaurant interior with thoughtful lighting",
    preferredPreset: "Restaurant Experience",
    copyAngle: "speed and convenience",
    ctaLanguage: "Plan your visit",
    sectionEmphasis: ["menu or offer", "atmosphere", "location", "visit details"],
  },
  {
    match: /(music|musician|artist|band|violin|performer|recording studio|entertainment)/,
    mood: "A distinctive creative identity presented with atmosphere and intent.",
    hero: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1524650359799-842906ca1c06?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Artist performing under atmospheric stage lighting",
    preferredPreset: "Music / Artist Portfolio",
    copyAngle: "creative portfolio tone",
    ctaLanguage: "Discuss a booking",
    sectionEmphasis: ["featured work", "creative identity", "availability", "collaboration"],
  },
  {
    match: /(salon|barber|beauty|spa|makeup)/,
    mood: "Personal style, considered service, and confidence in every detail.",
    hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Polished salon interior with modern styling",
    preferredPreset: "Luxury Editorial",
    copyAngle: "booking simplicity",
    ctaLanguage: "Ask about appointments",
    sectionEmphasis: ["services", "style", "booking", "experience"],
  },
  {
    match: /(dental|clinic|medical|health|wellness|therapy)/,
    mood: "Modern care, clear guidance, and a calmer customer experience.",
    hero: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1588776813677-77aaf5595b83?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Bright, modern care environment",
    preferredPreset: "Soft Wellness",
    copyAngle: "trust and credibility",
    ctaLanguage: "Ask about current availability",
    sectionEmphasis: ["care options", "patient guidance", "comfort", "appointments"],
  },
  {
    match: /(contractor|construction|builder|roofing|plumbing|electrical|mechanic|auto repair)/,
    mood: "Practical capability, disciplined process, and work presented with confidence.",
    hero: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1429497419816-9ca5cfb4571a?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Professional construction work with clear structural detail",
    preferredPreset: "Industrial Premium",
    copyAngle: "technical precision",
    ctaLanguage: "Discuss project scope",
    sectionEmphasis: ["capabilities", "project process", "service area", "quote path"],
  },
  {
    match: /(real estate|interior|architect|property|home staging)/,
    mood: "Spaces and properties presented with clarity, confidence, and visual intent.",
    hero: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Refined contemporary interior with architectural detail",
    preferredPreset: "Luxury Editorial",
    copyAngle: "transformation",
    ctaLanguage: "Discuss your property goals",
    sectionEmphasis: ["portfolio", "approach", "property or project goals", "consultation"],
  },
  {
    match: /(accounting|accountant|law|legal|attorney|finance|consulting|professional service)/,
    mood: "Measured expertise, clear guidance, and a professional path to enquiry.",
    hero: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Professional consultation in a modern office",
    preferredPreset: "Professional Trust",
    copyAngle: "trust and credibility",
    ctaLanguage: "Request a consultation",
    sectionEmphasis: ["expertise", "services", "process", "confidential enquiry"],
  },
  {
    match: /(flor|flower|wedding|event)/,
    mood: "Thoughtful details, beautiful presentation, and moments made memorable.",
    hero: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1507501336603-6e31db2be093?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1469259943454-aa100abba749?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Artfully arranged flowers in refined natural light",
    preferredPreset: "Soft Wellness",
    copyAngle: "craftsmanship",
    ctaLanguage: "Ask about current options",
    sectionEmphasis: ["arrangements or services", "occasion", "visual portfolio", "enquiry"],
  },
  {
    match: /(pet|veterinary|animal|grooming)/,
    mood: "Helpful service, genuine care, and an experience built around pets and their people.",
    hero: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=2200&q=88",
    feature: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=86",
    gallery: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1400&q=84",
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=84",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1400&q=84",
    ],
    alt: "Happy pet in warm natural light",
    preferredPreset: "Clean Local Business",
    copyAngle: "booking simplicity",
    ctaLanguage: "Ask about care options",
    sectionEmphasis: ["care services", "pet owner guidance", "availability", "contact"],
  },
];

const fallbackProfile: VisualProfile = {
  mood: "Professional service, clear next steps, and a presentation built around trust.",
  hero: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2200&q=88",
  feature: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=86",
  gallery: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=84",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=84",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=84",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=84",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=84",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=84",
  ],
  alt: "Professional modern workspace",
  preferredPreset: "Professional Trust",
  copyAngle: "local authority",
  ctaLanguage: "Ask about current options",
  sectionEmphasis: ["services", "customer guidance", "contact", "verified proof"],
};

export function visualProfile(category: string): VisualProfile {
  const lower = category.toLowerCase();
  return profiles.find((profile) => profile.match.test(lower)) ?? fallbackProfile;
}

export function schemaType(category: string) {
  const lower = category.toLowerCase();

  if (/(restaurant|cafe|food|bakery)/.test(lower)) return "Restaurant";
  if (/(dental|dentist)/.test(lower)) return "Dentist";
  if (/(auto|mechanic|vehicle|car|detailing)/.test(lower)) return "AutoRepair";
  if (/(salon|beauty|spa|barber)/.test(lower)) return "BeautySalon";
  if (/(real estate)/.test(lower)) return "RealEstateAgent";
  if (/(pet|veterinary)/.test(lower)) return "PetStore";
  if (/(funeral|memorial)/.test(lower)) return "LocalBusiness";
  return "ProfessionalService";
}
