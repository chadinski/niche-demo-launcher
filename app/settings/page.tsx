import type { Metadata } from "next";
import { getSettings } from "@/app/settings/actions";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your agency profile, proposal defaults, and outreach preferences.",
  robots:{index:false,follow:false},
};

export default async function SettingsPage() {
  const settingsResult = await getSettings();

  return (
    <SettingsForm
      initialSettings={settingsResult.settings}
      initialPersistenceMode={settingsResult.mode}
    />
  );
}
