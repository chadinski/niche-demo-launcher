import type { LeadTemperature } from "@/lib/types";

export type LeadSourceType = "website" | "social" | "directory" | "search-result";

export interface LeadCandidate {
  id: string;
  businessName: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  websiteUrl: string;
  socialUrl: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceSnippet: string;
  sourceType: LeadSourceType;
  services: string;
  opportunity: string;
  leadScore: number;
  leadTemperature: LeadTemperature;
  scoreReasons: string[];
  recommendedAngle: string;
  confidence: number;
  warnings: string[];
}

export interface LeadSearchRequest {
  industry: string;
  location: string;
  limit?: number;
}

export interface LeadSearchResponse {
  configured: boolean;
  query: string;
  candidates: LeadCandidate[];
  warnings: string[];
  searchedAt: string;
}
