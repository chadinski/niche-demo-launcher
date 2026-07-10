import { describe, expect, it, vi, afterEach } from "vitest";
import { getRoutesForStage } from "@/lib/ai/modelRouter";
import { openAIBusinessUnderstandingSchema } from "@/lib/openai-business-intelligence";
import { auditWebsite } from "@/lib/automation/quality-audit";
import { clearGenerationStorage, GENERATION_STORAGE_KEYS } from "@/lib/generation/session";
import { getLeadIndustryTarget } from "@/lib/leads/industry-targets";
import { normalizeLeadCandidate, canonicalizeLeadUrl } from "@/lib/leads/lead-qualification";
import { searchFirecrawlLeads } from "@/lib/leads/firecrawl-lead-search";
import { parseBusinessInfo } from "@/lib/generators/parser";
import type { BusinessInfo } from "@/lib/types";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("business parser", () => {
  it("extracts business name and category from messy profile text", () => {
    const parsed = parseBusinessInfo(`
      HappyFeet PetWorld Kingston
      Page · Pet Store
      Ruthven Medical Centre, 4 Ruthven Rd, Kingston, Jamaica
      We help Kingston pet owners protect, groom, and travel safely with their pets.
      +1 (876) 850-1017
    `);

    expect(parsed.businessName).toBe("HappyFeet PetWorld Kingston");
    expect(parsed.category).toBe("pet care");
    expect(parsed.location).toContain("Kingston");
  });

  it("infers trades/local service category instead of generic professional service", () => {
    const parsed = parseBusinessInfo(`
      HandyHub
      Page · In-Home Service
      Quick, trusted home service help. Book plumbers, electricians, painters and locksmiths.
      Portmore, Jamaica · New Kingston, Jamaica
    `);

    expect(parsed.category).toMatch(/construction|cleaning service|auto|pet care|restaurant|salon|clinic|florist|3d printing|home service/i);
    expect(parsed.category).not.toMatch(/consulting|professional/i);
  });
});

describe("business intelligence schema", () => {
  it("accepts field-level evidence metadata", () => {
    const parsed = openAIBusinessUnderstandingSchema.safeParse({
      rawOcrText: "Island Spice Kitchen Kingston · Restaurant",
      cleanedText: "Island Spice Kitchen Kingston",
      visualClues: ["Jamaican food imagery", "yellow green red logo"],
      businessNameCandidates: [{ value: "Island Spice Kitchen Kingston", score: 95, evidence: ["profile header"] }],
      selectedBusinessName: "Island Spice Kitchen Kingston",
      businessNameConfidence: 95,
      businessNameReason: "Visible in profile header",
      industry: {
        primaryIndustry: "Restaurant",
        secondaryIndustry: "",
        confidence: 92,
        category: { id: "food-hospitality-entertainment", label: "Food, Hospitality & Entertainment", examples: [] },
        categoryConfidence: 94,
        explanation: "Visible restaurant page category",
        triggeredKeywords: ["Restaurant"],
      },
      theme: {
        variation: "local-community",
        mood: "warm",
        palette: ["#facc15", "#16a34a"],
        typography: "bold friendly",
        animation: "subtle",
        sectionPriorities: ["menu", "contact"],
        cta: "Call now",
        imageStyle: "food photography",
        trustElements: ["location"],
        layoutStyle: "menu-forward",
        notes: [],
      },
      services: ["Jamaican flavors"],
      contact: { phone: "", email: "", website: "", social: "", location: "Kingston" },
      seoKeywords: ["Jamaican restaurant Kingston"],
      missingInformation: [],
      assumptions: [],
      enrichedInfo: {
        businessName: "Island Spice Kitchen Kingston",
        category: "Restaurant",
        location: "Kingston",
        phone: "",
        email: "",
        websiteUrl: "",
        socialUrl: "",
        services: "Jamaican flavors",
        brandColors: "#facc15, #16a34a",
        notes: "",
        painPoints: "",
      },
      fieldEvidence: {
        businessName: { value: "Island Spice Kitchen Kingston", confidence: 95, source: "ocr", evidence: ["profile header"], needsReview: false },
        category: { value: "Restaurant", confidence: 94, source: "ocr", evidence: ["Page · Restaurant"], needsReview: false },
        location: { value: "Kingston", confidence: 80, source: "ocr", evidence: ["visible city"], needsReview: false },
        phone: { value: "", confidence: 30, source: "fallback", evidence: [], needsReview: true },
        email: { value: "", confidence: 30, source: "fallback", evidence: [], needsReview: true },
        websiteUrl: { value: "", confidence: 30, source: "fallback", evidence: [], needsReview: true },
        socialUrl: { value: "", confidence: 30, source: "fallback", evidence: [], needsReview: true },
        services: { value: ["Jamaican flavors"], confidence: 78, source: "ocr", evidence: ["bio"], needsReview: false },
        brandColors: { value: ["#facc15", "#16a34a"], confidence: 76, source: "image", evidence: ["logo colors"], needsReview: false },
      },
      reportMarkdown: "# Report",
    });

    expect(parsed.success).toBe(true);
  });
});

