import type { OutreachStatus } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

export function statusLabel(status: OutreachStatus) {
  const labels: Record<OutreachStatus, string> = {
    new: "New",
    profile_extracted: "Profile Extracted",
    demo_generated: "Demo Generated",
    demo_deployed: "Demo Deployed",
    message_ready: "Message Ready",
    contacted: "Contacted",
    follow_up_due: "Follow-Up Due",
    replied: "Replied",
    won: "Won",
    lost: "Lost",
    opt_out: "Opt-Out",
  };
  if (labels[status]) return labels[status];
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeDate(value: string, referenceTime: string) {
  const current = new Date(value).getTime();
  const reference = new Date(referenceTime).getTime();
  if (Number.isNaN(current) || Number.isNaN(reference)) return "Recently";
  const diff = reference - current;
  const hours = Math.max(1, Math.floor(diff / 3_600_000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function externalHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}
