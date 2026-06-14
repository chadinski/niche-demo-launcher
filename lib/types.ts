export const OUTREACH_STATUSES = [
  "not_sent",
  "sent",
  "replied",
  "follow_up",
  "won",
  "lost",
  "opt_out",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

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
  followUp: string;
  finalFollowUp: string;
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
  pasted_raw_info: string;
  extracted_summary: string;
  package_price: string;
  generated_website_html: string;
  demo_url: string;
  whatsapp_message: string;
  email_subject: string;
  email_message: string;
  dm_message: string;
  outreach_status: OutreachStatus;
  notes: string;
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
  mailingAddress: string;
}
