import Link from "next/link";
import { Fragment } from "react";
import { Breadcrumb, Page, Prose } from "./Page";
import { AdSlot } from "@/components/ads/AdSlot";
import { IconChevronRight } from "@/components/ui/icons";
import { Viewer } from "@/components/viewer/Viewer";
import contentDates from "@/lib/content-dates.json";
import { format, getDictionary } from "@/lib/i18n";
import { articleSchema, breadcrumbSchema, faqSchema, howToSchema } from "@/lib/metadata";
import { DATE_LOCALE, localizedPath, SITE, type Locale } from "@/lib/site";

interface ArticlePageProps {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  intro?: string;
  /** Rendered as HowTo structured data when present. */
  steps?: ReadonlyArray<{ name: string; text: string }>;
  /** Shown after the body and emitted as FAQPage data: the question variants people search. */
  faq?: ReadonlyArray<{ q: string; a: string }>;
  /** Puts the working viewer above the article, for pages whose query is a task (convert, extract). */
  tool?: boolean;
  children: React.ReactNode;
}

export function ArticlePage({
  locale,
  path,
  title,
  description,
  intro,
  steps,
  faq,
  tool,
  children,
}: ArticlePageProps) {
  const t = getDictionary(locale);
  const modified = (contentDates as Record<string, string | undefined>)[localizedPath(path, locale)];

  const schemas: Array<Record<string, unknown>> = [
    breadcrumbSchema(locale, [
      { name: t.nav.viewer, path: "/" },
      { name: title, path },
    ]),
    articleSchema(locale, { title, description, path, dateModified: modified }),
  ];
  if (steps) {
    schemas.push(howToSchema({ name: title, description, steps }));
  }
  if (faq) schemas.push(faqSchema(faq));

  const header = (
    <>
      <Breadcrumb locale={locale} title={title} />
      <h1 className="text-[30px] leading-[1.18] font-semibold tracking-tight text-ink sm:text-[36px]">
        {title}
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">{description}</p>
      {modified && (
        <p className="mt-2 text-[12.5px] text-ink-subtle">
          {/* Visible to match the Person author in articleSchema. */}
          <Link href={localizedPath("/about", locale)} className="hover:text-ink hover:underline">
            {t.cta.byline}
          </Link>
          {" · "}
          <time dateTime={modified}>
            {format(t.cta.updated, {
              date: new Date(modified).toLocaleDateString(DATE_LOCALE[locale], {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
            })}
          </time>
        </p>
      )}
    </>
  );

  const body = (
    <>
      {intro && (
        <p className="mt-6 border-l-2 border-accent pl-4 text-[15.5px] leading-relaxed text-ink-muted">
          {intro}
        </p>
      )}

      <AdSlot slot={SITE.adSlots.articleTop} format="leaderboard" label={t.ads.label} className="mt-8" />

      <div className="mt-8">
        <Prose>
          {children}
          {faq && (
            <>
              <h2>{t.cta.faqHeading}</h2>
              {faq.map((item) => (
                <Fragment key={item.q}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </Fragment>
              ))}
            </>
          )}
        </Prose>
      </div>
    </>
  );

  const footerAd = (
    <AdSlot slot={SITE.adSlots.articleFooter} format="rectangle" label={t.ads.label} className="mt-10" />
  );

  if (tool) {
    // The viewer swaps all of this for the message list once a file is open, as on the home page.
    // Its children cross the server/client boundary, so each slot is one wrapper element.
    // No "open the viewer" card: the viewer is already at the top of the page.
    return (
      <Page locale={locale} path={path} schemas={schemas} wide>
        <Viewer t={t} locale={locale} intro={<div className="mx-auto mb-8 max-w-3xl">{header}</div>}>
          <article className="mx-auto mt-10 max-w-3xl">
            {body}
            {footerAd}
          </article>
        </Viewer>
      </Page>
    );
  }

  return (
    <Page locale={locale} path={path} schemas={schemas}>
      <article>
        {header}
        {body}
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

      {footerAd}
    </Page>
  );
}
