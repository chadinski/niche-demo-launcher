import type { Metadata } from "next";
import { DemoWorkspace } from "@/components/demo-workspace";

export const metadata: Metadata = {
  title: "Create Site",
  description:
    "Paste business information, generate a private website concept, and prepare outreach for manual approval.",
  robots:{index:false,follow:false},
};

export default async function CreateDemoPage({searchParams}:{searchParams:Promise<{firstProject?:string}>}) {
  const params=await searchParams;
  return <DemoWorkspace firstProject={params.firstProject==="1"} />;
}
