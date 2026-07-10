import { createClient } from "@/lib/supabase/server";
import type { ServerUserAccess } from "@/lib/auth/server-guard";
import { canonicalizeLeadUrl } from "@/lib/leads/lead-qualification";
import type { LeadCandidate } from "@/lib/leads/types";

type LeadStatus = NonNullable<LeadCandidate["status"]>;

function candidateKey(candidate: LeadCandidate) {
  return canonicalizeLeadUrl(candidate.sourceUrl) || `${candidate.businessName}|${candidate.sourceTitle}`;
}

export async function persistLeadSearch(input: {
  user: ServerUserAccess;
  targetIndustryId: string;
  industry: string;
  country: string;
  region: string;
  city: string;
  query: string;
  candidates: LeadCandidate[];
}) {
  const supabase = await createClient();
  if (!supabase || input.user.mode !== "remote") {
    return {
      searchRunId: undefined,
      candidates: input.candidates.map((candidate) => ({ ...candidate, status: "new" as const })),
    };
  }

  const { data: run, error: runError } = await supabase
    .from("lead_search_runs")
    .insert({
      user_id: input.user.userId,
      target_industry_id: input.targetIndustryId,
      industry: input.industry,
      country: input.country,
      region: input.region,
      city: input.city,
      query: input.query,
      result_count: input.candidates.length,
    })
    .select("id")
    .single();

  if (runError) throw new Error(runError.message);

  const searchRunId = String(run.id);
  const sourceUrls = input.candidates.map(candidateKey).filter(Boolean);
  const { data: blacklist } = await supabase
    .from("lead_blacklist")
    .select("source_url")
    .eq("user_id", input.user.userId)
    .in("source_url", sourceUrls.length ? sourceUrls : ["__none__"]);
  const blacklisted = new Set((blacklist ?? []).map((row) => String(row.source_url)));
  const { data: existingRows, error: existingError } = await supabase
    .from("lead_candidates")
    .select("id, source_url, status")
    .eq("user_id", input.user.userId)
    .in("source_url", sourceUrls.length ? sourceUrls : ["__none__"]);

  if (existingError) throw new Error(existingError.message);

  const existingBySource = new Map((existingRows ?? []).map((row) => [String(row.source_url), row]));
  const suppressedStatuses = new Set(["rejected", "blacklisted"]);
  const visibleCandidates = input.candidates.filter((candidate) => {
    const source = candidateKey(candidate);
    const existing = existingBySource.get(source);
    return !blacklisted.has(source) && !suppressedStatuses.has(String(existing?.status ?? ""));
  });

  const rows = visibleCandidates.map((candidate) => ({
    user_id: input.user.userId,
    search_run_id: searchRunId,
    business_name: candidate.businessName,
    category: candidate.category,
    location: candidate.location,
    phone: candidate.phone,
    email: candidate.email,
    website_url: candidate.websiteUrl,
    social_url: candidate.socialUrl,
    source_url: candidateKey(candidate),
    source_title: candidate.sourceTitle,
    source_summary: candidate.sourceSnippet,
    lead_score: candidate.leadScore,
    score_reasons: candidate.scoreReasons,
    warnings: candidate.warnings,
    status: existingBySource.get(candidateKey(candidate))?.status ?? "new",
  }));

  if (rows.length) {
    const { error } = await supabase
      .from("lead_candidates")
      .upsert(rows, { onConflict: "user_id,source_url", ignoreDuplicates: false });
    if (error) throw new Error(error.message);
  }

  const { data: savedRows, error: savedError } = await supabase
    .from("lead_candidates")
    .select("id, source_url, status")
    .eq("user_id", input.user.userId)
    .in("source_url", sourceUrls.length ? sourceUrls : ["__none__"]);

  if (savedError) throw new Error(savedError.message);

  const rowBySource = new Map((savedRows ?? []).map((row) => [String(row.source_url), row]));

  return {
    searchRunId,
    candidates: visibleCandidates.map((candidate) => {
      const source = candidateKey(candidate);
      const row = rowBySource.get(source);

      return {
        ...candidate,
        persistentId: row?.id ? String(row.id) : undefined,
        status: (row?.status as LeadStatus | undefined) ?? "new",
        searchRunId,
      };
    }),
  };
}

export async function updateLeadCandidateStatus(input: {
  user: ServerUserAccess;
  candidateId?: string;
  sourceUrl?: string;
  businessName?: string;
  status: LeadStatus;
  reason?: string;
}) {
  const supabase = await createClient();
  if (!supabase || input.user.mode !== "remote") {
    return { configured: false };
  }

  const sourceUrl = canonicalizeLeadUrl(input.sourceUrl || "");
  let query = supabase
    .from("lead_candidates")
    .update({ status: input.status })
    .eq("user_id", input.user.userId);

  if (input.candidateId) query = query.eq("id", input.candidateId);
  else if (sourceUrl) query = query.eq("source_url", sourceUrl);
  else throw new Error("Candidate id or source URL is required.");

  const { data: updated, error } = await query.select("id, source_url").maybeSingle();
  if (error) throw new Error(error.message);
  if (!updated) throw new Error("Lead candidate was not found or is no longer accessible.");

  if (input.status === "blacklisted" && updated.source_url) {
    const { error: blacklistError } = await supabase.from("lead_blacklist").upsert({
      user_id: input.user.userId,
      business_name: input.businessName || "",
      source_url: String(updated.source_url),
      reason: input.reason || "Rejected from Lead Finder",
    }, { onConflict: "user_id,source_url" });
    if (blacklistError) throw new Error(blacklistError.message);
  }

  return { configured: true, candidateId: String(updated.id), status: input.status };
}
