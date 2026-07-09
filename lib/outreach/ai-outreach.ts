import OpenAI from "openai";
import { getRoutesForStage, runWithModelRouteRetry, type ModelRoute } from "@/lib/ai/modelRouter";
import { generateSalesMessages } from "@/lib/generators";
import type { AppSettings, BusinessInfo, MessageTone, SalesMessages } from "@/lib/types";
import { parseOutreachMessages } from "@/lib/outreach/schema";

export type AIOutreachInput = {
  businessInfo: BusinessInfo;
  extractionReport?: unknown;
  painPoints?: string[];
  generatedDemoUrl?: string;
  websiteQualitySummary?: unknown;
  tone: MessageTone;
  packagePrice?: string;
  settings: AppSettings;
  channelRequirements?: string[];
};

export type AIOutreachResult = {
  messages: SalesMessages;
  usedAI: boolean;
  modelMetadata?: {
    stage: string;
    provider: string;
    model: string;
    fallback: boolean;
  };
  warnings: string[];
};

function buildPrompt(input: AIOutreachInput, fallback: SalesMessages) {
  return `You are Seraphim's respectful outreach copywriter for Niche Technologies.

Return strict JSON only with keys:
whatsapp, emailSubject, email, dm, facebook, followUp, followUp2, finalFollowUp.

Business info:
${JSON.stringify(input.businessInfo, null, 2)}

Extraction report:
${JSON.stringify(input.extractionReport ?? null, null, 2)}

Website quality summary:
${JSON.stringify(input.websiteQualitySummary ?? null, null, 2)}

Sender/settings:
${JSON.stringify(input.settings, null, 2)}

Tone: ${input.tone}
Package price: ${input.packagePrice || input.businessInfo.packagePrice || input.settings.defaultPackagePrice || "not supplied"}
Demo URL: ${input.generatedDemoUrl || input.businessInfo.demoUrl || "not supplied"}
Channel requirements: ${(input.channelRequirements ?? []).join("; ") || "Use normal WhatsApp/email/DM/follow-up requirements."}

Rules:
- Keep WhatsApp short, natural, and easy to reply to.
- Keep email professional and include a simple opt-out line.
- Do not fabricate results, ratings, urgency, awards, customer counts, revenue, SEO guarantees, or affiliation.
- Do not mention "AI-generated" unless required by the user.
- Say this is a website concept/demo when outreach is cold.
- Manual approval remains required; do not write as if anything was sent automatically.
- Use verified business details exactly; omit uncertain facts.
- Preserve the demo URL if supplied.

Safe deterministic fallback to improve from:
${JSON.stringify(fallback, null, 2)}`;
}

async function generateWithGemini(prompt: string, route: ModelRoute) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(route.model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.45,
          maxOutputTokens: 5000,
        },
      }),
    },
  );
  const payload = await response.json().catch(() => null) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } } | null;
  if (!response.ok) throw new Error(payload?.error?.message || "Gemini outreach generation failed.");

  return payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
}

async function generateWithOpenAI(prompt: string, route: ModelRoute) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: route.model,
    input: prompt,
    max_output_tokens: 5000,
  });

  return response.output_text || "";
}

export async function generateAIOutreach(input: AIOutreachInput): Promise<AIOutreachResult> {
  const fallback = generateSalesMessages(input.businessInfo, input.tone, input.settings);
  const prompt = buildPrompt(input, fallback);
  const warnings: string[] = [];

  for (const route of getRoutesForStage("outreach")) {
    try {
      const raw = await runWithModelRouteRetry(route, () =>
        route.provider === "openai"
          ? generateWithOpenAI(prompt, route)
          : generateWithGemini(prompt, route),
      );
      const messages = parseOutreachMessages(raw, fallback);
      const usedAI = messages !== fallback;

      return {
        messages,
        usedAI,
        modelMetadata: {
          stage: "outreach",
          provider: route.provider,
          model: route.model,
          fallback: route.fallback,
        },
        warnings: usedAI ? warnings : ["AI outreach returned invalid JSON; deterministic fallback was used."],
      };
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `${route.provider}:${route.model} failed`);
    }
  }

  return {
    messages: fallback,
    usedAI: false,
    warnings,
  };
}
