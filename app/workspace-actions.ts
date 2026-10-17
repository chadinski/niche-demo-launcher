"use server";
import { z } from "zod";
import { requireServerUser } from "@/lib/auth/server-guard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizePreviewHtml } from "@/lib/generation/preview";

const uuid = z.string().uuid();
async function ownedBusiness(id: string) {
  const user = await requireServerUser();
  const db = await createClient();
  if (!db || user.mode !== "remote")
    throw new Error("This action requires a connected account.");
  const { data, error } = await db
    .from("prospects")
    .select("id,business_name,generated_website_html,demo_status,revision")
    .eq("id", uuid.parse(id))
    .eq("user_id", user.userId)
    .maybeSingle();
  if (error || !data) throw new Error("Business not found in your workspace.");
  return { user, db, business: data };
}
export async function loadWorkspaceHistory(id: string) {
  const { db, user } = await ownedBusiness(id);
  const [versions, activity, shares, feedback] = await Promise.all([
    db
      .from("generated_websites")
      .select("id,style_name,created_at")
      .eq("prospect_id", id)
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("activity_logs")
      .select("id,action,detail,created_at")
      .eq("prospect_id", id)
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("demo_shares")
      .select("id,token,introduction,created_at,expires_at,revoked_at")
      .eq("prospect_id", id)
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("demo_feedback")
      .select("id,name,email,message,created_at")
      .eq("prospect_id", id)
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if ([versions, activity, shares, feedback].some((result) => result.error))
    throw new Error("History could not be loaded. Retry shortly.");
  return {
    versions: versions.data || [],
    activity: activity.data || [],
    shares: shares.data || [],
    feedback: feedback.data || [],
  };
}
export async function loadDemoVersion(prospectId: string, versionId: string) {
  const { db, user } = await ownedBusiness(prospectId);
  const { data, error } = await db
    .from("generated_websites")
    .select("html")
    .eq("id", uuid.parse(versionId))
    .eq("prospect_id", prospectId)
    .eq("user_id", user.userId)
    .maybeSingle();
  if (error || !data) throw new Error("That version could not be loaded.");
  return String(data.html);
}
export async function createDemoShare(input: {
  prospectId: string;
  introduction: string;
  revision: number;
}) {
  const safe = z
    .object({
      prospectId: uuid,
      introduction: z.string().trim().min(10).max(2000),
      revision: z.number().int().nonnegative(),
    })
    .parse(input);
  const { user, business } = await ownedBusiness(safe.prospectId);
  if (
    !business.generated_website_html ||
    !["reviewed", "shared"].includes(business.demo_status)
  )
    throw new Error(
      "Review and approve this demo before creating a share link.",
    );
  if (business.revision !== safe.revision)
    throw new Error(
      "The demo changed. Reload and review the latest saved version before sharing.",
    );
  const admin = createAdminClient();
  if (!admin)
    throw new Error(
      "Sharing is temporarily unavailable. HTML export is still available.",
    );
  const recent = await admin
    .from("demo_shares")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.userId)
    .gte("created_at", new Date(Date.now() - 3600000).toISOString());
  if (recent.error) throw new Error("Sharing is temporarily unavailable.");
  if ((recent.count || 0) >= 20)
    throw new Error(
      "You have created 20 share links this hour. Try again later.",
    );
  const { data, error } = await admin
    .from("demo_shares")
    .insert({
      user_id: user.userId,
      prospect_id: safe.prospectId,
      business_name: business.business_name,
      introduction: safe.introduction,
      html: sanitizePreviewHtml(business.generated_website_html),
    })
    .select("id,token,expires_at")
    .single();
  if (error || !data)
    throw new Error("The share link could not be created. Please retry.");
  return data as { id: string; token: string; expires_at: string };
}
export async function revokeDemoShare(prospectId: string, shareId: string) {
  const { user } = await ownedBusiness(prospectId);
  const admin = createAdminClient();
  if (!admin) throw new Error("Sharing is temporarily unavailable.");
  const { data, error } = await admin
    .from("demo_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", uuid.parse(shareId))
    .eq("user_id", user.userId)
    .eq("prospect_id", prospectId)
    .select("id")
    .maybeSingle();
  if (error || !data)
    throw new Error("The share link could not be revoked. Please retry.");
}
