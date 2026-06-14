"use client";

import {
  Braces,
  Check,
  Copy,
  FileCode2,
  Mail,
  MessageCircle,
  Plus,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/page-heading";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const VARIABLES = [
  "{{business_name}}",
  "{{category}}",
  "{{location}}",
  "{{demo_url}}",
  "{{package_price}}",
  "{{website_issue}}",
  "{{sender_name}}",
  "{{company_name}}",
  "{{phone}}",
  "{{email}}",
];

const DEFAULT_TEMPLATES = [
  {
    id: "website",
    name: "Editorial premium website",
    type: "Website style",
    icon: FileCode2,
    content:
      "Create a private, responsive single-file website for {{business_name}}, a {{category}} business in {{location}}. Use a confident editorial layout, clear service hierarchy, honest credibility cues, and a direct contact CTA. Do not invent testimonials, awards, or statistics.",
  },
  {
    id: "whatsapp",
    name: "Friendly WhatsApp introduction",
    type: "WhatsApp",
    icon: MessageCircle,
    content:
      "Hi {{business_name}}, I noticed {{website_issue}}. I prepared a private website concept to show a clearer mobile experience and contact path: {{demo_url}}. The package starts at {{package_price}}. Would you be open to taking a quick look? - {{sender_name}}, {{company_name}}",
  },
  {
    id: "email",
    name: "Premium email outreach",
    type: "Email",
    icon: Mail,
    content:
      "Subject: Private website concept for {{business_name}}\n\nHi {{business_name}},\n\nI prepared a private concept based on the information available for your {{category}} business in {{location}}. The goal is to make the offer clearer and give customers an easier next step.\n\nPreview: {{demo_url}}\nPackage: {{package_price}}\n\nRegards,\n{{sender_name}}\n{{company_name}}",
  },
  {
    id: "followup",
    name: "Low-pressure follow-up",
    type: "Follow-up",
    icon: Check,
    content:
      "Hi {{business_name}}, just following up on the private website concept I shared: {{demo_url}}. No pressure at all; I would value your honest feedback when convenient.",
  },
];

export function TemplatesManager() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedId, setSelectedId] = useState(DEFAULT_TEMPLATES[0].id);
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("niche-demo-launcher-templates");
      if (saved) {
        const parsed = JSON.parse(saved) as typeof DEFAULT_TEMPLATES;
        queueMicrotask(() =>
          setTemplates(
            parsed.map((template) => ({
              ...template,
              icon:
                DEFAULT_TEMPLATES.find((item) => item.id === template.id)?.icon ??
                Braces,
            })),
          ),
        );
      }
    } catch {
      // Keep defaults when local storage is unavailable.
    }
  }, []);

  const updateSelected = (content: string) => {
    setTemplates((current) =>
      current.map((template) => (template.id === selected.id ? { ...template, content } : template)),
    );
  };

  const save = () => {
    localStorage.setItem("niche-demo-launcher-templates", JSON.stringify(templates));
    toast.success("Templates saved");
  };

  const insertVariable = (variable: string) => {
    updateSelected(`${selected.content}${selected.content.endsWith(" ") ? "" : " "}${variable}`);
  };

  const addTemplate = () => {
    const id = crypto.randomUUID();
    setTemplates((current) => [
      ...current,
      {
        id,
        name: "Untitled outreach template",
        type: "Custom",
        icon: Braces,
        content: "Hi {{business_name}}, ",
      },
    ]);
    setSelectedId(id);
  };

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Reusable systems"
        title="Templates"
        description="Maintain the website and outreach starting points that keep your workflow fast without making it generic."
        action={
          <Button onClick={addTemplate}>
            <Plus className="size-4" />
            New Template
          </Button>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-[#e9eaf0] px-5 py-4">
            <h2 className="font-extrabold tracking-[-0.025em]">Template library</h2>
            <p className="mt-1 text-xs text-[#858b9d]">{templates.length} reusable templates</p>
          </div>
          <div className="divide-y divide-[#eff0f4]">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-5 py-4 text-left",
                    selectedId === template.id ? "bg-brand-50/65" : "hover:bg-[#fafafd]",
                  )}
                  onClick={() => setSelectedId(template.id)}
                >
                  <span className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    selectedId === template.id ? "bg-white text-brand-600 shadow-sm" : "bg-[#f3f3f7] text-[#7c8294]",
                  )}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{template.name}</span>
                    <span className="mt-1 block text-[0.7rem] font-semibold text-[#9499aa]">{template.type}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[0.68rem] font-bold tracking-[0.14em] text-brand-600 uppercase">Template editor</p>
                <input
                  className="mt-1 w-full border-0 bg-transparent p-0 text-xl font-extrabold tracking-[-0.035em] outline-none"
                  value={selected.name}
                  onChange={(event) =>
                    setTemplates((current) =>
                      current.map((template) =>
                        template.id === selected.id ? { ...template, name: event.target.value } : template,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(selected.content).then(() => toast.success("Template copied"))}>
                  <Copy className="size-4" /> Copy
                </Button>
                <Button onClick={save}><Save className="size-4" /> Save Templates</Button>
              </div>
            </div>
            <textarea
              className="field-input mt-6 min-h-[430px] resize-y font-mono text-[0.82rem] leading-6"
              value={selected.content}
              onChange={(event) => updateSelected(event.target.value)}
            />
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Braces className="size-4" />
              </span>
              <div>
                <h2 className="font-extrabold tracking-[-0.025em]">Available variables</h2>
                <p className="mt-1 text-xs text-[#858b9d]">Click a variable to append it to the selected template.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {VARIABLES.map((variable) => (
                <button
                  key={variable}
                  type="button"
                  className="rounded-xl border border-[#dfe1e9] bg-[#fafafd] px-3 py-2 font-mono text-xs text-[#596075] hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  onClick={() => insertVariable(variable)}
                >
                  {variable}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
