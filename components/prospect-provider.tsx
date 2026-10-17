"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  deleteProspect as deleteRecord,
  listProspects,
  upsertProspect,
} from "@/app/data-actions";
import { mergeProspect, salesStage, demoStatus } from "@/lib/workspace";
import type { OutreachStatus, Prospect } from "@/lib/types";

const STORAGE_KEY = "niche-demo-launcher-prospects";
type SaveResult = Promise<boolean>;
interface ProspectContextValue {
  prospects: Prospect[];
  hydrated: boolean;
  loadError: string;
  saveErrors: Record<string, string>;
  saving: Record<string, number>;
  saveProspect: (prospect: Prospect) => SaveResult;
  updateProspect: (id: string, patch: Partial<Prospect>) => SaveResult;
  retrySave: (id: string) => SaveResult;
  getProspect: (id: string) => Prospect | undefined;
  setStatus: (id: string, status: OutreachStatus) => SaveResult;
  deleteProspect: (id: string) => Promise<void>;
}
const ProspectContext = createContext<ProspectContextValue | null>(null);
function normalize(p: Prospect): Prospect {
  const legacy: Record<string, OutreachStatus> = {
    not_sent: "new",
    sent: "contacted",
    follow_up: "follow_up_due",
  };
  return {
    ...p,
    outreach_status: legacy[p.outreach_status] ?? p.outreach_status,
    sales_stage: salesStage(p),
    demo_status: demoStatus(p),
    revision: p.revision ?? 0,
  };
}
export function ProspectProvider({ children }: { children: ReactNode }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, number>>({});
  const rows = useRef<Prospect[]>([]);
  const confirmed = useRef(new Map<string, number>());
  const queue = useRef(new Map<string, Promise<boolean>>());
  const sequence = useRef(new Map<string, number>());
  const localDemo = useRef(false);
  const ready = useRef(false);
  const publish = useCallback((next: Prospect[]) => {
    rows.current = next;
    setProspects(next);
  }, []);
  useEffect(() => {
    let active = true;
    void listProspects()
      .then((result) => {
        if (!active) return;
        localDemo.current =
          !result.configured && process.env.NODE_ENV !== "production";
        let loaded = result.data;
        if (localDemo.current) {
          try {
            const stored: unknown = JSON.parse(
              localStorage.getItem(STORAGE_KEY) || "[]",
            );
            if (Array.isArray(stored)) loaded = stored;
          } catch {
            /* Empty local workspace. */
          }
        } else localStorage.removeItem(STORAGE_KEY);
        loaded = loaded.map(normalize);
        loaded.forEach((p) => confirmed.current.set(p.id, p.revision ?? 0));
        publish(loaded);
        ready.current = true;
      })
      .catch(() => {
        if (active)
          setLoadError(
            "Your workspace could not be loaded. Reload to reconnect; existing data has not been changed.",
          );
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [publish]);
  useEffect(() => {
    const unsaved =
      Object.values(saving).some(Boolean) || Object.keys(saveErrors).length > 0;
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saving, saveErrors]);
  const saveProspect = useCallback(
    (prospect: Prospect): SaveResult => {
      if (!ready.current) return Promise.resolve(false);
      const current = rows.current.find((p) => p.id === prospect.id);
      const next = current
        ? mergeProspect(current, prospect)
        : normalize(prospect);
      const id = next.id;
      const serial = (sequence.current.get(id) ?? 0) + 1;
      sequence.current.set(id, serial);
      publish(
        current
          ? rows.current.map((p) => (p.id === id ? next : p))
          : [next, ...rows.current],
      );
      setSaving((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
      const task = (queue.current.get(id) ?? Promise.resolve(true)).then(
        async () => {
          try {
            if (localDemo.current) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.current));
            } else {
              const result = await upsertProspect(
                next,
                confirmed.current.get(id),
              );
              confirmed.current.set(id, result.data.revision ?? 0);
              if (sequence.current.get(id) === serial)
                publish(
                  rows.current.map((p) =>
                    p.id === id ? normalize(result.data) : p,
                  ),
                );
            }
            setSaveErrors((errors) => {
              const copy = { ...errors };
              delete copy[id];
              return copy;
            });
            return true;
          } catch (error) {
            setSaveErrors((errors) => ({
              ...errors,
              [id]:
                error instanceof Error
                  ? error.message
                  : "Not saved. Retry when your connection is restored.",
            }));
            return false;
          } finally {
            setSaving((s) => ({ ...s, [id]: Math.max(0, (s[id] ?? 1) - 1) }));
          }
        },
      );
      queue.current.set(id, task);
      return task;
    },
    [publish],
  );
  const updateProspect = useCallback(
    (id: string, patch: Partial<Prospect>): SaveResult => {
      const current = rows.current.find((p) => p.id === id);
      return current
        ? saveProspect(mergeProspect(current, patch))
        : Promise.resolve(false);
    },
    [saveProspect],
  );
  const retrySave = useCallback(
    (id: string) => {
      const row = rows.current.find((p) => p.id === id);
      return row ? saveProspect(row) : Promise.resolve(false);
    },
    [saveProspect],
  );
  const setStatus = useCallback(
    (id: string, status: OutreachStatus) =>
      updateProspect(id, {
        outreach_status: status,
        ...(status === "contacted"
          ? { last_contacted_at: new Date().toISOString() }
          : {}),
      }),
    [updateProspect],
  );
  const getProspect = useCallback(
    (id: string) => prospects.find((p) => p.id === id),
    [prospects],
  );
  const deleteProspect = useCallback(
    async (id: string) => {
      await queue.current.get(id);
      if (!localDemo.current) await deleteRecord(id);
      const remaining = rows.current.filter((p) => p.id !== id);
      if (localDemo.current)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      publish(remaining);
      setSaveErrors((errors) => {
        const copy = { ...errors };
        delete copy[id];
        return copy;
      });
    },
    [publish],
  );
  const value = useMemo(
    () => ({
      prospects,
      hydrated,
      loadError,
      saveErrors,
      saving,
      saveProspect,
      updateProspect,
      retrySave,
      getProspect,
      setStatus,
      deleteProspect,
    }),
    [
      prospects,
      hydrated,
      loadError,
      saveErrors,
      saving,
      saveProspect,
      updateProspect,
      retrySave,
      getProspect,
      setStatus,
      deleteProspect,
    ],
  );
  return (
    <ProspectContext.Provider value={value}>
      {children}
    </ProspectContext.Provider>
  );
}
export function useProspects() {
  const value = useContext(ProspectContext);
  if (!value) throw new Error("Workspace provider is missing");
  return value;
}
export function WorkspaceSaveStatus() {
  const { loadError, saveErrors, retrySave, saving } = useProspects();
  const failures = Object.entries(saveErrors);
  if (loadError)
    return (
      <div
        role="alert"
        className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {loadError}{" "}
        <button
          className="ml-2 font-bold underline"
          onClick={() => window.location.reload()}
        >
          Reload workspace
        </button>
      </div>
    );
  if (!failures.length) return null;
  return (
    <div
      role="alert"
      className="mb-5 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
    >
      {failures.map(([id, message]) => (
        <div
          key={id}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="max-w-3xl">
            <strong>Changes not saved.</strong> {message} Keep this tab open.
          </p>
          <button
            disabled={Boolean(saving[id])}
            onClick={() => void retrySave(id)}
            className="rounded-lg border border-amber-400 px-4 py-2 font-bold disabled:opacity-50"
          >
            Retry save
          </button>
        </div>
      ))}
    </div>
  );
}
