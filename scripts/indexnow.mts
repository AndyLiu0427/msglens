/**
 * Tell Bing (and the other IndexNow engines) which pages exist, right after a
 * deploy. ChatGPT search and Copilot answer from Bing's index, so a page Bing
 * has not crawled is a page those assistants cannot cite.
 *
 * The key is public by design: IndexNow proves ownership by fetching it from
 * /<key>.txt on the site itself.
 *
 * Run after `wrangler pages deploy`: pnpm indexnow
 */

import { LOCALES, localizedUrl, ROUTES, SITE } from "../src/lib/site";

const KEY = "4ee1837c39be0a6b53add17fb4b687dc";

// ponytail: sends every route each time. ~30 URLs is well inside IndexNow's
// limits; send only changed routes (from content-dates.json) if the site grows.
const urlList = LOCALES.flatMap((locale) => ROUTES.map((route) => localizedUrl(route, locale)));

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE.url).host,
    key: KEY,
    keyLocation: `${SITE.url}/${KEY}.txt`,
    urlList,
  }),
});

// 200 and 202 both mean accepted; anything else is worth reading.
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
