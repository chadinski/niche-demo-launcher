export type GenerationStage =
  | "extraction"
  | "planning"
  | "section"
  | "qa"
  | "vision"
  | "fallback";

export type AiProvider = "gemini" | "openai";

const DEFAULT_FALLBACK_MODEL = "gemini-2.5-flash-lite";
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

export const MODEL_CONFIG = {
  extraction: process.env.EXTRACTION_MODEL,
  planner: process.env.PLANNER_MODEL,
  section: process.env.SECTION_MODEL,
  qa: process.env.QA_MODEL,
  vision: process.env.VISION_MODEL,
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
    case "planning":
      return MODEL_CONFIG.planner || MODEL_CONFIG.fallback;
    case "section":
      return MODEL_CONFIG.section || MODEL_CONFIG.openai || MODEL_CONFIG.fallback;
    case "qa":
      return MODEL_CONFIG.qa || MODEL_CONFIG.fallback;
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
