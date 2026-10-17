import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { activeShare, isolatedShareHtml } from "@/lib/sharing";
import { createPreviewHtml } from "@/lib/generation/preview";
import { DemoFeedbackForm } from "@/components/demo-feedback-form";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your website concept",
  robots: { index: false, follow: false },
};
export default async function SharedDemo({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const share = await activeShare(token);
  if (!share) notFound();
  return (
    <main className="min-h-screen bg-[#f3f6f7] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-7 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-700">
            A website concept for
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
            {share.business_name}
          </h1>
          <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-600">
            {share.introduction}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            This is a proposed design, not the business’s official website.
            Forms and scripts are disabled in this preview. Images may load from
            third-party hosts. This link expires{" "}
            {new Date(share.expires_at).toISOString().slice(0, 10)}.
          </p>
        </header>
        <iframe
          title={`${share.business_name} website concept`}
          sandbox=""
          referrerPolicy="no-referrer"
          srcDoc={isolatedShareHtml(createPreviewHtml(share.html))}
          className="h-[75vh] min-h-[480px] w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
        />
        <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">
            What do you think?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ask a question, suggest a change, or let the designer know you would
            like to discuss the project.
          </p>
          <DemoFeedbackForm token={token} />
        </section>
        <p className="mt-8 text-center text-xs text-slate-500">
          Prepared with Seraphim · Website concept for review
        </p>
      </div>
    </main>
  );
}
