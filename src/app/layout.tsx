import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/lib/content";
import "./globals.css";

/**
 * Baloo 2 is the ONLY typeface on the site — display and body both. Hierarchy
 * comes from weight, not from a second family.
 *
 * Self-hosted as a single variable file (wght 400–800), subset from the
 * official Google Fonts release in `Baloo_2/` down to latin + latin-ext plus
 * the punctuation and arrows the copy uses. ~50 KB for every weight, one
 * request, no Google Fonts call at build or runtime.
 */
const baloo = localFont({
  src: [{ path: "./fonts/baloo2-variable.woff2", weight: "400 800", style: "normal" }],
  variable: "--font-baloo",
  display: "swap",
  fallback: ["ui-rounded", "Trebuchet MS", "system-ui", "sans-serif"],
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
  themeColor: "#fff4e6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={baloo.variable}>
      <body>{children}</body>
    </html>
  );
}
