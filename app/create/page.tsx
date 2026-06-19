import type { Metadata } from "next";
import { DemoWorkspace } from "@/components/demo-workspace";

export const metadata: Metadata = {
  title: "Create Site",
  description:
    "Paste business information, generate a private website concept, and prepare outreach for manual approval.",
};

export default function CreateDemoPage() {
  return <DemoWorkspace />;
}
