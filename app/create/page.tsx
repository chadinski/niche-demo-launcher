import type { Metadata } from "next";
import { BusinessWorkspaceEntry } from "@/components/business-workspace";

export const metadata: Metadata = {
  title: "Add a business",
  description:
    "Paste business information, generate a private website concept, and prepare outreach for manual approval.",
  robots: { index: false, follow: false },
};

export default function CreateDemoPage() {
  return <BusinessWorkspaceEntry />;
}
