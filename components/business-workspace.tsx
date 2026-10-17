"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  RotateCcw,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useProspects } from "@/components/prospect-provider";
import { Button, Card, EmptyState, buttonClass } from "@/components/ui";
import { WorkspacePreview } from "@/components/workspace-preview";
import { WorkspaceHistory } from "@/components/workspace-history";
import { DemoContentEditor } from "@/components/demo-content-editor";
import {
  DesignPreferences,
  type DesignPreferenceValues,
} from "@/components/DesignPreferences";
import { createDemoShare } from "@/app/workspace-actions";
import {
  deployGeneratedWebsite,
  getAutomationStatus,
} from "@/app/deployment-actions";
import {
  readDemoResponse,
  type DemoEvent,
} from "@/lib/generation/client-stream";
import {
  newProspect,
  prospectInfo,
  salesStage,
  SALES_STAGES,
  SALES_LABELS,
  demoStatus,
  DEMO_LABELS,
  mergeProspect,
  safeExternalUrl,
  isClosed,
} from "@/lib/workspace";
import { generateSalesMessages } from "@/lib/generators/messages";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import { auditWebsite } from "@/lib/automation/quality-audit";
import type {
  BusinessIntelligence,
  Prospect,
  SalesMessages,
} from "@/lib/types";
import type { BusinessUnderstanding } from "@/lib/industry-theme-engine";
import { cn } from "@/lib/utils";

type Tab = "facts" | "design" | "review" | "outreach" | "history";
const tabs: Tab[] = ["facts", "design", "review", "outreach", "history"];
const stages: Record<string, string> = {
  "understanding-business": "Understanding the business",
  "planning-site": "Planning the website",
  "generating-website": "Designing your demo",
  "checking-output": "Checking the output",
  "repairing-output": "Refining the result",
  complete: "Saving your website",
};
function details(
  p: Prospect,
  patch: Partial<BusinessIntelligence> = {},
): BusinessIntelligence {
  return {
    summary: "",
    targetCustomer: "",
    onlineWeakness: "",
    websiteStrategy: "",
    bestCta: "",
    suggestedPackage: "",
    suggestedPriceRange: "",
    outreachAngle: "",
    objections: [],
    ...p.business_intelligence,
    ...patch,
  };
}
function messagePatch(messages: SalesMessages): Partial<Prospect> {
  return {
    whatsapp_message: messages.whatsapp,
    email_subject: messages.emailSubject,
    email_message: messages.email,
    dm_message: messages.dm,
    facebook_message: messages.facebook,
    follow_up_1_message: messages.followUp,
    follow_up_2_message: messages.followUp2,
    final_check_in_message: messages.finalFollowUp,
  };
}

export function BusinessWorkspaceEntry({
  prospectId,
  initialTab,
}: {
  prospectId?: string;
  initialTab?: string;
}) {
  const { getProspect, hydrated, loadError } = useProspects();
  if (!hydrated)
    return (
      <div role="status" className="space-y-5">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
        <span className="sr-only">Loading workspace</span>
      </div>
    );
  if (loadError) return null;
  const p = prospectId ? getProspect(prospectId) : undefined;
  if (prospectId && !p)
    return (
      <EmptyState
        icon={<FileCheck2 />}
        title="Business not found"
        description="It may have been deleted or belong to another workspace."
        action={
          <Link href="/prospects" className={buttonClass()}>
            Back to pipeline
          </Link>
        }
      />
    );
  return (
    <BusinessWorkspace
      key={prospectId || "new"}
      initial={p}
      initialTab={initialTab}
    />
  );
}

