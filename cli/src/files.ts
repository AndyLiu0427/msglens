import { writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

/**
 * Attachment names come from the message, so they are untrusted: strip any
 * path, characters Windows rejects, and leading dots so a mail cannot drop
 * `../x` or a hidden `.npmrc` into the output folder.
 */
export function safeName(name: string, fallback: string): string {
  const clean = basename(name.replace(/\\/g, "/"))
    .replace(/[\x00-\x1f<>:"|?*]/g, "-")
    .replace(/^[. ]+|[. ]+$/g, "");
  return clean || fallback;
}

/** Write without ever overwriting: `a.pdf`, then `a (1).pdf`, `a (2).pdf`. */
export async function writeUnique(dir: string, name: string, data: string | Uint8Array): Promise<string> {
  const ext = extname(name);
  const stem = name.slice(0, name.length - ext.length);
  for (let n = 0; ; n++) {
    const path = join(dir, n === 0 ? name : `${stem} (${n})${ext}`);
    try {
      await writeFile(path, data, { flag: "wx" });
      return path;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
    }
  }
}
