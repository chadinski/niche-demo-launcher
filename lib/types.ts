export const OUTREACH_STATUSES = [
  "new",
  "profile_extracted",
  "demo_generated",
  "demo_deployed",
  "message_ready",
  "contacted",
  "follow_up_due",
  "replied",
  "won",
  "lost",
  "opt_out",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];
export type LegacyOutreachStatus = "not_sent" | "sent" | "follow_up";
export type LeadTemperature = "Hot" | "Warm" | "Cold";
export type DeploymentMode = "manual" | "automatic";

export type MessageTone =
  | "Friendly"
  | "Direct"
  | "Premium"
  | "Soft sell"
  | "Confident"
  | "Local business friendly";

export interface BusinessInfo {
  rawInfo: string;
  businessName: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  websiteUrl: string;
  socialUrl: string;
  services: string;
  brandColors: string;
  notes: string;
  painPoints: string;
  packagePrice: string;
  demoUrl: string;
}

export interface SalesMessages {
  whatsapp: string;
  emailSubject: string;
  email: string;
  dm: string;
  facebook: string;
  followUp: string;
  followUp2: string;
  finalFollowUp: string;
}

export interface LeadScoreResult {
  score: number;
  temperature: LeadTemperature;
  explanation: string[];
  recommendedAngle: string;
}

export interface BusinessIntelligence {
  summary: string;
  targetCustomer: string;
  onlineWeakness: string;
  websiteStrategy: string;
  bestCta: string;
  suggestedPackage: string;
  suggestedPriceRange: string;
  outreachAngle: string;
  objections: string[];
  extractionReportMarkdown?: string;
  screenshotName?: string;
  screenshotDataUrl?: string;
  screenshotSaved?: boolean;
  generationMode?: string;
  extractionReviewed?: boolean;
}

export interface QualityAuditItem {
  label: string;
  passed: boolean;
  detail: string;
}

export interface QualityAudit {
  score: number;
  passed: boolean;
  items: QualityAuditItem[];
  warnings: string[];
}

export interface DeploymentResult {
  ok: boolean;
  status: "setup_required" | "deployed" | "failed";
  message: string;
  url?: string;
  repoUrl?: string;
  missing?: string[];
}

export interface Prospect {
  id: string;
  business_name: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  website_url: string;
  social_url: string;
  source: string;
  pasted_raw_info: string;
  extracted_summary: string;
  package_price: string;
  deal_value: string;
  lead_score: number;
  lead_temperature: LeadTemperature;
  lead_score_explanation: string;
  recommended_sales_angle: string;
  business_intelligence: BusinessIntelligence | null;
  website_quality_audit: QualityAudit | null;
  generated_website_html: string;
  demo_url: string;
  whatsapp_message: string;
  email_subject: string;
  email_message: string;
  dm_message: string;
  facebook_message: string;
  follow_up_1_message: string;
  follow_up_2_message: string;
  final_check_in_message: string;
  outreach_status: OutreachStatus;
  notes: string;
  follow_up_count: number;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
}

export interface ActivityItem {
  id: string;
  prospectId: string;
  prospectName: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  senderName: string;
  senderEmail: string;
  whatsappNumber: string;
  website: string;
  defaultPackagePrice: string;
  defaultCurrency: string;
  defaultTone: MessageTone;
  defaultWebsiteStyle: string;
  defaultFollowUpCadence: string;
  deploymentMode: DeploymentMode;
  mailingAddress: string;
}
