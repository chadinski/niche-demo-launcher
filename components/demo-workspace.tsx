"use client";

import {
  Check,
  ChevronDown,
  Clipboard,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Globe2,
  Mail,
  MessageCircle,
  MousePointerClick,
  Save,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";
import { PageHeading } from "@/components/page-heading";
import { Button, Card, SectionLabel } from "@/components/ui";
import { useProspects } from "@/components/prospect-provider";
import {
  emptyBusinessInfo,
  generateSalesMessages,
  generateWebsiteHTML,
  generatedNames,
  parseBusinessInfo,
} from "@/lib/generators";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import type {
  BusinessInfo,
  MessageTone,
  Prospect,
  SalesMessages,
} from "@/lib/types";
import { cn, phoneDigits } from "@/lib/utils";

const TONES: MessageTone[] = [
  "Friendly",
  "Direct",
  "Premium",
  "Soft sell",
  "Confident",
  "Local business friendly",
];

const messageTabs: Array<{ key: keyof SalesMessages; label: string }> = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "dm", label: "DM" },
  { key: "followUp", label: "Follow-up" },
  { key: "finalFollowUp", label: "Final follow-up" },
];

type BusyAction = "parse" | "website" | "message" | "both" | "save" | null;

export function DemoWorkspace() {
  const { saveProspect, setStatus } = useProspects();
  const [info, setInfo] = useState<BusinessInfo>(() => emptyBusinessInfo());
  const [html, setHtml] = useState("");
  const [messages, setMessages] = useState<SalesMessages | null>(null);
  const [tone, setTone] = useState<MessageTone>("Friendly");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [outputTab, setOutputTab] = useState<"preview" | "code">("preview");
  const [messageTab, setMessageTab] = useState<keyof SalesMessages>("whatsapp");
  const [prospectId, setProspectId] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const names = useMemo(() => generatedNames(info), [info]);

  const updateInfo = useCallback(
    (key: keyof BusinessInfo, value: string) => {
      const nextInfo = { ...info, [key]: value };
      setInfo(nextInfo);
      if (key === "demoUrl" && messages) {
        setMessages(generateSalesMessages(nextInfo, tone, DEFAULT_SETTINGS));
      }
    },
    [info, messages, tone],
  );

  const runAction = async (action: BusyAction, work: () => void, success: string) => {
    setBusy(action);
    await new Promise((resolve) => window.setTimeout(resolve, 420));
    work();
    setBusy(null);
    toast.success(success);
  };

  const handleParse = () =>
    runAction(
      "parse",
      () => {
        const parsed = parseBusinessInfo(info.rawInfo);
        setInfo((current) => ({ ...current, ...parsed }));
      },
      "Business details extracted",
    );

  const handleGenerateWebsite = () =>
    runAction(
      "website",
      () => {
        setHtml(generateWebsiteHTML(info));
        setOutputTab("preview");
      },
      "Premium website concept generated",
    );

  const handleGenerateMessages = () =>
    runAction(
      "message",
      () => setMessages(generateSalesMessages(info, tone, DEFAULT_SETTINGS)),
      "Outreach messages generated",
    );

  const handleGenerateBoth = () =>
    runAction(
      "both",
      () => {
        setHtml(generateWebsiteHTML(info));
        setMessages(generateSalesMessages(info, tone, DEFAULT_SETTINGS));
        setOutputTab("preview");
      },
      "Website and outreach kit generated",
    );

  const buildProspect = (): Prospect => {
    const now = new Date().toISOString();
    return {
      id: prospectId ?? crypto.randomUUID(),
      business_name: info.businessName || "Untitled prospect",
      category: info.category,
      location: info.location,
      phone: info.phone,
      email: info.email,
      website_url: info.websiteUrl,
      social_url: info.socialUrl,
      pasted_raw_info: info.rawInfo,
      extracted_summary: [
        info.businessName,
        info.category,
        info.location,
        info.services && `Services: ${info.services}`,
      ]
        .filter(Boolean)
        .join(". "),
      package_price: info.packagePrice,
      generated_website_html: html,
      demo_url: info.demoUrl,
      whatsapp_message: messages?.whatsapp ?? "",
      email_subject: messages?.emailSubject ?? "",
      email_message: messages?.email ?? "",
      dm_message: messages?.dm ?? "",
      outreach_status: "not_sent",
      notes: info.notes,
      created_at: now,
      updated_at: now,
      last_contacted_at: null,
      next_follow_up_at: null,
    };
  };

  const handleSave = () =>
    runAction(
      "save",
      () => {
        const prospect = buildProspect();
        saveProspect(prospect);
        setProspectId(prospect.id);
      },
      prospectId ? "Prospect updated" : "Prospect saved",
    );

  const copyText = async (value: string, label: string) => {
    if (!value) {
      toast.error(`Generate or add ${label.toLowerCase()} first`);
      return;
    }
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const downloadHtml = () => {
    if (!html) {
      toast.error("Generate the website first");
      return;
    }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "index.html";
    anchor.click();
    URL.revokeObjectURL(href);
    toast.success("index.html downloaded");
  };

  const openWhatsApp = () => {
    const phone = phoneDigits(info.phone);
    if (!phone || !messages?.whatsapp) {
      toast.error("Add a phone number and generate the WhatsApp message first");
      return;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(messages.whatsapp)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const openEmail = () => {
    if (!info.email || !messages?.email) {
      toast.error("Add an email address and generate the email first");
      return;
    }
    window.location.href = `mailto:${info.email}?subject=${encodeURIComponent(messages.emailSubject)}&body=${encodeURIComponent(messages.email)}`;
  };

  const markSent = () => {
    if (!prospectId) {
      const prospect = buildProspect();
      saveProspect({ ...prospect, outreach_status: "sent", last_contacted_at: new Date().toISOString() });
      setProspectId(prospect.id);
    } else {
      setStatus(prospectId, "sent");
    }
    setConfirmSent(false);
    toast.success("Outreach marked as sent");
  };

  const activeMessage = messages?.[messageTab] ?? "";

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Demo workspace"
        title="Create a new website demo"
        description="Paste what you have, shape the facts, generate the private concept, then prepare outreach for manual approval."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSave} loading={busy === "save"}>
              <Save className="size-4" />
              Save Prospect
            </Button>
            <Button onClick={handleGenerateBoth} loading={busy === "both"}>
              <WandSparkles className="size-4" />
              Generate Website + Message
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["01", "Paste and parse", "Drop in messy business information."],
          ["02", "Generate and review", "Create the site and personalized copy."],
          ["03", "Deploy and contact", "Add the URL, approve, then open a draft."],
        ].map(([number, title, text], index) => (
          <div
            key={number}
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4",
              index === 0 ? "border-brand-200 bg-brand-50/60" : "border-[#e7e8ef] bg-white",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-xs font-extrabold text-brand-700 shadow-sm">
              {number}
            </span>
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="mt-0.5 text-xs text-[#858b9d]">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(380px,.75fr)_minmax(0,1.25fr)]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionLabel>Source information</SectionLabel>
                <h2 className="mt-2 text-xl font-extrabold tracking-[-0.035em]">Paste business info</h2>
                <p className="mt-1 text-xs leading-5 text-[#7f8597]">
                  Paste a profile, listing, notes, or mixed contact details. You can correct every field.
                </p>
              </div>
              <Clipboard className="size-5 text-[#a3a8b7]" />
            </div>
            <label className="mt-5 block">
              <span className="sr-only">Paste business information</span>
              <textarea
                className="field-input min-h-56 resize-y leading-6"
                value={info.rawInfo}
                onChange={(event) => updateInfo("rawInfo", event.target.value)}
                placeholder={"Example:\nBusiness: North Coast Auto Care\nLocation: St. Ann\nWhatsApp: +1 876...\nServices: diagnostics, brakes, servicing\nInstagram: https://..."}
              />
            </label>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={handleParse}
              loading={busy === "parse"}
              disabled={!info.rawInfo.trim()}
            >
              <Sparkles className="size-4 text-brand-600" />
              Parse Business Info
            </Button>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeader
              icon={<FileCode2 className="size-4" />}
              title="Business profile"
              description="Only verified details should become visible claims."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Business name" value={info.businessName} onChange={(value) => updateInfo("businessName", value)} />
              <Field label="Business category" value={info.category} onChange={(value) => updateInfo("category", value)} />
              <Field label="Location" value={info.location} onChange={(value) => updateInfo("location", value)} />
              <Field label="Phone / WhatsApp" value={info.phone} onChange={(value) => updateInfo("phone", value)} />
              <Field label="Email" type="email" value={info.email} onChange={(value) => updateInfo("email", value)} />
              <Field label="Existing website" type="url" value={info.websiteUrl} onChange={(value) => updateInfo("websiteUrl", value)} />
              <Field label="Social media link" type="url" value={info.socialUrl} onChange={(value) => updateInfo("socialUrl", value)} />
              <Field label="Brand colors" value={info.brandColors} onChange={(value) => updateInfo("brandColors", value)} placeholder="#4f46e5, #14b8a6" />
            </div>
            <div className="mt-4 space-y-4">
              <TextField label="Services / products" value={info.services} onChange={(value) => updateInfo("services", value)} />
              <TextField label="Observed opportunity / pain point" value={info.painPoints} onChange={(value) => updateInfo("painPoints", value)} />
              <TextField label="Internal notes" value={info.notes} onChange={(value) => updateInfo("notes", value)} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Package price" value={info.packagePrice} onChange={(value) => updateInfo("packagePrice", value)} />
              <Field label="Live demo URL" type="url" value={info.demoUrl} onChange={(value) => updateInfo("demoUrl", value)} placeholder="https://demo.vercel.app" />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeader
              icon={<MousePointerClick className="size-4" />}
              title="Generate"
              description="Mock generation works without an API key."
            />
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={handleGenerateWebsite} loading={busy === "website"}>
                <Globe2 className="size-4" />
                Generate Website
              </Button>
              <Button variant="outline" onClick={handleGenerateMessages} loading={busy === "message"}>
                <MessageCircle className="size-4" />
                Generate Sales Message
              </Button>
              <Button className="sm:col-span-2" onClick={handleGenerateBoth} loading={busy === "both"}>
                <WandSparkles className="size-4" />
                Generate Website + Message
              </Button>
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-5 2xl:sticky 2xl:top-8">
          <Card className="overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e9eaf0] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div>
                <SectionLabel>Website generator output</SectionLabel>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.035em]">Private website concept</h2>
              </div>
              <div className="flex rounded-xl bg-[#f1f1f5] p-1">
                <TabButton active={outputTab === "preview"} onClick={() => setOutputTab("preview")}>
                  <Globe2 className="size-3.5" /> Preview
                </TabButton>
                <TabButton active={outputTab === "code"} onClick={() => setOutputTab("code")}>
                  <Code2 className="size-3.5" /> HTML
                </TabButton>
              </div>
            </div>

            {html ? (
              <>
                {outputTab === "preview" ? (
                  <div className="bg-[#ececf2] p-3 sm:p-5">
                    <div className="overflow-hidden rounded-xl border border-[#dfe0e7] bg-white shadow-[0_16px_40px_rgba(21,26,45,.12)]">
                      <div className="flex h-10 items-center gap-2 border-b border-[#ececf2] bg-white px-4">
                        <span className="size-2.5 rounded-full bg-red-400" />
                        <span className="size-2.5 rounded-full bg-amber-400" />
                        <span className="size-2.5 rounded-full bg-emerald-400" />
                        <div className="ml-2 flex-1 truncate rounded-md bg-[#f4f4f7] px-3 py-1 text-center text-[0.65rem] text-[#8a90a2]">
                          {info.demoUrl || `${names.project}.vercel.app`}
                        </div>
                      </div>
                      <iframe
                        title="Generated website preview"
                        srcDoc={html}
                        sandbox=""
                        className="h-[620px] w-full bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <pre className="scrollbar-thin max-h-[670px] overflow-auto bg-[#161a2b] p-5 text-xs leading-6 text-[#dce0f0]">
                    <code>{html}</code>
                  </pre>
                )}
                <div className="grid gap-3 border-t border-[#e9eaf0] p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end sm:p-5">
                  <div>
                    <label className="field-label" htmlFor="demo-url-output">Live demo URL</label>
                    <input
                      id="demo-url-output"
                      type="url"
                      className="field-input"
                      value={info.demoUrl}
                      onChange={(event) => updateInfo("demoUrl", event.target.value)}
                      placeholder="Paste the deployed Vercel link"
                    />
                  </div>
                  <Button variant="outline" onClick={() => copyText(html, "Website HTML")}>
                    <Copy className="size-4" />
                    Copy HTML
                  </Button>
                  <Button variant="secondary" onClick={downloadHtml}>
                    <Download className="size-4" />
                    Download
                  </Button>
                </div>
                <div className="grid gap-2 border-t border-[#eff0f4] bg-[#fafafd] px-5 py-4 text-xs sm:grid-cols-3">
                  <OutputName label="Folder" value={names.folder} />
                  <OutputName label="Vercel project" value={names.project} />
                  <OutputName label="File" value={names.file} />
                </div>
              </>
            ) : (
              <div className="grid min-h-[520px] place-items-center px-6 py-14 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Globe2 className="size-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em]">Your preview will appear here</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7a8194]">
                    Add the business details, then generate a complete single-file website with private demo metadata.
                  </p>
                  <Button className="mt-5" onClick={handleGenerateWebsite} loading={busy === "website"}>
                    <Sparkles className="size-4" />
                    Generate Website
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col justify-between gap-4 border-b border-[#e9eaf0] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <div>
                <SectionLabel>Sales message generator</SectionLabel>
                <h2 className="mt-1 text-lg font-extrabold tracking-[-0.035em]">Personalized outreach</h2>
              </div>
              <label className="relative">
                <span className="sr-only">Message tone</span>
                <select
                  className="field-input min-h-10 appearance-none py-2 pr-9 text-xs font-semibold"
                  value={tone}
                  onChange={(event) => {
                    const nextTone = event.target.value as MessageTone;
                    setTone(nextTone);
                    if (messages) setMessages(generateSalesMessages(info, nextTone, DEFAULT_SETTINGS));
                  }}
                >
                  {TONES.map((option) => <option key={option}>{option}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#8a90a2]" />
              </label>
            </div>
            <div className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-[#e9eaf0] px-3 pt-3 sm:px-5">
              {messageTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={cn(
                    "border-b-2 px-3 py-2.5 text-xs font-bold whitespace-nowrap",
                    messageTab === tab.key
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-[#858b9c] hover:text-ink-950",
                  )}
                  onClick={() => setMessageTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {messages ? (
              <>
                {messageTab === "email" ? (
                  <div className="border-b border-[#eff0f4] px-5 py-3 text-xs">
                    <span className="font-bold text-[#656c7f]">Subject:</span>{" "}
                    <span className="text-[#777e90]">{messages.emailSubject}</span>
                    <button
                      type="button"
                      className="ml-2 font-bold text-brand-600"
                      onClick={() => copyText(messages.emailSubject, "Email subject")}
                    >
                      Copy
                    </button>
                  </div>
                ) : null}
                <textarea
                  className="scrollbar-thin min-h-64 w-full resize-y border-0 bg-white p-5 text-sm leading-6 text-[#3f4659] outline-none sm:p-6"
                  value={activeMessage}
                  onChange={(event) =>
                    setMessages((current) =>
                      current ? { ...current, [messageTab]: event.target.value } : current,
                    )
                  }
                  aria-label={`${messageTabs.find((tab) => tab.key === messageTab)?.label} message`}
                />
                <div className="flex flex-wrap gap-2 border-t border-[#e9eaf0] p-4 sm:p-5">
                  <Button variant="outline" onClick={() => copyText(activeMessage, "Sales message")}>
                    <Copy className="size-4" />
                    Copy Message
                  </Button>
                  <Button variant="outline" onClick={() => copyText(info.demoUrl, "Demo link")}>
                    <ExternalLink className="size-4" />
                    Copy Demo Link
                  </Button>
                  <Button variant="outline" onClick={openWhatsApp}>
                    <MessageCircle className="size-4" />
                    Open WhatsApp
                  </Button>
                  <Button variant="outline" onClick={openEmail}>
                    <Mail className="size-4" />
                    Open Email Draft
                  </Button>
                  <Button variant="secondary" className="sm:ml-auto" onClick={() => setConfirmSent(true)}>
                    <Send className="size-4" />
                    Mark as Sent
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
                <div>
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-mint-50 text-emerald-600">
                    <MessageCircle className="size-5" />
                  </div>
                  <h3 className="mt-4 font-extrabold tracking-[-0.025em]">No messages generated yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7a8194]">
                    Create channel-specific outreach with a clear concept disclosure and no fake urgency.
                  </p>
                  <Button variant="outline" className="mt-5" onClick={handleGenerateMessages} loading={busy === "message"}>
                    <Sparkles className="size-4" />
                    Generate Sales Messages
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="sticky bottom-3 z-20 flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_18px_60px_rgba(21,26,45,.16)] backdrop-blur-xl sm:flex-row sm:items-center">
        <div className="hidden flex-1 items-center gap-2 px-2 text-xs text-[#72798c] sm:flex">
          <Check className="size-4 text-emerald-600" />
          Manual approval remains required before sending any outreach.
        </div>
        <Button variant="outline" onClick={handleSave} loading={busy === "save"}>
          <Save className="size-4" />
          Save Prospect
        </Button>
        <Button onClick={handleGenerateBoth} loading={busy === "both"}>
          <WandSparkles className="size-4" />
          Generate Website + Message
        </Button>
      </div>

      <ConfirmModal
        open={confirmSent}
        title="Mark this outreach as sent?"
        description="This only updates the prospect status. Niche Demo Launcher does not send messages automatically."
        confirmLabel="Mark as sent"
        onCancel={() => setConfirmSent(false)}
        onConfirm={markSent}
      />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div>
        <h2 className="font-extrabold tracking-[-0.025em]">{title}</h2>
        <p className="mt-1 text-xs text-[#858b9d]">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <textarea
        className="field-input min-h-24 resize-y"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold",
        active ? "bg-white text-ink-950 shadow-sm" : "text-[#7c8294]",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function OutputName({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[0.65rem] font-bold tracking-[0.12em] text-[#9a9faf] uppercase">{label}</div>
      <div className="mt-1 truncate font-mono text-[0.72rem] text-[#50576b]">{value}</div>
    </div>
  );
}
