import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ThemeScript } from "@/components/site/ThemeScript";
import { IconMail, IconChevronRight } from "@/components/ui/icons";
import { SITE } from "@/lib/site";
import "./globals.css";

/**
 * The 404 for unmatched URLs across the whole app.
 *
 * `global-not-found` rather than `not-found`: this app has two root layouts
 * (one per locale route group), so there is no single layout Next could
 * compose a 404 from — which is why the default was an unstyled white page.
 *
 * It bypasses layouts entirely, so everything a page normally inherits has to
 * be re-declared here: the stylesheet, the font, and the pre-paint theme
 * script.
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `Page not found — ${SITE.name}`,
  description: "This page does not exist. Open the .msg viewer instead.",
  // A 404 has nothing to index, and letting it in would dilute the real pages.
  robots: { index: false, follow: true },
};

/**
 * Picks the locale from the URL before first paint.
 *
 * A visitor who mistypes a URL under /zh/ should not be answered in English.
 * Doing this with a class on <html> plus CSS (rather than swapping text after
 * hydration) means the correct language is painted on the first frame.
 */
const localeScript = `
(function () {
  try {
    if (location.pathname.split("/")[1] === "zh") {
      document.documentElement.classList.add("is-zh");
      document.documentElement.lang = "zh-Hant";
    }
  } catch (e) {}
})();
`;

const localeCss = `
  .zh-only { display: none; }
  .is-zh .en-only { display: none; }
  .is-zh .zh-only { display: revert; }
`;

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script dangerouslySetInnerHTML={{ __html: localeScript }} suppressHydrationWarning />
        <style dangerouslySetInnerHTML={{ __html: localeCss }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-ink"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-on">
              <IconMail className="size-4.5" />
            </span>
            <span className="text-[16px]">{SITE.name}</span>
          </Link>

          <p className="mt-10 text-[13px] font-semibold tracking-[0.18em] text-ink-subtle uppercase">
            404
          </p>

          <h1 className="mt-3 max-w-lg text-[28px] leading-tight font-semibold tracking-tight text-ink sm:text-[34px]">
            <span className="en-only">This page does not exist</span>
            <span className="zh-only">找不到這個頁面</span>
          </h1>

          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">
            <span className="en-only">
              The link may be out of date, or the address may have a typo. The viewer
              itself is still here.
            </span>
            <span className="zh-only">
              連結可能已失效,或是網址打錯了。檢視器本身還在。
            </span>
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-[14.5px] font-medium text-accent-on transition-colors hover:bg-accent-hover en-only"
          >
            Open the .msg viewer
            <IconChevronRight className="size-4" />
          </Link>
          <Link
            href="/zh/"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-[14.5px] font-medium text-accent-on transition-colors hover:bg-accent-hover zh-only"
          >
            開啟 .msg 檢視器
            <IconChevronRight className="size-4" />
          </Link>

          <nav className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13.5px]">
            <span className="en-only contents">
              <Link href="/how-to-open-msg-files/" className="text-ink-muted hover:text-ink">
                How to open .msg files
              </Link>
              <Link href="/what-is-a-msg-file/" className="text-ink-muted hover:text-ink">
                What is a .msg file?
              </Link>
              <Link href="/faq/" className="text-ink-muted hover:text-ink">
                FAQ
              </Link>
            </span>
            <span className="zh-only contents">
              <Link href="/zh/how-to-open-msg-files/" className="text-ink-muted hover:text-ink">
                如何開啟 .msg 檔
              </Link>
              <Link href="/zh/what-is-a-msg-file/" className="text-ink-muted hover:text-ink">
                .msg 檔是什麼?
              </Link>
              <Link href="/zh/faq/" className="text-ink-muted hover:text-ink">
                常見問題
              </Link>
            </span>
          </nav>
        </main>
      </body>
    </html>
  );
}
