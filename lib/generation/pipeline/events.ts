import type { GenerationStreamEvent } from "./types";

export type EventSender = (event: GenerationStreamEvent) => void;

export function safeEvent(event: GenerationStreamEvent) {
  const { type, generationId } = event;
  if (type === "complete") return event;
  return { ...event, generationId };
}

const stageOrder = ["understanding-business", "planning-site", "generating-website", "checking-output", "repairing-output", "complete"];

/** Used by tests and transports to reject out-of-order stale pipeline events. */
export function isValidEventOrder(events: Array<Pick<GenerationStreamEvent, "type">>) {
  let previous = -1;
  for (const event of events) {
    if (event.type === "error") return true;
    const index = stageOrder.indexOf(event.type);
    if (index < 0 || index < previous) return false;
    previous = index;
  }
  return true;
}

export function isEventForGeneration(activeGenerationId: string, event: unknown) {
  const generationId = event && typeof event === "object" && "generationId" in event && typeof event.generationId === "string"
    ? event.generationId
    : "";
  return !generationId || generationId === activeGenerationId;
}

/** Failed generation reservations are released; only a completed page consumes usage. */
export function usageStatusForPipelineOutcome(succeeded: boolean): "succeeded" | "refunded" {
  return succeeded ? "succeeded" : "refunded";
}
