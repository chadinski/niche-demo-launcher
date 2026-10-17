"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Plus, Search, PanelsTopLeft } from "lucide-react";
import { useProspects } from "@/components/prospect-provider";
import { Card, EmptyState, buttonClass } from "@/components/ui";
import {
  salesStage,
  SALES_STAGES,
  SALES_LABELS,
  demoStatus,
  DEMO_LABELS,
  nextAction,
  type SalesStage,
} from "@/lib/workspace";
import { createPreviewHtml } from "@/lib/generation/preview";

export function BusinessCollection({
  mode = "pipeline",
}: {
  mode?: "pipeline" | "demos";
}) {
  const { prospects, hydrated } = useProspects();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState<"all" | SalesStage>("all"),
    [limit, setLimit] = useState(24);
  const demos = mode === "demos";
  const collection = prospects.filter(
    (p) =>
      (!demos || p.generated_website_html) &&
      (filter === "all" || salesStage(p) === filter) &&
      [p.business_name, p.category, p.location, p.email]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-700">
            {demos ? "The work you've made" : "From opportunity to client"}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            {demos ? "Your demo library" : "Your pipeline"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            {demos
              ? "Every saved concept, ready to refine, review, or present. Versions and feedback stay with the business."
              : "Sales progress and demo progress, side by side. Open a business to take its next step."}
          </p>
        </div>
        <Link href="/create" className={buttonClass("primary", "min-h-12")}>
          <Plus className="size-4" />
          Add a business
        </Link>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search businesses</span>
          <Search className="absolute top-3.5 left-3 size-4 text-slate-400" />
          <input
            className="field-input pl-10"
            type="search"
            placeholder="Search name, market, or location"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(24);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Filter sales stage</span>
          <select
            className="field-input"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as typeof filter);
              setLimit(24);
            }}
          >
            <option value="all">All sales stages</option>
            {SALES_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {SALES_LABELS[stage]} (
                {prospects.filter((p) => salesStage(p) === stage).length})
              </option>
            ))}
          </select>
        </label>
      </div>
      {!hydrated ? (
        <p role="status" className="p-8 text-slate-500">
          Loading businesses…
        </p>
      ) : !collection.length ? (
        <Card>
          <EmptyState
            icon={<PanelsTopLeft />}
            title={
              query || filter !== "all"
                ? "No matching businesses"
                : demos
                  ? "Your first demo belongs here"
                  : "A clear pipeline starts with one business"
            }
            description="Discover a business or add one you already know. Its facts, demos, messages, and history will stay together."
            action={
              <Link href="/leads" className={buttonClass()}>
                Discover businesses
              </Link>
            }
          />
        </Card>
      ) : demos ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {collection.slice(0, limit).map((p) => (
            <Link
              key={p.id}
              href={`/prospects/${p.id}?tab=review`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg"
            >
              <div
                className="relative h-48 overflow-hidden border-b border-slate-100 bg-slate-100"
                aria-hidden="true"
              >
                <iframe
                  title={`${p.business_name} thumbnail`}
                  loading="lazy"
                  srcDoc={createPreviewHtml(p.generated_website_html)}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  tabIndex={-1}
                  className="pointer-events-none absolute left-0 top-0 h-[768px] w-[1280px] origin-top-left scale-[.30] border-0 bg-white"
                />
              </div>
              <div className="p-5">
                <div className="flex justify-between gap-3">
                  <h2 className="font-bold">{p.business_name}</h2>
                  <ArrowUpRight className="size-4 shrink-0 text-brand-700" />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {p.category || "Business concept"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800">
                    {DEMO_LABELS[demoStatus(p)]}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {SALES_LABELS[salesStage(p)]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:grid">
            <span>Business</span>
            <span>Sales stage</span>
            <span>Demo</span>
            <span>Next action</span>
          </div>
          <div className="divide-y divide-slate-100">
            {collection.slice(0, limit).map((p) => {
              const next = nextAction(p);
              return (
                <Link
                  key={p.id}
                  href={`/prospects/${p.id}?tab=${next.tab}`}
                  className="grid gap-4 p-5 hover:bg-slate-50 lg:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr] lg:items-center lg:px-6"
                >
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">
                      {p.business_name}
                    </h2>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {[p.category, p.location].filter(Boolean).join(" · ") ||
                        "Details to verify"}
                    </p>
                  </div>
                  <span className="text-sm text-slate-600">
                    {SALES_LABELS[salesStage(p)]}
                  </span>
                  <span className="text-sm text-slate-500">
                    {DEMO_LABELS[demoStatus(p)]}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                    {next.label}
                    <ArrowUpRight className="size-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          {Math.min(limit, collection.length)} of {collection.length} businesses
        </p>
        {collection.length > limit ? (
          <button
            className={buttonClass("outline")}
            onClick={() => setLimit((value) => value + 24)}
          >
            Show more
          </button>
        ) : null}
      </div>
    </div>
  );
}
