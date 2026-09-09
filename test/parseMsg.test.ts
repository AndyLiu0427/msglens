import { describe, expect, it } from "vitest";
import { parseMsg } from "@/lib/email/parseMsg";
import { buildMsg, bin, bool, i32, str, time, TAG, type PropValue } from "./helpers/buildMsg";

const parse = (buffer: ArrayBuffer) => parseMsg(buffer, "test.msg");
const utf8 = (s: string) => new TextEncoder().encode(s);

describe("parseMsg body resolution", () => {
  it("prefers PidTagHtml over the plain-text body", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.body, str("plain fallback")],
          [TAG.html, bin(utf8("<p>rich</p>"))],
          [TAG.internetCodepage, i32(65001)],
        ]),
      }),
    );
    expect(email.bodySource).toBe("html");
    expect(email.body).toContain("<p>rich</p>");
  });

  it("decodes PidTagHtml with the declared code page", async () => {
    // Assuming UTF-8 is what turns CJK, Cyrillic and Greek mail into mojibake.
    const big5 = new Uint8Array([0x3c, 0x70, 0x3e, 0xa4, 0xa4, 0x3c, 0x2f, 0x70, 0x3e]);
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.html, bin(big5)],
          [TAG.internetCodepage, i32(950)],
        ]),
      }),
    );
    expect(email.body).toBe("<p>中</p>");
  });

  it("falls back to plain text when no HTML or RTF is present", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.body, str("just text")],
        ]),
      }),
    );
    expect(email.bodySource).toBe("text");
    expect(email.bodyKind).toBe("text");
    expect(email.body).toBe("just text");
  });

  it("reports no body rather than inventing one", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([[TAG.messageClass, str("IPM.Note")]]),
      }),
    );
    expect(email.bodySource).toBe("none");
    expect(email.body).toBe("");
  });
});

describe("parseMsg addresses", () => {
  it("resolves the sender from the SMTP address property", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.senderName, str("Dana Whitfield")],
          [TAG.senderAddressType, str("SMTP")],
          [TAG.senderEmail, str("dana@northwind.example")],
        ]),
      }),
    );
    expect(email.from).toEqual({
      name: "Dana Whitfield",
      address: "dana@northwind.example",
    });
  });

  it("does not present an Exchange legacy DN as an email address", async () => {
    // /O=…/CN=… is not something a reader can mail to; showing it as an
    // address is worse than showing the display name alone.
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.senderName, str("Internal User")],
          [TAG.senderEmail, str("/O=EXCHANGELABS/OU=EAG/CN=RECIPIENTS/CN=abc")],
        ]),
      }),
    );
    expect(email.from?.address).toBe("");
    expect(email.from?.name).toBe("Internal User");
  });

  it("splits recipients by type", async () => {
    const recip = (name: string, address: string, type: number) =>
      new Map<number, PropValue>([
        [TAG.displayName, str(name)],
        [TAG.addressType, str("SMTP")],
        [TAG.emailAddress, str(address)],
        [TAG.recipientType, i32(type)],
      ]);
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([[TAG.messageClass, str("IPM.Note")]]),
        recipients: [
          recip("To Person", "to@example.com", 1),
          recip("Cc Person", "cc@example.com", 2),
          recip("Bcc Person", "bcc@example.com", 3),
        ],
      }),
    );
    expect(email.to.map((r) => r.address)).toEqual(["to@example.com"]);
    expect(email.cc.map((r) => r.address)).toEqual(["cc@example.com"]);
    expect(email.bcc.map((r) => r.address)).toEqual(["bcc@example.com"]);
  });
});

describe("parseMsg attachments", () => {
  const attachment = (extra: Array<[number, PropValue]>) =>
    new Map<number, PropValue>([
      [TAG.attachLongFilename, str("report.pdf")],
      [TAG.attachExtension, str(".pdf")],
      [TAG.attachData, bin(utf8("%PDF-1.4 fake"))],
      ...extra,
    ]);

  it("extracts content and infers a mime type from the extension", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([[TAG.messageClass, str("IPM.Note")]]),
        attachments: [attachment([])],
      }),
    );
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments[0].fileName).toBe("report.pdf");
    expect(email.attachments[0].mimeType).toBe("application/pdf");
    expect(email.attachments[0].size).toBeGreaterThan(0);
  });

  it("marks an attachment with a content id as inline", async () => {
    // Body images are attachments too. Listing them next to real attachments
    // buries the document the reader actually wants.
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([[TAG.messageClass, str("IPM.Note")]]),
        attachments: [
          attachment([[TAG.attachContentId, str("image001@01D9")]]),
          attachment([]),
        ],
      }),
    );
    expect(email.attachments[0].inline).toBe(true);
    expect(email.attachments[0].contentId).toBe("image001@01D9");
    expect(email.attachments[1].inline).toBe(false);
    expect(email.hasAttachments).toBe(true);
  });

  it("treats the hidden flag as inline as well", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([[TAG.messageClass, str("IPM.Note")]]),
        attachments: [attachment([[TAG.attachmentHidden, bool(true)]])],
      }),
    );
    expect(email.attachments[0].inline).toBe(true);
    expect(email.hasAttachments).toBe(false);
  });
});

describe("parseMsg metadata", () => {
  it("labels the date by which timestamp it came from", async () => {
    const sent = new Date("2026-03-12T09:24:00Z");
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.clientSubmitTime, time(sent)],
        ]),
      }),
    );
    expect(email.dateLabel).toBe("sent");
    expect(email.date?.toISOString()).toBe(sent.toISOString());
  });

  it("falls back to creation time and says so", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.creationTime, time(new Date("2026-01-05T00:00:00Z"))],
        ]),
      }),
    );
    expect(email.dateLabel).toBe("created");
  });

  it("parses internet headers into ordered pairs", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [
            TAG.transportHeaders,
            str("From: a@b.c\r\nSubject: Hi\r\n\tcontinued\r\nX-Note: v\r\n"),
          ],
        ]),
      }),
    );
    expect(email.headerPairs.map((p) => p.name)).toEqual(["From", "Subject", "X-Note"]);
    // Folded continuation lines belong to the header they continue.
    expect(email.headerPairs[1].value).toBe("Hi continued");
  });

  it("decodes RFC 2047 encoded words in the subject", async () => {
    const email = await parse(
      buildMsg({
        props: new Map<number, PropValue>([
          [TAG.messageClass, str("IPM.Note")],
          [TAG.subject, str("=?utf-8?B?5Lit5paH5qiZ6aGM?=")],
        ]),
      }),
    );
    expect(email.subject).toBe("中文標題");
  });
});
