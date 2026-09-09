import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Fully static export. The entire product runs client-side, so there is no
   * server to run — which is also what makes the "your file is never uploaded"
   * claim structurally true rather than a policy promise.
   */
  output: "export",

  // Cloudflare Pages serves `/path/` from `path/index.html`; trailing slashes
  // keep asset-relative URLs and the deployed routes consistent.
  trailingSlash: true,

  images: {
    // No Image Optimization server exists in a static export.
    unoptimized: true,
  },

  // Ship the smallest possible client bundle: the parsing libraries are all
  // dynamically imported, so they never land in the initial chunk.
  productionBrowserSourceMaps: false,

  experimental: {
    // Required for app/global-not-found.tsx. With two root layouts (one per
    // locale) there is no single layout Next can build a 404 from, so the
    // route-level `not-found` convention leaves an unstyled default page.
    globalNotFound: true,
  },
};

export default nextConfig;
