"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Filter,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { Card, EmptyState, buttonClass } from "@/components/ui";
import { useProspects } from "@/components/prospect-provider";
import type { OutreachStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statusFilters: Array<{ value: "all" | OutreachStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "not_sent", label: "Not sent" },
  { value: "sent", label: "Sent" },
  { value: "replied", label: "Replied" },
  { value: "follow_up", label: "Follow-up" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "opt_out", label: "Opt-out" },
];

export function ProspectsTable() {
  const { prospects } = useProspects();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OutreachStatus>("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return prospects.filter((prospect) => {
      const matchesStatus = status === "all" || prospect.outreach_status === status;
      const matchesQuery =
        !normalized ||
        [
          prospect.business_name,
          prospect.category,
          prospect.location,
          prospect.phone,
          prospect.email,
        ].some((value) => value.toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [prospects, query, status]);

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Prospect CRM"
        title="Prospects"
        description="Track generated websites, outreach status, follow-ups, replies, and client outcomes in one place."
        action={
          <Link href="/create" className={buttonClass("primary", "min-h-11 px-4")}>
            <Plus className="size-4" />
            Add Prospect
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#e9eaf0] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <label className="relative w-full sm:max-w-sm">
            <span className="sr-only">Search prospects</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#9aa0b0]" />
            <input
              type="search"
              className="field-input pl-10"
              placeholder="Search business, category, location..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by status</span>
            <Filter className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-[#8e94a5]" />
            <select
              className="field-input min-w-44 appearance-none pl-9 text-xs font-semibold"
              value={status}
              onChange={(event) => setStatus(event.target.value as "all" | OutreachStatus)}
            >
              {statusFilters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#ececf2] bg-[#fafafd] text-[0.67rem] font-bold tracking-[0.1em] text-[#969bac] uppercase">
                    <th className="px-5 py-3.5">Business</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Site</th>
                    <th className="px-5 py-3.5">Follow-up</th>
                    <th className="px-5 py-3.5" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff0f4]">
                  {filtered.map((prospect) => (
                    <tr key={prospect.id} className="group hover:bg-[#fbfbfd]">
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-ink-950">{prospect.business_name}</div>
                        <div className="mt-1 text-xs text-[#858b9d]">
                          {[prospect.category, prospect.location].filter(Boolean).join(" · ") || "Details pending"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="max-w-48 truncate text-xs font-semibold text-[#5f6679]">
                          {prospect.phone || prospect.email || "No contact added"}
                        </div>
                        {prospect.phone && prospect.email ? (
                          <div className="mt-1 max-w-48 truncate text-[0.7rem] text-[#969bac]">{prospect.email}</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={prospect.outreach_status} />
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold ${prospect.demo_url ? "text-emerald-700" : "text-[#9a9faf]"}`}>
                          {prospect.demo_url ? "Live link added" : "Awaiting link"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#6f7689]">
                        {formatDate(prospect.next_follow_up_at)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/prospects/${prospect.id}`}
                          className="grid size-9 place-items-center rounded-xl border border-[#e3e4eb] bg-white text-[#757c8f] group-hover:border-brand-200 group-hover:text-brand-700"
                          aria-label={`View ${prospect.business_name}`}
                        >
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#eff0f4] md:hidden">
              {filtered.map((prospect) => (
                <Link key={prospect.id} href={`/prospects/${prospect.id}`} className="block p-4 hover:bg-[#fbfbfd]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{prospect.business_name}</div>
                      <div className="mt-1 truncate text-xs text-[#858b9d]">
                        {[prospect.category, prospect.location].filter(Boolean).join(" · ") || "Details pending"}
                      </div>
                    </div>
                    <StatusBadge status={prospect.outreach_status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-[#777e91]">
                    <span>{prospect.phone || prospect.email || "No contact added"}</span>
                    <ArrowUpRight className="size-4" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Users className="size-5" />}
            title="No matching prospects"
            description="Adjust the search or status filter, or create a new prospect."
            action={
              <Link href="/create" className={buttonClass("primary")}>
                <Plus className="size-4" />
                Create Site
              </Link>
            }
          />
        )}

        <div className="border-t border-[#ececf2] bg-[#fafafd] px-5 py-3 text-xs text-[#8b91a2]">
          Showing {filtered.length} of {prospects.length} prospects
        </div>
      </Card>
    </div>
  );
}
