import type { Metadata } from "next";
import { Toaster } from "sonner";
import { RootProviders } from "@/components/root-providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: {
    default: "Seraphim — Prospect demos and outreach workspace",
    template: "%s | Seraphim",
  },
  description:
    "Find prospects, create premium website demos, and prepare personalized outreach from one workspace.",
  applicationName: "Seraphim",
  authors: [{ name: "Niche Technologies" }],
  creator: "Niche Technologies",
  publisher: "Niche Technologies",
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Seraphim",
    description:
      "Find prospects, create premium website demos, and prepare personalized outreach from one workspace.",
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
        <RootProviders>
          {children}
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
        </RootProviders>
      </body>
    </html>
  );
}
