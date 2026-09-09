/**
 * TNEF (`winmail.dat`) reader — [MS-OXTNEF].
 *
 * When Outlook sends in Rich Text format to a recipient whose server does not
 * negotiate it, everything Outlook could not express in plain MIME is bundled
 * into a single `winmail.dat` attachment: the formatted body and, more
 * painfully, every real attachment. The recipient sees one file nothing opens
 * and their actual documents are gone.
 *
 * Structurally this is nothing like a `.msg`. There is no compound file — the
 * whole thing is a flat sequence of length-prefixed attributes, some of which
 * carry a serialised MAPI property blob.
 */

import type { Attachment, EmailAddress, ParsedEmail } from "./types";
import { guessMimeType } from "./mime";
import { decodeWords, makeAddress } from "./headers";
import { rtfBodyFromCompressed } from "./rtf";

/** First four bytes of every TNEF stream, little-endian. */
export const TNEF_SIGNATURE = 0x223e9f78;

const LVL_MESSAGE = 0x01;
const LVL_ATTACHMENT = 0x02;

// Attribute ids, as the combined (type << 16) | id value stored in the stream.
const ATT_FROM = 0x00008000;
const ATT_SUBJECT = 0x00018004;
const ATT_DATE_SENT = 0x00038005;
const ATT_MSG_CLASS = 0x00078008;
const ATT_BODY = 0x0000800c;
const ATT_MSG_PROPS = 0x00069003;
const ATT_ATTACH_RENDDATA = 0x00069002;
const ATT_ATTACH_TITLE = 0x00018010;
const ATT_ATTACH_DATA = 0x0006800f;
const ATT_ATTACHMENT = 0x00069005;

// MAPI property types.
const PT_SHORT = 0x0002;
const PT_LONG = 0x0003;
const PT_FLOAT = 0x0004;
const PT_DOUBLE = 0x0005;
const PT_BOOLEAN = 0x000b;
const PT_CURRENCY = 0x0006;
const PT_APPTIME = 0x0007;
const PT_INT64 = 0x0014;
const PT_SYSTIME = 0x0040;
const PT_CLSID = 0x0048;
const PT_STRING8 = 0x001e;
const PT_UNICODE = 0x001f;
const PT_BINARY = 0x0102;
const PT_OBJECT = 0x000d;
const MV_FLAG = 0x1000;

/** Property tags this reader cares about. */
const TAG = {
  subject: 0x0037,
  messageClass: 0x001a,
  body: 0x1000,
  html: 0x1013,
  rtfCompressed: 0x1009,
  senderName: 0x0c1a,
  senderEmail: 0x0c1f,
  senderSmtp: 0x5d01,
  internetCodepage: 0x3fde,
  attachLongFilename: 0x3707,
  attachFilename: 0x3704,
  attachMimeTag: 0x370e,
  attachContentId: 0x3712,
  attachmentHidden: 0x7ffe,
} as const;

type PropMap = Map<number, string | Uint8Array | number | boolean>;

class Cursor {
  offset = 0;
  constructor(readonly view: DataView) {}
  get remaining() {
    return this.view.byteLength - this.offset;
  }
  u8() {
    return this.view.getUint8(this.offset++);
  }
  u16() {
    const v = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return v;
  }
  u32() {
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }
  bytes(length: number): Uint8Array {
    const start = this.view.byteOffset + this.offset;
    this.offset += length;
    return new Uint8Array(this.view.buffer, start, length);
  }
  /** Values are padded to a 4-byte boundary. */
  align4() {
    this.offset += (4 - (this.offset % 4)) % 4;
  }
}

function decodeString(bytes: Uint8Array, unicode: boolean, codepage?: number): string {
  // Trailing NULs are part of the stored length, not the value — but they have
  // to be trimmed in whole code units. In UTF-16LE every Latin character has a
  // 0x00 high byte, so trimming byte-wise eats the last character's high byte
  // and leaves an odd-length buffer, decoding the final letter as U+FFFD.
  const unit = unicode ? 2 : 1;
  let end = bytes.length - (bytes.length % unit);
  while (end >= unit && bytes.subarray(end - unit, end).every((b) => b === 0)) {
    end -= unit;
  }
  const slice = bytes.subarray(0, end);
  if (unicode) return new TextDecoder("utf-16le", { fatal: false }).decode(slice);
  const label = codepage === 65001 ? "utf-8" : "windows-1252";
  return new TextDecoder(label, { fatal: false }).decode(slice);
}

/**
 * Parse a serialised MAPI property blob (MS-OXTNEF §2.1.3.9).
 *
 * Named properties (id >= 0x8000) carry a GUID and either a numeric or string
 * name before their value. Nothing here needs them, but the bytes still have
 * to be stepped over or every subsequent property is misread.
 */
