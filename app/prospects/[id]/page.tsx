import type { Metadata } from "next";
import { BusinessWorkspaceEntry } from "@/components/business-workspace";

export const metadata: Metadata = {
  title: "Business workspace",
  description:
    "Review one prospect profile, generated website, outreach drafts, and pipeline status.",
  robots: { index: false, follow: false },
};

export default async function ProspectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  return <BusinessWorkspaceEntry prospectId={id} initialTab={tab} />;
}