function BusinessWorkspace({
  initial,
  initialTab,
}: {
  initial?: Prospect;
  initialTab?: string;
}) {
  const router = useRouter();
  const { saveProspect, getProspect, saving, saveErrors, deleteProspect } =
    useProspects();
  const [draft, setDraft] = useState<Prospect>(() => initial || newProspect());
  const [tab, setTab] = useState<Tab>(() =>
    tabs.includes(initialTab as Tab)
      ? (initialTab as Tab)
      : initial?.generated_website_html
        ? "review"
        : "facts",
  );
  const [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [progress, setProgress] = useState("");
  const [depth, setDepth] = useState<"fast-draft" | "premium-final">(
    "fast-draft",
  );
  const [preferences, setPreferences] = useState<DesignPreferenceValues | null>(
    null,
  );
  const [image, setImage] = useState<{ data: string; name: string } | null>(
    null,
  );
  const [introduction, setIntroduction] = useState(
    "Here is a website concept prepared for your business. Please review the details and design, and share any changes or questions below.",
  );
  const [sectionIndex, setSectionIndex] = useState(0),
    [feedback, setFeedback] = useState("");
  const active = useRef<{ id: string; controller: AbortController } | null>(
    null,
  );
  const changeVersion = useRef(0);
  const current = getProspect(draft.id);
  const persisted = Boolean(current);
  const savingNow = Boolean(saving[draft.id]);
  const locked = Boolean(busy) || savingNow;
  const info = prospectInfo(draft);
  const verified = Boolean(draft.business_intelligence?.extractionReviewed);
  const safeSource =
    safeExternalUrl(draft.source) ??
    safeExternalUrl(draft.business_intelligence?.research?.sourceUrl || "");
  const [managedDeploymentAvailable, setManagedDeploymentAvailable] =
    useState(false);
  const sections = Array.from(
    draft.generated_website_html.matchAll(
      /<section\b[^>]*>[\s\S]*?<\/section>/gi,
    ),
  ).map((match) => match[0]);

  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const guard = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !link ||
        link.target === "_blank" ||
        link.getAttribute("href")?.startsWith("#")
      )
        return;
      if (
        !window.confirm(
          busy
            ? "Work is still running. Leave this workspace?"
            : "You have unsaved edits. Leave without saving?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guard, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guard, true);
    };
  }, [dirty, busy]);
  useEffect(
    () => () => {
      const run = active.current;
      active.current = null;
      if (run) {
        run.controller.abort();
        void fetch(`/api/generation-jobs/${run.id}`, {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        }).catch(() => undefined);
      }
    },
    [],
  );
  useEffect(() => {
    let active = true;
    void getAutomationStatus()
      .then((status) => {
        if (active)
          setManagedDeploymentAvailable(status.managedDeploymentAvailable);
      })
      .catch(() => {
        if (active) setManagedDeploymentAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function edit(patch: Partial<Prospect>) {
    changeVersion.current += 1;
    setDraft((p) => mergeProspect(p, patch));
    setDirty(true);
  }
  function fact(key: keyof Prospect, value: string) {
    edit({
      [key]: value,
      business_intelligence: details(draft, { extractionReviewed: false }),
    });
  }
  function intelligenceField(key: "services" | "brandColors", value: string) {
    edit({
      business_intelligence: details(draft, {
        [key]: value,
        extractionReviewed: false,
      }),
    });
  }
  const persist = useCallback(
    async (next: Prospect) => {
      if (!next.business_name.trim()) {
        setError("Add the business name before saving.");
        return false;
      }
      const version = changeVersion.current;
      const ok = await saveProspect(next);
      if (ok && version === changeVersion.current) {
        setDraft(next);
        setDirty(false);
        setError("");
      }
      return ok;
      if (ok && version === changeVersion.current && !initial && !current)
        router.replace(`/prospects/${next.id}?tab=facts`);
    },
    [current, initial, router, saveProspect],
  );
  async function move(next: Tab) {
    if (dirty && !(await persist(draft))) return;
    setTab(next);
    setError("");
  }
  async function act(name: string, work: () => Promise<void>) {
    if (locked) return;
    setBusy(name);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please retry.",
      );
    } finally {
      setBusy("");
      setProgress("");
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 4_000_000
    ) {
      setError("Choose a PNG, JPEG, or WebP image smaller than 4 MB.");
      return;
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Image could not be read."));
      reader.readAsDataURL(file);
    });
    setImage({ data, name: file.name });
  }
  async function extract() {
    await act("Extracting business details", async () => {
      const id = crypto.randomUUID();
      const response = await fetch("/api/business-intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": id,
        },
        body: JSON.stringify({
          generationId: id,
          rawOcrText: draft.pasted_raw_info,
          imageDataUrl: image?.data || "",
          imageName: image?.name || "",
          currentInfo: info,
        }),
      });
      const result = (await response.json()) as {
        understanding?: BusinessUnderstanding;
        error?: string;
      };
      if (!response.ok || !result.understanding)
        throw new Error(
          result.error ||
            "Extraction did not complete. You can enter the details manually.",
        );
      const u = result.understanding,
        fields = u.enrichedInfo;
      const next = mergeProspect(draft, {
        business_name: fields.businessName,
        category: fields.category,
        location: fields.location,
        phone: fields.phone,
        email: fields.email,
        website_url: fields.websiteUrl,
        social_url: fields.socialUrl,
        extracted_summary: u.reportMarkdown,
        recommended_sales_angle: fields.painPoints,
        business_intelligence: details(draft, {
          services: fields.services,
          brandColors: fields.brandColors,
          fieldEvidence: u.fieldEvidence,
          extractionReviewed: false,
          extractionReportMarkdown: u.reportMarkdown,
          screenshotName: image?.name,
          screenshotDataUrl:
            image && image.data.length < 750000 ? image.data : undefined,
        }),
      });
      edit(next);
      if (await persist(next))
        toast.success(
          "Details extracted and saved. Verify the sources before continuing.",
        );
    });
  }
  async function approveFacts() {
    if (!draft.business_name.trim() || !draft.category.trim()) {
      setError(
        "Add the business name and category, then verify the remaining details.",
      );
      return;
    }
    const next = mergeProspect(draft, {
      business_intelligence: details(draft, { extractionReviewed: true }),
      sales_stage:
        salesStage(draft) === "new" ? "qualified" : salesStage(draft),
    });
    if (await persist(next)) {
      setTab("design");
      toast.success("Business details verified");
    }
  }
  async function saveGenerated(event: DemoEvent, base: Prospect) {
    if (!event.html) throw new Error("No website was returned.");
    const next = mergeProspect(base, {
      generated_website_html: event.html,
      website_quality_audit: auditWebsite(event.html, prospectInfo(base)),
      business_intelligence: details(base, {
        generationId: event.generationId,
        generationDepth: depth,
        generationPlan:
          event.generationPlan as BusinessIntelligence["generationPlan"],
        visualPreferences:
          preferences || base.business_intelligence?.visualPreferences,
      }),
      demo_status: "draft",
    });
    setDraft(next);
    setDirty(true);
    if (await persist(next))
      toast.success("Demo saved. Review it before sharing.");
    setTab("review");
  }
  async function generate() {
    if (!verified) {
      setError("Verify the business details before generating.");
      setTab("facts");
      return;
    }
    await act("Generating website", async () => {
      const id = crypto.randomUUID(),
        controller = new AbortController();
      active.current = { id, controller };
      const base = mergeProspect(draft, {
        business_intelligence: details(draft, {
          generationId: id,
          generationDepth: depth,
        }),
      });
      if (!(await persist(base))) {
        active.current = null;
        return;
      }
      setProgress("Starting your demo");
      const input = {
        generationId: id,
        info: prospectInfo(base),
        generationDepth: depth,
        visualPreferences:
          preferences || base.business_intelligence?.visualPreferences,
        businessUnderstanding: base.business_intelligence,
        sourceImageDataUrl:
          image?.data || base.business_intelligence?.screenshotDataUrl || "",
        imageName: image?.name || "",
      };
      try {
        let result: DemoEvent;
        if (
          depth === "premium-final" &&
          process.env.NEXT_PUBLIC_PREMIUM_GENERATION_ASYNC === "1"
        ) {
          const queued = await fetch("/api/generation-jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
            signal: controller.signal,
          });
          const receipt = await queued.json();
          if (!queued.ok)
            throw new Error(receipt.error || "Could not queue this run.");
          for (;;) {
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(resolve, 2000);
              controller.signal.addEventListener(
                "abort",
                () => {
                  clearTimeout(timer);
                  reject(new Error("Generation cancelled."));
                },
                { once: true },
              );
            });
            const status = await fetch(`/api/generation-jobs/${id}`, {
              signal: controller.signal,
            });
            const payload = await status.json();
            if (!status.ok)
              throw new Error(
                payload.error || "Could not check generation status.",
              );
            const job = payload.job;
            setProgress(job?.stage || "Queued for generation");
            if (job?.status === "succeeded") {
              result = { ...job.result, type: "complete", generationId: id };
              break;
            }
            if (["failed", "cancelled"].includes(job?.status))
              throw new Error(
                "Generation stopped. Your previous saved demo is unchanged.",
              );
          }
        } else {
          const response = await fetch("/api/generate-website", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
              "X-Idempotency-Key": `${id}:${depth}`,
            },
            body: JSON.stringify(input),
            signal: controller.signal,
          });
          result = await readDemoResponse(response, id, (event) => {
            if (active.current?.id === id)
              setProgress(stages[event.type] || "Working on your demo");
          });
        }
        if (active.current?.id === id) await saveGenerated(result, base);
      } finally {
        if (active.current?.id === id) active.current = null;
      }
    });
  }
  async function cancel() {
    const run = active.current;
    if (!run) return;
    active.current = null;
    run.controller.abort();
    await fetch(`/api/generation-jobs/${run.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    }).catch(() => undefined);
    setError(
      "Cancellation requested. Your previous saved demo remains available. Check Usage for the final run status.",
    );
  }
  async function recover() {
    await act("Checking last run", async () => {
      const id = draft.business_intelligence?.generationId;
      if (!id) throw new Error("No previous generation to recover.");
      const response = await fetch(`/api/generation-jobs/${id}`);
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not recover this run.");
      if (result.job?.status !== "succeeded" || !result.job.result?.html)
        throw new Error(
          `Last run: ${result.job?.status || "unavailable"}. Try again if it is still running.`,
        );
      if (
        draft.generated_website_html &&
        !window.confirm(
          "Load the completed run? Your current saved demo stays in version history.",
        )
      )
        return;
      await saveGenerated(
        { ...result.job.result, type: "complete", generationId: id },
        draft,
      );
    });
  }
  async function saveHtml(html: string) {
    const next = mergeProspect(draft, {
      generated_website_html: html,
      website_quality_audit: auditWebsite(html, info),
      demo_status: "draft",
    });
    return persist(next);
  }
  async function regenerateSection() {
    await act("Refining selected section", async () => {
      if (!feedback.trim()) throw new Error("Describe the change you want.");
      const response = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          sectionIndex,
          plan: draft.business_intelligence?.generationPlan,
          designTokens: draft.business_intelligence?.visualPreferences,
          originalHtml: sections[sectionIndex],
          feedback,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.html)
        throw new Error(result.error || "Section refinement failed.");
      let index = 0;
      const next = draft.generated_website_html.replace(
        /<section\b[^>]*>[\s\S]*?<\/section>/gi,
        (original) => (index++ === sectionIndex ? result.html : original),
      );
      if (await saveHtml(next)) {
        setFeedback("");
        toast.success("Section saved as a new version");
      }
    });
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([draft.generated_website_html], { type: "text/html" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download =
      draft.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function share() {
    await act("Creating share link", async () => {
      if (dirty)
        throw new Error(
          "Save your changes and review this version before sharing.",
        );
      const result = await createDemoShare({
        prospectId: draft.id,
        introduction,
        revision: current?.revision ?? draft.revision ?? 0,
      });
      const url = `${window.location.origin}/share/${result.token}`;
      const next = mergeProspect(draft, {
        demo_url: url,
        demo_status: "shared",
      });
      if (!(await persist(next)))
        throw new Error(
          "The review link was created, but its address was not saved to this business. Retry saving before leaving.",
        );
      setTab("outreach");
      toast.success(
        "Reviewed snapshot shared. Prepare your message when ready.",
      );
    });
  }
  async function generateOutreach(useAI: boolean) {
    await act(
      useAI ? "Preparing personalized outreach" : "Preparing outreach",
      async () => {
        if (isClosed(draft))
          throw new Error(
            "Outreach is disabled for closed or opted-out businesses.",
          );
        if (dirty && !(await persist(draft))) return;
        let messages: SalesMessages;
        if (useAI) {
          const response = await fetch("/api/generate-outreach", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify({
              businessInfo: info,
              generatedDemoUrl: draft.demo_url,
              tone: "Friendly",
            }),
          });
          const result = await response.json();
          if (!response.ok)
            throw new Error(result.error || "Outreach could not be generated.");
          messages = result.messages;
        } else
          messages = generateSalesMessages(info, "Friendly", DEFAULT_SETTINGS);
        if (!messages) throw new Error("No outreach draft returned.");
        if (await persist(mergeProspect(draft, messagePatch(messages))))
          toast.success("Drafts saved. Review before sending.");
      },
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/prospects"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" />
          Pipeline
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-700">
              Business workspace
            </p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl">
              {draft.business_name || "Your next client starts here."}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {[draft.category, draft.location].filter(Boolean).join(" · ") ||
                "Add one business. Keep every next step together."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              role="status"
              className={cn(
                "text-xs",
                saveErrors[draft.id] ? "text-red-700" : "text-slate-500",
              )}
            >
              {savingNow
                ? "Saving…"
                : saveErrors[draft.id]
                  ? "Not saved"
                  : dirty
                    ? "Unsaved edits"
                    : persisted
                      ? "Saved"
                      : "New business"}
            </span>
            <Button
              variant="outline"
              loading={savingNow}
              disabled={Boolean(busy)}
              onClick={() => void persist(draft)}
            >
              <Save className="size-4" />
              Save
            </Button>
            <label>
              <span className="sr-only">Sales stage</span>
              <select
                className="field-input !w-auto text-sm"
                value={salesStage(draft)}
                disabled={!persisted || locked}
                onChange={(event) =>
                  void persist(
                    mergeProspect(draft, {
                      sales_stage: event.target
                        .value as Prospect["sales_stage"],
                    }),
                  )
                }
              >
                {SALES_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {SALES_LABELS[stage]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>
      <nav
        aria-label="Business workspace"
        className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2"
      >
        {(
          [
            ["facts", "01", "Confirm business"],
            ["design", "02", "Choose direction"],
            ["review", "03", "Review demo"],
            ["outreach", "", "Outreach"],
            ["history", "", "Activity & versions"],
          ] as const
        ).map(([key, num, label]) => (
          <button
            key={key}
            onClick={() => void move(key)}
            disabled={Boolean(busy)}
            aria-current={tab === key ? "step" : undefined}
            className={cn(
              "flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50",
              tab === key
                ? "bg-brand-700 text-white"
                : "text-slate-500 hover:bg-slate-50",
            )}
          >
            <span className="text-xs opacity-60">{num}</span>
            {label}
          </button>
        ))}
      </nav>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}
      {busy ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 p-5"
        >
          <div className="flex items-center gap-3">
            <LoaderCircle className="size-5 animate-spin text-brand-700" />
            <div>
              <p className="font-bold text-brand-900">{progress || busy}</p>
              <p className="mt-1 text-xs text-brand-800">
                Your previous saved version remains available.
              </p>
            </div>
          </div>
          {busy === "Generating website" ? (
            <Button variant="outline" onClick={() => void cancel()}>
              Cancel run
            </Button>
          ) : null}
        </div>
      ) : null}
      {tab === "facts" ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <Card className="p-6">
              <h2 className="text-xl font-bold">Start with what you know</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Paste business details, a source excerpt, or upload a
                screenshot. You can also fill in the facts directly.
              </p>
              <Field
                label="Source text"
                multiline
                value={draft.pasted_raw_info}
                onChange={(value) => fact("pasted_raw_info", value)}
                disabled={locked}
                maxLength={24000}
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className={buttonClass("outline", "cursor-pointer")}>
                  <Upload className="size-4" />
                  Add screenshot
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={locked}
                    onChange={(event) =>
                      void upload(event.target.files?.[0]).catch(() =>
                        setError("Image could not be read."),
                      )
                    }
                  />
                </label>
                <Button
                  disabled={locked || (!draft.pasted_raw_info && !image)}
                  onClick={() => void extract()}
                >
                  <Sparkles className="size-4" />
                  Extract details
                </Button>
              </div>
              {image ? (
                <p className="mt-3 text-sm text-slate-600">
                  {image.name}{" "}
                  <button
                    onClick={() => setImage(null)}
                    className="ml-2 underline"
                  >
                    Remove
                  </button>
                </p>
              ) : null}
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Extraction uses one extraction allowance. Your text or image is
                processed by the configured AI service.
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <FileCheck2 className="size-5 text-brand-700" />
                <h2 className="text-xl font-bold">Verify business details</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Only approved facts should appear on the website. Leave unknown
                details blank.
              </p>
              <fieldset
                disabled={locked}
                className="mt-4 grid gap-x-5 sm:grid-cols-2"
              >
                {(
                  [
                    ["business_name", "Business name"],
                    ["category", "Business category"],
                    ["location", "Verified location / service area"],
                    ["phone", "Business phone"],
                    ["email", "Business email"],
                    ["website_url", "Official website"],
                    ["social_url", "Social profile"],
                  ] as const
                ).map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    value={draft[key]}
                    onChange={(value) => fact(key, value)}
                    type={
                      key === "email"
                        ? "email"
                        : key.endsWith("url")
                          ? "url"
                          : "text"
                    }
                  />
                ))}
              </fieldset>
              <Field
                label="Verified services / products"
                multiline
                value={draft.business_intelligence?.services || ""}
                onChange={(value) => intelligenceField("services", value)}
                disabled={locked}
              />
              <Field
                label="Brand colors or identity notes"
                value={draft.business_intelligence?.brandColors || ""}
                onChange={(value) => intelligenceField("brandColors", value)}
                disabled={locked}
              />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-md text-xs leading-5 text-slate-500">
                  Continuing confirms that you reviewed these facts against the
                  business’s source material.
                </p>
                <Button disabled={locked} onClick={() => void approveFacts()}>
                  <Check className="size-4" />
                  Verify & continue
                </Button>
              </div>
            </Card>
          </div>
          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="font-bold">Research & evidence</h2>
              {safeSource ? (
                <a
                  href={safeSource}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
                >
                  Open source <ExternalLink className="size-4" />
                </a>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Add a source URL or use Discover to retain the research trail.
                </p>
              )}
              <Field
                label="Source URL"
                value={safeSource || ""}
                type="url"
                onChange={(value) => edit({ source: value })}
                disabled={locked}
              />
              {draft.business_intelligence?.research ? (
                <div className="mt-4 space-y-3 text-xs leading-5 text-slate-500">
                  <p>
                    Search area:{" "}
                    {draft.business_intelligence.research.searchLocation}. This
                    is a search filter, not a verified address.
                  </p>
                  <p>{draft.business_intelligence.research.websiteStatus}</p>
                </div>
              ) : null}
              <dl className="mt-4 space-y-4">
                {Object.entries(
                  draft.business_intelligence?.fieldEvidence || {},
                ).map(([key, evidence]) => (
                  <div key={key}>
                    <dt className="text-xs font-bold capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </dt>
                    <dd className="mt-1 text-xs leading-5 text-slate-500">
                      {evidence.evidence?.join(" ") ||
                        "No source excerpt provided."}
                      <span className="mt-1 block text-brand-700">
                        {evidence.needsReview
                          ? "Needs verification"
                          : "Source provided — confirm accuracy"}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Agency notes</h2>
              <Field
                label="Observed website opportunity"
                multiline
                value={draft.recommended_sales_angle}
                onChange={(value) => edit({ recommended_sales_angle: value })}
                disabled={locked}
              />
              <Field
                label="Internal notes"
                multiline
                value={draft.notes}
                onChange={(value) => edit({ notes: value })}
                disabled={locked}
              />
              <p className="mt-2 text-xs text-slate-500">
                Internal notes are excluded from shared pages.
              </p>
            </Card>
          </aside>
        </div>
      ) : null}
      {tab === "design" ? (
        <div className="mx-auto max-w-4xl space-y-6">
          <Card className="p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
              Choose your next investment
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              A quick first impression. A considered final demo.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Start with a draft to qualify the opportunity. Refine the
              strongest prospects with Premium.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {(
                [
                  [
                    "fast-draft",
                    "Fast Draft",
                    "A complete website for an initial conversation.",
                    "1 fast generation allowance",
                  ],
                  [
                    "premium-final",
                    "Premium refinement",
                    "Additional review and refinement for a promising client.",
                    "1 premium generation allowance",
                  ],
                ] as const
              ).map(([key, title, copy, cost]) => (
                <button
                  key={key}
                  disabled={locked}
                  aria-pressed={depth === key}
                  onClick={() => setDepth(key)}
                  className={cn(
                    "rounded-2xl border-2 p-5 text-left",
                    depth === key
                      ? "border-brand-600 bg-brand-50"
                      : "border-slate-200 bg-white",
                  )}
                >
                  <span className="text-lg font-bold">{title}</span>
                  <span className="mt-3 block text-sm leading-6 text-slate-600">
                    {copy}
                  </span>
                  <span className="mt-5 block text-xs font-bold text-brand-800">
                    {cost}
                  </span>
                </button>
              ))}
            </div>
            <details className="mt-6 rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-bold">
                Adjust colors, typography & mood
              </summary>
              <div className="mt-4">
                <DesignPreferences
                  value={preferences}
                  onChange={setPreferences}
                />
              </div>
            </details>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Generation uses your verified facts and business identity.
              Provider failures release the generation allowance. Your saved
              demo is preserved until a new result is ready.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                disabled={locked || !verified}
                onClick={() => void generate()}
              >
                <Sparkles className="size-4" />
                {draft.generated_website_html
                  ? "Generate a new version"
                  : "Create first demo"}
              </Button>
              {!verified ? (
                <Button variant="outline" onClick={() => void move("facts")}>
                  Verify details first
                </Button>
              ) : null}
              {draft.business_intelligence?.generationId ? (
                <Button
                  variant="ghost"
                  disabled={locked}
                  onClick={() => void recover()}
                >
                  <RotateCcw className="size-4" />
                  Recover last run
                </Button>
              ) : null}
            </div>
          </Card>
          <p className="text-sm text-slate-500">
            Need the original detailed tools?{" "}
            <Link
              href="/create/advanced"
              className="font-semibold text-brand-700 underline"
            >
              Open the advanced generator
            </Link>
            .
          </p>
        </div>
      ) : null}
      {tab === "review" ? (
        draft.generated_website_html ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {draft.business_name} · website concept
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {DEMO_LABELS[demoStatus(draft)]} · Check facts, links,
                  imagery, and mobile layout.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={download}>
                  <Download className="size-4" />
                  Export HTML
                </Button>
                <Button
                  variant="outline"
                  disabled={locked}
                  onClick={() => void move("design")}
                >
                  New version
                </Button>
                <Button
                  disabled={locked || demoStatus(draft) === "reviewed"}
                  onClick={() =>
                    void persist(
                      mergeProspect(draft, { demo_status: "reviewed" }),
                    )
                  }
                >
                  <Check className="size-4" />
                  Approve this demo
                </Button>
              </div>
            </div>
            <WorkspacePreview html={draft.generated_website_html} />
            <fieldset disabled={locked}>
              <DemoContentEditor
                html={draft.generated_website_html}
                onApply={saveHtml}
              />
            </fieldset>
            {sections.length ? (
              <details className="rounded-xl border border-slate-200 bg-white p-5">
                <summary className="cursor-pointer font-bold">
                  Refine a specific section with AI
                </summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]">
                  <label>
                    <span className="field-label">Section</span>
                    <select
                      className="field-input"
                      value={sectionIndex}
                      onChange={(event) =>
                        setSectionIndex(Number(event.target.value))
                      }
                    >
                      {sections.map((_, index) => (
                        <option key={index} value={index}>
                          Section {index + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Requested change"
                    multiline
                    value={feedback}
                    onChange={setFeedback}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Uses one regeneration allowance. Review the result before
                  sharing.
                </p>
                <Button
                  className="mt-4"
                  disabled={locked || !feedback.trim()}
                  onClick={() => void regenerateSection()}
                >
                  Refine section
                </Button>
              </details>
            ) : null}
            <Card className="p-6">
              <h2 className="text-xl font-bold">Present the concept</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Create a private, unlisted review link that expires in 30 days.
                It shares this approved version and your introduction, with a
                feedback form for the recipient. Revoke links from Activity &
                versions.
              </p>
              <Field
                label="Introduction for the prospect"
                multiline
                value={introduction}
                onChange={setIntroduction}
                maxLength={2000}
                disabled={locked}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  disabled={
                    locked ||
                    !["reviewed", "shared"].includes(demoStatus(draft))
                  }
                  onClick={() => void share()}
                >
                  Create review link <ArrowRight className="size-4" />
                </Button>
                {managedDeploymentAvailable ? (
                  <Button
                    variant="ghost"
                    disabled={
                      locked ||
                      !["reviewed", "shared"].includes(demoStatus(draft))
                    }
                    onClick={() =>
                      void act("Deploying demo", async () => {
                        const result = await deployGeneratedWebsite({
                          html: draft.generated_website_html,
                          businessName: draft.business_name,
                        });
                        if (!result.ok || !result.url)
                          throw new Error(result.message);
                        if (
                          !(await persist(
                            mergeProspect(draft, {
                              demo_url: result.url,
                              demo_status: "shared",
                            }),
                          ))
                        )
                          throw new Error(
                            "The demo deployed, but its URL was not saved to this business. Retry saving before leaving.",
                          );
                        toast.success("Demo deployed");
                      })
                    }
                  >
                    Managed deployment
                  </Button>
                ) : null}
              </div>
              {demoStatus(draft) === "draft" ? (
                <p className="mt-3 text-xs text-amber-800">
                  Approve the demo above to enable a review link.
                </p>
              ) : null}
              <p className="mt-3 text-xs text-slate-500">
                HTML export is always available. Managed deployment is available
                only to approved accounts. Production forms, domain setup, and
                client approval are separate delivery steps.
              </p>
            </Card>
          </div>
        ) : (
          <EmptyState
            icon={<Sparkles />}
            title="Your demo will appear here"
            description="Verify the business details and choose a design direction to create the first version."
            action={
              <Button onClick={() => void move(verified ? "design" : "facts")}>
                Continue <ArrowRight className="size-4" />
              </Button>
            }
          />
        )
      ) : null}
      {tab === "outreach" ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="p-6">
            <h2 className="text-2xl font-bold">Start a useful conversation</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Drafts stay here until you choose to copy or open one. Opening a
              draft does not mark the business contacted.
            </p>
            {isClosed(draft) ? (
              <p
                role="status"
                className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
              >
                Outreach is disabled while this business is{" "}
                {SALES_LABELS[salesStage(draft)].toLowerCase()}.
              </p>
            ) : (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  disabled={locked}
                  onClick={() => void generateOutreach(true)}
                >
                  <Sparkles className="size-4" />
                  Personalize with AI
                </Button>
                <Button
                  variant="outline"
                  disabled={locked}
                  onClick={() => void generateOutreach(false)}
                >
                  Use standard draft
                </Button>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">
              AI personalization uses one outreach allowance. A standard draft
              uses no AI allowance.
            </p>
            {(
              [
                ["whatsapp_message", "WhatsApp"],
                ["email_subject", "Email subject"],
                ["email_message", "Email"],
                ["dm_message", "Direct message"],
                ["follow_up_1_message", "First follow-up"],
                ["follow_up_2_message", "Second follow-up"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Field
                  label={label}
                  multiline={key !== "email_subject"}
                  value={draft[key]}
                  onChange={(value) => edit({ [key]: value })}
                  disabled={locked || isClosed(draft)}
                  maxLength={12000}
                />
                {draft[key] ? (
                  <Button
                    className="mt-2"
                    variant="ghost"
                    disabled={isClosed(draft)}
                    onClick={async () => {
                      if (dirty && !(await persist(draft))) return;
                      try {
                        await navigator.clipboard.writeText(draft[key]);
                        toast.success("Copied. Send only after your review.");
                      } catch {
                        toast.error(
                          "Clipboard unavailable. Select and copy the message text.",
                        );
                      }
                    }}
                  >
                    Copy {label.toLowerCase()}
                  </Button>
                ) : null}
              </div>
            ))}
            <div className="mt-5 flex flex-wrap gap-3">
              {!isClosed(draft) && draft.email && draft.email_message ? (
                <a
                  href={`mailto:${encodeURIComponent(draft.email)}?subject=${encodeURIComponent(draft.email_subject)}&body=${encodeURIComponent(draft.email_message)}`}
                  className={buttonClass("outline")}
                >
                  Open email draft
                </a>
              ) : null}
              {!isClosed(draft) && draft.phone && draft.whatsapp_message ? (
                <a
                  href={`https://wa.me/${draft.phone.replace(/\D/g, "")}?text=${encodeURIComponent(draft.whatsapp_message)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass("outline")}
                >
                  Open WhatsApp draft
                </a>
              ) : null}
            </div>
          </Card>
          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="font-bold">Demo & next step</h2>
              {safeExternalUrl(draft.demo_url) ? (
                <a
                  href={draft.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-700"
                >
                  Open saved demo <ExternalLink className="size-4" />
                </a>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Create a review link from the demo, or add an existing
                  deployment URL.
                </p>
              )}
              <Field
                label="Demo link"
                type="url"
                value={draft.demo_url}
                onChange={(value) => edit({ demo_url: value })}
                disabled={locked}
              />
              <Field
                label="Package price (optional)"
                value={draft.package_price}
                onChange={(value) => edit({ package_price: value })}
                disabled={locked}
              />
              <Field
                label="Next follow-up"
                type="date"
                value={draft.next_follow_up_at?.slice(0, 10) || ""}
                onChange={(value) =>
                  edit({
                    next_follow_up_at: value ? `${value}T12:00:00.000Z` : null,
                  })
                }
                disabled={locked || isClosed(draft)}
              />
              <Button
                className="mt-5 w-full"
                disabled={locked || isClosed(draft)}
                onClick={() => {
                  if (
                    window.confirm(
                      "Have you sent the message? This records contact and does not send anything.",
                    )
                  )
                    void persist(
                      mergeProspect(draft, {
                        sales_stage: "contacted",
                        outreach_status: "contacted",
                        last_contacted_at: new Date().toISOString(),
                        next_follow_up_at:
                          draft.next_follow_up_at ||
                          new Date(Date.now() + 3 * 86400000).toISOString(),
                      }),
                    );
                }}
              >
                Mark contacted
              </Button>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Respect declines and opt-outs. Use the sales stage above to stop
                future outreach.
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="font-bold">Keep the message specific</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Mention one verified observation, explain the concept, and ask
                for one clear next step. Review every claim before sending.
              </p>
              <Link
                href={`/prospects/${draft.id}/advanced`}
                className="mt-4 inline-block text-sm font-semibold text-brand-700"
              >
                More outreach tools
              </Link>
            </Card>
          </aside>
        </div>
      ) : null}
      {tab === "history" ? (
        persisted ? (
          <>
            <WorkspaceHistory
              prospectId={draft.id}
              revision={current?.revision ?? 0}
              onRestore={saveHtml}
            />
            <details className="rounded-xl border border-red-100 p-5">
              <summary className="cursor-pointer text-sm font-bold text-red-700">
                Delete this business
              </summary>
              <p className="mt-3 text-sm text-slate-600">
                This permanently deletes its saved versions, review links, and
                feedback.
              </p>
              <Button
                variant="danger"
                className="mt-4"
                onClick={() =>
                  void act("Deleting business", async () => {
                    if (
                      !window.confirm(
                        `Permanently delete ${draft.business_name} and its workspace history?`,
                      )
                    )
                      return;
                    await deleteProspect(draft.id);
                    setDirty(false);
                    router.push("/prospects");
                  })
                }
              >
                Delete business
              </Button>
            </details>
          </>
        ) : (
          <EmptyState
            icon={<Save />}
            title="Save your business first"
            description="Your activity and website versions will appear here after saving."
            action={
              <Button onClick={() => void persist(draft)}>Save business</Button>
            }
          />
        )
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  disabled = false,
  type = "text",
  maxLength = 4000,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  disabled?: boolean;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="mt-4 block">
      <span className="field-label">{label}</span>
      {multiline ? (
        <textarea
          className="field-input min-h-28"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          maxLength={maxLength}
        />
      ) : (
        <input
          className="field-input"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          maxLength={maxLength}
        />
      )}
    </label>
  );
}
