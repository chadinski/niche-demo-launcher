"use server";

import { revalidatePath } from "next/cache";
import {
  requireConfiguredSupabaseInProduction,
  requireServerUser,
  type ServerUserAccess,
} from "@/lib/auth/server-guard";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

type SettingsRow = {
  company_name?: string | null;
  sender_name?: string | null;
  sender_email?: string | null;
  whatsapp_number?: string | null;
  website?: string | null;
  default_package_price?: string | null;
  default_currency?: string | null;
  default_message_tone?: AppSettings["defaultTone"] | null;
  default_website_style?: string | null;
  default_follow_up_cadence?: string | null;
  deployment_mode?: AppSettings["deploymentMode"] | null;
  mailing_address?: string | null;
};

export type SettingsResult = {
  configured: boolean;
  mode: "remote" | "local-demo";
  settings: AppSettings;
};

function rowToSettings(row: SettingsRow | null | undefined): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    companyName: row?.company_name || DEFAULT_SETTINGS.companyName,
    senderName: row?.sender_name || DEFAULT_SETTINGS.senderName,
    senderEmail: row?.sender_email || DEFAULT_SETTINGS.senderEmail,
    whatsappNumber: row?.whatsapp_number || DEFAULT_SETTINGS.whatsappNumber,
    website: row?.website || DEFAULT_SETTINGS.website,
    defaultPackagePrice: row?.default_package_price || DEFAULT_SETTINGS.defaultPackagePrice,
    defaultCurrency: row?.default_currency || DEFAULT_SETTINGS.defaultCurrency,
    defaultTone: row?.default_message_tone || DEFAULT_SETTINGS.defaultTone,
    defaultWebsiteStyle: row?.default_website_style || DEFAULT_SETTINGS.defaultWebsiteStyle,
    defaultFollowUpCadence: row?.default_follow_up_cadence || DEFAULT_SETTINGS.defaultFollowUpCadence,
    deploymentMode: row?.deployment_mode || DEFAULT_SETTINGS.deploymentMode,
    mailingAddress: row?.mailing_address || DEFAULT_SETTINGS.mailingAddress,
  };
}

function settingsToRow(settings: AppSettings, user: ServerUserAccess) {
  return {
    user_id: user.userId,
    company_name: settings.companyName,
    sender_name: settings.senderName,
    sender_email: settings.senderEmail,
    whatsapp_number: settings.whatsappNumber,
    website: settings.website,
    default_package_price: settings.defaultPackagePrice,
    default_currency: settings.defaultCurrency,
    default_message_tone: settings.defaultTone,
    default_website_style: settings.defaultWebsiteStyle,
    default_follow_up_cadence: settings.defaultFollowUpCadence,
    deployment_mode: settings.deploymentMode,
    mailing_address: settings.mailingAddress,
  };
}

export async function getSettings(): Promise<SettingsResult> {
  requireConfiguredSupabaseInProduction();

  const supabase = await createClient();
  if (!supabase) {
    return {
      configured: false,
      mode: "local-demo",
      settings: DEFAULT_SETTINGS,
    };
  }

  const user = await requireServerUser();
  if (user.mode !== "remote") {
    return {
      configured: false,
      mode: "local-demo",
      settings: DEFAULT_SETTINGS,
    };
  }

  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("user_id", user.userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    configured: true,
    mode: "remote",
    settings: rowToSettings(data as SettingsRow | null),
  };
}

export async function upsertSettings(settings: AppSettings): Promise<SettingsResult> {
  const user = await requireServerUser();
  const supabase = await createClient();

  if (!supabase || user.mode !== "remote") {
    return {
      configured: false,
      mode: "local-demo",
      settings,
    };
  }

  const { data, error } = await supabase
    .from("app_settings")
    .upsert(settingsToRow(settings, user), { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/settings");

  return {
    configured: true,
    mode: "remote",
    settings: rowToSettings(data as SettingsRow),
  };
}
