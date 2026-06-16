"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronRight,
  FileStack,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  Plus,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "Create Site", icon: Sparkles },
  { href: "/prospects", label: "Prospects", icon: Users },
  { href: "/templates", label: "Templates", icon: FileStack },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r border-[#e7e8ef] bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col">
        <Sidebar pathname={pathname} />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Close navigation"
          className={cn(
            "absolute inset-0 bg-ink-950/35 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "relative flex h-full w-[min(86vw,310px)] flex-col bg-white shadow-2xl transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            className="absolute top-4 right-4 grid size-9 place-items-center rounded-xl text-[#6f768a] hover:bg-[#f1f1f6]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
          <Sidebar pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e7e8ef] bg-white/88 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-[-0.03em]">
            <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
              <BriefcaseBusiness className="size-4" />
            </span>
            Seraphim
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-xl border border-[#e1e3eb] bg-white"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
        </header>
        <main className="mx-auto min-h-screen w-full max-w-[1560px] px-4 py-5 sm:px-6 sm:py-7 xl:px-9 xl:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-[#ececf2] px-5">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand-600 text-white shadow-[0_10px_24px_rgba(124,58,237,.2)]">
          <BriefcaseBusiness className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[0.94rem] font-extrabold tracking-[-0.035em]">
            Seraphim
          </div>
          <div className="text-[0.68rem] font-semibold tracking-[0.12em] text-[#969bad] uppercase">
            Private command center
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <Link href="/create" className={buttonClass("primary", "w-full min-h-11")} onClick={onNavigate}>
          <Plus className="size-4" />
          Create New Site
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5" aria-label="Main navigation">
        <p className="px-3 pb-2 text-[0.65rem] font-bold tracking-[0.15em] text-[#a3a8b8] uppercase">
          Workspace
        </p>
        <div className="space-y-1">
          {navigation.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-[#666d81] hover:bg-[#f4f4f8] hover:text-ink-950",
                )}
              >
                <Icon className={cn("size-[18px]", active && "text-brand-600")} />
                <span>{item.label}</span>
                {active ? <ChevronRight className="ml-auto size-4" /> : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="m-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-700">
          <Sparkles className="size-4" />
          Ready to launch
        </div>
        <p className="mt-2 text-xs leading-5 text-[#70778b]">
          Paste business info, generate the site, then approve outreach manually.
        </p>
      </div>

      <div className="flex items-center gap-3 border-t border-[#ececf2] px-5 py-4">
        <div className="grid size-9 place-items-center rounded-full bg-ink-950 text-xs font-bold text-white">
          CT
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">Chad</div>
          <div className="truncate text-xs text-[#8b91a2]">Niche Technologies</div>
        </div>
        <PanelLeftClose className="size-4 text-[#a1a6b5]" aria-hidden="true" />
      </div>
    </>
  );
}
