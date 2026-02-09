// src/app/layout.tsx
import "@/app//globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import GlobalClickHaptics from "@/components/system/GlobalClickHaptics";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://app.origio.site"),
  title: {
    default: "Origio – Admin dashboard",
    template: "%s | Origio",
  },
  description:
    "Administrační rozhraní Origio pro správu workspace, projektů a publikovaných stránek v Origio.",
  openGraph: {
    title: "Origio – Admin dashboard",
    description:
      "Administrační rozhraní Origio pro správu workspace, projektů a publikovaných stránek v Origio.",
    url: "/",
    siteName: "Origio",
    locale: "cs_CZ",
    type: "website",
    images: [
      {
        url: "/images/og.png",
        width: 1200,
        height: 630,
        alt: "Origio – admin dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Origio – Admin dashboard",
    description:
      "Administrační rozhraní Origio pro správu workspace, projektů a publikovaných stránek v Origio.",
    images: ["/images/og.png"],
  },
  icons: {
    icon: [
      { url: "/images/logo2.png", sizes: "32x32", type: "image/x-icon" },
      { url: "/images/logo2.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-dvh mx-auto text-zinc-50">
        {children}
      </body>
    </html>
  );
}
