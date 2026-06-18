import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Configure sender defaults, generation preferences, and server-side integration readiness.",
};

export default function SettingsPage() {
  return <SettingsForm />;
}
