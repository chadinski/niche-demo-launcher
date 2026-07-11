import type { ReactNode } from "react";
import { PublicFooter, PublicHeader } from "@/components/public-chrome";

export function PublicPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <div className="min-h-screen bg-[#f7f7fa] text-ink-950"><PublicHeader /><main><section className="border-b border-[#e4e5ec] bg-white px-4 py-16 sm:px-6 sm:py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-extrabold tracking-[.15em] text-brand-700 uppercase">{eyebrow}</p><h1 className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[.95] font-black tracking-[-.07em]">{title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-[#666d81]">{intro}</p></div></section><div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-18">{children}</div></main><PublicFooter /></div>;
}

export function CopySection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mb-10 rounded-2xl border border-[#e1e3eb] bg-white p-6 sm:p-8"><h2 className="text-2xl font-black tracking-[-.04em]">{title}</h2><div className="mt-4 space-y-4 leading-7 text-[#666d81]">{children}</div></section>;
}
