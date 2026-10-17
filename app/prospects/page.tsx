import type { Metadata } from "next";
import { BusinessCollection } from "@/components/business-collection";

export const metadata: Metadata = {
  title: "Pipeline",
  description:
    "Track website concepts, outreach status, follow-ups, replies, and client outcomes.",
  robots: { index: false, follow: false },
};

export default function ProspectsPage() {
  return <BusinessCollection />;
}
