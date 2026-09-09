/**
 * Structural smoke test for the .msg parsing chain against real files.
 *
 * Run: pnpm dlx tsx scripts/verify-parse.ts <dir-or-file>...
 *
 * Reports only shape — which body property won, byte counts, attachment
 * counts — never message contents, so it can be run against real mail.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { parseMsg } from "../src/lib/email/parseMsg";
import { parseEml } from "../src/lib/email/parseEml";
import { parseTnef } from "../src/lib/email/tnef";
import { detectFormat } from "../src/lib/email/parse";

function collect(target: string): string[] {
  const st = statSync(target);
  if (st.isFile()) return [target];
  return readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const full = join(target, entry.name);
    if (entry.isDirectory()) return collect(full);
    const ext = extname(entry.name).toLowerCase();
    return ext === ".msg" || ext === ".eml" || ext === ".dat" ? [full] : [];
  });
}

const targets = process.argv.slice(2).flatMap(collect);
if (targets.length === 0) {
  console.error("No .msg/.eml/.dat files found.");
  process.exit(1);
}

let ok = 0;
let failed = 0;
let placeholders = 0;
const bodySources: Record<string, number> = {};

for (const file of targets) {
  const name = basename(file);

  /**
   * Cloud-storage placeholders read as empty.
   *
   * OneDrive and iCloud list a file at its full size and only fetch the
   * contents on first read; if that fetch fails or is slow, the read returns
   * nothing (or throws ETIMEDOUT) and every parser downstream reports a
   * mangled-file error for a file that is perfectly fine. Distinguishing this
   * up front is the difference between "your corpus is broken" and "these are
   * not downloaded yet" — the app draws the same distinction with
   * FileReadError.
   */
  let bytes: Buffer;
  try {
    bytes = readFileSync(file);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    console.log(`⏳ ${name}: not downloaded (${code}) — cloud placeholder`);
    placeholders++;
    continue;
  }
  if (bytes.byteLength === 0) {
    console.log(`⏳ ${name}: 0 bytes on disk — cloud placeholder, not a parse failure`);
    placeholders++;
    continue;
  }

  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

  try {
    const format = detectFormat(buffer, name);
    const email =
      format === "eml"
        ? await parseEml(buffer, name)
        : format === "tnef"
          ? await parseTnef(buffer, name)
          : await parseMsg(buffer, name);

    bodySources[email.bodySource] = (bodySources[email.bodySource] ?? 0) + 1;
    ok++;

    const flags = [
      `fmt=${email.sourceFormat}`,
      `body=${email.bodySource}`,
      `bodyLen=${email.body.length}`,
      `subject=${email.subject ? "yes" : "MISSING"}`,
      `from=${email.from?.address ? "smtp" : email.from?.name ? "name-only" : "MISSING"}`,
      `to=${email.to.length}`,
      `att=${email.attachments.length}`,
      `inline=${email.attachments.filter((a) => a.inline).length}`,
      `hdrs=${email.headerPairs.length}`,
      `date=${email.date ? "yes" : "MISSING"}`,
    ];
    console.log(`✓ ${flags.join("  ")}   [${name.slice(0, 40)}]`);

    if (email.warnings.length) {
      for (const w of email.warnings) console.log(`    ! ${w}`);
    }
  } catch (err) {
    failed++;
    console.log(`✗ ${name}: ${(err as Error).message}`);
  }
}

console.log(`\n${ok} parsed, ${failed} failed, out of ${targets.length}`);
console.log("body source distribution:", bodySources);

if (placeholders) {
  // Counted separately so a run against a cloud-synced folder cannot be read
  // as a parser result. It is not one either way.
  console.log(
    `\n${placeholders} file(s) were cloud placeholders and never reached the parser.` +
      `\nIn Finder, right-click the folder and choose "Always Keep on This Device",` +
      `\nwait for the download to finish, then run this again.`,
  );
}
if (failed > 0) process.exitCode = 1;
