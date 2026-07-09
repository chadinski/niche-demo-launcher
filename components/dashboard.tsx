"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCheck,
  Clock3,
  Code2,
  MailCheck,
  MessageSquareText,
  Plus,
  RefreshCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { isFollowUpDue } from "@/lib/automation/follow-ups";
import { useProspects } from "@/components/prospect-provider";
import { RevolvingGlobe } from "@/components/dashboard/revolving-globe";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { Card, EmptyState, buttonClass } from "@/components/ui";

const statIcons = {
  prospects: Users,
  websites: Code2,
  messages: MessageSquareText,
  sent: MailCheck,
  replies: RefreshCcw,
  followups: CalendarClock,
  lost: CheckCheck,
};

const statToneClasses: Record<string, string> = {
  lime: "bg-lime-50 text-lime-700",
  green: "bg-green-50 text-green-700",
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
  amber: "bg-amber-50 text-amber-600",
  orange: "bg-orange-50 text-orange-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
};

export function Dashboard({ nowIso }: { nowIso: string }) {
  const { prospects } = useProspects();
  const deployed = prospects.filter((item) => item.demo_url).length;
  const generated = prospects.filter((item) => item.generated_website_html).length;
  const readyToDeploy = prospects.filter((item) => item.generated_website_html && !item.demo_url).length;
  const messageReady = prospects.filter((item) => item.outreach_status === "message_ready").length;
  const metrics = [
    { label: "Total prospects", value: prospects.length, icon: statIcons.prospects, tone: "lime" },
    { label: "Hot leads", value: prospects.filter((item) => item.lead_temperature === "Hot").length, icon: statIcons.replies, tone: "rose" },
    {
      label: "Websites generated",
      value: generated,
      icon: statIcons.websites,
      tone: "green",
    },
    {
      label: "Websites deployed",
      value: deployed,
      icon: statIcons.sent,
      tone: "cyan",
    },
    {
      label: "Ready to deploy",
      value: readyToDeploy,
      icon: statIcons.websites,
      tone: "amber",
    },
    {
      label: "Messages generated",
      value: prospects.filter((item) => item.whatsapp_message || item.email_message).length,
      icon: statIcons.messages,
      tone: "blue",
    },
    {
      label: "Messages sent",
      value: prospects.filter((item) => item.last_contacted_at).length,
      icon: statIcons.sent,
      tone: "cyan",
    },
    {
      label: "Replies",
      value: prospects.filter((item) => item.outreach_status === "replied").length,
      icon: statIcons.replies,
      tone: "amber",
    },
    {
      label: "Follow-ups due",
      value: prospects.filter((item) => isFollowUpDue(item, nowIso)).length,
      icon: statIcons.followups,
      tone: "orange",
    },
    {
      label: "Messages ready",
      value: messageReady,
      icon: statIcons.lost,
      tone: "blue",
    },
  ];

  const recent = [...prospects]
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 5);

  const pipeline = [
    { label: "New", count: prospects.filter((p) => p.outreach_status === "new").length, color: "bg-slate-400" },
    { label: "Profile", count: prospects.filter((p) => p.outreach_status === "profile_extracted").length, color: "bg-violet-500" },
    { label: "Generated", count: prospects.filter((p) => p.outreach_status === "demo_generated").length, color: "bg-indigo-500" },
    { label: "Deployed", count: prospects.filter((p) => p.outreach_status === "demo_deployed").length, color: "bg-cyan-500" },
    { label: "Contacted", count: prospects.filter((p) => p.outreach_status === "contacted").length, color: "bg-blue-500" },
    { label: "Replied", count: prospects.filter((p) => p.outreach_status === "replied").length, color: "bg-lime-500" },
    { label: "Follow-up", count: prospects.filter((p) => p.outreach_status === "follow_up_due").length, color: "bg-amber-500" },
    { label: "Won", count: prospects.filter((p) => p.outreach_status === "won").length, color: "bg-emerald-500" },
  ];
  const maxPipeline = Math.max(1, ...pipeline.map((item) => item.count));
  const todayActions = prospects
    .filter((item) => isFollowUpDue(item, nowIso) || item.lead_temperature === "Hot" || item.outreach_status === "message_ready")
    .slice(0, 5);

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Sales workspace"
        title="Good morning, Chad."
        description="Your private command center for turning business information into premium websites and respectful, personalized outreach."
        action={
          <Link href="/create" className={buttonClass("primary", "min-h-11 px-4")}>
            <Plus className="size-4" />
            Create New Site
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
        <Card className="surface-grid relative overflow-hidden border-white/10 bg-ink-950 p-6 text-white shadow-[0_28px_90px_rgba(21,26,45,.28)] sm:p-8">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_65%_35%,rgba(168,85,247,.34),transparent_17rem)]" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[0.68rem] font-bold tracking-[0.13em] text-brand-100 uppercase">
              <Sparkles className="size-3.5" />
              Seraphim workflow
            </span>
            <h2 className="mt-8 max-w-2xl text-[clamp(2rem,5vw,4.5rem)] leading-[0.9] font-black tracking-[-0.075em]">
              Build the demo. Shape the message. Keep the send manual.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/62">
              A focused workspace for one-person agency speed: capture the business, generate a polished Seraphim site, attach the live URL, then approve outreach with context.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["Prospects", prospects.length],
                ["Demos", generated],
                ["Follow-ups", prospects.filter((item) => isFollowUpDue(item, nowIso)).length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                  <div className="text-2xl font-black tracking-[-0.05em]">{value}</div>
                  <div className="mt-1 text-[0.68rem] font-bold tracking-[0.12em] text-white/48 uppercase">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/create" className={buttonClass("primary", "min-h-12 px-5")}>
                Start a site
                <ArrowUpRight className="size-4" />
              </Link>
              <Link href="/prospects" className={buttonClass("outline", "min-h-12 border-white/15 bg-white/10 px-5 text-white hover:bg-white hover:text-ink-950")}>
                Review prospects
              </Link>
            </div>
          </div>
        </Card>

        <RevolvingGlobe />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5" aria-label="Performance overview">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="min-w-0 p-4 shadow-none sm:p-5 xl:min-h-36">
              <div className="flex items-center justify-between gap-3">
                <span className={`grid size-9 place-items-center rounded-xl ${statToneClasses[metric.tone]}`}>
                  <Icon className="size-4" />
                </span>
                <ArrowUpRight className="size-3.5 text-[#b4b7c3]" />
              </div>
              <div className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-ink-950">
                {metric.value}
              </div>
              <div className="mt-1 text-[0.72rem] leading-4 font-semibold text-[#7b8193]">
                {metric.label}
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.7fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#ececf2] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold tracking-[-0.025em]">Recent prospects</h2>
              <p className="mt-1 text-xs text-[#848a9c]">Latest real prospects saved in this workspace.</p>
            </div>
            <Link href="/prospects" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {recent.length ? (
            <div className="divide-y divide-[#eff0f4]">
              {recent.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/prospects/${prospect.id}`}
                  className="grid gap-3 px-5 py-4 hover:bg-[#fbfbfd] sm:grid-cols-[minmax(0,1fr)_130px_100px_20px] sm:items-center sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink-950">{prospect.business_name}</div>
                    <div className="mt-1 truncate text-xs text-[#858b9d]">
                      {[prospect.category, prospect.location].filter(Boolean).join(" · ") || "Business details pending"}
                    </div>
                  </div>
                  <StatusBadge status={prospect.outreach_status} className="w-fit" />
                  <span className="text-xs text-[#858b9d]">{formatRelativeDate(prospect.updated_at, nowIso)}</span>
                  <ArrowUpRight className="hidden size-4 text-[#aeb2bf] sm:block" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="size-5" />}
              title="No prospects yet"
              description="Create a site to add your first real prospect."
            />
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold tracking-[-0.025em]">Pipeline snapshot</h2>
              <p className="mt-1 text-xs text-[#848a9c]">Current production status distribution.</p>
            </div>
            <span className="rounded-full bg-mint-50 px-2.5 py-1 text-[0.67rem] font-bold text-emerald-700">
              Live
            </span>
          </div>
          <div className="mt-7 space-y-5">
            {pipeline.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#666d80]">{item.label}</span>
                  <span className="font-bold text-ink-950">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f0f0f4]">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${Math.max(item.count ? 14 : 0, (item.count / maxPipeline) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(320px,.7fr)_minmax(0,1.5fr)]">
        <Card className="relative overflow-hidden border-brand-700 bg-brand-700 p-6 text-white">
          <div className="absolute -top-20 -right-16 size-60 rounded-full border border-white/10 shadow-[0_0_0_36px_rgba(255,255,255,.035),0_0_0_72px_rgba(255,255,255,.02)]" />
          <div className="relative">
            <div className="grid size-10 place-items-center rounded-2xl bg-white/10">
              <Sparkles className="size-4 text-brand-100" />
            </div>
            <h2 className="mt-8 max-w-xs text-2xl leading-tight font-bold tracking-[-0.045em]">
              Go from copied info to outreach-ready in minutes.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/58">
              Generate the site, deploy the live URL, review the copy, and open the right draft.
            </p>
            <Link href="/create" className={buttonClass("outline", "mt-6 border-white/15 bg-white text-ink-950")}>
              Launch workspace
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#ececf2] px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold tracking-[-0.025em]">Recent activity</h2>
              <p className="mt-1 text-xs text-[#848a9c]">Important changes and outreach actions.</p>
            </div>
            <Clock3 className="size-4 text-[#a1a6b5]" />
          </div>
          {recent.length ? (
            <div className="divide-y divide-[#eff0f4]">
              {recent.map((prospect) => (
                <div key={prospect.id} className="flex gap-4 px-5 py-4 sm:px-6">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-50" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-ink-950">{prospect.business_name}</p>
                    <span className="text-[0.7rem] text-[#979cac]">{formatRelativeDate(prospect.updated_at, nowIso)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#7c8294]">
                    <span className="font-semibold text-[#5f6679]">{prospect.outreach_status.replaceAll("_", " ")}:</span>{" "}
                    {prospect.demo_url ? "Live demo URL is saved." : prospect.generated_website_html ? "Website generated and ready to deploy." : "Prospect is saved and ready for website generation."}
                  </p>
                </div>
              </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock3 className="size-5" />}
              title="No activity yet"
              description="Real activity will appear here after you save prospects, generate sites, and deploy demos."
            />
          )}
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#ececf2] px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold tracking-[-0.025em]">Today&apos;s action list</h2>
            <p className="mt-1 text-xs text-[#848a9c]">Hot leads, ready messages, and overdue follow-ups.</p>
          </div>
          <CalendarClock className="size-4 text-[#a1a6b5]" />
        </div>
        {todayActions.length ? (
          <div className="divide-y divide-[#eff0f4]">
            {todayActions.map((prospect) => (
              <Link
                key={prospect.id}
                href={`/prospects/${prospect.id}`}
                className="grid gap-3 px-5 py-4 hover:bg-[#fbfbfd] sm:grid-cols-[minmax(0,1fr)_120px_140px_20px] sm:items-center sm:px-6"
              >
                <div>
                  <p className="text-sm font-bold text-ink-950">{prospect.business_name}</p>
                  <p className="mt-1 text-xs text-[#858b9d]">
                    {isFollowUpDue(prospect, nowIso) ? "Follow-up due now" : prospect.recommended_sales_angle || "Review next best action"}
                  </p>
                </div>
                <span className="text-xs font-bold text-brand-700">{prospect.lead_temperature}</span>
                <StatusBadge status={prospect.outreach_status} className="w-fit" />
                <ArrowUpRight className="hidden size-4 text-[#aeb2bf] sm:block" />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarClock className="size-5" />}
            title="No urgent actions"
            description="When follow-ups are due or hot leads are ready, they will appear here."
          />
        )}
      </Card>
    </div>
  );
}
