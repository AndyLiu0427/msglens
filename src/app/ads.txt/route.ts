import { SITE } from "@/lib/site";

// Required by `output: export` — generated once at build time.
export const dynamic = "force-static";

/**
 * IAB `ads.txt` for AdSense.
 *
 * Without this file Google flags the site "Earnings at risk" and restricts
 * what it will pay out, because it cannot confirm we authorised anyone to sell
 * our inventory. It is derived from the publisher id rather than hand-written
 * so the two can never drift apart.
 *
 * `f08c47fec0942fa0` is Google's fixed TAG certification-authority id — the
 * same value for every AdSense publisher.
 */
export function GET(): Response {
  const client = SITE.adsenseClient.trim();

  // Before approval there is no publisher to declare. An empty file is the
  // correct answer: a placeholder id would be an unverifiable claim.
  const body = client
    ? `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "";

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
