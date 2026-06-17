"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OutreachStatus, Prospect } from "@/lib/types";

export async function listProspects() {
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
  const supabase = await createClient();
  if (!supabase) return { configured: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const { error } = await supabase.from("prospects").upsert({
    ...prospect,
    user_id: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospect.id}`);
  return { configured: true };
}

export async function patchProspect(
  id: string,
  patch: Partial<Prospect>,
) {
  const supabase = await createClient();
  if (!supabase) return { configured: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const { error } = await supabase
    .from("prospects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${id}`);
  return { configured: true };
}

export async function updateProspectStatus(
  id: string,
  status: OutreachStatus,
) {
  const contactStatuses: OutreachStatus[] = ["contacted", "replied"];
  return patchProspect(id, {
    outreach_status: status,
    last_contacted_at: contactStatuses.includes(status)
      ? new Date().toISOString()
      : undefined,
  });
}
