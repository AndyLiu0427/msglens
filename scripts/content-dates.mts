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

function git(args: string[], quiet = false): string {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", quiet ? "ignore" : "inherit"],
  }).trim();
}

function isShallow(): boolean {
  try {
    return git(["rev-parse", "--is-shallow-repository"]) === "true";
  } catch {
    return true; // No git at all: treat as unknown.
  }
}

/**
 * A content module holds several guides, and a page renders one of them
 * (`enContent.whatIs`). Dating the whole file re-dates every guide in it when
 * one changes, which reports pages as updated that were not. Where the page
 * names its guide, only that block is dated.
 */
interface Source {
  file: string;
  /** Top-level key inside the module, when the page uses just one guide. */
  key?: string;
}

/** Files that decide what a route says, from the route's own import list. */
function sourcesFor(route: string): Source[] {
  const slug = route === "/" ? "" : route.replace(/^\//, "");
  const pages = [
    join("src/app/(en)", slug, "page.tsx"),
    join("src/app/(zh)/zh", slug, "page.tsx"),
  ].filter((p) => existsSync(join(ROOT, p)));

  // module path -> guide key, or "" when the whole module is used.
  const modules = new Map<string, string>();
  for (const page of pages) {
    const source = readFileSync(join(ROOT, page), "utf8");
    for (const match of source.matchAll(/import \{ (\w+) \} from "@\/([^"]+)"/g)) {
      const [, name, mod] = match;
      if (SHELL.has(mod) || mod.startsWith("lib/")) continue;
      const key = new RegExp(`\\b${name}\\.(\\w+)\\b`).exec(source)?.[1] ?? "";
      modules.set(mod, key);
      // A guide's prose lives in a per-locale file with the same keys; the page
      // only imports its own locale, so pair them up.
      if (mod.startsWith("content/en")) modules.set(mod.replace("content/en", "content/zh"), key);
      if (mod.startsWith("content/zh")) modules.set(mod.replace("content/zh", "content/en"), key);
    }
  }

  const sources: Source[] = pages.map((file) => ({ file }));
  for (const [mod, key] of modules) {
    for (const ext of [".tsx", ".ts"]) {
      const file = join("src", mod + ext);
      if (existsSync(join(ROOT, file))) sources.push(key ? { file, key } : { file });
    }
  }
  return sources;
}

/**
 * Last commit touching one guide's block: from its `  key: {` line to the next
 * top-level key, or to the module's closing `}` for the last guide.
 */
function lastCommitForBlock(file: string, key: string): string | null {
  for (const end of ["^  [A-Za-z0-9_]*: {$", "^}"]) {
    try {
      // Quiet: the first end pattern is expected to miss on a module's last guide.
      const out = git(["log", "-n", "1", "--format=%cI", "-L", `/^  ${key}: {$/,/${end}/:${file}`], true);
      const iso = out.split("\n")[0];
      if (/^\d{4}-/.test(iso)) return iso;
    } catch {
      // No match for this end pattern; try the next one.
    }
  }
  return null;
}

function lastCommitForFiles(files: string[]): string | null {
  if (!files.length) return null;
  try {
    const iso = git(["log", "-1", "--format=%cI", "--", ...files]);
    return iso || null;
  } catch {
    return null;
  }
}

/** The newest of the route's sources, each dated as narrowly as it can be. */
function lastCommit(sources: Source[]): string | null {
  const whole = sources.filter((s) => !s.key).map((s) => s.file);
  const dates = [
    lastCommitForFiles(whole),
    ...sources.filter((s) => s.key).map((s) => lastCommitForBlock(s.file, s.key!)),
  ].filter((d): d is string => d !== null);
  if (!dates.length) return null;
  return dates.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b));
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
