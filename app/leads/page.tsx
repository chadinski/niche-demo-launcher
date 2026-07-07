import type { Metadata } from "next";
import { LeadFinder } from "@/components/lead-finder";

export const metadata: Metadata = {
  title: "Lead Finder | Seraphim",
  description: "Find and qualify local business leads with Firecrawl before saving them to the Seraphim prospect workflow.",
};

export default function LeadsPage() {
  return <LeadFinder />;
}
