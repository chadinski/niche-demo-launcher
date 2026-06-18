import type { Metadata } from "next";
import { TemplatesManager } from "@/components/templates-manager";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Manage reusable website and outreach templates for faster, consistent demo production.",
};

export default function TemplatesPage() {
  return <TemplatesManager />;
}
