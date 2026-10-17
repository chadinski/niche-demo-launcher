"use client";
import Link from "next/link";
import { ArrowRight, Plus, Search, CheckCircle2, Clock3 } from "lucide-react";
import { useProspects } from "@/components/prospect-provider";
import { Card, EmptyState, buttonClass } from "@/components/ui";
import {
  nextAction,
  salesStage,
  SALES_LABELS,
  demoStatus,
  DEMO_LABELS,
  isClosed,
} from "@/lib/workspace";
import { isFollowUpDue } from "@/lib/automation/follow-ups";

export function Dashboard({
  nowIso,
  estimatedSpend = null,
}: {
  nowIso: string;
  estimatedSpend?: number | null;
}) {
  const { prospects, hydrated } = useProspects();
  const open = prospects.filter((p) => !isClosed(p));
  const actions = [...open]
    .sort(
      (a, b) =>
        nextAction(a, nowIso).priority - nextAction(b, nowIso).priority ||
        (a.next_follow_up_at || a.updated_at).localeCompare(
          b.next_follow_up_at || b.updated_at,
        ),
    )
    .slice(0, 8);
  const due = prospects.filter((p) => isFollowUpDue(p, nowIso)).length;
  const metrics = [
    {
      label: "Qualified opportunities",
      value: open.filter((p) => salesStage(p) !== "new").length,
      detail: "Verified or in conversation",
    },
    {
      label: "Conversations",
      value: open.filter((p) => ["replied", "proposal"].includes(salesStage(p)))
        .length,
      detail: "Based on your recorded sales stages",
    },
    {
      label: "Clients won",
      value: prospects.filter((p) => salesStage(p) === "won").length,
      detail: "Recorded outcomes, not forecasts",
    },
    {
      label: "Estimated provider cost",
      value:
        estimatedSpend === null
          ? "Unavailable"
          : new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(estimatedSpend),
      detail:
        estimatedSpend === null
          ? "Usage data is unavailable"
          : "Current calendar month · estimate",
    },
  ];
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-700">
            Your agency, in motion
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Make the next move.
          </h1>
          <p className="mt-3 text-base text-slate-500">
            {due
              ? String(due) +
                " follow-up" +
                (due === 1 ? " is" : "s are") +
                " due. Start with the conversations already in progress."
              : "Your prospects, demos, and conversations—ready for the next useful step."}
          </p>
        </div>
        <Link
          href="/create"
          className={buttonClass("primary", "min-h-12 px-5")}
        >
          <Plus className="size-4" />
          Add a business
        </Link>
      </header>
      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Workspace summary"
      >
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-5 shadow-none">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {hydrated ? metric.value : "—"}
            </p>
            <p className="mt-2 text-xs text-slate-500">{metric.detail}</p>
          </Card>
        ))}
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-xl font-bold">Your next actions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Follow-ups first. Then the work that moves a business forward.
              </p>
            </div>
            <Clock3 className="size-5 text-brand-600" />
          </div>
          {!hydrated ? (
            <p role="status" className="p-6 text-slate-500">
              Loading your workspace…
            </p>
          ) : actions.length ? (
            <div className="divide-y divide-slate-100">
              {actions.map((p) => {
                const action = nextAction(p, nowIso);
                return (
                  <Link
                    key={p.id}
                    href={"/prospects/" + p.id + "?tab=" + action.tab}
                    className="group flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-slate-50 sm:p-6"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {p.business_name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {SALES_LABELS[salesStage(p)]} ·{" "}
                        {DEMO_LABELS[demoStatus(p)]}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                      {action.label}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="size-5" />}
              title={
                prospects.length
                  ? "You're caught up."
                  : "Start with one promising business."
              }
              description={
                prospects.length
                  ? "No open opportunities need attention. Discover a new business when you are ready."
                  : "Find a business in your market, verify its information, and create a first demo."
              }
              action={
                <Link href="/leads" className={buttonClass()}>
                  <Search className="size-4" />
                  Discover businesses
                </Link>
              }
            />
          )}
        </Card>
        <aside className="space-y-5">
          <Card className="border-brand-100 bg-brand-50/50 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
              Build with purpose
            </p>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight">
              The right demo starts with the right business.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Look for a specific, verifiable opportunity. Make a fast first
              draft, then invest in the conversations that show promise.
            </p>
            <Link
              href="/leads"
              className={buttonClass("outline", "mt-6 w-full")}
            >
              Find an opportunity
              <ArrowRight className="size-4" />
            </Link>
          </Card>
          <Card className="p-6">
            <h2 className="font-bold">Pick up a demo</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Review, refine, or share the work you have already started.
            </p>
            <Link
              href="/demos"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
            >
              Open demo library
              <ArrowRight className="size-4" />
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
