import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getRoutesForStage, type ModelRoute } from "@/lib/ai/modelRouter";

const businessInfoSchema = z.object({
  rawInfo: z.string().default(""),
  businessName: z.string().default(""),
  category: z.string().default(""),
  location: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  websiteUrl: z.string().default(""),
  socialUrl: z.string().default(""),
  services: z.string().default(""),
  brandColors: z.string().default(""),
  notes: z.string().default(""),
  painPoints: z.string().default(""),
  packagePrice: z.string().default(""),
  demoUrl: z.string().default(""),
});

const requestSchema = z.object({
  generationId: z.string().min(1).max(80),
  info: businessInfoSchema,
  generationMode: z.string().max(80).optional().default("standard"),
  businessUnderstanding: z.unknown().optional(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getUnderstandingSummary(value: unknown) {
  if (!isRecord(value)) return "No structured business intelligence was supplied.";

  const industry = isRecord(value.industry) ? value.industry : {};
  const theme = isRecord(value.theme) ? value.theme : {};
  const contact = isRecord(value.contact) ? value.contact : {};
  const services = Array.isArray(value.services) ? value.services.filter((item) => typeof item === "string") : [];
  const missingInformation = Array.isArray(value.missingInformation)
    ? value.missingInformation.filter((item) => typeof item === "string")
    : [];
  const assumptions = Array.isArray(value.assumptions) ? value.assumptions.filter((item) => typeof item === "string") : [];

  const prioritySections = Array.isArray(theme.sectionPriorities)
    ? theme.sectionPriorities.filter((item) => typeof item === "string").slice(0, 8).join(", ")
    : "";
  const trustElements = Array.isArray(theme.trustElements)
    ? theme.trustElements.filter((item) => typeof item === "string").slice(0, 8).join(", ")
    : "";
  const palette = Array.isArray(theme.palette) ? theme.palette.filter((item) => typeof item === "string").slice(0, 6).join(", ") : "";

  return [
    `Name: ${asString(value.selectedBusinessName) || "unknown"} (${typeof value.businessNameConfidence === "number" ? value.businessNameConfidence : "?"}/100 confidence)`,
    `Industry: ${asString(industry.primaryIndustry) || "unknown"} (${typeof industry.confidence === "number" ? industry.confidence : "?"}/100 confidence)`,
    `Visual direction: ${asString(theme.variation) || "premium"}; ${asString(theme.mood) || "custom, credible, high-end"}; palette ${palette || "derive from business context"}`,
    `Recommended CTA: ${asString(theme.cta) || "Request a quote / contact"}`,
    `Priority sections: ${prioritySections || "hero, services, proof, process, contact"}`,
    `Trust/proof to prepare for: ${trustElements || "real photos, reviews, credentials, service-area facts"}`,
    `Extracted services: ${services.slice(0, 10).join(", ") || "unknown"}`,
    `Contact: phone=${asString(contact.phone) || "missing"}; email=${asString(contact.email) || "missing"}; website=${asString(contact.website) || "missing"}; social=${asString(contact.social) || "missing"}; location=${asString(contact.location) || "missing"}`,
    `Known gaps: ${missingInformation.slice(0, 8).join("; ") || "none listed"}`,
    `Assumptions to avoid overclaiming: ${assumptions.slice(0, 8).join("; ") || "none listed"}`,
  ].join("\n");
}

function compactBusinessFacts(info: z.infer<typeof businessInfoSchema>) {
  const rows = [
    ["Business", info.businessName],
    ["Category", info.category],
    ["Location", info.location],
    ["Phone", info.phone],
    ["Email", info.email],
    ["Website", info.websiteUrl],
    ["Social", info.socialUrl],
    ["Services", info.services],
    ["Brand colors", info.brandColors],
    ["Observed opportunity", info.painPoints],
    ["Internal notes", info.notes],
    ["Package price", info.packagePrice],
    ["Demo URL", info.demoUrl],
  ]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`);

  if (info.rawInfo.trim()) rows.push(`Raw source notes:\n${info.rawInfo.trim().slice(0, 6000)}`);

  return rows.join("\n") || "No business facts supplied.";
}

function modeDirection(mode: string) {
  switch (mode) {
    case "more-luxury":
      return "Push the result more editorial, spacious, refined, and luxury-service. Use restraint, strong typography, composed imagery, and premium proof framing.";
    case "more-local":
      return "Make the result warmer, more neighborhood-rooted, practical, and easy to contact while preserving polish.";
    case "more-bold":
      return "Make the result more dramatic, modern, energetic, and visually confident without becoming gimmicky.";
    default:
      return "Balanced premium: custom, polished, conversion-focused, and industry-specific.";
  }
}

function buildPrompt(input: z.infer<typeof requestSchema>) {
  const { info, generationMode, businessUnderstanding } = input;
  const businessFacts = compactBusinessFacts(info);
  const intelligence = getUnderstandingSummary(businessUnderstanding);

  return `Role: senior Niche Studios website designer + conversion copywriter + single-file frontend engineer.

Task: produce ONE complete, deployable legacy index.html for a private prospect demo.

Inputs:
${businessFacts}

Business intelligence:
${intelligence}

Generation direction: ${modeDirection(generationMode)}

Output rules:
- Return only HTML. Start with <!DOCTYPE html> and end with </html>. No markdown fences.
- Single file only: semantic HTML, embedded CSS, minimal embedded JS. No React/Tailwind/build step/external JS.
- Private demo SEO: include viewport, title, meta description, theme-color, OG/Twitter basics when supportable, and robots noindex,nofollow. Do not invent canonical URLs.
- JSON-LD only for visible verified facts; never add ratings, offers, reviews, awards, or prices unless supplied.

Fact rules:
- Use only supplied/derived facts for visible claims: name, category, location, contact, services, colors, notes.
- Never invent testimonials, ratings, awards, certifications, guarantees, years in business, customer counts, exact prices, or performance results.
- Missing proof becomes clearly labeled proof slots: "Verified proof to add", "Representative imagery", "Replace with verified business photography".
- If including a form, make it a visibly labeled demo/prototype interaction unless a real endpoint is supplied.

Luxury execution standard:
- This must feel like a $1,000+ custom concept, not a generic landing page.
- Choose one visual thesis tailored to the industry: e.g. warm editorial hospitality, precise technical confidence, quiet clinical trust, crafted local authority, cinematic portfolio, dignified memorial care.
- Preserve any supplied brand colors, but elevate them with a disciplined palette, rich neutrals, and restrained accents.
- Use editorial composition: asymmetry where useful, strong first viewport, varied section rhythms, purposeful whitespace, composed typography, and proof-oriented imagery.
- Avoid cheap signals: repeated three-card grids, fake logo strips, generic SaaS dashboards for non-software businesses, vague hype, decorative blobs, neon/purple defaults, filler badges, and inflated copy.
- Every section needs a conversion job. Skimmable headings should communicate value without reading body copy.

Required page architecture:
1. Header: brand, concise anchors, primary CTA.
2. Hero: what the business offers, for whom/where, why it matters, primary CTA, one proof/reassurance cue.
3. Trust bridge: verified facts if available; otherwise honest proof placeholders.
4. Services/products: grouped by customer intent, not a flat generic list.
5. Differentiator/story: explain the value or better customer journey without unsupported claims.
6. Process/expectations: how to enquire, book, request quote, order, visit, or confirm availability.
7. Visual showcase: niche-relevant HTTPS imagery, labeled representative unless verified.
8. FAQ/decision support: factual answers that reduce friction.
9. Final CTA + footer: complete contact paths and clear private concept disclosure.

Design system requirements:
- Use CSS custom properties for color, type, spacing, radius, borders, shadow, focus, and motion.
- Mobile-first; include responsive behavior for 360px, 430px, 768px, 1280px, and wide desktop.
- Accessible landmarks, one h1, logical h2/h3 order, labels, descriptive links, visible focus, 44px-ish tap targets, reduced-motion support.
- Use guarded JS only for real interactions such as mobile nav, accordions, or demo form success.
- Prevent overflow, clipped text, layout shift, and local machine paths.

Quality bar before final output:
- The hero is immediately specific to this business.
- The page feels custom to the industry and brand direction.
- The CTA path is obvious and functional.
- No unsupported claims are present.
- Contact links use tel:, mailto:, and verified HTTPS links where supplied.
- The footer clearly says this is a website concept/private demo for review.`;
}

function extractHtml(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced || text).trim();
  const start = candidate.search(/<!doctype html|<html/i);
  return start >= 0 ? candidate.slice(start).trim() : candidate;
}

function normalizeHtml(html: string) {
  let output = extractHtml(html);

  if (!/<!doctype html/i.test(output)) {
    output = `<!DOCTYPE html>\n${output}`;
  }

  if (!/<meta\s+name=["']robots["']/i.test(output)) {
    output = output.replace(/<head[^>]*>/i, (match) => `${match}\n  <meta name="robots" content="noindex, nofollow">`);
  }

  if (!/<\/html>\s*$/i.test(output)) {
    throw new Error("AI website generator did not return a complete HTML document.");
  }

  if (!/<style[\s>]/i.test(output) || !/<body[\s>]/i.test(output)) {
    throw new Error("AI website generator returned incomplete HTML.");
  }

  return output;
}

async function generateWithGemini(prompt: string, route: ModelRoute) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(route.model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.78,
          topP: 0.92,
          maxOutputTokens: 50000,
          responseMimeType: "text/plain",
        },
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Gemini website generation failed.");
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text.trim()) throw new Error("Gemini did not return website HTML.");

  return normalizeHtml(text);
}

async function generateWithOpenAI(prompt: string, route: ModelRoute) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: route.model,
    input: prompt,
    max_output_tokens: 30000,
  });

  if (!response.output_text?.trim()) {
    throw new Error("OpenAI did not return website HTML.");
  }

  return normalizeHtml(response.output_text);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        generationId: isRecord(body) ? asString(body.generationId) : "",
        error: "Invalid website generation request.",
        details: parsed.error.flatten(),
      },
      { status: 400, headers: noStoreHeaders },
    );
  }

  const prompt = buildPrompt(parsed.data);
  const routes = getRoutesForStage("section");
  const errors: string[] = [];

  for (const route of routes) {
    try {
      const html = route.provider === "gemini" ? await generateWithGemini(prompt, route) : await generateWithOpenAI(prompt, route);
      return NextResponse.json(
        {
          generationId: parsed.data.generationId,
          html,
          modelMetadata: {
            stage: "section",
            provider: route.provider,
            model: route.model,
            fallback: route.fallback,
          },
        },
        { headers: noStoreHeaders },
      );
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  return NextResponse.json(
    {
      generationId: parsed.data.generationId,
      error: `AI website generation could not complete. Last errors: ${errors.slice(-3).join(" | ")}`,
    },
    { status: 503, headers: noStoreHeaders },
  );
}
