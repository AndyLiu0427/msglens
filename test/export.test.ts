import { describe, expect, it } from "vitest";
import { buildEml, buildPlainText, safeFileName } from "@/lib/email/export";
import { parseEml } from "@/lib/email/parseEml";
import type { ParsedEmail } from "@/lib/email/types";

/**
 * A broken export is silent: the download succeeds and the damage only shows
 * up later, in whatever the reader opens it with. The strongest check is a
 * round trip — build an .eml, parse it back, and compare.
 */

const message = (overrides: Partial<ParsedEmail> = {}): ParsedEmail => ({
  id: "1",
  sourceFileName: "test.msg",
  sourceFormat: "msg",
  sourceSize: 100,
  subject: "Q3 supplier review",
  from: { name: "Dana Whitfield", address: "dana@northwind.example" },
  to: [{ name: "Sam Okafor", address: "sam@example.com" }],
  cc: [],
  bcc: [],
  replyTo: [],
  date: new Date("2026-03-12T09:24:00Z"),
  dateLabel: "sent",
  bodyKind: "html",
  body: "<p>Body <b>here</b></p>",
  bodyText: "Body here",
  bodySource: "html",
  attachments: [],
  headers: "",
  headerPairs: [],
  messageClass: "IPM.Note",
  itemKind: "note",
  importance: null,
  hasAttachments: false,
  warnings: [],
  ...overrides,
});

const reparse = async (blob: Blob) =>
  parseEml(await blob.arrayBuffer(), "roundtrip.eml");

describe("buildEml", () => {
  it("round-trips addresses, subject and body", async () => {
    const email = await reparse(buildEml(message()));
    expect(email.from?.address).toBe("dana@northwind.example");
    expect(email.to[0].address).toBe("sam@example.com");
    expect(email.subject).toBe("Q3 supplier review");
    expect(email.body).toContain("<b>here</b>");
  });

  it("encodes non-ASCII headers so they survive transport", async () => {
    // A raw UTF-8 subject in a header is not legal and gets mangled by some
    // clients; RFC 2047 encoded words are the portable form.
    const email = await reparse(buildEml(message({ subject: "中文標題" })));
    expect(email.subject).toBe("中文標題");
  });

  it("leaves plain ASCII headers human-readable", async () => {
    const text = await buildEml(message()).text();
    expect(text).toContain("Subject: Q3 supplier review");
    expect(text).not.toContain("=?utf-8?B?");
  });

  it("writes both a text and an HTML alternative", async () => {
    const email = await reparse(buildEml(message()));
    expect(email.body).toContain("Body <b>here</b>");
    expect(email.bodyText).toContain("Body here");
  });

  it("round-trips attachment bytes exactly", async () => {
    const content = new Uint8Array([0, 1, 2, 253, 254, 255]);
    const email = await reparse(
      buildEml(
        message({
          attachments: [
            {
              id: "0",
              fileName: "data.bin",
              mimeType: "application/octet-stream",
              size: content.length,
              content,
              inline: false,
              isEmbeddedMessage: false,
            },
          ],
          hasAttachments: true,
        }),
      ),
    );
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments[0].fileName).toBe("data.bin");
    // Byte-for-byte: base64 chunking bugs show up here and nowhere else.
    expect([...email.attachments[0].content]).toEqual([...content]);
  });

  it("keeps inline images inline, with their content id", async () => {
    const email = await reparse(
      buildEml(
        message({
          attachments: [
            {
              id: "0",
              fileName: "logo.png",
              mimeType: "image/png",
              size: 4,
              content: new Uint8Array([1, 2, 3, 4]),
              contentId: "logo@01D9",
              inline: true,
              isEmbeddedMessage: false,
            },
          ],
        }),
      ),
    );
    expect(email.attachments[0].contentId).toBe("logo@01D9");
    expect(email.attachments[0].inline).toBe(true);
  });

  it("handles an attachment large enough to cross the base64 chunk boundary", async () => {
    // toBase64 walks the array in 0x8000-byte chunks; an off-by-one there
    // corrupts everything past the first chunk.
    const content = new Uint8Array(70000).map((_, i) => i % 256);
    const email = await reparse(
      buildEml(
        message({
          attachments: [
            {
              id: "0",
              fileName: "big.bin",
              mimeType: "application/octet-stream",
              size: content.length,
              content,
              inline: false,
              isEmbeddedMessage: false,
            },
          ],
        }),
      ),
    );
    expect(email.attachments[0].content.length).toBe(content.length);
    expect(email.attachments[0].content[69999]).toBe(content[69999]);
  });
});

describe("buildPlainText", () => {
  it("includes the header block above the body", async () => {
    const text = await buildPlainText(message()).text();
    expect(text).toContain("From: Dana Whitfield <dana@northwind.example>");
    expect(text).toContain("Subject: Q3 supplier review");
    expect(text).toContain("Body here");
  });
});

describe("safeFileName", () => {
  it("strips characters that are illegal in file names", () => {
    expect(safeFileName('a/b:c*d?e"f<g>h|i', "fallback", "eml")).not.toMatch(
      /[\\/:*?"<>|]/,
    );
  });

  it("falls back when the subject is empty", () => {
    expect(safeFileName("", "message", "eml")).toBe("message.eml");
  });

  it("does not leave a trailing dot or space, which Windows rejects", () => {
    expect(safeFileName("Report. ", "message", "eml")).toBe("Report.eml");
  });
});
