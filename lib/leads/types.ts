import type { LeadTemperature } from "@/lib/types";

export type LeadSourceType = "website" | "social" | "directory" | "search-result";

export interface LeadCandidate {
  id: string;
  targetIndustryId: string;
  targetIndustryRank: number;
  targetIndustryPriority: string;
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
  websiteOffer: string;
  outreachHook: string;
  leadScore: number;
  leadTemperature: LeadTemperature;
  scoreReasons: string[];
  recommendedAngle: string;
  confidence: number;
  warnings: string[];
  persistentId?: string;
  status?: "new" | "saved" | "rejected" | "contacted" | "blacklisted";
  searchRunId?: string;
}

export interface LeadSearchRequest {
  targetIndustryId?: string;
  industry: string;
  location: string;
  country?: string;
  region?: string;
  city?: string;
  limit?: number;
}

export interface LeadSearchResponse {
  configured: boolean;
  query: string;
  targetIndustryId: string;
  candidates: LeadCandidate[];
  warnings: string[];
  searchedAt: string;
  searchRunId?: string;
}
