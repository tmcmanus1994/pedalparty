import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/lib/content";
import "./globals.css";

/**
 * Fonts are self-hosted (handoff §7) from the woff2 files in the Framer export:
 * Baloo 2 as a variable font (wght 400–800) for display, Inter 400/600 for body.
 * No Google Fonts request at runtime or build time.
 */
const baloo = localFont({
  src: [
    { path: "./fonts/baloo2-variable-latin.woff2", weight: "400 800", style: "normal" },
    { path: "./fonts/baloo2-variable-latin-ext.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-baloo",
  display: "swap",
  fallback: ["ui-rounded", "Trebuchet MS", "system-ui", "sans-serif"],
});

const inter = localFont({
  src: [
    { path: "./fonts/inter-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-400-latin-ext.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-600-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-600-latin-ext.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pedalpartylr.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Pedal Party — Little Rock's Monday social ride",
  description: site.description,
  keywords: [
    "Pedal Party",
    "Little Rock",
    "social ride",
    "bike ride",
    "group ride",
    "Arkansas cycling",
    "bicycle crawl",
  ],
  openGraph: {
    title: "Pedal Party — Little Rock's Monday social ride",
    description: site.description,
    url: siteUrl,
    siteName: "Pedal Party",
    images: [{ url: "/images/og.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pedal Party — Little Rock's Monday social ride",
    description: site.description,
    images: ["/images/og.png"],
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#5f13a9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${baloo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
