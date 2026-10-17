import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import {
  OnboardingChecklist,
  type ChecklistState,
} from "@/components/onboarding-checklist";
import { requireServerUser } from "@/lib/auth/server-guard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Home",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await requireServerUser();
  let state: ChecklistState = {
    profile: false,
    lead: false,
    facts: false,
    demo: false,
    review: false,
    outreach: false,
  };
  let estimatedSpend: number | null = null;
  const supabase = await createClient();
  if (supabase && user.mode === "remote") {
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();
    const [
      { data: progress },
      { data: prospects },
      { data: usage, error: usageError },
    ] = await Promise.all([
      supabase
        .from("onboarding_progress")
        .select(
          "profile_completed,lead_added,facts_verified,first_demo_generated,first_demo_reviewed,first_outreach_prepared",
        )
        .eq("user_id", user.userId)
        .maybeSingle(),
      supabase
        .from("prospects")
        .select(
          "business_intelligence,generated_website_html,demo_url,demo_status,whatsapp_message,email_message,outreach_status",
        )
        .eq("user_id", user.userId)
        .limit(50),
      supabase
        .from("usage_events")
        .select("estimated_cost_usd")
        .eq("user_id", user.userId)
        .gte("created_at", monthStart),
    ]);
    const rows = prospects || [];
    if (!usageError)
      estimatedSpend = (usage || []).reduce(
        (sum, event) => sum + Number(event.estimated_cost_usd || 0),
        0,
      );
    state = {
      profile: Boolean(progress?.profile_completed),
      lead: Boolean(progress?.lead_added) || rows.length > 0,
      facts:
        Boolean(progress?.facts_verified) ||
        rows.some((item) =>
          Boolean(item.business_intelligence?.extractionReviewed),
        ),
      demo:
        Boolean(progress?.first_demo_generated) ||
        rows.some((item) => Boolean(item.generated_website_html)),
      review:
        Boolean(progress?.first_demo_reviewed) ||
        rows.some(
          (item) => item.demo_status === "reviewed" || Boolean(item.demo_url),
        ),
      outreach:
        Boolean(progress?.first_outreach_prepared) ||
        rows.some((item) =>
          Boolean(item.whatsapp_message || item.email_message),
        ),
    };
  }
  return (
    <div className="space-y-7">
      <OnboardingChecklist state={state} />
      <Dashboard
        nowIso={new Date().toISOString()}
        estimatedSpend={estimatedSpend}
      />
    </div>
  );
}
