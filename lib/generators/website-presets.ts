export type WebsitePresetName =
  | "Luxury Editorial"
  | "Clean Local Business"
  | "Bold Modern"
  | "Soft Wellness"
  | "Industrial Premium"
  | "Music / Artist Portfolio"
  | "Memorial Tribute"
  | "Restaurant Experience"
  | "3D Printing Studio"
  | "Professional Trust";

export interface WebsitePreset {
  name: WebsitePresetName;
  tone: string;
  visualMood: string;
  headlineStyle: string;
  ctaStyle: string;
  sectionEmphasis: string[];
  preferredLayoutRhythm: string;
  safeWordingRules: string[];
}

const sharedSafety = [
  "Confirm availability directly.",
  "Ask about current options.",
  "Use representative imagery until verified business photography is supplied.",
  "Do not imply reviews, awards, prices, guarantees, or credentials that were not provided.",
];

export const websitePresets: Record<WebsitePresetName, WebsitePreset> = {
  "Luxury Editorial": {
    name: "Luxury Editorial",
    tone: "Refined, selective, and detail-led.",
    visualMood: "Editorial spacing, confident imagery, and restrained premium language.",
    headlineStyle: "Short, elegant statements focused on craft and experience.",
    ctaStyle: "Invite a considered enquiry or consultation.",
    sectionEmphasis: ["craftsmanship", "experience", "visual portfolio", "direct enquiry"],
    preferredLayoutRhythm: "Open editorial sections alternating with immersive media.",
    safeWordingRules: sharedSafety,
  },
  "Clean Local Business": {
    name: "Clean Local Business",
    tone: "Friendly, clear, and locally relevant.",
    visualMood: "Bright surfaces, approachable hierarchy, and direct contact routes.",
    headlineStyle: "Plain-language value statements with location context when verified.",
    ctaStyle: "Encourage a call, message, or availability check.",
    sectionEmphasis: ["services", "service area", "contact options", "simple process"],
    preferredLayoutRhythm: "Compact information sections with frequent practical next steps.",
    safeWordingRules: sharedSafety,
  },
  "Bold Modern": {
    name: "Bold Modern",
    tone: "Confident, energetic, and contemporary.",
    visualMood: "Large type, decisive contrast, and strong visual pacing.",
    headlineStyle: "Direct transformation-led statements.",
    ctaStyle: "Use an active, confident next-step invitation.",
    sectionEmphasis: ["transformation", "services", "visual impact", "action"],
    preferredLayoutRhythm: "High-impact hero followed by alternating dense and open sections.",
    safeWordingRules: sharedSafety,
  },
  "Soft Wellness": {
    name: "Soft Wellness",
    tone: "Calm, reassuring, and human.",
    visualMood: "Gentle color, breathing room, and supportive service language.",
    headlineStyle: "Warm outcome-focused statements without medical promises.",
    ctaStyle: "Invite a consultation or availability check without pressure.",
    sectionEmphasis: ["care experience", "service guidance", "comfort", "booking simplicity"],
    preferredLayoutRhythm: "Soft transitions, generous spacing, and concise reassurance.",
    safeWordingRules: sharedSafety,
  },
  "Industrial Premium": {
    name: "Industrial Premium",
    tone: "Precise, capable, and quality-focused.",
    visualMood: "Structured grids, technical imagery, and disciplined contrast.",
    headlineStyle: "Capability and process statements grounded in the supplied offer.",
    ctaStyle: "Prompt a quote, scope discussion, or availability check.",
    sectionEmphasis: ["capabilities", "process", "materials or services", "quote path"],
    preferredLayoutRhythm: "Structured capability blocks balanced by large process imagery.",
    safeWordingRules: sharedSafety,
  },
  "Music / Artist Portfolio": {
    name: "Music / Artist Portfolio",
    tone: "Expressive, distinctive, and audience-aware.",
    visualMood: "Atmospheric media, portfolio pacing, and personality-led presentation.",
    headlineStyle: "Creative statements centered on the work and experience.",
    ctaStyle: "Invite booking, collaboration, or portfolio enquiries.",
    sectionEmphasis: ["featured work", "creative identity", "availability", "contact"],
    preferredLayoutRhythm: "Immersive hero, portfolio moments, then concise booking information.",
    safeWordingRules: sharedSafety,
  },
  "Memorial Tribute": {
    name: "Memorial Tribute",
    tone: "Respectful, calm, and compassionate.",
    visualMood: "Quiet typography, softened imagery, and careful emotional pacing.",
    headlineStyle: "Gentle service statements centered on support and remembrance.",
    ctaStyle: "Offer a private conversation or request for current guidance.",
    sectionEmphasis: ["support", "options", "process clarity", "private contact"],
    preferredLayoutRhythm: "Measured sections with generous space and minimal visual pressure.",
    safeWordingRules: sharedSafety,
  },
  "Restaurant Experience": {
    name: "Restaurant Experience",
    tone: "Inviting, sensory, and experience-led.",
    visualMood: "Warm food and atmosphere imagery with energetic editorial pacing.",
    headlineStyle: "Short statements that evoke the dining or ordering experience.",
    ctaStyle: "Invite a visit, reservation, order, or menu enquiry when available.",
    sectionEmphasis: ["menu or offer", "atmosphere", "location", "visit or order"],
    preferredLayoutRhythm: "Visual hero, offer highlights, atmosphere gallery, practical visit details.",
    safeWordingRules: sharedSafety,
  },
  "3D Printing Studio": {
    name: "3D Printing Studio",
    tone: "Inventive, technical, and solution-oriented.",
    visualMood: "Product detail, fabrication imagery, and modular capability layouts.",
    headlineStyle: "Idea-to-object and precision-focused statements.",
    ctaStyle: "Invite a file, concept, prototype, or quote discussion.",
    sectionEmphasis: ["capabilities", "materials", "process", "custom quote"],
    preferredLayoutRhythm: "Technical feature blocks alternating with product-scale imagery.",
    safeWordingRules: sharedSafety,
  },
  "Professional Trust": {
    name: "Professional Trust",
    tone: "Measured, credible, and straightforward.",
    visualMood: "Clear typography, conservative hierarchy, and proof-ready structure.",
    headlineStyle: "Clarity and confidence statements without inflated claims.",
    ctaStyle: "Invite a consultation or confidential enquiry.",
    sectionEmphasis: ["expertise", "service clarity", "process", "confidential contact"],
    preferredLayoutRhythm: "Structured editorial sections with restrained visual emphasis.",
    safeWordingRules: sharedSafety,
  },
};

export function getWebsitePreset(name: WebsitePresetName) {
  return websitePresets[name];
}
