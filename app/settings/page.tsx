import type { Metadata } from "next";
import { getSettings } from "@/app/settings/actions";
import { SettingsForm } from "@/components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Configure sender defaults, generation preferences, and server-side integration readiness.",
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
