import { describe, expect, it } from "vitest";
import { parseEml } from "@/lib/email/parseEml";

const eml = (text: string) =>
  parseEml(new TextEncoder().encode(text).buffer as ArrayBuffer, "test.eml");

const multipart = [
  "From: Dana Whitfield <dana@northwind.example>",
  "To: Sam Okafor <sam@example.com>",
  "Cc: Lee <lee@example.com>",
  "Subject: =?utf-8?B?5Lit5paH5qiZ6aGM?=",
  "Date: Thu, 12 Mar 2026 09:24:00 +0000",
  "MIME-Version: 1.0",
  'Content-Type: multipart/mixed; boundary="OUTER"',
  "",
  "--OUTER",
  'Content-Type: multipart/alternative; boundary="INNER"',
  "",
  "--INNER",
  'Content-Type: text/plain; charset="utf-8"',
  "",
  "plain version",
  "",
  "--INNER",
  'Content-Type: text/html; charset="utf-8"',
  "",
  "<p>rich version</p>",
  "",
  "--INNER--",
  "",
  "--OUTER",
  'Content-Type: text/csv; name="rates.csv"',
  "Content-Transfer-Encoding: base64",
  'Content-Disposition: attachment; filename="rates.csv"',
  "",
  Buffer.from("a,b\n1,2\n").toString("base64"),
  "",
  "--OUTER",
  "Content-Type: image/png",
  "Content-Transfer-Encoding: base64",
  "Content-ID: <logo@01D9>",
  "Content-Disposition: inline",
  "",
  Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64"),
  "",
  "--OUTER--",
  "",
].join("\r\n");

describe("parseEml", () => {
  it("reads addresses, subject and date", async () => {
    const email = await eml(multipart);
    expect(email.from).toEqual({
      name: "Dana Whitfield",
      address: "dana@northwind.example",
    });
    expect(email.to.map((r) => r.address)).toEqual(["sam@example.com"]);
    expect(email.cc.map((r) => r.address)).toEqual(["lee@example.com"]);
    // RFC 2047 encoded words must be decoded, not shown raw.
    expect(email.subject).toBe("中文標題");
    expect(email.date?.toISOString()).toBe("2026-03-12T09:24:00.000Z");
  });

  it("prefers the HTML alternative but keeps the plain text for search", async () => {
    const email = await eml(multipart);
    expect(email.bodyKind).toBe("html");
    expect(email.body).toContain("rich version");
    expect(email.bodyText).toContain("plain version");
  });

  it("separates real attachments from inline images", async () => {
    const email = await eml(multipart);
    const real = email.attachments.filter((a) => !a.inline);
    const inline = email.attachments.filter((a) => a.inline);

    expect(real.map((a) => a.fileName)).toEqual(["rates.csv"]);
    expect(real[0].mimeType).toBe("text/csv");
    expect(new TextDecoder().decode(real[0].content)).toContain("a,b");

    expect(inline).toHaveLength(1);
    // Angle brackets are syntax, not part of the identifier used by cid:.
    expect(inline[0].contentId).toBe("logo@01D9");
    expect(email.hasAttachments).toBe(true);
  });

  it("always reports .eml as a mail item", async () => {
    // RFC 822 has no concept of appointments or contacts.
    const email = await eml(multipart);
    expect(email.itemKind).toBe("note");
    expect(email.sourceFormat).toBe("eml");
  });

  it("falls back to plain text when there is no HTML part", async () => {
    const email = await eml(
      ["From: a@b.c", "Subject: Plain", "", "just text"].join("\r\n"),
    );
    expect(email.bodyKind).toBe("text");
    expect(email.bodySource).toBe("text");
    expect(email.body).toContain("just text");
  });

  it("warns rather than pretending a bodyless message is fine", async () => {
    const email = await eml(["From: a@b.c", "Subject: Empty", "", ""].join("\r\n"));
    expect(email.bodySource).toBe("none");
    expect(email.warnings.length).toBeGreaterThan(0);
  });

  it("reads importance from either header spelling", async () => {
    const high = await eml(
      ["From: a@b.c", "Importance: high", "", "x"].join("\r\n"),
    );
    expect(high.importance).toBe("high");

    const low = await eml(["From: a@b.c", "X-Priority: 5", "", "x"].join("\r\n"));
    expect(low.importance).toBe("low");
  });
});
