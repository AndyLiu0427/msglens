/**
 * Derive a real `lastmod` per route from git history.
 *
 * Runs before the build and writes `src/lib/content-dates.json`.
 *
 * Why this exists: the sitemap used to stamp every URL with the build time,
 * which told Google that all 34 pages changed on every deploy. They did not.
 * Google discounts `lastmod` when it proves unreliable, and it discounts it for
 * the whole site — so a date that is always wrong does not merely fail to help,
 * it destroys the signal for the pages that genuinely do change later.
 *
 * Two rules follow, and both bias the same way:
 *
 *   - **Never report a date newer than the truth.** A stale date costs a little
 *     crawl priority. A fresh one that is not true costs the signal entirely.
 *   - **When the answer is unknown, emit nothing.** Cloudflare Pages may build
 *     from a shallow clone, where every file reports the same single commit.
 *     Omitting `lastmod` is correct there; guessing is not.
 *
 * Route-to-source mapping is read from each page's own imports rather than
 * hardcoded, so a new page is covered without anyone remembering to add it.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "src/lib/content-dates.json");

/** Layout, not content — a change here is not a change to what a page says. */
const SHELL = new Set(["components/site/ArticlePage", "components/site/Page"]);

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function isShallow(): boolean {
  try {
    return git(["rev-parse", "--is-shallow-repository"]) === "true";
  } catch {
    return true; // No git at all: treat as unknown.
  }
}

/** Files that decide what a route says, from the route's own import list. */
function sourcesFor(route: string): string[] {
  const slug = route === "/" ? "" : route.replace(/^\//, "");
  const pages = [
    join("src/app/(en)", slug, "page.tsx"),
    join("src/app/(zh)/zh", slug, "page.tsx"),
  ].filter((p) => existsSync(join(ROOT, p)));

  const modules = new Set<string>();
  for (const page of pages) {
    const source = readFileSync(join(ROOT, page), "utf8");
    for (const match of source.matchAll(/from "@\/([^"]+)"/g)) {
      const mod = match[1];
      if (SHELL.has(mod) || mod.startsWith("lib/")) continue;
      modules.add(mod);
      // A guide's prose lives in a per-locale file; the page only imports its
      // own locale, so pair them up.
      if (mod.startsWith("content/en")) modules.add(mod.replace("content/en", "content/zh"));
      if (mod.startsWith("content/zh")) modules.add(mod.replace("content/zh", "content/en"));
    }
  }

  const files = [...pages];
  for (const mod of modules) {
    for (const ext of [".tsx", ".ts"]) {
      const candidate = join("src", mod + ext);
      if (existsSync(join(ROOT, candidate))) files.push(candidate);
    }
  }
  return files;
}

function lastCommit(files: string[]): string | null {
  if (!files.length) return null;
  try {
    const iso = git(["log", "-1", "--format=%cI", "--", ...files]);
    return iso || null;
  } catch {
    return null;
  }
}

/**
 * Read ROUTES by parsing site.ts, not by executing it.
 *
 * This previously spawned `node` to import the module. That works on a Node
 * with type stripping and fails on one without — which is exactly what
 * happened: fine locally on Node 22, fatal in the deploy build, taking the
 * whole site build down with it. A regex over a literal array has no runtime
 * to be wrong about.
 */
function readRoutes(): string[] {
  const source = readFileSync(join(ROOT, "src/lib/site.ts"), "utf8");
  const block = /export const ROUTES = \[([\s\S]*?)\]/.exec(source);
  if (!block) throw new Error("Could not find ROUTES in src/lib/site.ts");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Nothing below may fail the build.
 *
 * A per-route lastmod is a small improvement to how Google schedules crawls.
 * It is not worth a deploy, and this script has already cost one. On any
 * error the committed dates stay as they are and the build continues.
 */
function main(): void {
const dates: Record<string, string> = {};
const routes = readRoutes();

if (isShallow()) {
  // Leave the committed file untouched. Its dates were computed from full
  // history on someone's machine and are the best available answer; writing an
  // empty map here would throw them away on every deploy.
  console.log(
    "content-dates: shallow clone — keeping the committed dates.\n" +
      "               (Deploy builds cannot see history; this is expected.)",
  );
} else {
  for (const route of routes) {
    const when = lastCommit(sourcesFor(route));
    if (when) dates[route] = when;
  }
  console.log(`content-dates: dated ${Object.keys(dates).length}/${routes.length} routes`);
  writeFileSync(OUT, JSON.stringify(dates, null, 2) + "\n");
}
}

try {
  main();
} catch (error) {
  console.warn(
    "content-dates: skipped —",
    error instanceof Error ? error.message : error,
  );
  console.warn("               The committed dates are unchanged. Build continues.");
}
