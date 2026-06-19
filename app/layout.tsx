import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ProspectProvider } from "@/components/prospect-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: {
    default: "Seraphim",
    template: "%s | Seraphim",
  },
  description:
    "Private website generation and prospect outreach command center for Niche Technologies.",
  applicationName: "Seraphim",
  authors: [{ name: "Niche Technologies" }],
  creator: "Niche Technologies",
  publisher: "Niche Technologies",
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: "Seraphim",
    description:
      "Private website generation and prospect outreach command center for Niche Technologies.",
    type: "website",
    siteName: "Seraphim",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6d28d9",
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
