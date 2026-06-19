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

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Local extraction fallback will be used." },
      { status: 503 },
    );
  }

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

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-5.4";
  const userText = [
    `Image filename: ${imageName || "not supplied"}`,
    `Sampled brand colors: ${brandColors || "not supplied"}`,
    `Current app fields: ${JSON.stringify(currentInfo)}`,
    "Raw OCR text:",
    rawOcrText || "No OCR text supplied. Use the screenshot image as the main source.",
  ].join("\n\n");

  try {
    const response = await client.responses.parse({
      model,
      instructions: BUSINESS_INTELLIGENCE_PROMPT,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: userText },
            ...(hasImage(imageDataUrl)
              ? [{ type: "input_image" as const, image_url: imageDataUrl, detail: "high" as const }]
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
      return NextResponse.json(
        { error: "OpenAI did not return structured business intelligence." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      understanding: sanitizeOpenAIUnderstanding(response.output_parsed),
      model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenAI business intelligence request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
