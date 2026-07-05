"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Clipboard,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  MessageSquareText,
  RefreshCcw,
  Save,
  Send,
  Trophy,
  UserRoundX,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";
import { deployGeneratedWebsite } from "@/app/deployment-actions";
import { useProspects } from "@/components/prospect-provider";
import { StatusBadge } from "@/components/status-badge";
import { Button, Card, EmptyState, buttonClass } from "@/components/ui";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import { generateSalesMessages } from "@/lib/generators";
import { createGenerationId, type GenerationPlan } from "@/lib/generation/session";
import { createPreviewHtml } from "@/lib/generation/preview";
import { generateBusinessIntelligence } from "@/lib/automation/business-intelligence";
import { nextFollowUpDate } from "@/lib/automation/follow-ups";
import { scoreLead } from "@/lib/automation/lead-scoring";
import { auditWebsite } from "@/lib/automation/quality-audit";
import type { BusinessInfo, OutreachStatus, Prospect } from "@/lib/types";
import { cn, externalHref, formatDate, phoneDigits } from "@/lib/utils";

type DetailTab = "profile" | "website" | "messages" | "activity";
type ModelMetadata = {
  stage: string;
  provider: string;
  model: string;
  fallback: boolean;
};

type QualityGatePayload = {
  score: number;
  passed: boolean;
  rejectionReasons: string[];
  revisionBrief?: string;
};

type WebsiteGenerationPayload = {
  generationId?: string;
  html?: string;
  modelMetadata?: ModelMetadata;
  pipelineModelMetadata?: ModelMetadata[];
  generationPlan?: GenerationPlan;
  qualityGate?: QualityGatePayload;
  error?: string;
};

type WebsiteStreamEvent =
  | ({ type: "complete" } & WebsiteGenerationPayload)
  | { type: "error"; error?: string; generationId?: string }
  | { type: "plan" | "section" | "qa"; [key: string]: unknown };

async function readGenerationStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming response did not include a readable body.");
  const decoder = new TextDecoder();
  let buffer = "";
  let complete: WebsiteGenerationPayload | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const data = part
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue;
      const event = JSON.parse(data) as WebsiteStreamEvent;
      if (event.type === "error") throw new Error(event.error || "Premium website regeneration failed.");
      if (event.type === "complete") complete = event;
    }
  }

  if (!complete) throw new Error("Premium website regeneration stream ended before completion.");
  return complete;
}

