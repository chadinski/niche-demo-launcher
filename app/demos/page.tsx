import type { Metadata } from "next";
import { BusinessCollection } from "@/components/business-collection";
export const metadata: Metadata = {
  title: "Demo library",
  robots: { index: false, follow: false },
};
export default function DemosPage() {
  return <BusinessCollection mode="demos" />;
}
