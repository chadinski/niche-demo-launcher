"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ProspectProvider } from "@/components/prospect-provider";
const publicPaths=new Set(["/","/features","/how-it-works","/pricing","/privacy","/terms","/acceptable-use","/support","/login","/signup","/forgot-password","/reset-password","/service-unavailable"]);
export function RootProviders({children}:{children:ReactNode}){const pathname=usePathname();if(publicPaths.has(pathname))return <AppShell>{children}</AppShell>;return <ProspectProvider><AppShell>{children}</AppShell></ProspectProvider>}
