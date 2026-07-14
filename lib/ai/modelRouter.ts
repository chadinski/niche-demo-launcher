import {
  getGeminiFallbackModels,
  getModelForStage,
  inferProvider,
  MODEL_CONFIG,
  type AiProvider,
  type GenerationStage,
} from "@/lib/ai/modelConfig";
import { serverLog } from "@/lib/observability/logger";

export type ModelRoute = {
  stage: GenerationStage;
  provider: AiProvider;
  model: string;
  fallback: boolean;
  reason: string;
};

type CircuitState = {
  failures: number;
  openedAt: number | null;
};

const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_RESET_MS = 60_000;
const ROUTE_RETRIES = 1;
const BASE_RETRY_DELAY_MS = 500;
const circuitState = new Map<string, CircuitState>();

function routeKey(route: Pick<ModelRoute, "stage" | "provider" | "model">) {
  return `${route.stage}:${route.provider}:${route.model}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt: number) {
  return BASE_RETRY_DELAY_MS * 2 ** attempt;
}

function getCircuitState(route: ModelRoute) {
  const key = routeKey(route);
  const state = circuitState.get(key) ?? { failures: 0, openedAt: null };
  circuitState.set(key, state);
  return state;
}

export function isModelRouteAvailable(route: ModelRoute) {
  const state = getCircuitState(route);
  if (!state.openedAt) return true;

  if (Date.now() - state.openedAt >= CIRCUIT_RESET_MS) {
    circuitState.set(routeKey(route), { failures: 0, openedAt: null });
    return true;
  }

  return false;
}

export function recordModelRouteSuccess(route: ModelRoute) {
  circuitState.set(routeKey(route), { failures: 0, openedAt: null });
}

export function recordModelRouteFailure(route: ModelRoute) {
  const state = getCircuitState(route);
  const failures = state.failures + 1;
  circuitState.set(routeKey(route), {
    failures,
    openedAt: failures >= CIRCUIT_FAILURE_THRESHOLD ? Date.now() : state.openedAt,
  });
}

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

  const fallbackModel = primaryProvider === "gemini"
    ? (MODEL_CONFIG.openai || getGeminiFallbackModels().find((model) => model !== primaryModel))
    : getGeminiFallbackModels()[0];
  if (fallbackModel) routes.push({ stage, provider: inferProvider(fallbackModel), model: fallbackModel, fallback: true, reason: "Single bounded fallback route from centralized model config." });

  return uniqueRoutes(routes).filter(isModelRouteAvailable).slice(0, 2);
}

export function logModelRoute(route: ModelRoute, generationId: string) {
  serverLog("info","ai.route_selected",{generationId,stage:route.stage,provider:route.provider,model:route.model,fallback:route.fallback});
}

export async function runWithModelRouteRetry<T>(
  route: ModelRoute,
  operation: (route: ModelRoute, attempt: number) => Promise<T>,
  options: { retries?: number } = {},
) {
  if (!isModelRouteAvailable(route)) {
    throw new Error(`Circuit open for ${route.provider}:${route.model} on ${route.stage}.`);
  }

  const retries = options.retries ?? ROUTE_RETRIES;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const startedAt=Date.now();
    try {
      const result = await operation(route, attempt);
      recordModelRouteSuccess(route);
      serverLog("info","ai.stage_completed",{stage:route.stage,provider:route.provider,model:route.model,fallback:route.fallback,attempt,latencyMs:Date.now()-startedAt});
      return result;
    } catch (error) {
      lastError = error;
      serverLog("warn","ai.stage_attempt_failed",{stage:route.stage,provider:route.provider,model:route.model,fallback:route.fallback,attempt,latencyMs:Date.now()-startedAt});
      if (attempt >= retries) break;
      await sleep(retryDelay(attempt));
    }
  }

  recordModelRouteFailure(route);
  throw lastError instanceof Error
    ? lastError
    : new Error(`${route.provider}:${route.model} failed after retries.`);
}
