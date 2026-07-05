import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getRoutesForStage, runWithModelRouteRetry, type ModelRoute } from "@/lib/ai/modelRouter";
import { buildSectionPrompt } from "@/lib/ai/prompts/section";
import type { WebsitePlan } from "@/lib/ai/prompts/planner";
import {
  DEFAULT_CREATIVE_CONTRACT,
  DEFAULT_DESIGN_SYSTEM_CONTRACT,
  parsePageContract,
  type SectionContract,
} from "@/lib/ai/site-contract-schema";
import type { DesignTokens } from "@/lib/design/tokens";
import { getArchetypeById } from "@/lib/archetypes";

const regenerateSectionSchema = z.object({
  sectionIndex: z.number().int().min(0),
  plan: z.unknown(),
  designTokens: z.unknown(),
  originalHtml: z.string().optional().default(""),
  feedback: z.string().optional().default(""),
  archetypeId: z.string().min(1).max(80).optional(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizePlan(value: unknown): WebsitePlan {
  const source = isRecord(value) && isRecord(value.premiumPlan) ? value.premiumPlan : value;
  const record = isRecord(source) ? source : {};
  const sections = Array.isArray(record.sections)
    ? record.sections
        .filter(isRecord)
        .map((section, index) => ({
          name: asString(section.name) || `Section ${index + 1}`,
          goal: asString(section.goal) || "Improve this section while preserving the page strategy.",
          order: typeof section.order === "number" ? section.order : index + 1,
        }))
    : [];

  return {
    colorPalette: isRecord(record.colorPalette)
      ? {
          primary: asString(record.colorPalette.primary) || "#2B5E8C",
          secondary: asString(record.colorPalette.secondary) || "#F4A261",
          accent: asString(record.colorPalette.accent) || "#E76F51",
          neutral: asString(record.colorPalette.neutral) || "#0F172A",
          rationale: asString(record.colorPalette.rationale) || "Preserve the selected visual system.",
        }
      : {
          primary: "#2B5E8C",
          secondary: "#F4A261",
          accent: "#E76F51",
          neutral: "#0F172A",
          rationale: "Preserve the selected visual system.",
        },
    typography: isRecord(record.typography)
      ? {
          heading: asString(record.typography.heading) || "Inter, ui-sans-serif, system-ui, sans-serif",
          body: asString(record.typography.body) || "Inter, ui-sans-serif, system-ui, sans-serif",
          rationale: asString(record.typography.rationale) || "Keep typography consistent with the page.",
        }
      : {
          heading: "Inter, ui-sans-serif, system-ui, sans-serif",
          body: "Inter, ui-sans-serif, system-ui, sans-serif",
          rationale: "Keep typography consistent with the page.",
        },
    layoutPhilosophy: asString(record.layoutPhilosophy) || "Regenerate a premium section that fits the existing landing-page flow.",
    visualThesis: asString(record.visualThesis),
    sections,
    conversionFlow: asString(record.conversionFlow) || "Preserve the original conversion flow.",
  };
}

function normalizeTokens(value: unknown): DesignTokens {
  const record = isRecord(value) ? value : {};
  const colors = isRecord(record.colors) ? record.colors : {};
  const fonts = isRecord(record.fonts) ? record.fonts : {};
  const spacing = isRecord(record.spacing) ? record.spacing : {};
  const borderRadius = isRecord(record.borderRadius) ? record.borderRadius : {};
  const shadows = isRecord(record.shadows) ? record.shadows : {};

  return {
    colors: {
      primary: asString(colors.primary) || "#2B5E8C",
      secondary: asString(colors.secondary) || "#F4A261",
      accent: asString(colors.accent) || "#E76F51",
      neutral: isRecord(colors.neutral) ? colors.neutral as Record<string, string> : { 900: "#0F172A" },
    },
    fonts: {
      heading: asString(fonts.heading) || "Inter, ui-sans-serif, system-ui, sans-serif",
      body: asString(fonts.body) || "Inter, ui-sans-serif, system-ui, sans-serif",
    },
    spacing: {
      base: asString(spacing.base) || "1rem",
      scale: isRecord(spacing.scale) ? spacing.scale as Record<string, string> : {},
    },
    borderRadius: {
      sm: asString(borderRadius.sm) || "0.375rem",
      md: asString(borderRadius.md) || "0.5rem",
      lg: asString(borderRadius.lg) || "0.75rem",
      xl: asString(borderRadius.xl) || "1rem",
    },
    shadows: isRecord(shadows) ? shadows as Record<string, string> : {},
  };
}

function extractSectionFragment(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1] ?? text;
  return fenced.trim().replace(/<\/?(?:html|head|body)[^>]*>/gi, "").trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
}

async function generateTextWithGemini(
  prompt: string,
  route: ModelRoute,
  options: { temperature?: number; maxOutputTokens?: number } = {},
) {
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
          temperature: options.temperature ?? 0.7,
          topP: 0.92,
          maxOutputTokens: options.maxOutputTokens ?? 14000,
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
    throw new Error(payload?.error?.message || "Gemini section regeneration failed.");
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text.trim()) throw new Error("Gemini did not return section output.");

  return text;
}

async function generateTextWithOpenAI(prompt: string, route: ModelRoute) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: route.model,
    input: prompt,
    max_output_tokens: 12000,
  });

  if (!response.output_text?.trim()) {
    throw new Error("OpenAI did not return section output.");
  }

  return response.output_text;
}

