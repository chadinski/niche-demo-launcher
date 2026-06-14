"use server";

import {
  generateFollowUpMessage as generateMockFollowUp,
  generateSalesMessages as generateMockMessages,
  generateWebsiteHTML as generateMockWebsite,
  parseBusinessInfo as parseMockBusinessInfo,
} from "@/lib/generators";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import type { AppSettings, BusinessInfo, MessageTone } from "@/lib/types";

export async function parseBusinessInfo(rawInfo: string) {
  return {
    mode: process.env.OPENAI_API_KEY ? "ai-placeholder" : "mock",
    data: parseMockBusinessInfo(rawInfo),
  };
}

export async function generateWebsiteHTML(info: BusinessInfo) {
  return {
    mode: process.env.OPENAI_API_KEY ? "ai-placeholder" : "mock",
    html: generateMockWebsite(info),
  };
}

export async function generateSalesMessages(
  info: BusinessInfo,
  tone: MessageTone = "Friendly",
  settings: AppSettings = DEFAULT_SETTINGS,
) {
  return {
    mode: process.env.OPENAI_API_KEY ? "ai-placeholder" : "mock",
    messages: generateMockMessages(info, tone, settings),
  };
}

export async function generateFollowUpMessage(
  info: BusinessInfo,
  settings: AppSettings = DEFAULT_SETTINGS,
  final = false,
) {
  return {
    mode: process.env.OPENAI_API_KEY ? "ai-placeholder" : "mock",
    message: generateMockFollowUp(info, settings, final),
  };
}
