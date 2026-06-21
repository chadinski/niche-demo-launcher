import {
  getGeminiFallbackModels,
  getModelForStage,
  inferProvider,
  MODEL_CONFIG,
  type AiProvider,
  type GenerationStage,
} from "@/lib/ai/modelConfig";

export type ModelRoute = {
  stage: GenerationStage;
  provider: AiProvider;
  model: string;
  fallback: boolean;
  reason: string;
};

function uniqueRoutes(routes: ModelRoute[]) {
  const seen = new Set<string>();
  return routes.filter((route) => {
    const key = `${route.provider}:${route.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getRoutesForStage(
  stage: GenerationStage,
  options: { hasImage?: boolean } = {},
): ModelRoute[] {
  const routedStage = options.hasImage ? "vision" : stage;
  const primaryModel = getModelForStage(routedStage);
  const primaryProvider = inferProvider(primaryModel);
  const routes: ModelRoute[] = [
    {
      stage: routedStage,
      provider: primaryProvider,
      model: primaryModel,
      fallback: false,
      reason: options.hasImage
        ? "Vision-capable route selected because the request includes an image."
        : `Primary ${stage} route selected from centralized model config.`,
    },
  ];

  if (primaryProvider !== "gemini") {
    routes.push(
      ...getGeminiFallbackModels().map((model) => ({
        stage,
        provider: "gemini" as const,
        model,
        fallback: true,
        reason: "Gemini fallback route from centralized model config.",
      })),
    );
  } else {
    routes.push(
      ...getGeminiFallbackModels().map((model) => ({
        stage,
        provider: "gemini" as const,
        model,
        fallback: true,
        reason: "Gemini fallback route from centralized model config.",
      })),
    );
  }

  if (MODEL_CONFIG.openai) {
    routes.push({
      stage,
      provider: "openai",
      model: MODEL_CONFIG.openai,
      fallback: primaryProvider !== "openai",
      reason: "OpenAI fallback route from centralized model config.",
    });
  }

  return uniqueRoutes(routes);
}

export function logModelRoute(route: ModelRoute, generationId: string) {
  console.info(
    `[generation:${generationId}] ${route.stage} handled by ${route.provider}:${route.model}${route.fallback ? " (fallback)" : ""}`,
  );
}
