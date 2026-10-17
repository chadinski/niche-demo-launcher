import type { Metadata } from "next";
import { DemoWorkspace } from "@/components/demo-workspace";
export const metadata: Metadata = {
  title: "Advanced generator",
  robots: { index: false, follow: false },
};
export default function AdvancedGenerator() {
  return <DemoWorkspace />;
}
