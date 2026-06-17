"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_PROSPECTS } from "@/lib/mock-data";
import type { LeadTemperature, OutreachStatus, Prospect } from "@/lib/types";
import {
  listProspects,
  patchProspect,
  upsertProspect,
} from "@/app/data-actions";

const STORAGE_KEY = "niche-demo-launcher-prospects";

const legacyStatusMap: Record<string, OutreachStatus> = {
  not_sent: "new",
  sent: "contacted",
  follow_up: "follow_up_due",
};

function normalizeStatus(status: string): OutreachStatus {
  if (legacyStatusMap[status]) return legacyStatusMap[status];
  return status as OutreachStatus;
}

function normalizeTemperature(value: unknown): LeadTemperature {
  return value === "Hot" || value === "Warm" || value === "Cold" ? value : "Cold";
}

function normalizeProspect(prospect: Prospect): Prospect {
  const status = normalizeStatus(prospect.outreach_status as string);
  return {
    ...prospect,
    outreach_status: status,
    source: prospect.source ?? "",
    deal_value: prospect.deal_value ?? prospect.package_price ?? "",
    lead_score: prospect.lead_score ?? 0,
    lead_temperature: normalizeTemperature(prospect.lead_temperature),
    lead_score_explanation: prospect.lead_score_explanation ?? "",
    recommended_sales_angle: prospect.recommended_sales_angle ?? "",
    business_intelligence: prospect.business_intelligence ?? null,
    website_quality_audit: prospect.website_quality_audit ?? null,
    facebook_message: prospect.facebook_message ?? "",
    follow_up_1_message: prospect.follow_up_1_message ?? "",
    follow_up_2_message: prospect.follow_up_2_message ?? "",
    final_check_in_message: prospect.final_check_in_message ?? "",
    follow_up_count: prospect.follow_up_count ?? 0,
  };
}

interface ProspectContextValue {
  prospects: Prospect[];
  hydrated: boolean;
  saveProspect: (prospect: Prospect) => void;
  updateProspect: (id: string, patch: Partial<Prospect>) => void;
  getProspect: (id: string) => Prospect | undefined;
  setStatus: (id: string, status: OutreachStatus) => void;
}

const ProspectContext = createContext<ProspectContextValue | null>(null);

export function ProspectProvider({ children }: { children: ReactNode }) {
  const [prospects, setProspects] = useState<Prospect[]>(MOCK_PROSPECTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const remote = await listProspects();
        if (!active) return;
        if (remote.configured) {
          setProspects(remote.data.map(normalizeProspect));
        } else {
          const stored = window.localStorage.getItem(STORAGE_KEY);
          if (stored) setProspects((JSON.parse(stored) as Prospect[]).map(normalizeProspect));
        }
      } catch {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && active) setProspects((JSON.parse(stored) as Prospect[]).map(normalizeProspect));
      } finally {
        if (active) setHydrated(true);
      }
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
  }, [hydrated, prospects]);

  const saveProspect = useCallback((prospect: Prospect) => {
    setProspects((current) => {
      const existingIndex = current.findIndex((item) => item.id === prospect.id);
      if (existingIndex === -1) return [prospect, ...current];
      return current.map((item) => (item.id === prospect.id ? prospect : item));
    });
    void upsertProspect(prospect).catch(() => {
      // Local storage remains the offline fallback when remote persistence fails.
    });
  }, []);

  const updateProspect = useCallback((id: string, patch: Partial<Prospect>) => {
    setProspects((current) =>
      current.map((prospect) =>
        prospect.id === id
          ? { ...prospect, ...patch, updated_at: new Date().toISOString() }
          : prospect,
      ),
    );
    void patchProspect(id, patch).catch(() => {
      // Keep the optimistic local update in offline or demo mode.
    });
  }, []);

  const getProspect = useCallback(
    (id: string) => prospects.find((prospect) => prospect.id === id),
    [prospects],
  );

  const setStatus = useCallback(
    (id: string, status: OutreachStatus) => {
      const now = new Date();
      updateProspect(id, {
        outreach_status: status,
        last_contacted_at:
          status === "contacted" || status === "replied" ? now.toISOString() : undefined,
      });
    },
    [updateProspect],
  );

  const value = useMemo(
    () => ({ prospects, hydrated, saveProspect, updateProspect, getProspect, setStatus }),
    [getProspect, hydrated, prospects, saveProspect, setStatus, updateProspect],
  );

  return <ProspectContext.Provider value={value}>{children}</ProspectContext.Provider>;
}

export function useProspects() {
  const context = useContext(ProspectContext);
  if (!context) throw new Error("useProspects must be used within ProspectProvider");
  return context;
}