export function ProspectDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getProspect, updateProspect, setStatus, hydrated } = useProspects();
  const prospect = getProspect(params.id);
  const [tab, setTab] = useState<DetailTab>("profile");
  const [confirmStatus, setConfirmStatus] = useState<OutreachStatus | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [regeneratingWebsite, setRegeneratingWebsite] = useState(false);

  if (!prospect && !hydrated) {
    return <div className="panel min-h-96 animate-pulse bg-white" />;
  }

  if (!prospect) {
    return (
      <Card>
        <EmptyState
          icon={<UserRoundX className="size-5" />}
          title="Prospect not found"
          description="This prospect is not available in the current workspace."
          action={<Link href="/prospects" className={buttonClass("primary")}>Back to prospects</Link>}
        />
      </Card>
    );
  }

  const info = prospectToBusinessInfo(prospect);
  const generatedMessages = generateSalesMessages(info, "Friendly", DEFAULT_SETTINGS);
  const leadScore = scoreLead(info);
  const intelligence = prospect.business_intelligence ?? generateBusinessIntelligence(info, leadScore);
  const qualityAudit = prospect.website_quality_audit ?? (
    prospect.generated_website_html ? auditWebsite(prospect.generated_website_html, info) : null
  );
  const generatedWebsitePreviewHtml = createPreviewHtml(prospect.generated_website_html);

  const copyText = async (value: string, label: string) => {
    if (!value) {
      toast.error(`${label} is not available yet`);
      return;
    }
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const downloadHtml = () => {
    if (!prospect.generated_website_html) {
      toast.error("Generate the website first");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([prospect.generated_website_html], { type: "text/html;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "index.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  const regenerateWebsite = async () => {
    const activeGenerationId = createGenerationId();
    setRegeneratingWebsite(true);

    try {
      const response = await fetch("/api/generate-website", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          generationId: activeGenerationId,
          info,
          generationMode: "more-luxury",
          visualPreferences: prospect.business_intelligence?.visualPreferences,
          archetypeId: prospect.business_intelligence?.archetypeId,
          imageName: prospect.business_intelligence?.screenshotName ?? "",
          sourceImageDataUrl: prospect.business_intelligence?.screenshotDataUrl ?? "",
          businessUnderstanding: prospect.business_intelligence,
        }),
      });
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("text/event-stream")
        ? await readGenerationStream(response)
        : await response.json() as WebsiteGenerationPayload;

      if (payload.generationId !== activeGenerationId || !response.ok || !payload.html) {
        throw new Error(payload.error || "Premium website regeneration failed.");
      }

      if (!payload.generationPlan?.seraphimGenerator) {
        throw new Error("Regeneration did not return a Seraphim Generator plan. Clear the prospect output and regenerate.");
      }

      const nextMetadata = payload.pipelineModelMetadata?.length
        ? payload.pipelineModelMetadata
        : payload.modelMetadata
          ? [payload.modelMetadata]
          : prospect.business_intelligence?.modelMetadata ?? [];

      updateProspect(prospect.id, {
        generated_website_html: payload.html,
        website_quality_audit: auditWebsite(payload.html, info),
        outreach_status: "demo_generated",
        business_intelligence: {
          ...intelligence,
          ...prospect.business_intelligence,
          generationId: activeGenerationId,
          generationMode: "more-luxury",
          archetypeId: prospect.business_intelligence?.archetypeId,
          visualPreferences: prospect.business_intelligence?.visualPreferences,
          generationPlan: payload.generationPlan ?? prospect.business_intelligence?.generationPlan ?? null,
          modelMetadata: nextMetadata,
        },
      });

      if (payload.qualityGate && !payload.qualityGate.passed) {
        toast.warning(`Premium regeneration completed with QA notes: ${payload.qualityGate.score}/10`);
      } else {
        toast.success("Premium website regenerated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Premium website regeneration failed.");
    } finally {
      setRegeneratingWebsite(false);
    }
  };

  const regenerateMessages = () => {
    updateProspect(prospect.id, {
      whatsapp_message: generatedMessages.whatsapp,
      email_subject: generatedMessages.emailSubject,
      email_message: generatedMessages.email,
      dm_message: generatedMessages.dm,
      facebook_message: generatedMessages.facebook,
      follow_up_1_message: generatedMessages.followUp,
      follow_up_2_message: generatedMessages.followUp2,
      final_check_in_message: generatedMessages.finalFollowUp,
      outreach_status: "message_ready",
    });
    toast.success("Messages regenerated");
  };

  const openWhatsApp = () => {
    const phone = phoneDigits(prospect.phone);
    if (!phone || !prospect.whatsapp_message) {
      toast.error("A phone number and WhatsApp message are required");
      return;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(prospect.whatsapp_message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openEmail = () => {
    if (!prospect.email || !prospect.email_message) {
      toast.error("An email address and generated email are required");
      return;
    }
    window.location.href = `mailto:${prospect.email}?subject=${encodeURIComponent(prospect.email_subject)}&body=${encodeURIComponent(prospect.email_message)}`;
  };

  const applyStatus = (status: OutreachStatus) => {
    if (status === "contacted") {
      updateProspect(prospect.id, {
        outreach_status: status,
        last_contacted_at: new Date().toISOString(),
        next_follow_up_at: nextFollowUpDate(prospect.follow_up_count || 0),
        follow_up_count: (prospect.follow_up_count || 0) + 1,
      });
    } else {
      setStatus(prospect.id, status);
    }
    setConfirmStatus(null);
    toast.success(`Prospect marked ${status.replaceAll("_", " ")}`);
  };

  const deployWebsite = async () => {
    if (!prospect.generated_website_html) {
      toast.error("Generate the website before deploying");
      return;
    }
    setDeploying(true);
    const result = await deployGeneratedWebsite({
      businessName: prospect.business_name,
      html: prospect.generated_website_html,
    });
    setDeploying(false);

    if (result.ok && result.url) {
      updateProspect(prospect.id, {
        demo_url: result.url,
        outreach_status: "demo_deployed",
      });
      toast.success("Website deployed and URL saved");
      return;
    }

    if (result.status === "setup_required") {
      toast.info(`Deployment setup required: ${(result.missing ?? []).join(", ")}`);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => router.push("/prospects")}
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#72798c] hover:text-brand-700"
        >
          <ArrowLeft className="size-4" />
          Back to prospects
        </button>
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(1.8rem,4vw,2.65rem)] leading-none font-extrabold tracking-[-0.055em]">
                {prospect.business_name}
              </h1>
              <StatusBadge status={prospect.outreach_status} />
            </div>
            <p className="mt-3 text-sm text-[#747b8f]">
              {[prospect.category, prospect.location].filter(Boolean).join(" · ") || "Business details pending"}
              {" · "}
              Created {formatDate(prospect.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={regenerateWebsite} loading={regeneratingWebsite}>
              <RefreshCcw className="size-4" />
              Regenerate Premium
            </Button>
            <Button variant="outline" onClick={regenerateMessages}>
              <MessageSquareText className="size-4" />
              Regenerate Message
            </Button>
            <Button onClick={() => setConfirmStatus("contacted")}>
              <Send className="size-4" />
              Mark Sent
            </Button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin flex gap-1 overflow-x-auto rounded-2xl border border-[#e5e6ed] bg-white p-1.5">
        {[
          ["profile", "Profile", FileText],
          ["website", "Website", Globe2],
          ["messages", "Messages", MessageCircle],
          ["activity", "Activity", CalendarClock],
        ].map(([value, label, Icon]) => (
          <button
            key={value as string}
            type="button"
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold whitespace-nowrap",
              tab === value ? "bg-ink-950 text-white shadow-sm" : "text-[#72798c] hover:bg-[#f3f3f7]",
            )}
            onClick={() => setTab(value as DetailTab)}
          >
            <Icon className="size-4" />
            {label as string}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className="p-5 sm:p-6">
              <CardHeading title="Business profile" icon={<FileText className="size-4" />} />
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail label="Business name" value={prospect.business_name} />
                <Detail label="Category" value={prospect.category} />
                <Detail label="Location" value={prospect.location} />
                <Detail label="Phone / WhatsApp" value={prospect.phone} />
                <Detail label="Email" value={prospect.email} />
                <Detail label="Package price" value={prospect.package_price} />
                <Detail label="Existing website" value={prospect.website_url} link />
                <Detail label="Social profile" value={prospect.social_url} link />
                <Detail label="Source" value={prospect.source} />
                <Detail label="Deal value" value={prospect.deal_value || prospect.package_price} />
              </dl>
            </Card>
            <Card className="p-5 sm:p-6">
              <CardHeading title="Lead intelligence" icon={<Trophy className="size-4" />} />
              <div className="mt-5 grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
                  <div className="text-[0.65rem] font-bold tracking-[0.12em] text-brand-700 uppercase">Lead score</div>
                  <div className="mt-3 text-5xl font-black tracking-[-0.08em] text-ink-950">{prospect.lead_score || leadScore.score}</div>
                  <div className="mt-1 text-sm font-bold text-brand-700">{prospect.lead_temperature || leadScore.temperature}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail label="Recommended angle" value={prospect.recommended_sales_angle || leadScore.recommendedAngle} />
                  <Detail label="Best CTA" value={intelligence.bestCta} />
                  <Detail label="Suggested package" value={intelligence.suggestedPackage} />
                  <Detail label="Suggested price range" value={intelligence.suggestedPriceRange} />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#62697c]">{intelligence.websiteStrategy}</p>
            </Card>
            <Card className="p-5 sm:p-6">
              <CardHeading title="Original pasted information" icon={<Clipboard className="size-4" />} />
              <pre className="mt-5 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-[#e8e9ef] bg-[#fafafd] p-4 font-sans text-sm leading-6 text-[#596075]">
                {prospect.pasted_raw_info || "No raw business information was saved."}
              </pre>
            </Card>
            <Card className="p-5 sm:p-6">
              <CardHeading title="Extracted summary" icon={<Check className="size-4" />} />
              <p className="mt-4 text-sm leading-6 text-[#62697c]">
                {prospect.extracted_summary || "No extracted summary is available."}
              </p>
            </Card>
          </div>
          <div className="space-y-5">
            <Card className="p-5">
              <CardHeading title="Pipeline controls" icon={<Trophy className="size-4" />} />
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => applyStatus("demo_generated")}>Demo Generated</Button>
                <Button variant="outline" onClick={() => applyStatus("demo_deployed")}>Demo Deployed</Button>
                <Button variant="outline" onClick={() => applyStatus("message_ready")}>Message Ready</Button>
                <Button variant="outline" onClick={() => applyStatus("contacted")}>Contacted</Button>
                <Button variant="outline" onClick={() => applyStatus("replied")}>Mark Replied</Button>
                <Button variant="outline" onClick={() => applyStatus("follow_up_due")}>Follow-up Due</Button>
                <Button variant="outline" onClick={() => applyStatus("won")}>Mark Won</Button>
                <Button variant="danger" onClick={() => setConfirmStatus("lost")}>Mark Lost</Button>
                <Button variant="ghost" className="col-span-2" onClick={() => setConfirmStatus("opt_out")}>
                  <UserRoundX className="size-4" />
                  Mark Opt-Out
                </Button>
              </div>
            </Card>
            <Card className="p-5">
              <CardHeading title="Follow-up date" icon={<CalendarClock className="size-4" />} />
              <input
                type="datetime-local"
                className="field-input mt-4"
                value={prospect.next_follow_up_at?.slice(0, 16) ?? ""}
                onChange={(event) =>
                  updateProspect(prospect.id, {
                    next_follow_up_at: event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null,
                  })
                }
              />
              <p className="mt-2 text-xs text-[#8b91a2]">Current: {formatDate(prospect.next_follow_up_at)}</p>
              <p className="mt-1 text-xs text-[#8b91a2]">Touches recorded: {prospect.follow_up_count || 0}</p>
            </Card>
            <Card className="p-5">
              <CardHeading title="Internal notes" icon={<Save className="size-4" />} />
              <textarea
                className="field-input mt-4 min-h-40 resize-y"
                value={prospect.notes}
                onChange={(event) => updateProspect(prospect.id, { notes: event.target.value })}
                placeholder="Add internal notes..."
              />
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "website" ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col justify-between gap-4 border-b border-[#e9eaf0] p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-extrabold tracking-[-0.025em]">Generated website</h2>
              <p className="mt-1 text-xs text-[#858b9d]">{prospect.demo_url || "No deployed URL added yet."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => copyText(prospect.generated_website_html, "Website HTML")}>
                <Copy className="size-4" /> Copy HTML
              </Button>
              <Button variant="secondary" onClick={downloadHtml}>
                <Download className="size-4" /> Download index.html
              </Button>
              <Button onClick={deployWebsite} loading={deploying}>
                <Globe2 className="size-4" /> Deploy
              </Button>
            </div>
          </div>
          {prospect.generated_website_html ? (
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
              <div className="bg-[#ececf2] p-4">
                <iframe
                  title={`${prospect.business_name} website preview`}
                  srcDoc={generatedWebsitePreviewHtml}
                  sandbox=""
                  scrolling="auto"
                  referrerPolicy="no-referrer"
                  className="h-[720px] w-full rounded-xl border border-[#dfe0e7] bg-white shadow-xl"
                />
              </div>
              <pre className="scrollbar-thin max-h-[752px] overflow-auto bg-[#161a2b] p-5 text-xs leading-6 text-[#dce0f0]">
                <code>{prospect.generated_website_html}</code>
              </pre>
            </div>
          ) : (
            <EmptyState
              icon={<Code2 className="size-5" />}
              title="No website generated"
              description="Generate a complete single-file website for this prospect."
              action={<Button onClick={regenerateWebsite} loading={regeneratingWebsite}>Generate Premium</Button>}
            />
          )}
          <div className="border-t border-[#e9eaf0] p-5">
            <label className="field-label" htmlFor="detail-demo-url">Live site URL</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="detail-demo-url"
                type="url"
                className="field-input flex-1"
                value={prospect.demo_url}
                onChange={(event) => updateProspect(prospect.id, { demo_url: event.target.value })}
                placeholder="https://project.vercel.app"
              />
              <Button variant="outline" onClick={() => copyText(prospect.demo_url, "Site link")}>
                <ExternalLink className="size-4" /> Copy Link
              </Button>
            </div>
          </div>
          {qualityAudit ? (
            <div className="border-t border-[#e9eaf0] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold">Quality audit</h3>
                  <p className="mt-1 text-xs text-[#858b9d]">{qualityAudit.score}/100 checklist score</p>
                </div>
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  qualityAudit.passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                )}>
                  {qualityAudit.passed ? "Ready" : "Review"}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {qualityAudit.items.map((check) => (
                  <div key={check.label} className="rounded-xl border border-[#ececf2] bg-[#fafafd] p-3 text-xs">
                    <div className="font-bold">{check.passed ? "Pass" : "Review"}: {check.label}</div>
                    <p className="mt-1 leading-5 text-[#747b8f]">{check.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {tab === "messages" ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <MessageCard
            title="WhatsApp message"
            value={prospect.whatsapp_message}
            onChange={(value) => updateProspect(prospect.id, { whatsapp_message: value })}
            actions={
              <>
                <Button variant="outline" onClick={() => copyText(prospect.whatsapp_message, "WhatsApp message")}>
                  <Copy className="size-4" /> Copy
                </Button>
                <Button onClick={openWhatsApp}><MessageCircle className="size-4" /> Open WhatsApp</Button>
              </>
            }
          />
          <MessageCard
            title="Email message"
            subject={prospect.email_subject}
            value={prospect.email_message}
            onChange={(value) => updateProspect(prospect.id, { email_message: value })}
            actions={
              <>
                <Button variant="outline" onClick={() => copyText(prospect.email_subject, "Email subject")}>
                  <Copy className="size-4" /> Copy Subject
                </Button>
                <Button onClick={openEmail}><Mail className="size-4" /> Open Email Draft</Button>
              </>
            }
          />
          <MessageCard
            title="Instagram / Facebook DM"
            value={prospect.dm_message}
            onChange={(value) => updateProspect(prospect.id, { dm_message: value })}
            actions={
              <Button variant="outline" onClick={() => copyText(prospect.dm_message, "DM message")}>
                <Copy className="size-4" /> Copy DM
              </Button>
            }
          />
          <MessageCard
            title="Facebook message"
            value={prospect.facebook_message}
            onChange={(value) => updateProspect(prospect.id, { facebook_message: value })}
            actions={
              <Button variant="outline" onClick={() => copyText(prospect.facebook_message, "Facebook message")}>
                <Copy className="size-4" /> Copy Facebook
              </Button>
            }
          />
          <MessageCard
            title="Follow-up 1"
            value={prospect.follow_up_1_message}
            onChange={(value) => updateProspect(prospect.id, { follow_up_1_message: value })}
            actions={
              <Button variant="outline" onClick={() => copyText(prospect.follow_up_1_message, "Follow-up 1")}>
                <Copy className="size-4" /> Copy Follow-up
              </Button>
            }
          />
          <MessageCard
            title="Follow-up 2"
            value={prospect.follow_up_2_message}
            onChange={(value) => updateProspect(prospect.id, { follow_up_2_message: value })}
            actions={
              <Button variant="outline" onClick={() => copyText(prospect.follow_up_2_message, "Follow-up 2")}>
                <Copy className="size-4" /> Copy Follow-up 2
              </Button>
            }
          />
          <MessageCard
            title="Final check-in"
            value={prospect.final_check_in_message}
            onChange={(value) => updateProspect(prospect.id, { final_check_in_message: value })}
            actions={
              <Button variant="outline" onClick={() => copyText(prospect.final_check_in_message, "Final check-in")}>
                <Copy className="size-4" /> Copy Final
              </Button>
            }
          />
          <Card className="p-5 sm:p-6">
            <CardHeading title="Outreach actions" icon={<Send className="size-4" />} />
            <p className="mt-4 text-sm leading-6 text-[#70778b]">
              Drafts open in the selected channel. Nothing is sent automatically.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => setConfirmStatus("contacted")}><Send className="size-4" /> Mark Sent</Button>
              <Button variant="outline" onClick={() => applyStatus("replied")}>Mark Replied</Button>
              <Button variant="outline" onClick={() => applyStatus("won")}>Mark Won</Button>
              <Button variant="danger" onClick={() => setConfirmStatus("lost")}>Mark Lost</Button>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "activity" ? (
        <Card className="overflow-hidden">
          <div className="border-b border-[#e9eaf0] p-5">
            <h2 className="font-extrabold tracking-[-0.025em]">Activity history</h2>
            <p className="mt-1 text-xs text-[#858b9d]">A concise timeline of saved prospect events.</p>
          </div>
          <div className="divide-y divide-[#eff0f4]">
            {[
              ["Prospect updated", `Last saved ${formatDate(prospect.updated_at)}`],
              ["Prospect created", `Added ${formatDate(prospect.created_at)}`],
              prospect.last_contacted_at
                ? ["Last contacted", formatDate(prospect.last_contacted_at)]
                : ["Outreach pending", "No sent date has been recorded."],
              prospect.next_follow_up_at
                ? ["Follow-up scheduled", formatDate(prospect.next_follow_up_at)]
                : ["No follow-up scheduled", "Add a date from the profile tab."],
            ].map(([title, detail], index) => (
              <div key={`${title}-${index}`} className="flex gap-4 p-5">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-50" />
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-1 text-xs text-[#858b9d]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <ConfirmModal
        open={Boolean(confirmStatus)}
        title={
          confirmStatus === "opt_out"
            ? "Mark this prospect as opted out?"
            : `Mark prospect as ${confirmStatus?.replaceAll("_", " ")}?`
        }
        description={
          confirmStatus === "contacted"
            ? "This records the outreach as sent. It does not send a message."
            : "This status change will be saved in the local workspace."
        }
        confirmLabel={confirmStatus === "contacted" ? "Mark as sent" : "Update status"}
        destructive={confirmStatus === "lost" || confirmStatus === "opt_out"}
        onCancel={() => setConfirmStatus(null)}
        onConfirm={() => confirmStatus && applyStatus(confirmStatus)}
      />
    </div>
  );
}

function prospectToBusinessInfo(prospect: Prospect): BusinessInfo {
  const servicesMatch = prospect.extracted_summary.match(/Services:\s*([^.]*)/i);

  return {
    rawInfo: prospect.pasted_raw_info,
    businessName: prospect.business_name,
    category: prospect.category,
    location: prospect.location,
    phone: prospect.phone,
    email: prospect.email,
    websiteUrl: prospect.website_url,
    socialUrl: prospect.social_url,
    services: servicesMatch?.[1]?.trim() ?? "",
    brandColors: "",
    notes: prospect.notes,
    painPoints: "",
    packagePrice: prospect.package_price,
    demoUrl: prospect.demo_url,
  };
}

function CardHeading({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <h2 className="font-extrabold tracking-[-0.025em]">{title}</h2>
    </div>
  );
}

function Detail({ label, value, link }: { label: string; value: string; link?: boolean }) {
  const href = link ? externalHref(value) : "";

  return (
    <div className="rounded-2xl border border-[#e9eaf0] bg-[#fafafd] p-4">
      <dt className="text-[0.65rem] font-bold tracking-[0.12em] text-[#999eae] uppercase">{label}</dt>
      <dd className="mt-2 break-words text-sm font-semibold text-[#4f566a]">
        {value ? (
          href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{value}</a> : value
        ) : (
          <span className="font-normal text-[#a0a5b5]">Not provided</span>
        )}
      </dd>
    </div>
  );
}

function MessageCard({
  title,
  subject,
  value,
  onChange,
  actions,
}: {
  title: string;
  subject?: string;
  value: string;
  onChange: (value: string) => void;
  actions: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[#e9eaf0] px-5 py-4">
        <h2 className="font-extrabold tracking-[-0.025em]">{title}</h2>
        {subject ? <p className="mt-1 text-xs text-[#7d8496]">Subject: {subject}</p> : null}
      </div>
      <textarea
        className="min-h-72 w-full resize-y border-0 p-5 text-sm leading-6 text-[#4f566a] outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Generate this message to edit it here."
      />
      <div className="flex flex-wrap gap-2 border-t border-[#e9eaf0] p-4">{actions}</div>
    </Card>
  );
}
