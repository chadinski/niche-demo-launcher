export type DemoEvent = {
  type: string;
  generationId?: string;
  html?: string;
  error?: string;
  generationPlan?: Record<string, unknown>;
  qualityGate?: { passed?: boolean; rejectionReasons?: string[] };
};
export async function readDemoResponse(
  response: Response,
  generationId: string,
  onProgress: (event: DemoEvent) => void,
): Promise<DemoEvent> {
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    const data = (await response.json()) as DemoEvent;
    if (!response.ok || !data.html)
      throw new Error(
        data.error || "Generation did not return a website. Try again.",
      );
    if (data.generationId !== generationId)
      throw new Error("An outdated response was ignored.");
    return data;
  }
  if (!response.ok || !response.body)
    throw new Error("Generation could not connect. Try again.");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "";
  let complete: DemoEvent | undefined;
  const accept = (block: string) => {
    const content = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!content) return;
    const event = JSON.parse(content) as DemoEvent;
    if (event.generationId && event.generationId !== generationId) return;
    if (event.type === "error")
      throw new Error(
        event.error || "Generation stopped. Your saved demo is unchanged.",
      );
    onProgress(event);
    if (
      event.type === "complete" &&
      event.generationId === generationId &&
      event.html
    )
      complete = event;
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || "";
      blocks.forEach(accept);
      if (done) {
        if (buffer.trim()) accept(buffer);
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (!complete)
    throw new Error(
      "The connection ended before completion. Recover the last run or retry; your previous demo is safe.",
    );
  return complete;
}
