import { generationModeSummary, normalizeGenerationDepth, type GenerationDepth } from "@/lib/generation/pipeline/types";

export type RunGenerationOptions<TInput, TResult> = {
  input: TInput & { generationDepth?: unknown };
  runPremium: (input: TInput, mode: ReturnType<typeof generationModeSummary>) => Promise<TResult>;
  runFastDraft?: (input: TInput, mode: ReturnType<typeof generationModeSummary>) => Promise<TResult>;
};

export async function runGeneration<TInput, TResult>(options: RunGenerationOptions<TInput, TResult>) {
  const generationDepth: GenerationDepth = normalizeGenerationDepth(options.input.generationDepth);
  const mode = generationModeSummary(generationDepth);

  if (generationDepth === "fast-draft" && options.runFastDraft) {
    return options.runFastDraft(options.input, mode);
  }

  return options.runPremium(options.input, mode);
}
