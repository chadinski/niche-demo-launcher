import { generationModeSummary, normalizeGenerationDepth, type GenerationStreamEvent } from "@/lib/generation/pipeline/types";

export type StreamSender = (event: GenerationStreamEvent | Record<string, unknown>) => void;

export async function runStreamingGeneration<TInput, TResult>(options: {
  input: TInput & { generationDepth?: unknown };
  send: StreamSender;
  runPremium: (input: TInput, mode: ReturnType<typeof generationModeSummary>, send: StreamSender) => Promise<TResult>;
  runFastDraft?: (input: TInput, mode: ReturnType<typeof generationModeSummary>, send: StreamSender) => Promise<TResult>;
}) {
  const generationDepth = normalizeGenerationDepth(options.input.generationDepth);
  const mode = generationModeSummary(generationDepth);

  if (generationDepth === "fast-draft" && options.runFastDraft) {
    return options.runFastDraft(options.input, mode, options.send);
  }

  return options.runPremium(options.input, mode, options.send);
}
