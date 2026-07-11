import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";

const steps = [
  [Search, "Add a business", "Find a lead or import the business information you already have."],
  [FileCheck2, "Verify the facts", "Review evidence and correct uncertain details before anything is generated."],
  [Sparkles, "Create the demo", "Generate, refine, preview, and export a premium single-file website."],
  [ShieldCheck, "Approve the outreach", "Prepare a personalized message, then decide what to send and when."],
] as const;

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-[#f7f7fa] text-ink-950">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b border-[#e7e8ef] bg-white px-4 py-20 sm:px-6 sm:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(124,58,237,.12),transparent_32rem)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
            <div>
              <p className="text-xs font-extrabold tracking-[0.16em] text-brand-700 uppercase">Prospect-to-client workspace</p>
              <h1 className="mt-5 max-w-4xl text-[clamp(3rem,6vw,5.3rem)] leading-[.94] font-black tracking-[-0.07em]">
                Turn promising businesses into premium website demos.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#666d81]">
                Find prospects, verify their business information, create premium website concepts, and prepare respectful outreach from one focused workspace.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/signup" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-5 font-bold text-white shadow-[0_14px_35px_rgba(124,58,237,.25)] hover:bg-brand-700">
                  Request beta access <ArrowRight className="size-4" />
                </Link>
                <Link href="/how-it-works" className="inline-flex min-h-12 items-center rounded-xl border border-[#dfe1e9] bg-white px-5 font-bold hover:bg-[#f7f7fa]">
                  See how it works
                </Link>
              </div>
              <p className="mt-5 text-sm text-[#7b8193]">No automatic sending. Business facts and generated output always require your review.</p>
            </div>
            <div className="rounded-[2rem] border border-[#e1e3eb] bg-[#151a2d] p-5 text-white shadow-[0_35px_100px_rgba(21,26,45,.24)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div><p className="text-xs font-bold tracking-[.14em] text-brand-200 uppercase">Guided workflow</p><p className="mt-1 font-bold">One clear next step</p></div>
                <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-bold text-emerald-300">Manual approval</span>
              </div>
              <div className="mt-5 space-y-3">
                {steps.map(([Icon, title, description], index) => (
                  <div key={title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-2xl border border-white/10 bg-white/[.055] p-4">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-500/20 text-brand-200"><Icon className="size-4" /></span>
                    <div><p className="text-xs font-bold text-white/45">0{index + 1}</p><h2 className="mt-1 font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-white/55">{description}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-xs font-bold tracking-[.15em] text-brand-700 uppercase">Built for client acquisition</p><h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-5xl">Move faster without losing judgment.</h2></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["Qualified context", "Keep source links, extracted facts, confidence signals, notes, and prospect status together."],
                ["Premium output", "Use the existing Seraphim generation system to create custom, portable website demos."],
                ["Responsible outreach", "Draft concise outreach while keeping sending, follow-ups, and fact verification under human control."],
              ].map(([title, copy]) => <article key={title} className="rounded-2xl border border-[#e1e3eb] bg-white p-6"><CheckCircle2 className="size-5 text-brand-600" /><h3 className="mt-6 text-xl font-extrabold">{title}</h3><p className="mt-3 leading-7 text-[#6f768a]">{copy}</p></article>)}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 rounded-[2rem] bg-brand-700 p-8 text-white sm:p-12 lg:flex-row lg:items-center">
            <div><p className="text-sm font-bold text-brand-100">Public beta</p><h2 className="mt-2 max-w-2xl text-3xl font-black tracking-[-.045em] sm:text-4xl">Start with included beta usage. Upgrade billing is not enabled yet.</h2><p className="mt-4 max-w-2xl leading-7 text-white/65">Usage is measured and limited server-side so shared AI services stay reliable. Automatic deployment is available only to approved beta accounts; HTML export remains available.</p></div>
            <Link href="/signup" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 font-bold text-brand-800">Create your account</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
