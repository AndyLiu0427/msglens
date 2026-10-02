/**
 * Public API of the `msglens` npm package: the same parsers msglens.app runs
 * in the browser, bundled for Node.
 */

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { parseEmbedded } from "../../src/lib/email/parse";
import { buildEml, buildPlainText } from "../../src/lib/email/export";
import type { ParsedEmail } from "../../src/lib/email/types";
import { htmlToText } from "./text";

export {
  detectFormat,
  UnsupportedFileError,
  WrongFormatError,
} from "../../src/lib/email/parse";
export type { DetectedFormat } from "../../src/lib/email/parse";
export type {
  AppointmentDetails,
  Attachment,
  ContactDetails,
  EmailAddress,
  ItemKind,
  ParsedEmail,
} from "../../src/lib/email/types";

/**
 * Parse a .msg, .eml or winmail.dat from memory. The format is detected from
 * the bytes; the name is only a tie-breaker and a label.
 */
export async function parse(bytes: Uint8Array | ArrayBuffer, fileName = "message"): Promise<ParsedEmail> {
  // parseEmbedded copies into a fresh ArrayBuffer, which also detaches us from
  // Node's pooled Buffer memory.
  const email = await parseEmbedded(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), fileName);
  // The viewer fills this in after parsing; RTF-only bodies have no text otherwise.
  email.bodyText ||= email.bodyKind === "html" ? htmlToText(email.body) : email.body;
  return email;
}

export async function parseFile(path: string): Promise<ParsedEmail> {
  return parse(await readFile(path), basename(path));
}

/** RFC 822 text, openable in Apple Mail, Thunderbird or any mail client. */
export function toEml(email: ParsedEmail): Promise<string> {
  return buildEml(email).text();
}

/** Headers, attachment names and the plain-text body. */
export function toText(email: ParsedEmail): Promise<string> {
  return buildPlainText(email).text();
}
