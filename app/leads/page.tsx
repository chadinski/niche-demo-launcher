import type { Metadata } from "next";
import { LeadFinder } from "@/components/lead-finder";

export const metadata: Metadata = {
  title: "Leads",
  description: "Find and qualify local business leads with Firecrawl before saving them to the Seraphim prospect workflow.",
  robots:{index:false,follow:false},
};

export default function LeadsPage() {
  return <LeadFinder />;
}
