import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, localizedUrl, SITE, type Locale } from "./site";

interface PageMetaInput {
  locale: Locale;
  /** Route path without locale prefix, e.g. "/faq". */
  path: string;
  title: string;
  description: string;
  /** Omit the site-name suffix (used for the home page). */
  bareTitle?: boolean;
}

/**
 * Builds canonical + hreflang alternates for a page.
 *
 * Every page exists in both locales at mirrored paths, so alternates can be
 * derived rather than hand-maintained — which is what stops them rotting.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  bareTitle,
}: PageMetaInput): Metadata {
  const url = localizedUrl(path, locale);
  const fullTitle = bareTitle ? title : `${title} — ${SITE.name}`;

  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l === "zh" ? "zh-Hant" : "en"] = localizedUrl(path, l);
  }
  languages["x-default"] = localizedUrl(path, DEFAULT_LOCALE);

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      locale: locale === "zh" ? "zh_TW" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

/** JSON-LD helper — stringified once so the same object is not re-serialised. */
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}

export function faqSchema(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function softwareSchema(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    url: localizedUrl("/", locale),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript. Works in Chrome, Edge, Firefox and Safari.",
    description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isAccessibleForFree: true,
    // The public source of this same app: lets search and AI systems tie the
    // two together, and makes the "nothing is uploaded" claim checkable.
    sameAs: [SITE.repo, SITE.npm],
    featureList: [
      "Open Outlook .msg files without Outlook",
      "Open .eml files",
      "Client-side parsing — no upload",
      "Extract and download attachments",
      "Export to .eml, .txt and PDF",
      "View raw internet headers",
    ],
  };
}

/** Names the site itself, which is what Google shows as the site name in results. */
export function websiteSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: localizedUrl("/", locale),
    inLanguage: locale === "zh" ? "zh-Hant" : "en",
    publisher: { "@type": "Organization", name: SITE.operator },
  };
}

export function howToSchema(input: {
  name: string;
  description: string;
  steps: ReadonlyArray<{ name: string; text: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    totalTime: "PT1M",
    step: input.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * Who is behind the site, in machine-readable form.
 *
 * The About page exists to answer "who runs this", and it was the one content
 * page emitting no structured data at all. A named Person as the publisher is
 * the exact signal that page is for — both for E-E-A-T and for an ads reviewer
 * checking a site is a real thing run by a real someone.
 */
export function aboutSchema(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: SITE.name,
    url: localizedUrl("/about", locale),
    description,
    inLanguage: locale === "zh" ? "zh-Hant" : "en",
    mainEntity: {
      "@type": "Person",
      name: "Andy Liu",
      // The operator, not an employee of anything — stated plainly on the page.
      jobTitle: "Independent developer",
      email: `mailto:${SITE.contactEmail}`,
      worksFor: {
        "@type": "Organization",
        name: SITE.operator,
        // localizedUrl, not SITE.url: the latter has no trailing slash and
        // therefore 308-redirects. A schema URL that redirects is the same
        // sloppiness this change set exists to remove.
        url: localizedUrl("/", locale),
      },
    },
  };
}

/** Where to reach the operator. Pairs with aboutSchema on /contact. */
export function contactSchema(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: SITE.name,
    url: localizedUrl("/contact", locale),
    description,
    inLanguage: locale === "zh" ? "zh-Hant" : "en",
    mainEntity: {
      "@type": "Organization",
      name: SITE.operator,
      url: localizedUrl("/", locale),
      email: `mailto:${SITE.contactEmail}`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: `mailto:${SITE.contactEmail}`,
        availableLanguage: ["en", "zh-Hant"],
      },
    },
  };
}

/**
 * A guide or reference page. `dateModified` comes from git and is left out when
 * unknown, the same rule as the sitemap: a wrong date is worse than none.
 */
export function articleSchema(
  locale: Locale,
  input: { title: string; description: string; path: string; dateModified?: string },
) {
  const url = localizedUrl(input.path, locale);
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    inLanguage: locale === "zh" ? "zh-Hant" : "en",
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    author: { "@type": "Person", name: "Andy Liu", url: localizedUrl("/about", locale) },
    publisher: { "@type": "Organization", name: SITE.operator, url: localizedUrl("/", locale) },
  };
}

export function breadcrumbSchema(
  locale: Locale,
  trail: ReadonlyArray<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: localizedUrl(item.path, locale),
    })),
  };
}
