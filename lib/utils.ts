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
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRelativeDate(value: string, referenceTime: string) {
  const diff = new Date(referenceTime).getTime() - new Date(value).getTime();
  const hours = Math.max(1, Math.floor(diff / 3_600_000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}
