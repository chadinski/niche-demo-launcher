import type { BusinessInfo, OutreachStatus, Prospect } from "@/lib/types";

export const SALES_STAGES = [
  "new",
  "qualified",
  "contacted",
  "replied",
  "proposal",
  "won",
  "lost",
  "opt_out",
] as const;
export type SalesStage = (typeof SALES_STAGES)[number];
export const SALES_LABELS: Record<SalesStage, string> = {
  new: "New",
  qualified: "Qualified",
  contacted: "Contacted",
  replied: "In conversation",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
  opt_out: "Do not contact",
};
export const DEMO_LABELS = {
  not_started: "No demo yet",
  draft: "Needs review",
  reviewed: "Reviewed",
  shared: "Shared",
};
export function salesStage(prospect: Prospect): SalesStage {
  if (prospect.sales_stage && SALES_STAGES.includes(prospect.sales_stage))
    return prospect.sales_stage;
  const legacy = prospect.outreach_status;
  if (["contacted", "replied", "won", "lost", "opt_out"].includes(legacy))
    return legacy as SalesStage;
  if (legacy === "follow_up_due") return "contacted";
  return prospect.business_intelligence?.extractionReviewed
    ? "qualified"
    : "new";
}
export function demoStatus(
  prospect: Prospect,
): NonNullable<Prospect["demo_status"]> {
  return (
    prospect.demo_status ??
    (prospect.demo_url
      ? "shared"
      : prospect.generated_website_html
        ? "draft"
        : "not_started")
  );
}
export function mergeProspect(
  current: Prospect,
  patch: Partial<Prospect>,
): Prospect {
  const next = {
    ...current,
    ...patch,
    id: current.id,
    created_at: current.created_at,
  };
  next.sales_stage = patch.sales_stage ?? salesStage(current);
  if (
    !patch.sales_stage &&
    patch.outreach_status &&
    [
      "contacted",
      "replied",
      "won",
      "lost",
      "opt_out",
      "follow_up_due",
    ].includes(patch.outreach_status)
  ) {
    next.sales_stage =
      patch.outreach_status === "follow_up_due"
        ? "contacted"
        : (patch.outreach_status as SalesStage);
  }
  if (!["new", "qualified"].includes(next.sales_stage)) {
    next.outreach_status =
      next.sales_stage === "proposal"
        ? "replied"
        : (next.sales_stage as OutreachStatus);
  }
  next.demo_status = patch.demo_status ?? demoStatus(current);
  if (
    patch.generated_website_html !== undefined &&
    patch.generated_website_html !== current.generated_website_html
  )
    next.demo_status = patch.generated_website_html ? "draft" : "not_started";
  return next;
}
export function isClosed(prospect: Prospect) {
  return ["won", "lost", "opt_out"].includes(salesStage(prospect));
}
export function nextAction(prospect: Prospect, now = new Date().toISOString()) {
  if (isClosed(prospect))
    return { label: "View business", tab: "facts", priority: 9 };
  if (prospect.next_follow_up_at && prospect.next_follow_up_at <= now)
    return { label: "Follow up", tab: "outreach", priority: 0 };
  if (salesStage(prospect) === "replied")
    return { label: "Continue conversation", tab: "outreach", priority: 1 };
  if (!prospect.business_intelligence?.extractionReviewed)
    return { label: "Verify business details", tab: "facts", priority: 2 };
  if (!prospect.generated_website_html)
    return { label: "Create first draft", tab: "design", priority: 3 };
  if (demoStatus(prospect) === "draft")
    return { label: "Review demo", tab: "review", priority: 4 };
  if (["new", "qualified"].includes(salesStage(prospect)))
    return { label: "Prepare outreach", tab: "outreach", priority: 5 };
  return { label: "Open workspace", tab: "facts", priority: 6 };
}
export function prospectInfo(p: Prospect): BusinessInfo {
  return {
    rawInfo: p.pasted_raw_info,
    businessName: p.business_name,
    category: p.category,
    location: p.location,
    phone: p.phone,
    email: p.email,
    websiteUrl: p.website_url,
    socialUrl: p.social_url,
    services: p.business_intelligence?.services ?? p.extracted_summary,
    brandColors: p.business_intelligence?.brandColors ?? "",
    notes: p.notes,
    painPoints: p.recommended_sales_angle,
    packagePrice: p.package_price,
    demoUrl: p.demo_url,
  };
}
export function newProspect(name = ""): Prospect {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    business_name: name,
    category: "",
    location: "",
    phone: "",
    email: "",
    website_url: "",
    social_url: "",
    source: "Manual entry",
    pasted_raw_info: "",
    extracted_summary: "",
    package_price: "",
    deal_value: "",
    lead_score: 0,
    lead_temperature: "Cold",
    lead_score_explanation: "",
    recommended_sales_angle: "",
    business_intelligence: null,
    website_quality_audit: null,
    generated_website_html: "",
    demo_url: "",
    whatsapp_message: "",
    email_subject: "",
    email_message: "",
    dm_message: "",
    facebook_message: "",
    follow_up_1_message: "",
    follow_up_2_message: "",
    final_check_in_message: "",
    outreach_status: "new",
    notes: "",
    follow_up_count: 0,
    created_at: now,
    updated_at: now,
    last_contacted_at: null,
    next_follow_up_at: null,
    sales_stage: "new",
    demo_status: "not_started",
    revision: 0,
  };
}
export function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
