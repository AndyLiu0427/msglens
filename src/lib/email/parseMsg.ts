/**
 * Outlook `.msg` (CFBF / MS-OXMSG) -> ParsedEmail.
 *
 * The body is resolved through a deliberate fallback chain, because which
 * property Outlook populates depends on how the message was composed:
 *   PidTagHtml (bytes)  ->  PidTagBodyHtml (string)
 *   ->  PidTagRtfCompressed (de-encapsulated)  ->  PidTagBody (plain text)
 */

import type MsgReaderType from "@kenjiuno/msgreader";
import type { FieldsData } from "@kenjiuno/msgreader";
import type { Attachment, EmailAddress, ParsedEmail } from "./types";
import { guessMimeType } from "./mime";
import {
  decodeWords,
  findHeader,
  isExchangeDn,
  makeAddress,
  parseAddressList,
  parseHeaderBlock,
} from "./headers";
import { rtfBodyFromCompressed } from "./rtf";
import { classifyItem, extractAppointment, extractContact } from "./items";

const CODEPAGE_LABELS: Record<number, string> = {
  874: "windows-874",
  932: "shift_jis",
  936: "gbk",
  949: "euc-kr",
  950: "big5",
  1250: "windows-1250",
  1251: "windows-1251",
  1252: "windows-1252",
  1253: "windows-1253",
  1254: "windows-1254",
  1255: "windows-1255",
  1256: "windows-1256",
  1257: "windows-1257",
  1258: "windows-1258",
  65001: "utf-8",
};

