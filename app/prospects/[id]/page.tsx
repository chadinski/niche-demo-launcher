import type { Metadata } from "next";
import { ProspectDetail } from "@/components/prospect-detail";

export const metadata: Metadata = {
  title: "Prospect Detail",
};

export default function ProspectDetailPage() {
  return <ProspectDetail />;
}
