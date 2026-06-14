import type { Metadata } from "next";
import { TemplatesManager } from "@/components/templates-manager";

export const metadata: Metadata = {
  title: "Templates",
};

export default function TemplatesPage() {
  return <TemplatesManager />;
}
