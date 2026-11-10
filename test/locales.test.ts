import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, ROUTES } from "../src/lib/site";

/**
 * The sitemap and hreflang tags list every route in every locale, so a
 * missing page in one language ships a 404 that Google is told to index.
 */
describe("locales", () => {
  it("every route has a page in every locale", () => {
    const missing = LOCALES.flatMap((locale) =>
      ROUTES.map((route) => {
        const slug = route === "/" ? "" : route.slice(1);
        const dir = locale === DEFAULT_LOCALE ? "src/app/(en)" : `src/app/(${locale})/${locale}`;
        return join(dir, slug, "page.tsx");
      }),
    ).filter((page) => !existsSync(page));
    expect(missing).toEqual([]);
  });
});
