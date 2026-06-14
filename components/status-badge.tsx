import type { OutreachStatus } from "@/lib/types";
import { cn, statusLabel } from "@/lib/utils";

const styles: Record<OutreachStatus, string> = {
  not_sent: "border-slate-200 bg-slate-50 text-slate-600",
  sent: "border-blue-200 bg-blue-50 text-blue-700",
  replied: "border-lime-200 bg-lime-50 text-lime-800",
  follow_up: "border-amber-200 bg-amber-50 text-amber-700",
  won: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lost: "border-rose-200 bg-rose-50 text-rose-700",
  opt_out: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OutreachStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-bold whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
