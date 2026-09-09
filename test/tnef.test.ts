import { describe, expect, it } from "vitest";
import { detectFormat, parseEmailFile } from "@/lib/email/parse";
import { isTnef, parseTnef } from "@/lib/email/tnef";
import { buildTnef, binary, boolean as bool, uni, type TnefProp } from "./helpers/buildTnef";

/**
 * `winmail.dat` is the file people receive when Outlook could not express a
 * Rich Text message in plain MIME. The formatted body and — the part that
 * actually hurts — every real attachment end up inside it, and the recipient
 * sees one file that nothing opens.
 */

const TAG = {
  subject: 0x0037,
  body: 0x1000,
  html: 0x1013,
  senderName: 0x0c1a,
  senderSmtp: 0x5d01,
  attachLongFilename: 0x3707,
  attachMimeTag: 0x370e,
  attachContentId: 0x3712,
  attachmentHidden: 0x7ffe,
};

const parse = (buffer: ArrayBuffer) => parseTnef(buffer, "winmail.dat");

describe("TNEF detection", () => {
  it("recognises the signature regardless of file name", () => {
    const buffer = buildTnef({ subject: "x" });
    expect(isTnef(buffer)).toBe(true);
    expect(detectFormat(buffer, "renamed.txt")).toBe("tnef");
  });

  it("does not claim an unrelated binary", () => {
    const other = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).buffer;
    expect(isTnef(other)).toBe(false);
  });

  it("routes a winmail.dat through parseEmailFile", async () => {
    const file = new File([buildTnef({ subject: "Routed" })], "winmail.dat");
    const email = await parseEmailFile(file);
    expect(email.sourceFormat).toBe("tnef");
    expect(email.subject).toBe("Routed");
  });
});

