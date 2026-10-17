import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
export async function activeShare(token: string) {
  if (!z.string().uuid().safeParse(token).success) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("demo_shares")
    .select("id,user_id,prospect_id,business_name,introduction,html,expires_at")
    .eq("token", token)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return error ? null : data;
}
export function isolatedShareHtml(html: string) {
  const csp =
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https:; font-src https: data:; form-action 'none'; base-uri 'none'; frame-src 'none'\">";
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head([^>]*)>/i, `<head$1>${csp}`)
    : `${csp}${html}`;
}
