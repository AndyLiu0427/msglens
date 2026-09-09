/**
 * RFC 822 `.eml` / MIME -> ParsedEmail.
 *
 * Supporting .eml alongside .msg costs little and covers the very common case
 * of a user having a mix of exports from Outlook, Thunderbird and Gmail.
 */

import type { Address, Attachment as PmAttachment, Mailbox } from "postal-mime";
import type { Attachment, EmailAddress, ParsedEmail } from "./types";
import { guessMimeType } from "./mime";
import { makeAddress, parseHeaderBlock } from "./headers";

function flattenAddresses(input: Address[] | Address | undefined): EmailAddress[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  const out: EmailAddress[] = [];
  for (const entry of list) {
    if ("group" in entry && entry.group) {
      for (const member of entry.group as Mailbox[]) {
        const addr = makeAddress(member.name, member.address);
        if (addr) out.push(addr);
      }
      continue;
    }
    const addr = makeAddress(entry.name, (entry as Mailbox).address);
    if (addr) out.push(addr);
  }
  return out;
}

function toUint8(content: PmAttachment["content"]): Uint8Array {
  if (content instanceof Uint8Array) return content;
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  return new TextEncoder().encode(String(content));
}

let idCounter = 0;
const nextId = () => `e${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export async function parseEml(
  buffer: ArrayBuffer,
  sourceFileName: string,
): Promise<ParsedEmail> {
  const { default: PostalMime } = await import("postal-mime");
  const email = await PostalMime.parse(buffer, { attachmentEncoding: "arraybuffer" });

  const warnings: string[] = [];

  const attachments: Attachment[] = (email.attachments ?? []).map((att, index) => {
    const fileName = att.filename?.trim() || `attachment-${index + 1}`;
    const content = toUint8(att.content);
    const contentId = att.contentId?.replace(/^<|>$/g, "");
    return {
      id: `${index}`,
      fileName,
      mimeType: guessMimeType(fileName, att.mimeType),
      size: content.length,
      content,
      contentId,
      inline: att.disposition === "inline" || Boolean(att.related) || Boolean(contentId),
      isEmbeddedMessage: att.mimeType === "message/rfc822",
    };
  });

  const headers = (email.headerLines ?? []).map((h) => h.line).join("\r\n");
  const headerPairs =
    (email.headers ?? []).length > 0
      ? email.headers.map((h) => ({ name: h.originalKey || h.key, value: h.value }))
      : parseHeaderBlock(headers);

  const hasHtml = Boolean(email.html?.trim());
  const hasText = Boolean(email.text?.trim());
  if (!hasHtml && !hasText) warnings.push("This message has no readable body content.");

  const date = email.date ? new Date(email.date) : null;

  const importanceHeader = email.headers
    ?.find((h) => h.key === "importance" || h.key === "x-priority")
    ?.value?.toLowerCase();

  return {
    id: nextId(),
    sourceFileName,
    sourceFormat: "eml",
    sourceSize: buffer.byteLength,
    subject: (email.subject ?? "").trim(),
    from: flattenAddresses(email.from)[0] ?? null,
    to: flattenAddresses(email.to),
    cc: flattenAddresses(email.cc),
    bcc: flattenAddresses(email.bcc),
    replyTo: flattenAddresses(email.replyTo),
    date: date && !Number.isNaN(date.getTime()) ? date : null,
    dateLabel: date ? "sent" : null,
    bodyKind: hasHtml ? "html" : "text",
    body: hasHtml ? email.html! : (email.text ?? ""),
    bodyText: email.text ?? "",
    bodySource: hasHtml ? "html" : hasText ? "text" : "none",
    attachments,
    headers,
    headerPairs,
    messageClass: "IPM.Note",
    // RFC 822 has no concept of non-mail items.
    itemKind: "note",
    importance:
      importanceHeader === "high" || importanceHeader === "1" || importanceHeader === "2"
        ? "high"
        : importanceHeader === "low" || importanceHeader === "4" || importanceHeader === "5"
          ? "low"
          : importanceHeader
            ? "normal"
            : null,
    hasAttachments: attachments.some((a) => !a.inline),
    warnings,
  };
}