describe("model router", () => {
  it("returns fallback routes for a stage without requiring API keys", () => {
    vi.stubEnv("PLANNER_MODEL", "gemini-2.5-pro");

    const routes = getRoutesForStage("planning");

    expect(routes[0]?.stage).toBe("planning");
    expect(routes.some((route) => route.fallback)).toBe(true);
  });
});

describe("generation session cleanup", () => {
  it("clears generation storage keys from localStorage and sessionStorage", () => {
    const store = new Map<string, string>();
    const session = new Map<string, string>();
    const storageFor = (target: Map<string, string>) => ({
      removeItem: vi.fn((key: string) => target.delete(key)),
      setItem: vi.fn((key: string, value: string) => target.set(key, value)),
      getItem: vi.fn((key: string) => target.get(key) ?? null),
    });
    vi.stubGlobal("window", {
      localStorage: storageFor(store),
      sessionStorage: storageFor(session),
    });

    for (const key of GENERATION_STORAGE_KEYS) {
      store.set(key, "x");
      session.set(key, "x");
    }

    clearGenerationStorage();

    expect(store.size).toBe(0);
    expect(session.size).toBe(0);
  });
});

describe("quality audit", () => {
  const info: BusinessInfo = {
    rawInfo: "HandyHub plumbers electricians Portmore Jamaica",
    businessName: "HandyHub",
    category: "In-Home Service",
    location: "Portmore, Jamaica",
    phone: "(876) 782-4814",
    email: "",
    websiteUrl: "",
    socialUrl: "",
    services: "plumbers, electricians, painters",
    brandColors: "#f5c76b, #4b5563",
    notes: "",
    painPoints: "",
    packagePrice: "$1,000",
    demoUrl: "",
  };

  it("caps technically complete but boring output", () => {
    const html = `<!doctype html><html><head><title>HandyHub</title><meta name="description" content="Modern solutions"><meta property="og:title" content="HandyHub"><meta name="viewport" content="width=device-width"></head><body data-seraphim-generator="true"><section class="hero">Transform your business with best-in-class comprehensive services.</section><section>services</section><section>contact</section><section>faq</section><section>gallery</section><section>cta</section></body></html>`;

    const audit = auditWebsite(html, info);

    expect(audit.score).toBeLessThanOrEqual(72);
    expect(audit.warnings.join(" ")).toMatch(/generic|boring|corporate/i);
  });
});

describe("lead candidate normalization", () => {
  it("normalizes duplicate search results to the same candidate id", () => {
    const target = getLeadIndustryTarget("auto-services");
    const first = normalizeLeadCandidate(
      { title: "Johnsons Premium Finish | Facebook", url: "https://facebook.com/johnsonspremiumfinish", description: "Auto detailing service Kingston (876) 339-8526" },
      "auto detailing",
      "Kingston, Jamaica",
      target,
    );
    const second = normalizeLeadCandidate(
      { title: "Johnsons Premium Finish | Facebook", url: "https://facebook.com/johnsonspremiumfinish", description: "Auto detailing service Kingston (876) 339-8526" },
      "auto detailing",
      "Kingston, Jamaica",
      target,
    );

    expect(first?.id).toBe(second?.id);
    expect(first?.leadScore).toBeGreaterThan(40);
  });

  it("uses a canonical source URL for tracking variants", () => {
    const first = normalizeLeadCandidate(
      { title: "Example Business", url: "HTTPS://WWW.Example.com/profile/?utm_source=search#contact", description: "Local service" },
      "home services",
      "Kingston, Jamaica",
      getLeadIndustryTarget("contractors-home-services"),
    );
    const second = normalizeLeadCandidate(
      { title: "Example Business", url: "https://example.com/profile", description: "Local service" },
      "home services",
      "Kingston, Jamaica",
      getLeadIndustryTarget("contractors-home-services"),
    );

    expect(canonicalizeLeadUrl(first?.sourceUrl || "")).toBe("https://example.com/profile");
    expect(first?.id).toBe(second?.id);
  });

  it("passes Firecrawl geo targeting and surfaces API warnings", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "fc-test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      warning: "Some results were omitted.",
      data: { web: [{ title: "Example Business", url: "https://example.com", description: "Home service in Kingston" }] },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchFirecrawlLeads({
      targetIndustryId: "contractors-home-services",
      industry: "Home services",
      location: "Kingston Jamaica",
      country: "jm",
      limit: 5,
    });
    const request = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as Record<string, unknown>;

    expect(request.country).toBe("JM");
    expect(request.location).toBe("Kingston Jamaica");
    expect(request.ignoreInvalidURLs).toBe(true);
    expect(result.warnings).toContain("Some results were omitted.");
  });
});
