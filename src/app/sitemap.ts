import type { MetadataRoute } from "next";
import { BLOG_LOCALES, HREFLANG, LOCALES, localizedPath, localizedUrl, ROUTES } from "@/lib/site";
import { blogPaths } from "@/content/blog";
import contentDates from "@/lib/content-dates.json";

/**
 * One entry per route per locale, each carrying the full hreflang alternate
 * set so Google can pair the translations without a separate annotation.
 *
 * `lastModified` comes from git — the last commit that touched the files a
 * route actually renders — and is omitted entirely for any route we cannot
 * date. It used to be the build time on all 34 URLs, which claimed every page
 * changed on every deploy. Google discounts lastmod when it proves unreliable,
 * and discounts it site-wide, so a date that is always wrong is worse than no
 * date at all: it spends the signal before there is anything to say with it.
 *
 * Dates are per guide and per locale, not per file: several guides share a
 * content module, and the translations are edited separately.
 */
// Required by `output: export` — both files are generated once at build time.
export const dynamic = "force-static";

const dates = contentDates as Record<string, string | undefined>;

export default function sitemap(): MetadataRoute.Sitemap {
  const blog = blogPaths().map(({ locale, path, date }) => ({
    url: localizedUrl(path, locale),
    ...(date ? { lastModified: new Date(date) } : {}),
    changeFrequency: path === "/blog" ? ("weekly" as const) : ("monthly" as const),
    priority: 0.6,
    // Posts are written per language; only the blog index has a counterpart.
    ...(path === "/blog"
      ? {
          alternates: {
            languages: Object.fromEntries(
              BLOG_LOCALES.map((l) => [HREFLANG[l], localizedUrl("/blog", l)]),
            ),
          },
        }
      : {}),
  }));
  return [...pages(), ...blog];
}

function pages(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: localizedUrl(route, locale),
      ...(dates[localizedPath(route, locale)]
        ? { lastModified: new Date(dates[localizedPath(route, locale)]!) }
        : {}),
      changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "/" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [HREFLANG[l], localizedUrl(route, l)]),
        ),
      },
    })),
  );
}