function decodeBytes(bytes: Uint8Array, codepage?: number): string {
  const label = (codepage && CODEPAGE_LABELS[codepage]) || "utf-8";
  try {
    const text = new TextDecoder(label, { fatal: false }).decode(bytes);
    // A UTF-8 decode of Windows-1252 bytes produces replacement characters;
    // fall back rather than showing the user a body full of "�".
    if (label === "utf-8" && text.includes("�")) {
      return new TextDecoder("windows-1252", { fatal: false }).decode(bytes);
    }
    return text;
  } catch {
    return new TextDecoder("windows-1252", { fatal: false }).decode(bytes);
  }
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Resolve the sender across the several properties Outlook may populate. */
function resolveSender(
  fields: FieldsData,
  headerPairs: Array<{ name: string; value: string }>,
): EmailAddress | null {
  const fromHeader = parseAddressList(findHeader(headerPairs, "from"))[0];

  const candidates = [
    fields.senderSmtpAddress,
    fields.sentRepresentingSmtpAddress,
    fields.senderAddressType?.toUpperCase() === "SMTP" ? fields.senderEmail : undefined,
    fields.senderEmail,
  ];
  const address = candidates.find((c) => c && !isExchangeDn(c));
  const name = fields.senderName;

  // Prefer resolved SMTP data, but fall back to the transport header when the
  // message only carries an unresolvable Exchange legacy DN.
  if (address) return makeAddress(name, address);
  if (fromHeader) return fromHeader;
  return makeAddress(name, undefined);
}

function resolveRecipients(fields: FieldsData): {
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
} {
  const to: EmailAddress[] = [];
  const cc: EmailAddress[] = [];
  const bcc: EmailAddress[] = [];

  for (const r of fields.recipients ?? []) {
    const address = [r.smtpAddress, r.email].find((c) => c && !isExchangeDn(c));
    const parsed = makeAddress(r.name, address);
    if (!parsed) continue;
    if (r.recipType === "cc") cc.push(parsed);
    else if (r.recipType === "bcc") bcc.push(parsed);
    else to.push(parsed);
  }
  return { to, cc, bcc };
}

async function resolveBody(
  fields: FieldsData,
  warnings: string[],
): Promise<{ kind: "html" | "text"; value: string; source: ParsedEmail["bodySource"] }> {
  const codepage = fields.internetCodepage || fields.messageCodepage;

  if (fields.html && fields.html.length > 0) {
    const decoded = decodeBytes(fields.html, codepage);
    if (decoded.trim()) return { kind: "html", value: decoded, source: "html" };
  }

  if (fields.bodyHtml && fields.bodyHtml.trim()) {
    return { kind: "html", value: fields.bodyHtml, source: "html" };
  }

  if (fields.compressedRtf && fields.compressedRtf.length > 0) {
    const result = await rtfBodyFromCompressed(fields.compressedRtf);
    if (result) {
      return {
        kind: result.mode,
        value: result.content,
        source: "rtf",
      };
    }
    if (!fields.body?.trim()) {
      warnings.push(
        "This message stores its body as native Rich Text (RTF). Formatting could not be recovered, so the plain-text version is shown.",
      );
    }
  }

  if (fields.body && fields.body.trim()) {
    return { kind: "text", value: fields.body, source: "text" };
  }

  return { kind: "text", value: "", source: "none" };
}

function readImportance(
  headerPairs: Array<{ name: string; value: string }>,
): ParsedEmail["importance"] {
  const importance = findHeader(headerPairs, "importance")?.toLowerCase();
  if (importance === "high" || importance === "low") return importance;
  const priority = findHeader(headerPairs, "x-priority");
  if (priority) {
    const n = parseInt(priority, 10);
    if (n <= 2) return "high";
    if (n >= 4) return "low";
    return "normal";
  }
  return null;
}

let idCounter = 0;
const nextId = () => `m${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export async function parseMsg(
  buffer: ArrayBuffer,
  sourceFileName: string,
): Promise<ParsedEmail> {
  const { default: MsgReader } = await import("@kenjiuno/msgreader");
  const reader: MsgReaderType = new MsgReader(buffer);
  const fields = reader.getFileData();

  if (fields.error) {
    throw new Error(fields.error);
  }

  const warnings: string[] = [];
  const headers = fields.headers ?? "";
  const headerPairs = parseHeaderBlock(headers);

  const { to, cc, bcc } = resolveRecipients(fields);
  const body = await resolveBody(fields, warnings);

  const attachments: Attachment[] = [];
  for (const [index, meta] of (fields.attachments ?? []).entries()) {
    const fileName =
      meta.fileName || meta.fileNameShort || meta.name || `attachment-${index + 1}`;
    try {
      const data = reader.getAttachment(meta);
      const content = data.content ?? new Uint8Array();
      const isEmbedded = meta.innerMsgContent === true;
      const resolvedName = isEmbedded
        ? ensureExtension(data.fileName || fileName, "msg")
        : data.fileName || fileName;
      const contentId = meta.pidContentId?.replace(/^<|>$/g, "");

      attachments.push({
        id: `${index}`,
        fileName: resolvedName,
        mimeType: guessMimeType(resolvedName, meta.attachMimeTag),
        size: content.length || meta.contentLength || 0,
        content,
        contentId,
        // Outlook marks body images either with a content id or the hidden flag.
        inline: Boolean(contentId) || meta.attachmentHidden === true,
        isEmbeddedMessage: isEmbedded,
      });
    } catch {
      warnings.push(`Attachment "${fileName}" could not be extracted and was skipped.`);
    }
  }

  const messageClass = fields.messageClass ?? "";
  const itemKind = classifyItem(messageClass);

  const sent = parseDate(fields.clientSubmitTime);
  const received = parseDate(fields.messageDeliveryTime);
  const created = parseDate(fields.creationTime);
  const date = sent ?? received ?? created;
  const dateLabel = sent ? "sent" : received ? "received" : created ? "created" : null;

  return {
    id: nextId(),
    sourceFileName,
    sourceFormat: "msg",
    sourceSize: buffer.byteLength,
    subject: decodeWords(fields.subject ?? "").trim(),
    from: resolveSender(fields, headerPairs),
    to,
    cc,
    bcc,
    replyTo: parseAddressList(findHeader(headerPairs, "reply-to")),
    date,
    dateLabel,
    bodyKind: body.kind,
    body: body.value,
    bodyText: "",
    bodySource: body.source,
    attachments,
    headers,
    headerPairs,
    messageClass,
    itemKind,
    // Attendees on a meeting are the same recipient list mail uses.
    ...(itemKind === "meeting" || itemKind === "appointment"
      ? { appointment: extractAppointment(fields, [...to, ...cc]) }
      : {}),
    ...(itemKind === "contact" ? { contact: extractContact(fields) } : {}),
    importance: readImportance(headerPairs),
    hasAttachments: attachments.some((a) => !a.inline),
    warnings,
  };
}

function ensureExtension(name: string, ext: string): string {
  return name.toLowerCase().endsWith(`.${ext}`) ? name : `${name}.${ext}`;
}
