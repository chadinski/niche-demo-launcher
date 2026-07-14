import type { GenerationDepth } from "./types";

export class GenerationBudgetExceededError extends Error {
  code = "GENERATION_BUDGET_EXHAUSTED";
}

export class GenerationBudget {
  readonly maxAiCalls: number;
  readonly maxRepairCalls: number;
  readonly maxStageRetries: number;
  readonly maxOutputTokens: number;
  readonly maxDurationMs: number;
  private aiCalls = 0;
  private repairCalls = 0;
  private retries = 0;
  private readonly startedAt = Date.now();

  constructor(depth: GenerationDepth) {
    this.maxAiCalls = depth === "premium-final" ? 4 : 3;
    this.maxRepairCalls = 1;
    this.maxStageRetries = 1;
    this.maxOutputTokens = depth === "premium-final" ? 48_000 : 36_000;
    this.maxDurationMs = depth === "premium-final" ? 240_000 : 120_000;
  }

  consumeCall(stage: string, repair = false) {
    this.assertTime();
    if (this.aiCalls >= this.maxAiCalls) throw new GenerationBudgetExceededError(`AI call budget exhausted before ${stage}.`);
    if (repair && this.repairCalls >= this.maxRepairCalls) throw new GenerationBudgetExceededError("Repair-call budget exhausted.");
    this.aiCalls += 1;
    if (repair) this.repairCalls += 1;
  }

  consumeRetry(stage: string) {
    this.assertTime();
    if (this.retries >= this.maxStageRetries) throw new GenerationBudgetExceededError(`Retry budget exhausted for ${stage}.`);
    this.retries += 1;
  }

  assertTime() {
    if (Date.now() - this.startedAt > this.maxDurationMs) throw new GenerationBudgetExceededError("Generation duration budget exhausted.");
  }

  snapshot() {
    return { aiCalls: this.aiCalls, repairCalls: this.repairCalls, retries: this.retries, maxAiCalls: this.maxAiCalls, maxDurationMs: this.maxDurationMs };
  }
}
