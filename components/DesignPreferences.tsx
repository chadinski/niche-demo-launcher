"use client";

import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import Select, { type SingleValue } from "react-select";

export type DesignPreferenceValues = {
  primary: string;
  secondary: string;
  headingFont: string;
  bodyFont: string;
  mood: "Professional" | "Playful" | "Minimal" | "Luxury";
};

type DesignPreferencesProps = {
  onChange: (preferences: DesignPreferenceValues) => void;
};

type SelectOption = {
  label: string;
  value: string;
};

const STORAGE_KEY = "niche-demo-launcher-design-preferences";

const fontOptions: SelectOption[] = [
  { label: "Inter", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Playfair Display", value: '"Playfair Display", Georgia, serif' },
  { label: "Cormorant Garamond", value: '"Cormorant Garamond", Georgia, serif' },
  { label: "Montserrat", value: "Montserrat, ui-sans-serif, system-ui, sans-serif" },
  { label: "Poppins", value: "Poppins, ui-sans-serif, system-ui, sans-serif" },
  { label: "Lora", value: "Lora, Georgia, serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif" },
  { label: "Oswald", value: "Oswald, ui-sans-serif, system-ui, sans-serif" },
  { label: "Raleway", value: "Raleway, ui-sans-serif, system-ui, sans-serif" },
  { label: "DM Sans", value: '"DM Sans", ui-sans-serif, system-ui, sans-serif' },
  { label: "Source Serif 4", value: '"Source Serif 4", Georgia, serif' },
  { label: "Space Grotesk", value: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif' },
];

const moodOptions: SelectOption[] = [
  { label: "Professional", value: "Professional" },
  { label: "Playful", value: "Playful" },
  { label: "Minimal", value: "Minimal" },
  { label: "Luxury", value: "Luxury" },
];

const defaultPreferences: DesignPreferenceValues = {
  primary: process.env.NEXT_PUBLIC_DEFAULT_PRIMARY_COLOR || "#2B5E8C",
  secondary: process.env.NEXT_PUBLIC_DEFAULT_SECONDARY_COLOR || "#F4A261",
  headingFont: fontOptions[0].value,
  bodyFont: fontOptions[0].value,
  mood: "Professional",
};

function optionForValue(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value) ?? options[0];
}

function isDesignPreferenceValues(value: unknown): value is DesignPreferenceValues {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.primary === "string" &&
    typeof candidate.secondary === "string" &&
    typeof candidate.headingFont === "string" &&
    typeof candidate.bodyFont === "string" &&
    typeof candidate.mood === "string"
  );
}

export function DesignPreferences({ onChange }: DesignPreferencesProps) {
  const [preferences, setPreferences] = useState<DesignPreferenceValues>(defaultPreferences);
  const hasLoaded = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as unknown;
        if (isDesignPreferenceValues(parsed)) {
          queueMicrotask(() => {
            setPreferences(parsed);
            hasLoaded.current = true;
          });
          return;
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      onChange(defaultPreferences);
    }
    hasLoaded.current = true;
  }, [onChange]);

  useEffect(() => {
    if (!hasLoaded.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    onChange(preferences);
  }, [onChange, preferences]);

  const updatePreferences = (patch: Partial<DesignPreferenceValues>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  };

  return (
    <section className="rounded-2xl border border-[#e7e8ee] bg-white p-4 shadow-sm sm:p-5">
      <div>
        <p className="text-[0.65rem] font-bold tracking-[0.14em] text-brand-600 uppercase">
          Design preferences
        </p>
        <h3 className="mt-1 text-sm font-extrabold tracking-[-0.025em] text-ink-950">
          Visual direction for this generation
        </h3>
        <p className="mt-1 text-xs leading-5 text-[#7b8294]">
          These choices guide the website generator without replacing the extracted business identity.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ColorControl
          label="Primary"
          value={preferences.primary}
          onChange={(primary) => updatePreferences({ primary })}
        />
        <ColorControl
          label="Secondary"
          value={preferences.secondary}
          onChange={(secondary) => updatePreferences({ secondary })}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Heading font</span>
          <Select
            instanceId="heading-font-select"
            classNamePrefix="design-select"
            options={fontOptions}
            value={optionForValue(fontOptions, preferences.headingFont)}
            onChange={(option: SingleValue<SelectOption>) =>
              option && updatePreferences({ headingFont: option.value })
            }
          />
        </label>
        <label>
          <span className="field-label">Body font</span>
          <Select
            instanceId="body-font-select"
            classNamePrefix="design-select"
            options={fontOptions}
            value={optionForValue(fontOptions, preferences.bodyFont)}
            onChange={(option: SingleValue<SelectOption>) =>
              option && updatePreferences({ bodyFont: option.value })
            }
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="field-label">Mood</span>
        <select
          className="field-input"
          value={preferences.mood}
          onChange={(event) =>
            updatePreferences({ mood: event.target.value as DesignPreferenceValues["mood"] })
          }
        >
          {moodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="field-label mb-0">{label} color</span>
        <span
          className="rounded-full border border-[#e4e6ee] px-2 py-1 font-mono text-[0.68rem] font-bold text-[#677084]"
          style={{ backgroundColor: value, color: "#fff" }}
        >
          {value}
        </span>
      </div>
      <div className="rounded-2xl border border-[#e8e9ef] bg-[#fafafd] p-3">
        <HexColorPicker color={value} onChange={onChange} className="!h-36 !w-full" />
      </div>
      <input
        className="field-input mt-2 font-mono text-xs"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`${label} color hex value`}
      />
    </div>
  );
}
