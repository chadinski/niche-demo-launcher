import type { OutreachStatus, Prospect } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;
export const DEFAULT_FOLLOW_UP_CADENCE = [0, 2, 5, 10] as const;

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}

export function nextFollowUpDate(touchCount: number, from = new Date()) {
  const nextCadence = DEFAULT_FOLLOW_UP_CADENCE[Math.min(touchCount + 1, DEFAULT_FOLLOW_UP_CADENCE.length - 1)];
  return addDays(from, nextCadence || 2).toISOString();
}

export function isFollowUpDue(prospect: Prospect, nowIso: string) {
  return Boolean(
    prospect.next_follow_up_at &&
      prospect.next_follow_up_at <= nowIso &&
      !["won", "lost", "opt_out"].includes(prospect.outreach_status),
  );
}

export function followUpLabel(prospect: Prospect, nowIso: string) {
  if (!prospect.next_follow_up_at) return "No follow-up scheduled";
  if (isFollowUpDue(prospect, nowIso)) return "Follow-up due";
  return "Follow-up scheduled";
}

export function statusAfterMilestone(prospect: Prospect): OutreachStatus {
  if (prospect.demo_url) return "demo_deployed";
  if (prospect.whatsapp_message || prospect.email_message || prospect.dm_message) return "message_ready";
  if (prospect.generated_website_html) return "demo_generated";
  if (prospect.extracted_summary) return "profile_extracted";
  return "new";
}
