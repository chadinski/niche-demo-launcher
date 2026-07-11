import type { OutreachStatus } from "@/lib/types";
import { cn, statusLabel } from "@/lib/utils";

const styles: Record<OutreachStatus, string> = {
  new: "border-slate-200 bg-slate-50 text-slate-600",
  profile_extracted: "border-brand-200 bg-brand-50 text-brand-700",
  demo_generated: "border-indigo-200 bg-indigo-50 text-indigo-700",
  demo_deployed: "border-cyan-200 bg-cyan-50 text-cyan-700",
  message_ready: "border-blue-200 bg-blue-50 text-blue-700",
  contacted: "border-sky-200 bg-sky-50 text-sky-700",
  follow_up_due: "border-amber-200 bg-amber-50 text-amber-700",
  replied: "border-lime-200 bg-lime-50 text-lime-800",
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
