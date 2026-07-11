import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { getAdminAccess } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Administration",robots:{index:false,follow:false}};

export default async function AdminPage(){
  const access=await getAdminAccess();
  if(!access.allowed)notFound();
  const admin=createAdminClient();
  const monthStart=new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString();
  const [failedResult,usageResult]=admin?await Promise.all([
    admin.from("generation_jobs").select("id",{count:"exact",head:true}).eq("status","failed"),
    admin.from("usage_events").select("estimated_cost_usd,status").gte("created_at",monthStart),
  ]):[{count:0},{data:[]}];
  const usage=usageResult.data||[];
  const estimatedCost=usage.reduce((total,event)=>total+Number(event.estimated_cost_usd||0),0);
  const readiness=[
    ["Authentication",Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
    ["AI generation",Boolean(process.env.GEMINI_API_KEY||process.env.OPENAI_API_KEY)],
    ["Lead search",Boolean(process.env.FIRECRAWL_API_KEY)],
    ["Managed deployment flag",process.env.AUTOMATED_DEPLOYMENT_ENABLED==="1"],
    ["Error reporting seam",Boolean(process.env.ERROR_REPORTING_DSN)],
  ] as const;
  return <div className="space-y-7"><div><p className="text-xs font-bold tracking-[.14em] text-brand-700 uppercase">Operator only</p><h1 className="mt-2 text-4xl font-black tracking-[-.055em]">Administration</h1><p className="mt-3 text-[#71788b]">Server-verified role access. Values report readiness without exposing credentials.</p></div><div className="grid gap-4 md:grid-cols-2"><Card className="p-6"><h2 className="text-xl font-extrabold">Provider readiness</h2><div className="mt-5 space-y-3">{readiness.map(([label,ready])=><div key={label} className="flex justify-between rounded-xl bg-[#fafafd] p-3 text-sm"><span>{label}</span><strong className={ready?"text-emerald-700":"text-amber-700"}>{ready?"Ready":"Needs setup"}</strong></div>)}</div></Card><Card className="p-6"><h2 className="text-xl font-extrabold">Operations this month</h2><dl className="mt-5 grid grid-cols-3 gap-3"><Metric label="Failed jobs" value={String(failedResult.count||0)}/><Metric label="Usage events" value={String(usage.length)}/><Metric label="Estimated cost" value={`$${estimatedCost.toFixed(2)}`}/></dl><p className="mt-5 text-sm leading-6 text-[#71788b]">Plan-limit editing, entitlement grants, and job replay remain database/operator procedures for the controlled beta.</p></Card></div></div>;
}

function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-[#fafafd] p-4"><dt className="text-xs text-[#858b9d]">{label}</dt><dd className="mt-2 text-2xl font-black">{value}</dd></div>}
