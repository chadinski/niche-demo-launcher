"use server";

import { revalidatePath } from "next/cache";
import {
  requireConfiguredSupabaseInProduction,
  requireServerUser,
} from "@/lib/auth/server-guard";
import { createClient } from "@/lib/supabase/server";
import type { OutreachStatus, Prospect } from "@/lib/types";
import { z } from "zod";

const short=z.string().max(500);
const statusSchema=z.enum(["new","profile_extracted","demo_generated","demo_deployed","message_ready","contacted","follow_up_due","replied","won","lost","opt_out"]);
const prospectSchema=z.object({id:z.string().uuid(),business_name:z.string().trim().min(1).max(180),category:short,location:short,phone:short,email:z.string().max(320),website_url:short,social_url:short,source:short,pasted_raw_info:z.string().max(24_000),extracted_summary:z.string().max(12_000),package_price:z.string().max(80),deal_value:z.string().max(80),lead_score:z.number().int().min(0).max(100),lead_temperature:z.enum(["Cold","Warm","Hot"]),lead_score_explanation:z.string().max(4_000),recommended_sales_angle:z.string().max(4_000),business_intelligence:z.unknown().nullable(),website_quality_audit:z.unknown().nullable(),generated_website_html:z.string().max(2_500_000),demo_url:short,whatsapp_message:z.string().max(12_000),email_subject:z.string().max(500),email_message:z.string().max(24_000),dm_message:z.string().max(12_000),facebook_message:z.string().max(12_000),follow_up_1_message:z.string().max(12_000),follow_up_2_message:z.string().max(12_000),final_check_in_message:z.string().max(12_000),outreach_status:statusSchema,notes:z.string().max(24_000),follow_up_count:z.number().int().min(0).max(100),created_at:z.string().datetime(),updated_at:z.string().datetime(),last_contacted_at:z.string().datetime().nullable(),next_follow_up_at:z.string().datetime().nullable()}).strict();

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}

export async function listProspects() {
  requireConfiguredSupabaseInProduction();
  const supabase = await createClient();
  if (!supabase) return { configured: false, data: [] as Prospect[] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, data: [] as Prospect[] };

  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return { configured: true, data: (data ?? []) as Prospect[] };
}

export async function upsertProspect(prospect: Prospect) {
  await requireServerUser();
  const safeProspect=prospectSchema.parse(prospect) as Prospect;
  const supabase = await createClient();
  if (!supabase) return { configured: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const { error } = await supabase.from("prospects").upsert({
    ...safeProspect,
    user_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospect.id}`);
  return { configured: true };
}

export async function patchProspect(
  id: string,
  patch: Partial<Prospect>,
) {
  await requireServerUser();
  const safeId=z.string().uuid().parse(id);
  const safePatch=prospectSchema.partial().omit({id:true,created_at:true,updated_at:true}).strict().parse(patch) as Partial<Prospect>;
  const supabase = await createClient();
  if (!supabase) return { configured: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const { error } = await supabase
    .from("prospects")
    .update(withoutUndefined({ ...safePatch, updated_at: new Date().toISOString() }))
    .eq("id", safeId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${safeId}`);
  return { configured: true };
}

export async function updateProspectStatus(
  id: string,
  status: OutreachStatus,
) {
  const safeStatus=statusSchema.parse(status) as OutreachStatus;
  const contactStatuses: OutreachStatus[] = ["contacted", "replied"];
  return patchProspect(id, {
    outreach_status: safeStatus,
    last_contacted_at: contactStatuses.includes(safeStatus)
      ? new Date().toISOString()
      : undefined,
  });
}
