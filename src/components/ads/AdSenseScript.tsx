import { SITE } from "@/lib/site";

/**
 * The AdSense loader, rendered into `<head>`.
 *
 * Placement matters for approval: AdSense's site verification looks for this
 * snippet between `<head>` and `</head>`, and a body-injected copy (which is
 * where `next/script`'s default `afterInteractive` strategy puts it) can fail
 * the check and cost a full review cycle.
 *
 * A plain `<script async>` rather than `next/script` with `beforeInteractive`:
 * `async` already means the script never blocks parsing, so head placement
 * costs nothing in Core Web Vitals, while `beforeInteractive` would delay
 * hydration for an ad library that is not needed for the page to work.
 *
 * Renders nothing until a publisher id is configured, so the site stays clean
 * and script-free during the review.
 */
export function AdSenseScript() {
  if (!SITE.adsenseClient) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClient}`}
      crossOrigin="anonymous"
    />
  );
}
