import { describe, expect, it } from "vitest";
import { MOCK_PROSPECTS } from "@/lib/mock-data";
import { mergeProspect, nextAction, salesStage } from "@/lib/workspace";
import { readDemoResponse } from "@/lib/generation/client-stream";
import { getLeadIndustryTarget } from "@/lib/leads/industry-targets";
import { normalizeLeadCandidate } from "@/lib/leads/lead-qualification";
import { isolatedShareHtml } from "@/lib/sharing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("business workspace state", () => {
  it("keeps sales stage when demo content changes", () => {
    const current = {
      ...MOCK_PROSPECTS[0],
      sales_stage: "contacted" as const,
      demo_status: "reviewed" as const,
    };
    const updated = mergeProspect(current, {
      generated_website_html: "<main>New approved copy</main>",
    });
    expect(salesStage(updated)).toBe("contacted");
    expect(updated.demo_status).toBe("draft");
  });

  it("routes business next steps to actual workspace tabs", () => {
    const next = nextAction({
      ...MOCK_PROSPECTS[0],
      generated_website_html: "",
      outreach_status: "new",
      next_follow_up_at: null,
      business_intelligence: null,
    });
    expect(next.tab).toBe("facts");
  });

  it("does not infer a verified location from the search query", () => {
    const candidate = normalizeLeadCandidate(
      {
        title: "Island Dental",
        url: "https://example.com",
        description: "Dental clinic",
      },
      "Dentist",
      "Kingston Jamaica",
      getLeadIndustryTarget("health-wellness-beauty"),
    );
    expect(candidate?.location).toBe("");
    expect(candidate?.searchLocation).toBe("Kingston Jamaica");
    expect(candidate?.websiteStatus).toContain("confirm ownership");
  });
});

describe("website generation response recovery", () => {
  it("parses chunked SSE, ignores an outdated run, and accepts the active completion", async () => {
    const blocks = [
      `data: ${JSON.stringify({ type: "complete", generationId: "old-run", html: "<h1>Old</h1>" })}\r\n\r\n`,
      `data: ${JSON.stringify({ type: "generating-website", generationId: "active-run" })}\r\n\r\n`,
      `data: ${JSON.stringify({ type: "complete", generationId: "active-run", html: "<h1>Current</h1>" })}\r\n\r\n`,
    ].join("");
    const bytes = new TextEncoder().encode(blocks);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 27));
        controller.enqueue(bytes.slice(27, 81));
        controller.enqueue(bytes.slice(81));
        controller.close();
      },
    });
    const response = new Response(body, {
      headers: { "Content-Type": "text/event-stream" },
    });
    const progress: string[] = [];
    const result = await readDemoResponse(response, "active-run", (event) =>
      progress.push(event.type),
    );
    expect(result.html).toBe("<h1>Current</h1>");
    expect(progress).toEqual(["generating-website", "complete"]);
  });

  it("fails clearly when the stream ends before a matching completion", async () => {
    const response = new Response(
      `data: ${JSON.stringify({ type: "complete", generationId: "old-run", html: "old" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream" } },
    );
    await expect(
      readDemoResponse(response, "active-run", () => undefined),
    ).rejects.toThrow(/connection ended/i);
  });
});

describe("shared demo preview isolation", () => {
  it("adds a restrictive content policy to the saved snapshot", () => {
    const html = isolatedShareHtml(
      "<!doctype html><html><head><title>Demo</title></head><body>Review</body></html>",
    );
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("form-action 'none'");
    expect(html).toContain("base-uri 'none'");
  });

  it("keeps database sharing owner-readable and server-written", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/202610160001_client_workspace.sql",
      ),
      "utf8",
    );
    expect(migration).toMatch(/enable row level security/i);
    expect(migration).toMatch(/Owners read demo shares[\s\S]*auth\.uid\(\)/i);
    expect(migration).toMatch(
      /revoke insert,update,delete on public\.demo_shares,public\.demo_feedback/i,
    );
    expect(migration).toContain("old.generated_website_html");
  });
});
