"use client";
import { useMemo, useState } from "react";
import { createPreviewHtml } from "@/lib/generation/preview";
import { Button } from "@/components/ui";
export function WorkspacePreview({
  html,
  title = "Website preview",
}: {
  html: string;
  title?: string;
}) {
  const [size, setSize] = useState<"desktop" | "mobile">("desktop");
  const src = useMemo(() => createPreviewHtml(html), [html]);
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white p-3">
        <p className="text-xs font-medium text-slate-500">
          Isolated preview · scripts disabled
        </p>
        <div className="flex gap-1">
          <Button
            variant={size === "desktop" ? "secondary" : "ghost"}
            onClick={() => setSize("desktop")}
            aria-pressed={size === "desktop"}
          >
            Desktop
          </Button>
          <Button
            variant={size === "mobile" ? "secondary" : "ghost"}
            onClick={() => setSize("mobile")}
            aria-pressed={size === "mobile"}
          >
            Mobile
          </Button>
        </div>
      </div>
      <div className="p-2 sm:p-4">
        <iframe
          title={title}
          srcDoc={src}
          sandbox=""
          referrerPolicy="no-referrer"
          className="mx-auto h-[70vh] min-h-[480px] max-w-full rounded-lg bg-white shadow-sm"
          style={{ width: size === "mobile" ? 375 : "100%" }}
        />
      </div>
    </div>
  );
}
