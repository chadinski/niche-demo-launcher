import type { Metadata } from "next";
import { DemoWorkspace } from "@/components/demo-workspace";

export const metadata: Metadata = {
  title: "Create Demo",
};

export default function CreateDemoPage() {
  return <DemoWorkspace />;
}
