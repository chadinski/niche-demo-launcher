export type GenerationStage =
  | "extraction"
  | "inspiration"
  | "creative"
  | "design-system"
  | "planning"
  | "page-contract"
  | "section"
  | "qa"
  | "visual-qa"
  | "outreach"
  | "vision"
  | "fallback";

export type AiProvider = "gemini" | "openai";

const DEFAULT_FALLBACK_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_PLANNER_MODEL = "gemini-2.5-pro";
const DEFAULT_SECTION_MODEL = "gemini-2.5-pro";
const DEFAULT_QA_MODEL = "gemini-2.5-flash";
const DEFAULT_INSPIRATION_MODEL = "gemini-2.5-flash";
const DEFAULT_CONTRACT_MODEL = "gemini-2.5-pro";
const DEFAULT_OUTREACH_MODEL = "gemini-2.5-flash";
const DEFAULT_GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
];

function splitModels(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueModels(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export const EXTRACTION_MODEL = process.env.EXTRACTION_MODEL;
export const PLANNER_MODEL = process.env.PLANNER_MODEL || DEFAULT_PLANNER_MODEL;
export const SECTION_MODEL = process.env.SECTION_MODEL || DEFAULT_SECTION_MODEL;
export const QA_MODEL = process.env.QA_MODEL || DEFAULT_QA_MODEL;
export const INSPIRATION_MODEL = process.env.INSPIRATION_MODEL || DEFAULT_INSPIRATION_MODEL;
export const CREATIVE_MODEL = process.env.CREATIVE_MODEL || process.env.PLANNER_MODEL || DEFAULT_CONTRACT_MODEL;
export const DESIGN_SYSTEM_MODEL = process.env.DESIGN_SYSTEM_MODEL || process.env.PLANNER_MODEL || DEFAULT_CONTRACT_MODEL;
export const PAGE_CONTRACT_MODEL = process.env.PAGE_CONTRACT_MODEL || process.env.PLANNER_MODEL || DEFAULT_CONTRACT_MODEL;
export const VISUAL_QA_MODEL = process.env.VISUAL_QA_MODEL || process.env.QA_MODEL || DEFAULT_QA_MODEL;
export const OUTREACH_MODEL = process.env.OUTREACH_MODEL || process.env.QA_MODEL || DEFAULT_OUTREACH_MODEL;
export const VISION_MODEL = process.env.VISION_MODEL;

export const MODEL_CONFIG = {
  extraction: EXTRACTION_MODEL,
  inspiration: INSPIRATION_MODEL,
  creative: CREATIVE_MODEL,
  designSystem: DESIGN_SYSTEM_MODEL,
  planner: PLANNER_MODEL,
  pageContract: PAGE_CONTRACT_MODEL,
  section: SECTION_MODEL,
  qa: QA_MODEL,
  visualQa: VISUAL_QA_MODEL,
  outreach: OUTREACH_MODEL,
  vision: VISION_MODEL,
  fallback:
    process.env.FALLBACK_MODEL ||
    process.env.GEMINI_MODEL ||
    process.env.OPENAI_MODEL ||
    DEFAULT_FALLBACK_MODEL,
  openai: process.env.OPENAI_MODEL,
  gemini: process.env.GEMINI_MODEL,
  geminiFallbacks: uniqueModels([
    ...splitModels(process.env.GEMINI_FALLBACK_MODELS),
    ...DEFAULT_GEMINI_FALLBACK_MODELS,
  ]),
} as const;

export function getModelForStage(stage: GenerationStage): string {
  switch (stage) {
    case "extraction":
      return MODEL_CONFIG.extraction || MODEL_CONFIG.gemini || MODEL_CONFIG.fallback;
    case "inspiration":
      return MODEL_CONFIG.inspiration;
    case "creative":
      return MODEL_CONFIG.creative;
    case "design-system":
      return MODEL_CONFIG.designSystem;
    case "planning":
      return MODEL_CONFIG.planner;
    case "page-contract":
      return MODEL_CONFIG.pageContract;
    case "section":
      return MODEL_CONFIG.section;
    case "qa":
      return MODEL_CONFIG.qa;
    case "visual-qa":
      return MODEL_CONFIG.visualQa;
    case "outreach":
      return MODEL_CONFIG.outreach;
    case "vision":
      return MODEL_CONFIG.vision || MODEL_CONFIG.gemini || MODEL_CONFIG.fallback;
    case "fallback":
    default:
      return MODEL_CONFIG.fallback;
  }
}

export function inferProvider(model: string): AiProvider {
  if (/^(gpt|o\d|chatgpt)/i.test(model)) return "openai";
  return "gemini";
}

export function getGeminiFallbackModels() {
  return MODEL_CONFIG.geminiFallbacks;
}
