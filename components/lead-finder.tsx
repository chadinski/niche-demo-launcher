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
import { useMemo, useState, type FormEvent } from "react";
import { PageHeading } from "@/components/page-heading";
import { useProspects } from "@/components/prospect-provider";
import { Button, Card, EmptyState, buttonClass } from "@/components/ui";
import { getLeadIndustryTarget, LEAD_INDUSTRY_TARGETS } from "@/lib/leads/industry-targets";
import { buildLeadSearchLocation, getLeadCountry, LEAD_REGION_COUNTRIES, type LeadCountryCode } from "@/lib/leads/regions";
import type { LeadCandidate, LeadSearchResponse } from "@/lib/leads/types";
import type { LeadTemperature, Prospect } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    `Target industry: #${candidate.targetIndustryRank} ${candidate.targetIndustryPriority} - ${candidate.category}`,
    candidate.phone && `Phone: ${candidate.phone}`,
    candidate.email && `Email: ${candidate.email}`,
    candidate.websiteUrl && `Website: ${candidate.websiteUrl}`,
    candidate.socialUrl && `Social: ${candidate.socialUrl}`,
    `Source: ${candidate.sourceUrl}`,
    `Source title: ${candidate.sourceTitle}`,
    candidate.sourceSnippet && `Source summary: ${candidate.sourceSnippet}`,
    `Opportunity: ${candidate.opportunity}`,
    `Best website offer: ${candidate.websiteOffer}`,
    `Outreach hook: ${candidate.outreachHook}`,
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
      websiteStrategy: candidate.websiteOffer,
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
        `Target industry: #${candidate.targetIndustryRank} ${candidate.targetIndustryPriority}`,
        `Best website offer: ${candidate.websiteOffer}`,
        `Outreach hook: ${candidate.outreachHook}`,
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
      `Target strategy: #${candidate.targetIndustryRank} ${candidate.targetIndustryPriority}. ${candidate.websiteOffer}`,
      `Outreach hook: ${candidate.outreachHook}`,
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
  const [targetIndustryId, setTargetIndustryId] = useState(LEAD_INDUSTRY_TARGETS[0].id);
  const selectedTarget = getLeadIndustryTarget(targetIndustryId);
  const [industry, setIndustry] = useState(selectedTarget.searchLabel);
  const [countryCode, setCountryCode] = useState<LeadCountryCode>("JM");
  const [region, setRegion] = useState("Kingston");
  const [city, setCity] = useState("Kingston");
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LeadSearchResponse | null>(null);
  const [savedMap, setSavedMap] = useState<Record<string, string>>({});
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, NonNullable<LeadCandidate["status"]>>>({});
  const selectedCountry = getLeadCountry(countryCode);
  const searchLocation = buildLeadSearchLocation({
    city,
    region,
    country: countryCode,
  });

  const existingSources = useMemo(
    () => new Set(prospects.map((prospect) => prospect.source).filter(Boolean)),
    [prospects],
  );

  const changeCountry = (nextCountryCode: LeadCountryCode) => {
    const nextCountry = getLeadCountry(nextCountryCode);
    setCountryCode(nextCountry.code);
    setRegion(nextCountry.defaultRegion);
    setCity(nextCountry.defaultCity);
  };

  const changeTargetIndustry = (nextTargetId: string) => {
    const nextTarget = getLeadIndustryTarget(nextTargetId);
    setTargetIndustryId(nextTarget.id);
    setIndustry(nextTarget.searchLabel);
  };

  const searchLeads = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          targetIndustryId,
          country: countryCode,
          region,
          city,
          location: searchLocation,
          limit,
        }),
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
    setCandidateStatuses((current) => ({ ...current, [candidate.id]: "saved" }));
    void updateCandidateStatus(candidate, "saved");
  };

  const updateCandidateStatus = async (
    candidate: LeadCandidate,
    status: NonNullable<LeadCandidate["status"]>,
    reason?: string,
  ) => {
    setCandidateStatuses((current) => ({ ...current, [candidate.id]: status }));
    await fetch("/api/leads/candidate-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId: candidate.persistentId,
        sourceUrl: candidate.sourceUrl || candidate.sourceTitle,
        businessName: candidate.businessName,
        status,
        reason,
      }),
    }).catch(() => {
      // Remote status sync is best-effort; UI still reflects the user's current decision.
    });
  };

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Firecrawl lead engine"
        title="Lead Finder"
        description="Search priority industries by region, qualify the website opportunity, and save promising leads for manual demo generation and outreach approval."
      />

      <Card className="overflow-hidden">
        <form onSubmit={searchLeads} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,.9fr)_minmax(0,1fr)_minmax(0,1fr)_120px_auto] lg:items-end">
          <label>
            <span className="field-label">Target industry</span>
            <select
              className="field-input"
              value={targetIndustryId}
              onChange={(event) => changeTargetIndustry(event.target.value)}
            >
              {LEAD_INDUSTRY_TARGETS.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.rank}. {target.industry}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">Search niche</span>
            <input
              className="field-input"
              value={industry}
              onChange={(event) => setIndustry(event.target.value)}
              placeholder={selectedTarget.searchLabel}
              required
            />
          </label>

          <label>
            <span className="field-label">Country</span>
            <select
              className="field-input"
              value={countryCode}
              onChange={(event) => changeCountry(event.target.value as LeadCountryCode)}
            >
              {LEAD_REGION_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">{selectedCountry.regionLabel}</span>
            <select
              className="field-input"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              {selectedCountry.regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">{selectedCountry.cityLabel}</span>
            <input
              className="field-input"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder={selectedCountry.defaultCity}
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
          Search region: <span className="font-bold text-[#4a5165]">{searchLocation || "No region selected"}</span>.
          {" "}Firecrawl is used only for discovery and qualification. Seraphim does not send messages automatically.
          Verify each result before saving, demo generation, or outreach.
        </div>
      </Card>

      <Card className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_1fr]">
        <div>
          <div className="text-[0.66rem] font-bold tracking-[0.14em] text-brand-600 uppercase">
            Target strategy
          </div>
          <h2 className="mt-2 text-xl font-black tracking-[-0.045em] text-ink-950">
            #{selectedTarget.rank} - {selectedTarget.priority} priority
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#62697c]">{selectedTarget.worthTargeting}</p>
        </div>
        <div>
          <div className="text-[0.66rem] font-bold tracking-[0.14em] text-[#9aa0b0] uppercase">
            Common weaknesses
          </div>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-[#596075]">
            {selectedTarget.commonWeaknesses.slice(0, 5).map((weakness) => (
              <li key={weakness}>- {weakness}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[0.66rem] font-bold tracking-[0.14em] text-[#9aa0b0] uppercase">
            Offer and hook
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#343b4e]">{selectedTarget.bestWebsiteOffer}</p>
          <p className="mt-2 text-sm leading-6 text-[#62697c]">{selectedTarget.outreachHook}</p>
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
                const status = candidateStatuses[candidate.id] || candidate.status || "new";
                const alreadyExists = existingSources.has(`Firecrawl lead search: ${candidate.sourceUrl || candidate.sourceTitle}`);

                return (
                  <article key={candidate.id} className="p-5 hover:bg-[#fbfbfd]">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", temperatureClass(candidate.leadTemperature))}>
                            <Flame className="size-3.5" />
                            {candidate.leadTemperature} - {candidate.leadScore}
                          </span>
                          <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            #{candidate.targetIndustryRank} {candidate.targetIndustryPriority}
                          </span>
                          <span className="rounded-full border border-[#e3e5ed] bg-white px-2.5 py-1 text-xs font-bold text-[#667086]">
                            {candidate.sourceType}
                          </span>
                          <span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                            {candidate.confidence}/100 confidence
                          </span>
                          <span className="rounded-full border border-[#e3e5ed] bg-white px-2.5 py-1 text-xs font-bold text-[#667086]">
                            {status}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-black tracking-[-0.04em] text-ink-950">
                          {candidate.businessName}
                        </h3>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#70778b]">
                          <span>{candidate.category}</span>
                          {candidate.location ? (
                            <>
                              <span aria-hidden="true">-</span>
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
                          <Detail label="Contact" value={[candidate.phone, candidate.email].filter(Boolean).join(" - ") || "Not found in result"} />
                          <Detail label="Opportunity" value={candidate.opportunity} />
                          <Detail label="Website offer" value={candidate.websiteOffer} />
                          <Detail label="Outreach hook" value={candidate.outreachHook} />
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
                            disabled={alreadyExists || status === "rejected" || status === "blacklisted"}
                          >
                            <Save className="size-4" />
                            {alreadyExists ? "Already saved" : "Save prospect"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => void updateCandidateStatus(candidate, "rejected", "Rejected from Lead Finder")}
                          disabled={status === "rejected" || status === "blacklisted"}
                        >
                          Reject lead
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-rose-700"
                          onClick={() => void updateCandidateStatus(candidate, "blacklisted", "Blacklisted from Lead Finder")}
                          disabled={status === "blacklisted"}
                        >
                          Blacklist
                        </Button>
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
              description="Try a more specific niche and region, such as Auto detailing in Kingston Jamaica or Beauty salon in Miami Florida."
            />
          )}
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={<Search className="size-5" />}
            title="Start a lead search"
            description="Choose a country, region, and niche to find candidate businesses for manual review."
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
