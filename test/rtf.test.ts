import { describe, expect, it } from "vitest";
import { deEncapsulateRtf } from "@/lib/email/rtf";

/**
 * MS-OXRTFEX de-encapsulation.
 *
 * This is the load-bearing part of the parser: most real Outlook mail stores
 * its body only as compressed RTF with the original HTML wrapped inside, so a
 * regression here empties the body of the majority of messages rather than
 * breaking an edge case.
 */

const wrap = (inner: string) =>
  `{\\rtf1\\ansi\\ansicpg1252\\fromhtml1 \\fbidis {\\*\\generator Test;}${inner}}`;

describe("deEncapsulateRtf", () => {
  it("returns null for genuine RTF with no encapsulation marker", () => {
    // A real RTF document is a different problem; guessing at a conversion
    // would be worse than admitting the body is not HTML.
    expect(deEncapsulateRtf("{\\rtf1\\ansi Hello world}")).toBeNull();
  });

  it("recovers markup from htmltag destinations", () => {
    const result = deEncapsulateRtf(
      wrap(`{\\*\\htmltag84 <b>}Bold text{\\*\\htmltag92 </b>}`),
    );
    expect(result?.mode).toBe("html");
    expect(result?.content).toBe("<b>Bold text</b>");
  });

  it("drops content between \\htmlrtf and \\htmlrtf0", () => {
    // Everything in that span is RTF-side formatting that duplicates the real
    // markup; emitting it would double every styled run.
    const result = deEncapsulateRtf(
      wrap(`Keep \\htmlrtf {\\b DROP-ME}\\htmlrtf0 this`),
    );
    expect(result?.content).toContain("Keep");
    expect(result?.content).toContain("this");
    expect(result?.content).not.toContain("DROP-ME");
  });

  it("keeps htmltag content even while \\htmlrtf suppression is active", () => {
    const result = deEncapsulateRtf(
      wrap(`\\htmlrtf {\\*\\htmltag84 <i>}\\htmlrtf0 text`),
    );
    expect(result?.content).toContain("<i>");
  });

  it("emits \\par inside an htmltag destination as a newline", () => {
    // Regression: `{\*\htmltag4 \par }` encodes a newline that was in the
    // original HTML source. Dropping it welded adjacent words together —
    // "the prevailing9% GST" — because HTML collapses that newline to a space.
    const result = deEncapsulateRtf(
      wrap(`prevailing{\\*\\htmltag4 \\par }{\\*\\htmltag84 <b>}9% GST`),
    );
    expect(result?.content).toBe("prevailing\n<b>9% GST");
    expect(result?.content).not.toContain("prevailing<b>");
  });

  it("drops a bare \\par outside htmltag, which is RTF layout noise", () => {
    const result = deEncapsulateRtf(wrap(`one\\par two`));
    expect(result?.content).toBe("onetwo");
  });

  it("skips non-content destinations wholesale", () => {
    const result = deEncapsulateRtf(
      wrap(`{\\fonttbl{\\f0 Arial;}}{\\colortbl;\\red0\\green0\\blue0;}kept`),
    );
    expect(result?.content).toBe("kept");
    expect(result?.content).not.toContain("Arial");
  });

  it("discards mhtmltag, whose cid: rewriting breaks inline images", () => {
    const result = deEncapsulateRtf(
      wrap(`{\\*\\mhtmltag84 <img src="http://rewritten">}{\\*\\htmltag84 <img src="cid:x">}`),
    );
    expect(result?.content).toContain('cid:x');
    expect(result?.content).not.toContain("rewritten");
  });

  it("decodes \\'hh escapes using the declared code page", () => {
    // 0xE9 is é in both windows-1252 and Latin-1, so this asserts that the
    // declared code page is applied at all without depending on the C1 range
    // (see the divergence test below).
    expect(deEncapsulateRtf(wrap(`caf\\'e9`))?.content).toBe("café");
  });

  it("documents the C1 divergence between Node and browsers", () => {
    // windows-1252 0x92 is a right single quote (U+2019) under the WHATWG
    // Encoding Standard, which is what every browser implements — and the
    // browser is where this code actually runs, so production is correct.
    //
    // Node's TextDecoder uses ICU's IANA-flavoured windows-1252, which leaves
    // the C1 range untouched and yields U+0092. This test asserts whichever
    // the current environment does, so it documents the difference instead of
    // failing on it; it exists so nobody "fixes" the decoder to match Node.
    const decoded = deEncapsulateRtf(wrap(`it\\'92s`))?.content ?? "";
    const codePoint = decoded.codePointAt(2);
    expect([0x2019, 0x0092]).toContain(codePoint);
  });

  it("decodes multi-byte code pages as whole sequences", () => {
    // Big5 0xA4A4 is one character. Decoding byte-by-byte produces mojibake,
    // which is the failure mode for CJK mail.
    const rtf = `{\\rtf1\\ansi\\ansicpg950\\fromhtml1 \\'a4\\'a4}`;
    expect(deEncapsulateRtf(rtf)?.content).toBe("中");
  });

  it("emits \\uN and skips its ANSI fallback characters", () => {
    const result = deEncapsulateRtf(wrap(`\\uc1\\u20013 ?`));
    expect(result?.content).toBe("中");
  });

  it("handles \\uN written as a negative signed 16-bit value", () => {
    // Code points above 32767 are written negative; adding 65536 recovers them.
    const result = deEncapsulateRtf(wrap(`\\uc0\\u-3600`));
    expect(result?.content).toBe(String.fromCharCode(61936));
  });

  it("unescapes \\\\ \\{ \\} literals", () => {
    expect(deEncapsulateRtf(wrap(`a\\{b\\}c\\\\d`))?.content).toBe("a{b}c\\d");
  });

  it("skips the payload of \\bin", () => {
    const result = deEncapsulateRtf(wrap(`before\\bin5 ABCDEafter`));
    expect(result?.content).toBe("beforeafter");
  });

  it("strips CR/LF, which are RTF line wrapping rather than content", () => {
    expect(deEncapsulateRtf(wrap(`one\r\ntwo`))?.content).toBe("onetwo");
  });

  it("reports text mode for \\fromtext", () => {
    const result = deEncapsulateRtf(
      `{\\rtf1\\ansi\\ansicpg1252\\fromtext plain body}`,
    );
    expect(result?.mode).toBe("text");
    expect(result?.content).toContain("plain body");
  });

  it("returns null when de-encapsulation yields nothing usable", () => {
    expect(deEncapsulateRtf(wrap(`{\\fonttbl{\\f0 Arial;}}`))).toBeNull();
  });
});
