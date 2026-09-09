import Link from "next/link";
import { Breadcrumb, Page, Prose } from "./Page";
import { AdSlot } from "@/components/ads/AdSlot";
import { IconChevronRight } from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n";
import { breadcrumbSchema, howToSchema } from "@/lib/metadata";
import { localizedPath, SITE, type Locale } from "@/lib/site";

interface ArticlePageProps {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  intro?: string;
  /** Rendered as HowTo structured data when present. */
  steps?: ReadonlyArray<{ name: string; text: string }>;
  children: React.ReactNode;
}

export function ArticlePage({
  locale,
  path,
  title,
  description,
  intro,
  steps,
  children,
}: ArticlePageProps) {
  const t = getDictionary(locale);

  const schemas: Array<Record<string, unknown>> = [
    breadcrumbSchema(locale, [
      { name: t.nav.viewer, path: "/" },
      { name: title, path },
    ]),
  ];
  if (steps) {
    schemas.push(howToSchema({ name: title, description, steps }));
  }

  return (
    <Page locale={locale} path={path} schemas={schemas}>
      <Breadcrumb locale={locale} title={title} />

      <article>
        <h1 className="text-[30px] leading-[1.18] font-semibold tracking-tight text-ink sm:text-[36px]">
          {title}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">{description}</p>

        {intro && (
          <p className="mt-6 border-l-2 border-accent pl-4 text-[15.5px] leading-relaxed text-ink-muted">
            {intro}
          </p>
        )}

        <AdSlot slot={SITE.adSlots.articleTop} format="leaderboard" label={t.ads.label} className="mt-8" />

        <div className="mt-8">
          <Prose>{children}</Prose>
        </div>
      </article>

      <section className="mt-14 rounded-card border border-line bg-accent-soft px-6 py-7 text-center">
        <h2 className="text-[19px] font-semibold tracking-tight text-ink">{t.cta.title}</h2>
        <p className="mt-1.5 text-[14px] text-ink-muted">{t.cta.body}</p>
        <Link
          href={localizedPath("/", locale)}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-[14.5px] font-medium text-accent-on transition-colors hover:bg-accent-hover"
        >
          {t.cta.button}
          <IconChevronRight className="size-4" />
        </Link>
      </section>

      <AdSlot slot={SITE.adSlots.articleFooter} format="rectangle" label={t.ads.label} className="mt-10" />
    </Page>
  );
}
