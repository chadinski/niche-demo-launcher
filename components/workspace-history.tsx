"use client";
import { useCallback, useEffect, useState } from "react";
import {
  loadWorkspaceHistory,
  loadDemoVersion,
  revokeDemoShare,
} from "@/app/workspace-actions";
import { WorkspacePreview } from "@/components/workspace-preview";
import { Button, Card } from "@/components/ui";
import { toast } from "sonner";
type History = Awaited<ReturnType<typeof loadWorkspaceHistory>>;
export function WorkspaceHistory({
  prospectId,
  revision,
  onRestore,
}: {
  prospectId: string;
  revision: number;
  onRestore: (html: string) => Promise<boolean>;
}) {
  const [data, setData] = useState<History | null>(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(""),
    [html, setHtml] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setError("");
      setData(await loadWorkspaceHistory(prospectId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "History is unavailable.");
    }
  }, [prospectId]);
  useEffect(() => {
    let active = true;
    void loadWorkspaceHistory(prospectId)
      .then((result) => {
        if (active) {
          setError("");
          setData(result);
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : "History is unavailable.");
      });
    return () => {
      active = false;
    };
  }, [prospectId, revision]);
  async function preview(id: string) {
    setBusy(true);
    try {
      setHtml(await loadDemoVersion(prospectId, id));
      setSelected(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Version unavailable");
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id: string) {
    setBusy(true);
    try {
      await revokeDemoShare(prospectId, id);
      await refresh();
      toast.success("Share link revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke link");
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <Card className="p-6">
        <p role="alert" className="mb-3 text-red-700">
          {error}
        </p>
        <Button onClick={() => void refresh()}>Retry history</Button>
      </Card>
    );
  if (!data)
    return (
      <p role="status" className="p-6 text-slate-500">
        Loading saved history…
      </p>
    );
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-bold">Website versions</h2>
          <p className="mt-2 text-sm text-slate-500">
            Each saved change keeps a previous version. Restoring creates
            another version.
          </p>
          <div className="mt-5 divide-y divide-slate-100">
            {data.versions.length ? (
              data.versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-semibold">
                      {version.style_name.replaceAll("-", " ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(version.created_at).toLocaleString()}
                      {index === 0 ? " · Latest snapshot" : ""}
                    </p>
                  </div>
                  <Button
                    variant={selected === version.id ? "secondary" : "outline"}
                    disabled={busy}
                    onClick={() => void preview(version.id)}
                  >
                    Preview
                  </Button>
                </div>
              ))
            ) : (
              <p className="py-5 text-sm text-slate-500">
                Versions appear after saving your first demo.
              </p>
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-bold">Activity</h2>
          <ol className="mt-5 space-y-5">
            {data.activity.map((item) => (
              <li key={item.id} className="border-l-2 border-brand-100 pl-4">
                <p className="text-sm">{item.detail}</p>
                <time className="mt-1 block text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
          {!data.activity.length ? (
            <p className="mt-5 text-sm text-slate-500">
              Activity is recorded when you save, review, or update sales
              progress.
            </p>
          ) : null}
        </Card>
      </div>
      {html ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Selected version</h2>
            <Button
              loading={busy}
              onClick={async () => {
                if (
                  !window.confirm(
                    "Restore this version? Your current demo will remain in version history.",
                  )
                )
                  return;
                setBusy(true);
                try {
                  if (await onRestore(html)) {
                    toast.success(
                      "Version restored. Review it before sharing.",
                    );
                    setHtml("");
                    await refresh();
                  }
                } finally {
                  setBusy(false);
                }
              }}
            >
              Restore this version
            </Button>
          </div>
          <WorkspacePreview html={html} title="Saved website version" />
        </section>
      ) : null}
      <Card className="p-6">
        <h2 className="text-xl font-bold">Shared snapshots</h2>
        <p className="mt-2 text-sm text-slate-500">
          Editing the studio never changes an already shared snapshot. Revoke a
          link to stop access.
        </p>
        <div className="mt-5 space-y-3">
          {data.shares.map((share) => (
            <div
              key={share.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
            >
              <div>
                <p className="text-sm font-semibold">
                  {share.revoked_at
                    ? "Revoked"
                    : new Date(share.expires_at) < new Date()
                      ? "Expired"
                      : "Available"}
                </p>
                <p className="text-xs text-slate-500">
                  Expires {new Date(share.expires_at).toLocaleDateString()}
                </p>
              </div>
              {!share.revoked_at && new Date(share.expires_at) > new Date() ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${window.location.origin}/share/${share.token}`,
                        );
                        toast.success("Share link copied");
                      } catch {
                        toast.error(
                          "Clipboard unavailable. Open the link and copy its address.",
                        );
                      }
                    }}
                  >
                    Copy link
                  </Button>
                  <a
                    href={`/share/${share.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="self-center px-2 text-sm font-bold text-brand-700"
                  >
                    Open
                  </a>
                  <Button
                    variant="danger"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Revoke this link? Anyone using it will lose access.",
                        )
                      )
                        void revoke(share.id);
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {!data.shares.length ? (
            <p className="text-sm text-slate-500">
              No share links yet. Review your demo to create one.
            </p>
          ) : null}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Recipient feedback</h2>
        <p className="mt-2 text-sm text-slate-500">
          Messages submitted through your demo links. These do not automatically
          change the sales stage.
        </p>
        <div className="mt-5 space-y-4">
          {data.feedback.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-slate-500">
                {item.email} · {new Date(item.created_at).toLocaleString()}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                {item.message}
              </p>
            </article>
          ))}
          {!data.feedback.length ? (
            <p className="text-sm text-slate-500">No feedback submitted yet.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
