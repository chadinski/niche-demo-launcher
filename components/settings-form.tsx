"use client";

import {
  Bot,
  CheckCircle2,
  GitFork,
  KeyRound,
  Save,
  Settings2,
  ShieldCheck,
  Triangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAutomationStatus } from "@/app/deployment-actions";
import { upsertSettings, type SettingsResult } from "@/app/settings/actions";
import { PageHeading } from "@/components/page-heading";
import { Button, Card } from "@/components/ui";
import { DEFAULT_SETTINGS } from "@/lib/mock-data";
import type { AppSettings, MessageTone } from "@/lib/types";

const tones: MessageTone[] = [
  "Friendly",
  "Direct",
  "Premium",
  "Soft sell",
  "Confident",
  "Local business friendly",
];

export function SettingsForm({
  initialSettings = DEFAULT_SETTINGS,
  initialPersistenceMode = "local-demo",
}: {
  initialSettings?: AppSettings;
  initialPersistenceMode?: SettingsResult["mode"];
}) {
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS, ...initialSettings });
  const [persistenceMode, setPersistenceMode] = useState<SettingsResult["mode"]>(initialPersistenceMode);
  const [saving, setSaving] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({
    ai: false,
    gemini: false,
    openai: false,
    supabase: false,
    github: false,
    vercel: false,
    deploymentReady: false,
    missing: [] as string[],
    githubMissing: [] as string[],
    supabaseMissing: [] as string[],
  });

  useEffect(() => {
    if (initialPersistenceMode === "remote") return;
    try {
      const saved = localStorage.getItem("niche-demo-launcher-settings");
      if (saved) queueMicrotask(() => setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }));
    } catch {
      // Defaults remain available.
    }
  }, [initialPersistenceMode]);

  useEffect(() => {
    void getAutomationStatus().then(setServiceStatus).catch(() => {
      // Settings still render when service status cannot be checked.
    });
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const result = await upsertSettings(settings);
      setPersistenceMode(result.mode);
      setSettings(result.settings);

      if (result.mode === "local-demo") {
        localStorage.setItem("niche-demo-launcher-settings", JSON.stringify(settings));
        toast.success("Settings saved locally for this development browser");
      } else {
        localStorage.removeItem("niche-demo-launcher-settings");
        toast.success("Settings saved to Supabase");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Settings could not be saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Workspace configuration"
        title="Settings"
        description="Set sender identity, pricing defaults, follow-up cadence, and server-side integration status for Seraphim."
        action={<Button onClick={save} loading={saving}><Save className="size-4" /> Save Settings</Button>}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <SettingsHeader icon={<Settings2 className="size-4" />} title="Company and sender" description="Used to personalize generated messages and signatures." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SettingField label="Company name" value={settings.companyName} onChange={(value) => update("companyName", value)} />
              <SettingField label="Sender name" value={settings.senderName} onChange={(value) => update("senderName", value)} />
              <SettingField label="Sender email" type="email" value={settings.senderEmail} onChange={(value) => update("senderEmail", value)} />
              <SettingField label="WhatsApp number" value={settings.whatsappNumber} onChange={(value) => update("whatsappNumber", value)} />
              <SettingField label="Company website" type="url" value={settings.website} onChange={(value) => update("website", value)} />
              <SettingField label="Physical mailing address" value={settings.mailingAddress} onChange={(value) => update("mailingAddress", value)} />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SettingsHeader icon={<Bot className="size-4" />} title="Generation defaults" description="Applied when a new website workspace is created." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SettingField label="Default package price" value={settings.defaultPackagePrice} onChange={(value) => update("defaultPackagePrice", value)} />
              <SettingField label="Default currency" value={settings.defaultCurrency} onChange={(value) => update("defaultCurrency", value)} />
              <SettingField label="Default follow-up cadence" value={settings.defaultFollowUpCadence} onChange={(value) => update("defaultFollowUpCadence", value)} />
              <label>
                <span className="field-label">Default message tone</span>
                <select className="field-input" value={settings.defaultTone} onChange={(event) => update("defaultTone", event.target.value as MessageTone)}>
                  {tones.map((tone) => <option key={tone}>{tone}</option>)}
                </select>
              </label>
              <label>
                <span className="field-label">Default website style</span>
                <select className="field-input" value={settings.defaultWebsiteStyle} onChange={(event) => update("defaultWebsiteStyle", event.target.value)}>
                  <option>Editorial premium</option>
                  <option>Modern local service</option>
                  <option>Quiet luxury</option>
                  <option>Bold commercial</option>
                  <option>Technical precision</option>
                </select>
              </label>
              <label>
                <span className="field-label">Deployment mode</span>
                <select className="field-input" value={settings.deploymentMode} onChange={(event) => update("deploymentMode", event.target.value as AppSettings["deploymentMode"])}>
                  <option value="manual">Manual download fallback</option>
                  <option value="automatic">Automatic GitHub + Vercel</option>
                </select>
              </label>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SettingsHeader icon={<KeyRound className="size-4" />} title="AI configuration" description="Server-side secrets belong in Vercel environment variables." />
            <div className="mt-6 space-y-3">
              <IntegrationRow label="Gemini API key" variable="GEMINI_API_KEY" configured={serviceStatus.gemini} privateValue />
              <IntegrationRow label="Extraction model" variable="EXTRACTION_MODEL" configured={serviceStatus.ai} privateValue />
              <IntegrationRow label="Planning model" variable="PLANNER_MODEL" configured={serviceStatus.ai} privateValue />
              <IntegrationRow label="Section model" variable="SECTION_MODEL" configured={serviceStatus.ai} privateValue />
              <IntegrationRow label="QA model" variable="QA_MODEL" configured={serviceStatus.ai} privateValue />
              <IntegrationRow label="Vision model" variable="VISION_MODEL" configured={serviceStatus.ai} privateValue />
              <IntegrationRow label="Fallback model" variable="FALLBACK_MODEL" configured={serviceStatus.ai} privateValue />
              <IntegrationRow label="OpenAI API key" variable="OPENAI_API_KEY" configured={serviceStatus.openai} privateValue />
              <p className="mt-3 text-xs leading-5 text-[#858b9d]">
                Model routing is stage-based and centralized server-side. API keys are never stored in browser settings.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-8">
          <Card className="p-5">
            <SettingsHeader icon={<ShieldCheck className="size-4" />} title="Supabase" description="Authentication, CRM records, generated sites, and activity logs." />
            <div className="mt-5 space-y-3">
              <IntegrationRow label="Project URL" variable="NEXT_PUBLIC_SUPABASE_URL" configured={serviceStatus.supabase} />
              <IntegrationRow label="Anon key" variable="NEXT_PUBLIC_SUPABASE_ANON_KEY" configured={serviceStatus.supabase} />
              <IntegrationRow label="Service role" variable="SUPABASE_SERVICE_ROLE_KEY" configured={serviceStatus.supabase} privateValue />
            </div>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              {serviceStatus.supabase
                ? `Supabase is enabled. Settings persistence mode: ${persistenceMode === "remote" ? "remote per-user settings" : "local development fallback"}.`
                : `Supabase is not enabled yet. Missing: ${serviceStatus.supabaseMissing.join(", ") || "Supabase variables"}. Local browser settings are allowed only in development.`}
            </div>
          </Card>

          <Card className="p-5">
            <SettingsHeader icon={<Triangle className="size-4" />} title="Vercel" description="Server-side deployment token status." />
            <div className="mt-5 space-y-3">
              <IntegrationRow label="Vercel token" variable="VERCEL_TOKEN" configured={serviceStatus.vercel} privateValue />
              <IntegrationRow label="Vercel team ID" variable="VERCEL_TEAM_ID" configured={serviceStatus.vercel} privateValue />
            </div>
          </Card>

          <Card className="p-5">
            <SettingsHeader icon={<GitFork className="size-4" />} title="GitHub" description="Repository publishing token status." />
            <div className="mt-5 space-y-3">
              <IntegrationRow label="GitHub token" variable="GITHUB_TOKEN" configured={serviceStatus.github} privateValue />
              <IntegrationRow label="GitHub owner" variable="GITHUB_OWNER" configured={serviceStatus.github} privateValue />
              <IntegrationRow label="Repo prefix" variable="GITHUB_REPO_PREFIX" configured={serviceStatus.github} privateValue />
            </div>
            <div className="mt-5 rounded-xl border border-dashed border-[#dcdde6] bg-[#fafafd] p-4 text-center">
              <p className="text-sm font-bold">{serviceStatus.deploymentReady ? "Vercel deployment ready" : "Vercel token required"}</p>
              <p className="mt-1 text-xs leading-5 text-[#858b9d]">
                {serviceStatus.deploymentReady
                  ? serviceStatus.github
                    ? "Demos can deploy to Vercel and archive index.html to GitHub."
                    : `Demos can deploy to Vercel. GitHub archive is optional and currently missing: ${serviceStatus.githubMissing.join(", ")}.`
                  : `Missing: ${serviceStatus.missing.join(", ") || "VERCEL_TOKEN"}. Manual download remains available.`}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <div>
        <h2 className="font-extrabold tracking-[-0.025em]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#858b9d]">{description}</p>
      </div>
    </div>
  );
}

function SettingField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <input className="field-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function IntegrationRow({
  label,
  variable,
  configured = false,
  privateValue,
}: {
  label: string;
  variable: string;
  configured?: boolean;
  privateValue?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e8e9ef] bg-[#fafafd] p-3">
      <span className={`grid size-8 place-items-center rounded-lg bg-white shadow-sm ${configured ? "text-emerald-600" : "text-amber-600"}`}>
        <CheckCircle2 className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-bold">{label}</div>
        <div className="mt-0.5 truncate font-mono text-[0.65rem] text-[#8b91a2]">
          {privateValue ? "Server-only · " : ""}{variable}
        </div>
      </div>
    </div>
  );
}
