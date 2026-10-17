import type { Metadata } from "next";
import { ProspectDetail } from "@/components/prospect-detail";
export const metadata: Metadata = {
  title: "Advanced business tools",
  robots: { index: false, follow: false },
};
export default function AdvancedProspect() {
  return <ProspectDetail />;
}