async function generateSection(prompt: string) {
  const errors: string[] = [];

  for (const route of getRoutesForStage("section")) {
    try {
      const text = await runWithModelRouteRetry(route, () =>
        route.provider === "gemini"
          ? generateTextWithGemini(prompt, route, { temperature: 0.72, maxOutputTokens: 14000 })
          : generateTextWithOpenAI(prompt, route),
      );
      return {
        html: extractSectionFragment(text),
        modelMetadata: { stage: "section-regeneration", provider: route.provider, model: route.model, fallback: route.fallback },
      };
    } catch (error) {
      errors.push(`${route.provider}:${route.model}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  throw new Error(`Section regeneration failed. Last errors: ${errors.slice(-3).join(" | ")}`);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = regenerateSectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid section regeneration request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const plan = normalizePlan(parsed.data.plan);
  const designTokens = normalizeTokens(parsed.data.designTokens);
  const archetype = parsed.data.archetypeId ? getArchetypeById(parsed.data.archetypeId) : undefined;
  const designSystem = {
    ...DEFAULT_DESIGN_SYSTEM_CONTRACT,
    tokens: {
      ...DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens,
      colors: {
        ...DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens.colors,
        primary: designTokens.colors.primary,
        secondary: designTokens.colors.secondary,
        accent: designTokens.colors.accent,
      },
      fonts: {
        heading: designTokens.fonts.heading,
        body: designTokens.fonts.body,
      },
      radius: designTokens.borderRadius,
      shadows: {
        ...DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens.shadows,
        card: designTokens.shadows.lg || designTokens.shadows.md || DEFAULT_DESIGN_SYSTEM_CONTRACT.tokens.shadows.card,
      },
    },
  };
  const section = plan.sections[parsed.data.sectionIndex];

  if (!section) {
    return NextResponse.json(
      { error: `No section found at index ${parsed.data.sectionIndex}.` },
      { status: 400 },
    );
  }

  const sectionContract: SectionContract & { correctiveFeedback?: string[] } = {
    id: slugify(section.name),
    name: section.name,
    goal: section.goal,
    customerQuestionAnswered: "What should this regenerated section clarify for the visitor?",
    requiredContent: ["preserve verified business facts", "improve the section using existing page strategy"],
    visualTreatment: "Use the page design system and avoid dead utility classes.",
    ctaRole: "Support the existing conversion path.",
    mustAvoid: ["fake proof", "unsupported claims", "placeholder text", "Tailwind-only classes"],
    correctiveFeedback: parsed.data.feedback ? [parsed.data.feedback] : undefined,
  };
  const pageContract = parsePageContract({
    creativeContract: DEFAULT_CREATIVE_CONTRACT,
    designSystem,
    sections: plan.sections.map((planSection) => ({
      id: slugify(planSection.name),
      name: planSection.name,
      goal: planSection.goal,
      customerQuestionAnswered: "What should the visitor understand here?",
      requiredContent: ["business-specific copy"],
      visualTreatment: "Use the shared design system.",
      ctaRole: "Support the page conversion path.",
      mustAvoid: ["fake claims", "placeholder text", "dead utility classes"],
    })),
    globalCss: "",
    metadataRules: [],
    qaChecklist: [],
  });
  const context = [
    parsed.data.feedback ? `User feedback: ${parsed.data.feedback}` : "",
    parsed.data.originalHtml ? `Original section HTML to improve, not copy blindly:\n${parsed.data.originalHtml.slice(0, 12000)}` : "",
  ].filter(Boolean).join("\n\n");

  try {
    const prompt = buildSectionPrompt({
      business: {
        name: "Existing generated website",
        description: plan.layoutPhilosophy,
        targetAudience: plan.conversionFlow,
        differentiators: plan.sections.map((item) => item.name),
        brandPersonality: archetype?.tone,
      },
      cleanBusinessData: {
        originalSectionHtml: parsed.data.originalHtml,
        feedbackContext: context,
      },
      creativeContract: {
        ...DEFAULT_CREATIVE_CONTRACT,
        creativeThesis: {
          ...DEFAULT_CREATIVE_CONTRACT.creativeThesis,
          oneSentenceDirection: plan.visualThesis || plan.layoutPhilosophy,
          brandMood: archetype?.tone || DEFAULT_CREATIVE_CONTRACT.creativeThesis.brandMood,
        },
      },
      designSystem,
      pageContract,
      sectionContract,
      correctiveFeedback: parsed.data.feedback ? [parsed.data.feedback] : undefined,
    });
    const result = await generateSection(prompt);
    return NextResponse.json({
      html: result.html,
      sectionIndex: parsed.data.sectionIndex,
      modelMetadata: result.modelMetadata,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Section regeneration failed." },
      { status: 503 },
    );
  }
}