function parseProps(data: Uint8Array, codepage?: number): PropMap {
  const props: PropMap = new Map();
  if (data.byteLength < 4) return props;

  const c = new Cursor(new DataView(data.buffer, data.byteOffset, data.byteLength));
  let count: number;
  try {
    count = c.u32();
  } catch {
    return props;
  }

  for (let i = 0; i < count && c.remaining > 4; i++) {
    let type: number;
    let id: number;
    try {
      type = c.u16();
      id = c.u16();
    } catch {
      break;
    }

    const isMulti = (type & MV_FLAG) !== 0;
    const baseType = type & ~MV_FLAG;

    try {
      if (id >= 0x8000) {
        c.offset += 16; // property set GUID
        const kind = c.u32();
        if (kind === 0) {
          c.offset += 4; // numeric name
        } else {
          const nameLength = c.u32();
          c.offset += nameLength;
          c.align4();
        }
      }

      const variable =
        baseType === PT_STRING8 ||
        baseType === PT_UNICODE ||
        baseType === PT_BINARY ||
        baseType === PT_OBJECT;

      if (variable) {
        // Variable-length values always carry a count, even when single-valued.
        const valueCount = c.u32();
        let first: Uint8Array | undefined;
        for (let v = 0; v < valueCount && c.remaining >= 4; v++) {
          const length = c.u32();
          if (length > c.remaining) break;
          const bytes = c.bytes(length);
          c.align4();
          if (v === 0) first = bytes;
        }
        if (first) {
          props.set(
            id,
            baseType === PT_BINARY || baseType === PT_OBJECT
              ? first.slice()
              : decodeString(first, baseType === PT_UNICODE, codepage),
          );
        }
        continue;
      }

      const valueCount = isMulti ? c.u32() : 1;
      for (let v = 0; v < valueCount && c.remaining > 0; v++) {
        if (baseType === PT_SYSTIME || baseType === PT_INT64 ||
            baseType === PT_CURRENCY || baseType === PT_DOUBLE ||
            baseType === PT_APPTIME) {
          c.offset += 8;
        } else if (baseType === PT_CLSID) {
          c.offset += 16;
        } else {
          // SHORT, LONG, BOOLEAN and FLOAT all occupy a padded 4 bytes.
          const value = c.u32();
          if (v === 0) {
            if (baseType === PT_BOOLEAN) props.set(id, value !== 0);
            else if (baseType === PT_LONG || baseType === PT_SHORT || baseType === PT_FLOAT) {
              props.set(id, value);
            }
          }
        }
      }
    } catch {
      break;
    }
  }
  return props;
}

interface TnefAttachment {
  props: PropMap;
  title?: string;
  data?: Uint8Array;
}

