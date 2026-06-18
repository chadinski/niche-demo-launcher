import type { Metadata } from "next";
import { ProspectDetail } from "@/components/prospect-detail";

export const metadata: Metadata = {
  title: "Prospect Detail",
  description:
    "Review one prospect profile, generated website, outreach drafts, and pipeline status.",
};

export default function ProspectDetailPage() {
  return <ProspectDetail />;
}
