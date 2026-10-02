/**
 * Bundles the site's parsers (src/lib/email) into the `msglens` npm package,
 * so the website and the package never carry two copies of the parsing code.
 *
 * Run: pnpm cli:build
 */

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { copyFileSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const dir = new URL(".", import.meta.url).pathname;
rmSync(`${dir}dist`, { recursive: true, force: true });

await build({
  entryPoints: { index: `${dir}src/index.ts`, cli: `${dir}src/cli.ts` },
  outdir: `${dir}dist`,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "node",
  target: "node20",
  // Dependencies install from npm rather than being copied in.
  packages: "external",
  inject: [`${dir}src/textdecoder.ts`],
});

execFileSync("tsc", ["-p", `${dir}tsconfig.json`], { stdio: "inherit" });
// The sources import without extensions (bundler style); consumers on
// `moduleResolution: nodenext` reject that in .d.ts files, so add `.js`.
for (const file of readdirSync(`${dir}dist/types`, { recursive: true, encoding: "utf8" })) {
  if (!file.endsWith(".d.ts")) continue;
  const path = `${dir}dist/types/${file}`;
  writeFileSync(
    path,
    readFileSync(path, "utf8").replace(/((?:from|import)\s*\(?\s*)(["'])(\.\.?\/[^"']+?)\2/g, "$1$2$3.js$2"),
  );
}
copyFileSync(`${dir}../LICENSE`, `${dir}LICENSE`);