let idCounter = 0;
const nextId = () => `t${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export function isTnef(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 6) return false;
  return new DataView(buffer).getUint32(0, true) === TNEF_SIGNATURE;
}

export async function parseTnef(
  buffer: ArrayBuffer,
  sourceFileName: string,
): Promise<ParsedEmail> {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== TNEF_SIGNATURE) {
    throw new Error("Not a TNEF stream");
  }

  const c = new Cursor(view);
  c.offset = 6; // signature + legacy attachment key

  const warnings: string[] = [];
  let messageProps: PropMap = new Map();
  const attachmentsRaw: TnefAttachment[] = [];
  let subject = "";
  let messageClass = "";
  let bodyText = "";
  let senderName = "";
  let senderEmail = "";
  let dateSent: Date | null = null;

  while (c.remaining > 9) {
    const level = c.u8();
    if (level !== LVL_MESSAGE && level !== LVL_ATTACHMENT) break;

    const attId = c.u32();
    const length = c.u32();
    if (length < 0 || length > c.remaining) break;
    const data = c.bytes(length);
    c.offset += 2; // per-attribute checksum, not worth verifying

    if (level === LVL_ATTACHMENT) {
      // attAttachRenddata marks the start of each attachment.
      if (attId === ATT_ATTACH_RENDDATA) attachmentsRaw.push({ props: new Map() });
      const current = attachmentsRaw[attachmentsRaw.length - 1];
      if (!current) continue;

      if (attId === ATT_ATTACH_TITLE) current.title = decodeString(data, false);
      else if (attId === ATT_ATTACH_DATA) current.data = data.slice();
      else if (attId === ATT_ATTACHMENT) {
        for (const [k, v] of parseProps(data)) current.props.set(k, v);
      }
      continue;
    }

    switch (attId) {
      case ATT_SUBJECT:
        subject = decodeString(data, false);
        break;
      case ATT_MSG_CLASS:
        messageClass = decodeString(data, false);
        break;
      case ATT_BODY:
        bodyText = decodeString(data, false);
        break;
      case ATT_FROM:
        // attFrom is a TRIPLE structure; the display name follows a 2-byte
        // component count and a 2-byte length.
        senderName = decodeString(data.subarray(4), false).split("\0")[0] ?? "";
        break;
      case ATT_DATE_SENT: {
        // A 14-byte DTR: year, month, day, hour, minute, second, weekday.
        if (data.byteLength >= 12) {
          const d = new DataView(data.buffer, data.byteOffset, data.byteLength);
          const parsed = new Date(
            Date.UTC(d.getUint16(0, true), d.getUint16(2, true) - 1, d.getUint16(4, true),
              d.getUint16(6, true), d.getUint16(8, true), d.getUint16(10, true)),
          );
          if (!Number.isNaN(parsed.getTime())) dateSent = parsed;
        }
        break;
      }
      case ATT_MSG_PROPS:
        messageProps = parseProps(data);
        break;
    }
  }

  const codepage = messageProps.get(TAG.internetCodepage);
  const asString = (v: unknown) => (typeof v === "string" ? v : "");

  subject = decodeWords(asString(messageProps.get(TAG.subject)) || subject).trim();
  messageClass = asString(messageProps.get(TAG.messageClass)) || messageClass;
  senderName = asString(messageProps.get(TAG.senderName)) || senderName;
  senderEmail =
    asString(messageProps.get(TAG.senderSmtp)) ||
    asString(messageProps.get(TAG.senderEmail)) ||
    senderEmail;

  // Body, through the same precedence the .msg reader uses.
  let body = "";
  let bodyKind: ParsedEmail["bodyKind"] = "text";
  let bodySource: ParsedEmail["bodySource"] = "none";

  const htmlProp = messageProps.get(TAG.html);
  if (htmlProp instanceof Uint8Array && htmlProp.byteLength > 0) {
    body = decodeString(htmlProp, false, typeof codepage === "number" ? codepage : undefined);
    bodyKind = "html";
    bodySource = "html";
  }

  if (!body) {
    const rtf = messageProps.get(TAG.rtfCompressed);
    if (rtf instanceof Uint8Array && rtf.byteLength > 0) {
      const recovered = await rtfBodyFromCompressed(rtf);
      if (recovered) {
        body = recovered.content;
        bodyKind = recovered.mode;
        bodySource = "rtf";
      }
    }
  }

  if (!body) {
    const plain = asString(messageProps.get(TAG.body)) || bodyText;
    if (plain.trim()) {
      body = plain;
      bodyKind = "text";
      bodySource = "text";
    }
  }

  const attachments: Attachment[] = attachmentsRaw
    .filter((a) => a.data && a.data.byteLength > 0)
    .map((a, index) => {
      const fileName =
        asString(a.props.get(TAG.attachLongFilename)) ||
        asString(a.props.get(TAG.attachFilename)) ||
        a.title ||
        `attachment-${index + 1}`;
      const contentId = asString(a.props.get(TAG.attachContentId)).replace(/^<|>$/g, "");
      return {
        id: `${index}`,
        fileName,
        mimeType: guessMimeType(fileName, asString(a.props.get(TAG.attachMimeTag))),
        size: a.data!.byteLength,
        content: a.data!,
        contentId: contentId || undefined,
        inline: Boolean(contentId) || a.props.get(TAG.attachmentHidden) === true,
        isEmbeddedMessage: /\.msg$/i.test(fileName),
      };
    });

  if (attachmentsRaw.length > attachments.length) {
    warnings.push(
      `${attachmentsRaw.length - attachments.length} attachment(s) in this winmail.dat had no data and were skipped.`,
    );
  }

  const from: EmailAddress | null = makeAddress(senderName, senderEmail);

  return {
    id: nextId(),
    sourceFileName,
    sourceFormat: "tnef",
    sourceSize: buffer.byteLength,
    subject,
    from,
    // TNEF preserves the sender but not the recipient list — those stayed in
    // the carrying message's own headers, which this file does not contain.
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    date: dateSent,
    dateLabel: dateSent ? "sent" : null,
    bodyKind,
    body,
    bodyText: bodyKind === "text" ? body : bodyText,
    bodySource,
    attachments,
    headers: "",
    headerPairs: [],
    messageClass: messageClass || "IPM.Note",
    itemKind: "note",
    importance: null,
    hasAttachments: attachments.some((a) => !a.inline),
    warnings,
  };
}
