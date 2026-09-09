import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { ThemeScript } from "./ThemeScript";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Shared document shell for both locale root layouts.
 *
 * There are two root layouts (one per locale route group) so each tree can
 * emit its own `<html lang>` — a requirement for correct hreflang handling
 * and for screen readers to switch pronunciation.
 */
export function RootShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = getDictionary(locale);

  return (
    <html lang={t.meta.htmlLang} dir={t.meta.dir} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element -- the App Router
          guide "Preventing flash before hydration" prescribes exactly this:
          a synchronous inline script in <head> that runs before first paint.
          The rule it trips is a Pages Router rule. */}
      <head>
        <ThemeScript />
        {/* AdSense verification requires this inside <head>. */}
        <AdSenseScript />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
