/**
 * Format detection + unified entry point.
 *
 * Detection is by magic bytes rather than file extension: renamed files and
 * `.msg` files saved from webmail as MIME are common enough that trusting the
 * extension produces a confusing "corrupt file" error for a readable message.
 */

import type { ParsedEmail } from "./types";
import { parseMsg } from "./parseMsg";
import { parseEml } from "./parseEml";
import { isTnef } from "./tnef";

/** OLE2 / Compound File Binary Format signature — every real .msg starts here. */
const CFBF_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

export type DetectedFormat = "msg" | "eml" | "tnef" | "ical" | "vcard" | "unknown";

export function detectFormat(buffer: ArrayBuffer, fileName: string): DetectedFormat {
  const head = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 8));
  if (
    head.length >= 8 &&
    CFBF_SIGNATURE.every((byte, i) => head[i] === byte)
  ) {
    return "msg";
  }

  // TNEF is a flat binary stream with its own signature, checked before the
  // text sniffs below since it is not line-oriented at all.
  if (isTnef(buffer)) return "tnef";

  const probe = new TextDecoder("ascii", { fatal: false })
    .decode(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 2048)));

  // iCalendar and vCard first: both are line-oriented `NAME:value` formats and
  // would otherwise look header-shaped to the MIME sniff below. Outlook for Mac
  // exports calendar items as .ics, so this is a path users really take.
  if (/^\s*BEGIN\s*:\s*VCALENDAR/i.test(probe)) return "ical";
  if (/^\s*BEGIN\s*:\s*VCARD/i.test(probe)) return "vcard";

  // A MIME message starts with a header line. Anchoring to the first non-empty
  // line matters: matching anywhere in the window (with /m) made any file
  // containing an `X-Something:` line — an .ics among them — look like mail.
  const firstLine = probe.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  if (/^(Return-Path|Received|From|To|Cc|Subject|Date|Message-ID|MIME-Version|Delivered-To|Content-Type|X-[A-Za-z0-9-]+)\s*:/i.test(firstLine)) {
    return "eml";
  }

  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "msg") return "msg";
  if (ext === "eml" || ext === "mime") return "eml";
  if (ext === "dat" && fileName.toLowerCase().startsWith("winmail")) return "tnef";
  if (ext === "ics" || ext === "ical") return "ical";
  if (ext === "vcf" || ext === "vcard") return "vcard";
  return "unknown";
}

export class UnsupportedFileError extends Error {
  constructor(public readonly fileName: string) {
    super(`Unsupported file: ${fileName}`);
    this.name = "UnsupportedFileError";
  }
}

/**
 * The file could not be read off disk at all.
 *
 * The usual cause is cloud on-demand storage — OneDrive Files On-Demand,
 * iCloud Drive "Optimise Mac Storage", Google Drive streaming, Dropbox Smart
 * Sync. The placeholder reports its full logical size to the file picker while
 * holding zero bytes locally, so the read only fails once the browser asks for
 * the actual data. Reported separately because the file is fine — it just is
 * not on this machine yet.
 */
/**
 * The format was recognised but is not one this viewer opens.
 *
 * Worth separating from "unsupported/corrupt": a calendar or contact card is a
 * perfectly good file that simply opens somewhere else, and saying so is more
 * use than implying it is broken.
 */
export class WrongFormatError extends Error {
  constructor(
    public readonly fileName: string,
    public readonly format: "ical" | "vcard",
  ) {
    super(`${fileName} is a ${format} file`);
    this.name = "WrongFormatError";
  }
}

export class FileReadError extends Error {
  constructor(
    public readonly fileName: string,
    public readonly expected: number,
    public readonly received: number,
  ) {
    super(`Could not read ${fileName}: expected ${expected} bytes, got ${received}`);
    this.name = "FileReadError";
  }
}

export async function parseEmailFile(
  file: File | { name: string; buffer: ArrayBuffer },
): Promise<ParsedEmail> {
  const name = file.name;

  let buffer: ArrayBuffer;
  if (file instanceof File) {
    try {
      buffer = await file.arrayBuffer();
    } catch {
      // A cloud placeholder that could not be hydrated. `file.size` was
      // available, so this is not an empty file — the bytes are elsewhere.
      throw new FileReadError(name, file.size, 0);
    }
    // A short read means the same thing without throwing: some providers
    // return a truncated buffer rather than failing outright.
    if (file.size > 0 && buffer.byteLength < file.size) {
      throw new FileReadError(name, file.size, buffer.byteLength);
    }
  } else {
    buffer = file.buffer;
  }

  if (buffer.byteLength === 0) throw new UnsupportedFileError(name);

  const format = detectFormat(buffer, name);
  // Attach the original handle to whatever the parser returns, so the upload
  // path never has to re-derive the bytes.
  const withSource = (email: ParsedEmail): ParsedEmail =>
    file instanceof File ? { ...email, sourceFile: file } : email;

  if (format === "msg") return parseMsg(buffer, name).then(withSource);
  if (format === "eml") return parseEml(buffer, name).then(withSource);
  if (format === "tnef") {
    const { parseTnef } = await import("./tnef");
    return parseTnef(buffer, name).then(withSource);
  }
  if (format === "ical" || format === "vcard") {
    throw new WrongFormatError(name, format);
  }
  throw new UnsupportedFileError(name);
}

/** Re-parse an embedded message attachment so it can be opened in place. */
export async function parseEmbedded(
  content: Uint8Array,
  fileName: string,
): Promise<ParsedEmail> {
  const copy = content.slice();
  const buffer = copy.buffer.slice(
    copy.byteOffset,
    copy.byteOffset + copy.byteLength,
  ) as ArrayBuffer;
  return parseEmailFile({ name: fileName, buffer });
}

/**
 * True when an error is a failed dynamic `import()` rather than a bad file.
 *
 * The parsers are code-split, so a deploy that lands while a tab is open
 * leaves that tab referencing chunk filenames the new build no longer has.
 * The next `import()` 404s and rejects — which looks identical to a parse
 * failure unless it is told apart, and produces the badly misleading
 * "this file uses an unsupported Outlook feature" for a perfectly good file.
 */
export function isStaleBuildError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "ChunkLoadError") return true;
  return /dynamically imported module|Loading chunk|Importing a module script failed|not executable/i.test(
    err.message,
  );
}
