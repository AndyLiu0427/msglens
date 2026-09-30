import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Required by `output: export` — both files are generated once at build time.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE.url}/sitemap.xml`,
    // No `host`: it is a Yandex directive that wants a bare hostname, and Next
    // writes the full URL into it, which makes the line invalid everywhere.
  };
}
