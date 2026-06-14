import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProspectProvider } from "@/components/prospect-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Niche Demo Launcher",
    template: "%s | Niche Demo Launcher",
  },
  description:
    "Private demo generation and prospect outreach command center for Niche Technologies.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ProspectProvider>
          <AppShell>{children}</AppShell>
          <Toaster
            richColors
            position="bottom-right"
            toastOptions={{
              style: {
                borderRadius: "14px",
                border: "1px solid #e5e6ed",
                boxShadow: "0 18px 50px rgba(21,26,45,.14)",
              },
            }}
          />
        </ProspectProvider>
      </body>
    </html>
  );
}
