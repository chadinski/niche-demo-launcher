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

export function SettingsForm() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("niche-demo-launcher-settings");
      if (saved) queueMicrotask(() => setSettings(JSON.parse(saved)));
    } catch {
      // Defaults remain available.
    }
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const save = () => {
    localStorage.setItem("niche-demo-launcher-settings", JSON.stringify(settings));
    toast.success("Settings saved");
  };

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Workspace configuration"
        title="Settings"
        description="Set the sender identity, pricing defaults, compliance details, and optional service integrations used across the launcher."
        action={<Button onClick={save}><Save className="size-4" /> Save Settings</Button>}
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
            <SettingsHeader icon={<Bot className="size-4" />} title="Generation defaults" description="Applied when a new demo workspace is created." />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SettingField label="Default package price" value={settings.defaultPackagePrice} onChange={(value) => update("defaultPackagePrice", value)} />
              <SettingField label="Default currency" value={settings.defaultCurrency} onChange={(value) => update("defaultCurrency", value)} />
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
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SettingsHeader icon={<KeyRound className="size-4" />} title="AI configuration" description="Server-side secrets belong in Vercel environment variables." />
            <div className="mt-6">
              <label>
                <span className="field-label">OpenAI API key</span>
                <input className="field-input" type="password" value="" disabled placeholder="Configure OPENAI_API_KEY in .env.local or Vercel" />
              </label>
              <p className="mt-3 text-xs leading-5 text-[#858b9d]">
                The app uses strong local mock generation when no key is configured. API keys are never stored in browser settings.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-8">
          <Card className="p-5">
            <SettingsHeader icon={<ShieldCheck className="size-4" />} title="Supabase" description="Authentication, CRM records, templates, and activity logs." />
            <div className="mt-5 space-y-3">
              <IntegrationRow label="Project URL" variable="NEXT_PUBLIC_SUPABASE_URL" />
              <IntegrationRow label="Anon key" variable="NEXT_PUBLIC_SUPABASE_ANON_KEY" />
              <IntegrationRow label="Service role" variable="SUPABASE_SERVICE_ROLE_KEY" privateValue />
            </div>
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              Without Supabase variables, the launcher runs in local demo mode using browser storage.
            </div>
          </Card>

          <Card className="p-5">
            <SettingsHeader icon={<Triangle className="size-4" />} title="Vercel" description="Deployment automation placeholder for a later version." />
            <div className="mt-5 rounded-xl border border-dashed border-[#dcdde6] bg-[#fafafd] p-4 text-center">
              <p className="text-sm font-bold">Not connected</p>
              <p className="mt-1 text-xs leading-5 text-[#858b9d]">Generated HTML can be downloaded and deployed manually today.</p>
              <Button variant="outline" className="mt-4" disabled>Connect Vercel</Button>
            </div>
          </Card>

          <Card className="p-5">
            <SettingsHeader icon={<GitFork className="size-4" />} title="GitHub" description="Repository publishing placeholder for a later version." />
            <div className="mt-5 rounded-xl border border-dashed border-[#dcdde6] bg-[#fafafd] p-4 text-center">
              <p className="text-sm font-bold">Not connected</p>
              <p className="mt-1 text-xs leading-5 text-[#858b9d]">No repository access or automatic publishing is enabled.</p>
              <Button variant="outline" className="mt-4" disabled>Connect GitHub</Button>
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
  privateValue,
}: {
  label: string;
  variable: string;
  privateValue?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e8e9ef] bg-[#fafafd] p-3">
      <span className="grid size-8 place-items-center rounded-lg bg-white text-emerald-600 shadow-sm">
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
