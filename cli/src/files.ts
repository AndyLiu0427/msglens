import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { toEml, toText, type ParsedEmail } from "./index";

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

/** Every attachment into `dir`; returns the paths written. Shared by the CLI and MCP server. */
export async function saveAttachments(email: ParsedEmail, dir: string): Promise<string[]> {
  await mkdir(dir, { recursive: true });
  const paths: string[] = [];
  for (const [i, att] of email.attachments.entries()) {
    paths.push(await writeUnique(dir, safeName(att.fileName, `attachment-${i + 1}`), att.content));
  }
  return paths;
}

/** `file` converted to .eml or .txt in `dir`, named after the source file. */
export async function convertFile(
  email: ParsedEmail,
  file: string,
  format: "eml" | "txt",
  dir: string,
): Promise<string> {
  await mkdir(dir, { recursive: true });
  const stem = safeName(basename(file, extname(file)), "message");
  return writeUnique(dir, `${stem}.${format}`, format === "eml" ? await toEml(email) : await toText(email));
}
