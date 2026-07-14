import OpenAI from "openai";
import { getRoutesForStage, type ModelRoute } from "@/lib/ai/modelRouter";
import { serverLog } from "@/lib/observability/logger";
import type { GenerationBudget } from "./generation-budget";
import type { StageMetadata } from "./types";

export type ModelCallOptions = { stage: "planning" | "complete-page" | "section" | "visual-qa"; prompt: string; maxOutputTokens: number; json?: boolean; repair?: boolean; budget: GenerationBudget };

async function callGemini(route: ModelRoute, options: ModelCallOptions) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured.");
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(route.model)}:generateContent`, {
    method: "POST", signal: AbortSignal.timeout(90_000), headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: options.prompt }] }], generationConfig: { temperature: options.json ? 0.2 : 0.65, maxOutputTokens: options.maxOutputTokens, responseMimeType: options.json ? "application/json" : "text/plain" } }),
  });
  const payload = await response.json().catch(() => null) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } } | null;
  if (!response.ok) throw new Error(payload?.error?.message || "Gemini request failed.");
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text.trim()) throw new Error("Gemini returned no output.");
  return text;
}

async function callOpenAI(route: ModelRoute, options: ModelCallOptions) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI is not configured.");
  const response = await new OpenAI({ apiKey }).responses.create({ model: route.model, input: options.prompt, max_output_tokens: options.maxOutputTokens, text: options.json ? { format: { type: "json_object" } } : undefined });
  if (!response.output_text?.trim()) throw new Error("OpenAI returned no output.");
  return response.output_text;
}

export async function callConfiguredModel(options: ModelCallOptions): Promise<{ text: string; metadata: StageMetadata }> {
  const routes = getRoutesForStage(options.stage).slice(0, 2);
  let lastError: unknown;
  for (const [routeIndex, route] of routes.entries()) {
    // The primary may receive one retry. A fallback is a single last attempt,
    // never another retry loop that silently increases customer cost.
    const attempts = routeIndex === 0 ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      options.budget.consumeCall(options.stage, options.repair);
      if (attempt) options.budget.consumeRetry(options.stage);
      const startedAt = Date.now();
      try {
        const text = route.provider === "gemini" ? await callGemini(route, options) : await callOpenAI(route, options);
        serverLog("info", "generation.model_call", { stage: options.stage, provider: route.provider, model: route.model, fallback: route.fallback, attempt: attempt + 1, latencyMs: Date.now() - startedAt });
        return { text, metadata: { stage: options.stage, provider: route.provider, model: route.model, fallback: route.fallback, attempt: attempt + 1, latencyMs: Date.now() - startedAt } };
      } catch (error) { lastError = error; serverLog("warn", "generation.model_call_failed", { stage: options.stage, provider: route.provider, model: route.model, fallback: route.fallback, attempt: attempt + 1, latencyMs: Date.now() - startedAt, reason: error instanceof Error ? error.message.slice(0, 180) : "unknown" }); if (attempt === 0) continue; }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Configured AI provider could not complete the request.");
}
