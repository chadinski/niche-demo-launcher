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
import type { OutreachStatus, Prospect } from "@/lib/types";
import {
  listProspects,
  patchProspect,
  upsertProspect,
} from "@/app/data-actions";

const STORAGE_KEY = "niche-demo-launcher-prospects";

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
          setProspects(remote.data);
        } else {
          const stored = window.localStorage.getItem(STORAGE_KEY);
          if (stored) setProspects(JSON.parse(stored) as Prospect[]);
        }
      } catch {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored && active) setProspects(JSON.parse(stored) as Prospect[]);
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
      updateProspect(id, {
        outreach_status: status,
        last_contacted_at:
          status === "sent" || status === "replied" ? new Date().toISOString() : undefined,
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
