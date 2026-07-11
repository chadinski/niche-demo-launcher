"use server";

import {
  generateFollowUpMessage as generateMockFollowUp,
  generateSalesMessages as generateMockMessages,
  parseBusinessInfo as parseMockBusinessInfo,
} from "@/lib/generators";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import type { AppSettings, BusinessInfo, MessageTone } from "@/lib/types";
import { z } from "zod";
import { requireServerUser } from "@/lib/auth/server-guard";

const rawInfoSchema=z.string().max(24_000);
const businessEnvelope=z.custom<BusinessInfo>((value)=>Boolean(value&&typeof value==="object"&&JSON.stringify(value).length<=60_000));

export async function parseBusinessInfo(rawInfo: string) {
  await requireServerUser();
  const safeRawInfo=rawInfoSchema.parse(rawInfo);
  return {
    mode: process.env.OPENAI_API_KEY ? "ai-placeholder" : "mock",
    data: parseMockBusinessInfo(safeRawInfo),
  };
}

export async function generateSalesMessages(
  info: BusinessInfo,
  tone: MessageTone = "Friendly",
  settings: AppSettings = DEFAULT_SETTINGS,
) {
  await requireServerUser();
  const safeInfo=businessEnvelope.parse(info);
  return {
    mode: process.env.OPENAI_API_KEY ? "ai-placeholder" : "mock",
    messages: generateMockMessages(safeInfo, tone, settings),
  };
}

export async function generateFollowUpMessage(
  info: BusinessInfo,
  settings: AppSettings = DEFAULT_SETTINGS,
  final = false,
) {
  await requireServerUser();
  const safeInfo=businessEnvelope.parse(info);
  return {
    mode: process.env.OPENAI_API_KEY ? "ai-placeholder" : "mock",
    message: generateMockFollowUp(safeInfo, settings, final),
  };
}
