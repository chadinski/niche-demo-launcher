"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/40 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-[0_30px_90px_rgba(21,26,45,.3)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="confirm-title" className="text-xl font-bold tracking-[-0.03em] text-ink-950">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#70778b]">{description}</p>
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-[#747b8f] hover:bg-[#f2f2f6] hover:text-ink-950"
            onClick={onCancel}
            aria-label="Close confirmation"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
