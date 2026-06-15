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

export type ThemeMode = "dark" | "light" | "warm" | "soft" | "industrial" | "editorial";

export interface WebsiteTheme {
  pageBg: string;
  surface: string;
  text: string;
  muted: string;
  heroOverlay: string;
  heroText: string;
  cardBg: string;
  sectionBg: string;
  border: string;
  navBg: string;
  displayFont: string;
  bodyFont: string;
  shadow: string;
}

export interface WebsitePreset {
  name: WebsitePresetName;
  themeClass: string;
  themeMode: ThemeMode;
  typographyMood: "editorial" | "clean" | "bold" | "soft" | "technical" | "cinematic";
  cardStyle: "glass" | "bordered" | "soft" | "solid" | "minimal";
  heroTreatment: "immersive" | "split" | "soft-overlay" | "cinematic" | "technical";
  colorIntensity: "restrained" | "balanced" | "vivid";
  sectionOrder: string[];
  theme: WebsiteTheme;
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

const serifDisplay = 'Georgia, "Times New Roman", serif';
const sansDisplay = 'Inter, ui-sans-serif, system-ui, sans-serif';
const bodyFont = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const websitePresets: Record<WebsitePresetName, WebsitePreset> = {
  "Luxury Editorial": {
    name: "Luxury Editorial",
    themeClass: "theme-luxury-editorial",
    themeMode: "editorial",
    typographyMood: "editorial",
    cardStyle: "glass",
    heroTreatment: "immersive",
    colorIntensity: "restrained",
    sectionOrder: ["hero", "credibility", "services", "experience", "gallery", "process"],
    theme: { pageBg: "#08090b", surface: "#14151a", text: "#f8f5ee", muted: "#b9b5ad", heroOverlay: "linear-gradient(90deg, rgba(5,6,8,.98) 5%, rgba(5,6,8,.82) 46%, rgba(5,6,8,.2) 78%)", heroText: "#f8f5ee", cardBg: "linear-gradient(145deg, rgba(27,27,31,.88), rgba(11,11,13,.84))", sectionBg: "#0b0c0f", border: "rgba(255,255,255,.12)", navBg: "rgba(7,8,11,.88)", displayFont: serifDisplay, bodyFont, shadow: "0 30px 90px rgba(0,0,0,.45)" },
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
    themeClass: "theme-clean-local",
    themeMode: "light",
    typographyMood: "clean",
    cardStyle: "bordered",
    heroTreatment: "split",
    colorIntensity: "balanced",
    sectionOrder: ["hero", "services", "credibility", "process", "experience", "gallery"],
    theme: { pageBg: "#f7faf8", surface: "#ffffff", text: "#17201c", muted: "#5f6f67", heroOverlay: "linear-gradient(90deg, rgba(247,250,248,.98) 0%, rgba(247,250,248,.94) 48%, rgba(247,250,248,.2) 74%)", heroText: "#17201c", cardBg: "#ffffff", sectionBg: "#eef5f1", border: "rgba(23,32,28,.13)", navBg: "rgba(247,250,248,.92)", displayFont: sansDisplay, bodyFont, shadow: "0 24px 70px rgba(38,70,53,.12)" },
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
    themeClass: "theme-bold-modern",
    themeMode: "dark",
    typographyMood: "bold",
    cardStyle: "solid",
    heroTreatment: "immersive",
    colorIntensity: "vivid",
    sectionOrder: ["hero", "services", "transformation", "credibility", "gallery", "process"],
    theme: { pageBg: "#07070a", surface: "#17171d", text: "#ffffff", muted: "#b8b8c2", heroOverlay: "linear-gradient(90deg, rgba(4,4,7,.96), rgba(4,4,7,.7) 52%, rgba(4,4,7,.12))", heroText: "#ffffff", cardBg: "#17171d", sectionBg: "#0d0d12", border: "rgba(255,255,255,.14)", navBg: "rgba(7,7,10,.9)", displayFont: sansDisplay, bodyFont, shadow: "0 32px 90px rgba(0,0,0,.5)" },
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
    themeClass: "theme-soft-wellness",
    themeMode: "soft",
    typographyMood: "soft",
    cardStyle: "soft",
    heroTreatment: "split",
    colorIntensity: "restrained",
    sectionOrder: ["hero", "credibility", "experience", "services", "process", "gallery"],
    theme: { pageBg: "#f5f3ed", surface: "#fffdf8", text: "#26342f", muted: "#68766f", heroOverlay: "linear-gradient(90deg, rgba(245,243,237,.98), rgba(245,243,237,.9) 50%, rgba(245,243,237,.12) 78%)", heroText: "#26342f", cardBg: "#fffdf8", sectionBg: "#e9efe9", border: "rgba(38,52,47,.12)", navBg: "rgba(245,243,237,.92)", displayFont: serifDisplay, bodyFont, shadow: "0 24px 65px rgba(62,82,72,.13)" },
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
    themeClass: "theme-industrial",
    themeMode: "industrial",
    typographyMood: "technical",
    cardStyle: "solid",
    heroTreatment: "technical",
    colorIntensity: "balanced",
    sectionOrder: ["hero", "services", "process", "transformation", "gallery", "credibility"],
    theme: { pageBg: "#111417", surface: "#1d2227", text: "#f4f6f7", muted: "#adb5bd", heroOverlay: "linear-gradient(90deg, rgba(13,16,19,.98), rgba(13,16,19,.78) 50%, rgba(13,16,19,.2))", heroText: "#f4f6f7", cardBg: "#1b2025", sectionBg: "#171b1f", border: "rgba(255,255,255,.14)", navBg: "rgba(17,20,23,.92)", displayFont: sansDisplay, bodyFont, shadow: "0 26px 70px rgba(0,0,0,.38)" },
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
    themeClass: "theme-artist",
    themeMode: "dark",
    typographyMood: "cinematic",
    cardStyle: "glass",
    heroTreatment: "cinematic",
    colorIntensity: "vivid",
    sectionOrder: ["hero", "gallery", "experience", "services", "credibility", "process"],
    theme: { pageBg: "#08070d", surface: "#171321", text: "#fff9ff", muted: "#c4b9cc", heroOverlay: "linear-gradient(90deg, rgba(8,7,13,.96), rgba(8,7,13,.64) 48%, rgba(8,7,13,.16))", heroText: "#fff9ff", cardBg: "linear-gradient(145deg, rgba(31,22,43,.9), rgba(13,10,19,.86))", sectionBg: "#100c17", border: "rgba(255,255,255,.14)", navBg: "rgba(8,7,13,.9)", displayFont: serifDisplay, bodyFont, shadow: "0 34px 100px rgba(0,0,0,.5)" },
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
    themeClass: "theme-memorial",
    themeMode: "warm",
    typographyMood: "soft",
    cardStyle: "minimal",
    heroTreatment: "soft-overlay",
    colorIntensity: "restrained",
    sectionOrder: ["hero", "credibility", "services", "process", "experience", "gallery"],
    theme: { pageBg: "#f3f0e8", surface: "#fbf9f4", text: "#303830", muted: "#6f746b", heroOverlay: "linear-gradient(90deg, rgba(243,240,232,.98), rgba(243,240,232,.9) 55%, rgba(243,240,232,.28))", heroText: "#303830", cardBg: "#fbf9f4", sectionBg: "#e8e8df", border: "rgba(48,56,48,.12)", navBg: "rgba(243,240,232,.94)", displayFont: serifDisplay, bodyFont, shadow: "0 22px 60px rgba(64,70,58,.12)" },
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
    themeClass: "theme-restaurant",
    themeMode: "warm",
    typographyMood: "editorial",
    cardStyle: "solid",
    heroTreatment: "immersive",
    colorIntensity: "balanced",
    sectionOrder: ["hero", "services", "gallery", "experience", "process", "credibility"],
    theme: { pageBg: "#170e0b", surface: "#271714", text: "#fff8ed", muted: "#d0bfb2", heroOverlay: "linear-gradient(90deg, rgba(23,14,11,.97), rgba(23,14,11,.72) 48%, rgba(23,14,11,.18))", heroText: "#fff8ed", cardBg: "#271714", sectionBg: "#20120f", border: "rgba(255,239,220,.14)", navBg: "rgba(23,14,11,.92)", displayFont: serifDisplay, bodyFont, shadow: "0 30px 90px rgba(0,0,0,.42)" },
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
    themeClass: "theme-3d-studio",
    themeMode: "dark",
    typographyMood: "technical",
    cardStyle: "bordered",
    heroTreatment: "technical",
    colorIntensity: "vivid",
    sectionOrder: ["hero", "services", "transformation", "process", "gallery", "credibility"],
    theme: { pageBg: "#090b14", surface: "#121827", text: "#f4f7ff", muted: "#aeb8ce", heroOverlay: "linear-gradient(90deg, rgba(9,11,20,.97), rgba(9,11,20,.7) 50%, rgba(9,11,20,.12))", heroText: "#f4f7ff", cardBg: "#111827", sectionBg: "#0d1220", border: "rgba(103,232,249,.18)", navBg: "rgba(9,11,20,.92)", displayFont: sansDisplay, bodyFont, shadow: "0 28px 90px rgba(3,7,18,.52)" },
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
    themeClass: "theme-professional",
    themeMode: "light",
    typographyMood: "clean",
    cardStyle: "bordered",
    heroTreatment: "split",
    colorIntensity: "restrained",
    sectionOrder: ["hero", "credibility", "services", "process", "experience", "gallery"],
    theme: { pageBg: "#f4f7fa", surface: "#ffffff", text: "#17243a", muted: "#617086", heroOverlay: "linear-gradient(90deg, rgba(244,247,250,.99), rgba(244,247,250,.94) 50%, rgba(244,247,250,.16) 78%)", heroText: "#17243a", cardBg: "#ffffff", sectionBg: "#eaf0f5", border: "rgba(23,36,58,.13)", navBg: "rgba(244,247,250,.94)", displayFont: serifDisplay, bodyFont, shadow: "0 24px 70px rgba(31,54,80,.13)" },
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
