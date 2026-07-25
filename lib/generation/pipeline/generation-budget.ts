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
  private readonly retriesByStage = new Map<string, number>();
  private readonly startedAt = Date.now();

  constructor(depth: GenerationDepth) {
    // Normal paths are still 2 (Fast) and 3 (Premium) calls. The additional
    // capacity is deliberately reserved for an explicitly recorded provider
    // retry/fallback and one bounded repair; it must not block the required
    // complete-page call after a recoverable planning hiccup.
    this.maxAiCalls = depth === "premium-final" ? 9 : 6;
    this.maxRepairCalls = 1;
    this.maxStageRetries = 1;
    this.maxOutputTokens = depth === "premium-final" ? 48_000 : 36_000;
    this.maxDurationMs = depth === "premium-final" ? 240_000 : 120_000;
  }

  consumeCall(stage: string) {
    this.assertTime();
    if (this.aiCalls >= this.maxAiCalls) throw new GenerationBudgetExceededError(`AI call budget exhausted before ${stage}.`);
    this.aiCalls += 1;
  }

  consumeRepair(stage: string) {
    this.assertTime();
    if (this.repairCalls >= this.maxRepairCalls) throw new GenerationBudgetExceededError(`Repair-call budget exhausted before ${stage}.`);
    this.repairCalls += 1;
  }

  consumeRetry(stage: string) {
    this.assertTime();
    const stageRetries = this.retriesByStage.get(stage) ?? 0;
    if (stageRetries >= this.maxStageRetries) throw new GenerationBudgetExceededError(`Retry budget exhausted for ${stage}.`);
    this.retriesByStage.set(stage, stageRetries + 1);
  }

  assertTime() {
    if (Date.now() - this.startedAt > this.maxDurationMs) throw new GenerationBudgetExceededError("Generation duration budget exhausted.");
  }

  snapshot() {
    const retriesByStage = Object.fromEntries(this.retriesByStage);
    const retries = Object.values(retriesByStage).reduce((total, count) => total + count, 0);
    return { aiCalls: this.aiCalls, repairCalls: this.repairCalls, retries, retriesByStage, maxAiCalls: this.maxAiCalls, maxDurationMs: this.maxDurationMs };
  }
}
