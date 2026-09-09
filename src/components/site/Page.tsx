import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { IconChevronRight } from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n";
import { localizedPath, SITE, type Locale } from "@/lib/site";

interface PageProps {
  locale: Locale;
  /** Route path without locale prefix, used by the language switcher. */
  path: string;
  children: ReactNode;
  /** Structured data emitted into the document head. */
  schemas?: Array<Record<string, unknown>>;
  wide?: boolean;
}

export function Page({ locale, path, children, schemas, wide }: PageProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header locale={locale} path={path} />
      <main className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        {children}
      </main>
      <Footer locale={locale} />

      {schemas?.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Build-time JSON from our own dictionaries. `<` is escaped anyway so
          // a stray "</script>" in future copy can never break out of the tag.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </div>
  );
}

/** Breadcrumb shown at the top of every content page. */
export function Breadcrumb({
  locale,
  title,
}: {
  locale: Locale;
  title: string;
}) {
  const t = getDictionary(locale);
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex items-center gap-1 text-[12.5px] text-ink-subtle"
    >
      <Link href={localizedPath("/", locale)} className="transition-colors hover:text-ink">
        {SITE.name}
      </Link>
      <IconChevronRight className="size-3.5" />
      <span className="truncate text-ink-muted">{title}</span>
      <span className="sr-only">{t.nav.guides}</span>
    </nav>
  );
}

/**
 * Long-form article styling. Kept separate from `.msg-body` — that one styles
 * untrusted email HTML, this one styles our own content.
 */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className={[
        "text-[15.5px] leading-[1.75] text-ink-muted",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-ink",
        "[&_h3]:mt-7 [&_h3]:mb-2 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-ink",
        "[&_p]:mb-4",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
        "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-accent-hover",
        "[&_code]:rounded [&_code]:bg-surface-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-ink",
        "[&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[14px]",
        "[&_th]:border-b [&_th]:border-line [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink",
        "[&_td]:border-b [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
