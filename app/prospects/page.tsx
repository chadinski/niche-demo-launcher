import type { Metadata } from "next";
import { ProspectsTable } from "@/components/prospects-table";

export const metadata: Metadata = {
  title: "Prospects",
  description:
    "Track website concepts, outreach status, follow-ups, replies, and client outcomes.",
};

export default function ProspectsPage() {
  return <ProspectsTable />;
}