describe("parseTnef", () => {
  it("reads the message attributes", async () => {
    const email = await parse(
      buildTnef({
        subject: "Invoice attached",
        body: "See attached.",
        senderName: "Dana Whitfield",
        dateSent: new Date("2026-03-12T09:24:00Z"),
      }),
    );
    expect(email.subject).toBe("Invoice attached");
    expect(email.body).toContain("See attached.");
    expect(email.bodySource).toBe("text");
    expect(email.from?.name).toBe("Dana Whitfield");
    expect(email.date?.toISOString()).toBe("2026-03-12T09:24:00.000Z");
  });

  it("prefers MAPI properties over the legacy attributes", async () => {
    // Outlook writes both; the property blob is the accurate one and carries
    // Unicode, where the legacy attribute is single-byte.
    const email = await parse(
      buildTnef({
        subject: "legacy",
        msgProps: new Map<number, TnefProp>([
          [TAG.subject, uni("中文標題")],
          [TAG.senderSmtp, uni("dana@northwind.example")],
          [TAG.senderName, uni("Dana Whitfield")],
        ]),
      }),
    );
    expect(email.subject).toBe("中文標題");
    expect(email.from).toEqual({
      name: "Dana Whitfield",
      address: "dana@northwind.example",
    });
  });

  it("extracts attachments, which is the whole point of opening one", async () => {
    const pdf = new TextEncoder().encode("%PDF-1.4 invoice");
    const email = await parse(
      buildTnef({
        subject: "Invoice",
        attachments: [
          {
            title: "INVOIC~1.PDF",
            data: pdf,
            props: new Map<number, TnefProp>([
              [TAG.attachLongFilename, uni("Invoice 2026-03.pdf")],
              [TAG.attachMimeTag, uni("application/pdf")],
            ]),
          },
        ],
      }),
    );

    expect(email.attachments).toHaveLength(1);
    // The long name beats the 8.3 title stored in the legacy attribute.
    expect(email.attachments[0].fileName).toBe("Invoice 2026-03.pdf");
    expect(email.attachments[0].mimeType).toBe("application/pdf");
    expect([...email.attachments[0].content]).toEqual([...pdf]);
    expect(email.hasAttachments).toBe(true);
  });

  it("falls back to the 8.3 title when no long name is stored", async () => {
    const email = await parse(
      buildTnef({
        attachments: [{ title: "REPORT~1.XLS", data: new Uint8Array([1, 2, 3]) }],
      }),
    );
    expect(email.attachments[0].fileName).toBe("REPORT~1.XLS");
    // The mime type is still inferred from the extension.
    expect(email.attachments[0].mimeType).toBe("application/vnd.ms-excel");
  });

  it("keeps several attachments separate", async () => {
    const email = await parse(
      buildTnef({
        attachments: [
          { title: "a.txt", data: new TextEncoder().encode("first") },
          { title: "b.txt", data: new TextEncoder().encode("second") },
          { title: "c.txt", data: new TextEncoder().encode("third") },
        ],
      }),
    );
    expect(email.attachments.map((a) => a.fileName)).toEqual(["a.txt", "b.txt", "c.txt"]);
    expect(new TextDecoder().decode(email.attachments[1].content)).toBe("second");
  });

  it("marks a content-id attachment as inline", async () => {
    const email = await parse(
      buildTnef({
        attachments: [
          {
            title: "logo.png",
            data: new Uint8Array([1, 2, 3, 4]),
            props: new Map<number, TnefProp>([[TAG.attachContentId, uni("<logo@01D9>")]]),
          },
          { title: "real.pdf", data: new Uint8Array([5, 6]) },
        ],
      }),
    );
    expect(email.attachments[0].inline).toBe(true);
    expect(email.attachments[0].contentId).toBe("logo@01D9");
    expect(email.attachments[1].inline).toBe(false);
  });

  it("honours the hidden flag", async () => {
    const email = await parse(
      buildTnef({
        attachments: [
          {
            title: "sig.png",
            data: new Uint8Array([1]),
            props: new Map<number, TnefProp>([[TAG.attachmentHidden, bool(true)]]),
          },
        ],
      }),
    );
    expect(email.attachments[0].inline).toBe(true);
    expect(email.hasAttachments).toBe(false);
  });

  it("prefers an HTML body over plain text", async () => {
    const email = await parse(
      buildTnef({
        body: "plain fallback",
        msgProps: new Map<number, TnefProp>([
          [TAG.html, binary(new TextEncoder().encode("<p>rich</p>"))],
        ]),
      }),
    );
    expect(email.bodyKind).toBe("html");
    expect(email.bodySource).toBe("html");
    expect(email.body).toBe("<p>rich</p>");
  });

  it("reports no recipients rather than inventing them", async () => {
    // TNEF is an attachment inside a carrying message; the recipient list
    // lived in that message's headers, which this file does not contain.
    const email = await parse(buildTnef({ subject: "x" }));
    expect(email.to).toEqual([]);
    expect(email.cc).toEqual([]);
    expect(email.headerPairs).toEqual([]);
  });

  it("warns about an attachment that carried no data", async () => {
    const email = await parse(
      buildTnef({ attachments: [{ title: "empty.bin" }, { title: "ok.bin", data: new Uint8Array([1]) }] }),
    );
    expect(email.attachments).toHaveLength(1);
    expect(email.warnings.join(" ")).toMatch(/skipped/i);
  });

  it("stops cleanly on a truncated stream instead of throwing", async () => {
    // Mail gateways do truncate these. Half a file should still yield whatever
    // was readable before the cut.
    const full = new Uint8Array(
      buildTnef({ subject: "Truncated", attachments: [{ title: "a.txt", data: new Uint8Array(50) }] }),
    );
    const cut = full.slice(0, Math.floor(full.byteLength * 0.6));
    const buffer = new ArrayBuffer(cut.byteLength);
    new Uint8Array(buffer).set(cut);

    const email = await parse(buffer);
    expect(email.subject).toBe("Truncated");
  });

  it("rejects a stream without the signature", () => {
    const bogus = new ArrayBuffer(16);
    return expect(parseTnef(bogus, "x.dat")).rejects.toThrow();
  });
});
