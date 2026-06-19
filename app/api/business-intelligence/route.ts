import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  openAIBusinessIntelligenceRequestSchema,
  openAIBusinessUnderstandingSchema,
  sanitizeOpenAIUnderstanding,
} from "@/lib/openai-business-intelligence";

export const runtime = "nodejs";

const BUSINESS_INTELLIGENCE_PROMPT = `You are the business understanding engine for Niche Demo Launcher.

Analyze the supplied screenshot and OCR text before any website is generated.

You must:
- Extract all visible business facts without inventing unsupported claims.
- Use the image itself for visual context: logos, menu/product/service layouts, social profiles, Google listings, photos, icons, uniforms, maps, reviews, and page category labels.
- Rank business name candidates using logo/header/profile/domain/email/contact evidence.
- Detect industry from OCR, visual clues, services/products, page labels, and imagery.
- Assign exactly one of the seven website categories:
  1. Food, Hospitality & Entertainment
  2. Health, Wellness & Beauty
  3. Trades, Repairs & Local Services
  4. Professional, Finance & Business Services
  5. Retail, Products & E-commerce
  6. Creative, Events & Personal Brands
  7. Memorial, Community & Special Purpose
- Select a category-fit theme and variation.
- Populate enrichedInfo with empty strings for unknown business fields.
- Use "Your Business Name" only if no business name can be found.
- Mark weak OCR or low confidence in missingInformation and assumptions.
- Build reportMarkdown as a complete business-intelligence-report.md document.

Do not create testimonials, awards, ratings, prices, credentials, years in business, guarantees, addresses, or claims unless visible or supplied.`;

function hasImage(value: string) {
  return /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value);
}

function dataUrlToGeminiPart(value: string) {
  const match = value.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i);

  if (!match) return null;

  return {
    inline_data: {
      mime_type: match[1],
      data: match[2],
    },
  };
}

function userContext(input: {
  rawOcrText: string;
  imageName: string;
  brandColors: string;
  currentInfo: unknown;
}) {
  return [
    `Image filename: ${input.imageName || "not supplied"}`,
    `Sampled brand colors: ${input.brandColors || "not supplied"}`,
    `Current app fields: ${JSON.stringify(input.currentInfo)}`,
    "Raw OCR text:",
    input.rawOcrText || "No OCR text supplied. Use the screenshot image as the main source.",
  ].join("\n\n");
}

async function generateWithGemini(input: {
  rawOcrText: string;
  imageDataUrl: string;
  imageName: string;
  brandColors: string;
  currentInfo: unknown;
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const imagePart = hasImage(input.imageDataUrl) ? dataUrlToGeminiPart(input.imageDataUrl) : null;
  const parts = [
    {
      text: `${BUSINESS_INTELLIGENCE_PROMPT}

Return only valid JSON matching the required business understanding shape. Do not wrap it in Markdown.

${userContext(input)}`,
    },
    ...(imagePart ? [imagePart] : []),
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error ||
      "Gemini business intelligence request failed.";
    throw new Error(message);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini did not return structured business intelligence.");

  const parsedJson = JSON.parse(text) as unknown;
  const parsed = openAIBusinessUnderstandingSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new Error("Gemini returned JSON that did not match the business intelligence schema.");
  }

  return {
    understanding: sanitizeOpenAIUnderstanding(parsed.data),
    model,
    provider: "gemini",
  };
}

async function generateWithOpenAI(input: {
  rawOcrText: string;
  imageDataUrl: string;
  imageName: string;
  brandColors: string;
  currentInfo: unknown;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-5.4";
  const text = userContext(input);
  const response = await client.responses.parse({
    model,
    instructions: BUSINESS_INTELLIGENCE_PROMPT,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text },
          ...(hasImage(input.imageDataUrl)
            ? [{ type: "input_image" as const, image_url: input.imageDataUrl, detail: "high" as const }]
            : []),
        ],
      },
    ],
    text: {
      format: zodTextFormat(openAIBusinessUnderstandingSchema, "business_understanding"),
    },
    max_output_tokens: 9000,
  });

  if (!response.output_parsed) {
    throw new Error("OpenAI did not return structured business intelligence.");
  }

  return {
    understanding: sanitizeOpenAIUnderstanding(response.output_parsed),
    model,
    provider: "openai",
  };
}

export async function POST(request: Request) {
  const parsedRequest = openAIBusinessIntelligenceRequestSchema.safeParse(await request.json());

  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid business intelligence request.", details: parsedRequest.error.flatten() },
      { status: 400 },
    );
  }

  const { rawOcrText, imageDataUrl, imageName, brandColors, currentInfo } = parsedRequest.data;

  if (!rawOcrText.trim() && !hasImage(imageDataUrl)) {
    return NextResponse.json(
      { error: "Supply OCR text or a valid image data URL." },
      { status: 400 },
    );
  }

  try {
    const providerInput = { rawOcrText, imageDataUrl, imageName, brandColors, currentInfo };
    const result =
      (await generateWithGemini(providerInput)) ||
      (await generateWithOpenAI(providerInput));

    if (!result) {
      return NextResponse.json(
        { error: "No AI extraction provider configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local, then restart the app." },
        { status: 503 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI business intelligence request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
