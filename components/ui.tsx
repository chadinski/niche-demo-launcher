import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "border-brand-600 bg-brand-600 text-white shadow-[0_10px_24px_rgba(77,124,15,.22)] hover:-translate-y-0.5 hover:bg-brand-700",
    secondary: "border-brand-700 bg-brand-700 text-white hover:-translate-y-0.5 hover:bg-brand-600",
    outline: "border-[#dfe1ea] bg-white text-ink-800 hover:border-brand-500 hover:text-brand-700",
    ghost: "border-transparent bg-transparent text-[#60677b] hover:bg-[#f1f1f6] hover:text-ink-950",
    danger: "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
  };

  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClass(variant, className)} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel", className)} {...props} />;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[0.69rem] font-bold tracking-[0.16em] text-brand-600 uppercase">
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <h3 className="text-base font-bold text-ink-950">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#747b8f]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
