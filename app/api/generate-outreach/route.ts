import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, requireServerUser } from "@/lib/auth/server-guard";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import { generateAIOutreach } from "@/lib/outreach/ai-outreach";
import type { AppSettings, BusinessInfo, MessageTone } from "@/lib/types";

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
  businessInfo: businessInfoSchema,
  extractionReport: z.unknown().optional(),
  painPoints: z.array(z.string()).optional().default([]),
  generatedDemoUrl: z.string().optional().default(""),
  websiteQualitySummary: z.unknown().optional(),
  tone: z.string().optional().default("Friendly"),
  packagePrice: z.string().optional().default(""),
  settings: z.unknown().optional(),
  channelRequirements: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store, no-cache, must-revalidate" };

  try {
    await requireServerUser();
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return NextResponse.json(authError.body, { status: authError.status, headers });
    throw error;
  }

  try {
    const body = await request.json().catch(() => null);
    const input = requestSchema.parse(body);
    const settings = { ...DEFAULT_SETTINGS, ...(typeof input.settings === "object" && input.settings ? input.settings : {}) } as AppSettings;
    const result = await generateAIOutreach({
      businessInfo: input.businessInfo as BusinessInfo,
      extractionReport: input.extractionReport,
      painPoints: input.painPoints,
      generatedDemoUrl: input.generatedDemoUrl,
      websiteQualitySummary: input.websiteQualitySummary,
      tone: input.tone as MessageTone,
      packagePrice: input.packagePrice,
      settings,
      channelRequirements: input.channelRequirements,
    });

    return NextResponse.json(result, { headers });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : 503;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Outreach generation failed.",
      },
      { status, headers },
    );
  }
}
