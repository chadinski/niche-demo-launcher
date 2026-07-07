"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Flame,
  LoaderCircle,
  MapPin,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeading } from "@/components/page-heading";
import { useProspects } from "@/components/prospect-provider";
import { Button, Card, EmptyState, buttonClass } from "@/components/ui";
import type { LeadCandidate, LeadSearchResponse } from "@/lib/leads/types";
import type { LeadTemperature, Prospect } from "@/lib/types";
import { cn } from "@/lib/utils";

const defaultIndustries = [
  "Auto detailing",
  "Pet store",
  "Restaurant",
  "Home services",
  "Beauty salon",
  "Dental clinic",
  "Fitness studio",
  "Real estate",
];

function temperatureClass(temperature: LeadTemperature) {
  if (temperature === "Hot") return "border-rose-200 bg-rose-50 text-rose-700";
  if (temperature === "Warm") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function rawInfoForCandidate(candidate: LeadCandidate) {
  return [
    `Business: ${candidate.businessName}`,
    `Category: ${candidate.category}`,
    candidate.location && `Location: ${candidate.location}`,
    candidate.phone && `Phone: ${candidate.phone}`,
    candidate.email && `Email: ${candidate.email}`,
    candidate.websiteUrl && `Website: ${candidate.websiteUrl}`,
    candidate.socialUrl && `Social: ${candidate.socialUrl}`,
    `Source: ${candidate.sourceUrl}`,
    `Source title: ${candidate.sourceTitle}`,
    candidate.sourceSnippet && `Source summary: ${candidate.sourceSnippet}`,
    `Opportunity: ${candidate.opportunity}`,
  ].filter(Boolean).join("\n");
}

function buildProspect(candidate: LeadCandidate): Prospect {
  const now = new Date().toISOString();
  const extractedSummary = [
    candidate.businessName,
    candidate.category,
    candidate.location,
    candidate.services && `Services: ${candidate.services}`,
    candidate.opportunity,
  ].filter(Boolean).join(". ");

  return {
    id: crypto.randomUUID(),
    business_name: candidate.businessName || "Untitled Firecrawl lead",
    category: candidate.category,
    location: candidate.location,
    phone: candidate.phone,
    email: candidate.email,
    website_url: candidate.websiteUrl,
    social_url: candidate.socialUrl,
    source: `Firecrawl lead search: ${candidate.sourceUrl || candidate.sourceTitle}`,
    pasted_raw_info: rawInfoForCandidate(candidate),
    extracted_summary: extractedSummary,
    package_price: "$1,000",
    deal_value: "$1,000",
    lead_score: candidate.leadScore,
    lead_temperature: candidate.leadTemperature,
    lead_score_explanation: candidate.scoreReasons.join(" "),
    recommended_sales_angle: candidate.recommendedAngle,
    business_intelligence: {
      summary: `${candidate.businessName} appears to be a ${candidate.category}${candidate.location ? ` in ${candidate.location}` : ""}.`,
      targetCustomer: "Local customers comparing providers online.",
      onlineWeakness: candidate.opportunity,
      websiteStrategy: "Review the public source, verify facts, then prepare a specific website demo only if the lead is a good fit.",
      bestCta: candidate.phone ? "Call for availability" : "Request availability",
      suggestedPackage: "Premium local website",
      suggestedPriceRange: "$1,000+",
      outreachAngle: candidate.recommendedAngle,
      objections: [
        "Verify contact details before outreach.",
        "Do not claim affiliation with the business.",
        "Keep any website concept clearly positioned as a demo until approved.",
      ],
      extractionReportMarkdown: [
        `## Firecrawl lead candidate`,
        `Source type: ${candidate.sourceType}`,
        `Confidence: ${candidate.confidence}/100`,
        `Warnings: ${candidate.warnings.length ? candidate.warnings.join("; ") : "None"}`,
      ].join("\n"),
    },
    website_quality_audit: null,
    generated_website_html: "",
    demo_url: "",
    whatsapp_message: "",
    email_subject: "",
    email_message: "",
    dm_message: "",
    facebook_message: "",
    follow_up_1_message: "",
    follow_up_2_message: "",
    final_check_in_message: "",
    outreach_status: "profile_extracted",
    notes: [
      "Imported from Firecrawl Lead Finder.",
      "Verify the source and contact details before generating a demo or preparing outreach.",
      ...candidate.warnings,
    ].join("\n"),
    follow_up_count: 0,
    created_at: now,
    updated_at: now,
    last_contacted_at: null,
    next_follow_up_at: null,
  };
}

export function LeadFinder() {
  const { prospects, saveProspect } = useProspects();
  const [industry, setIndustry] = useState("Auto detailing");
  const [location, setLocation] = useState("Kingston Jamaica");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LeadSearchResponse | null>(null);
  const [savedMap, setSavedMap] = useState<Record<string, string>>({});

  const existingSources = useMemo(
    () => new Set(prospects.map((prospect) => prospect.source).filter(Boolean)),
    [prospects],
  );

  const searchLeads = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, location, limit }),
      });
      const payload = (await response.json()) as LeadSearchResponse;
      setResult(payload);
      if (!response.ok) setError(payload.warnings[0] || "Lead search failed.");
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Lead search failed.");
    } finally {
      setLoading(false);
    }
  };

  const saveCandidate = (candidate: LeadCandidate) => {
    const prospect = buildProspect(candidate);
    saveProspect(prospect);
    setSavedMap((current) => ({ ...current, [candidate.id]: prospect.id }));
  };

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Firecrawl lead engine"
        title="Lead Finder"
        description="Search for local business prospects, qualify the opportunity, and save promising leads for manual demo generation and outreach approval."
      />

      <Card className="overflow-hidden">
        <form onSubmit={searchLeads} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto] lg:items-end">
          <label>
            <span className="field-label">Industry or niche</span>
            <input
              className="field-input"
              list="lead-industries"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              placeholder="Auto detailing, pet store, restaurant..."
              required
            />
            <datalist id="lead-industries">
              {defaultIndustries.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>

          <label>
            <span className="field-label">Location</span>
            <input
              className="field-input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Kingston Jamaica"
            />
          </label>

          <label>
            <span className="field-label">Result limit</span>
            <select
              className="field-input"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            >
              {[5, 10, 15, 20].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <Button type="submit" className="min-h-11 px-5" loading={loading}>
            <Search className="size-4" />
            Search leads
          </Button>
        </form>

        <div className="border-t border-[#ececf2] bg-[#fafafd] px-5 py-3 text-xs leading-5 text-[#747b8f]">
          Firecrawl is used only for discovery and qualification. Seraphim does not send messages automatically.
          Verify each result before saving, demo generation, or outreach.
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {result?.warnings.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="size-4" />
            Search notes
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[#ececf2] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.16em] text-brand-600 uppercase">
                Search results
              </p>
              <h2 className="mt-1 text-xl font-black tracking-[-0.045em] text-ink-950">
                {result.candidates.length} candidate{result.candidates.length === 1 ? "" : "s"} found
              </h2>
              <p className="mt-1 text-xs text-[#858b9d]">Query: {result.query || "No query available"}</p>
            </div>
            <span className={cn(
              "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
              result.configured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
            )}>
              {result.configured ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
              {result.configured ? "Firecrawl connected" : "Firecrawl not configured"}
            </span>
          </div>

          {loading ? (
            <EmptyState
              icon={<LoaderCircle className="size-5 animate-spin" />}
              title="Searching live business results"
              description="Firecrawl is collecting and summarizing candidate pages."
            />
          ) : result.candidates.length ? (
            <div className="divide-y divide-[#eff0f4]">
              {result.candidates.map((candidate) => {
                const savedId = savedMap[candidate.id];
                const alreadyExists = existingSources.has(`Firecrawl lead search: ${candidate.sourceUrl || candidate.sourceTitle}`);

                return (
                  <article key={candidate.id} className="p-5 hover:bg-[#fbfbfd]">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", temperatureClass(candidate.leadTemperature))}>
                            <Flame className="size-3.5" />
                            {candidate.leadTemperature} · {candidate.leadScore}
                          </span>
                          <span className="rounded-full border border-[#e3e5ed] bg-white px-2.5 py-1 text-xs font-bold text-[#667086]">
                            {candidate.sourceType}
                          </span>
                          <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                            {candidate.confidence}/100 confidence
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-black tracking-[-0.04em] text-ink-950">
                          {candidate.businessName}
                        </h3>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#70778b]">
                          <span>{candidate.category}</span>
                          {candidate.location ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3.5" />
                                {candidate.location}
                              </span>
                            </>
                          ) : null}
                        </p>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#596075]">
                          {candidate.sourceSnippet || "No summary was returned. Open the source and verify the business manually."}
                        </p>

                        <div className="mt-4 grid gap-3 text-xs text-[#697184] sm:grid-cols-2">
                          <Detail label="Contact" value={[candidate.phone, candidate.email].filter(Boolean).join(" · ") || "Not found in result"} />
                          <Detail label="Opportunity" value={candidate.opportunity} />
                        </div>

                        {candidate.scoreReasons.length ? (
                          <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#687083] sm:grid-cols-2">
                            {candidate.scoreReasons.slice(0, 4).map((reason) => (
                              <li key={reason} className="rounded-xl border border-[#ececf2] bg-white px-3 py-2">
                                {reason}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {candidate.warnings.length ? (
                          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                            {candidate.warnings.join(" ")}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-3 rounded-2xl border border-[#ececf2] bg-white p-4">
                        <a
                          href={candidate.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonClass("outline", "w-full justify-between")}
                        >
                          Open source
                          <ExternalLink className="size-4" />
                        </a>
                        {candidate.websiteUrl ? (
                          <a href={candidate.websiteUrl} target="_blank" rel="noreferrer" className={buttonClass("ghost", "w-full justify-between")}>
                            Website
                            <ArrowUpRight className="size-4" />
                          </a>
                        ) : null}
                        {candidate.socialUrl ? (
                          <a href={candidate.socialUrl} target="_blank" rel="noreferrer" className={buttonClass("ghost", "w-full justify-between")}>
                            Social profile
                            <ArrowUpRight className="size-4" />
                          </a>
                        ) : null}
                        {savedId ? (
                          <Link href={`/prospects/${savedId}`} className={buttonClass("secondary", "w-full")}>
                            <CheckCircle2 className="size-4" />
                            View saved prospect
                          </Link>
                        ) : (
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => saveCandidate(candidate)}
                            disabled={alreadyExists}
                          >
                            <Save className="size-4" />
                            {alreadyExists ? "Already saved" : "Save prospect"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Sparkles className="size-5" />}
              title="No lead candidates yet"
              description="Try a more specific niche and location, such as Auto detailing in Kingston Jamaica."
            />
          )}
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<Search className="size-5" />}
            title="Start a lead search"
            description="Enter a niche and location to find candidate businesses for manual review."
          />
        </Card>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.66rem] font-bold tracking-[0.14em] text-[#9aa0b0] uppercase">{label}</div>
      <div className="mt-1 font-semibold text-[#343b4e]">{value}</div>
    </div>
  );
}
