// @vitest-environment node
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TextDecoder as PackageDecoder } from "../cli/src/textdecoder";
import { safeName, writeUnique } from "../cli/src/files";
import { htmlToText, terminalSafe } from "../cli/src/text";
import { parseFile } from "../cli/src/index";
import { handle } from "../cli/src/mcp";

/**
 * The npm package runs the site's parsers in Node, where the browser fills
 * in nothing for us. These pin what Node needed added: the decoder, text from
 * HTML, and safe handling of names and text that come out of a message.
 */

describe("package TextDecoder", () => {
  it("decodes windows-1252 0x80-0x9F the way browsers do", () => {
    // Node's own decoder returns C1 controls here, so RTF quotes vanish.
    expect(new PackageDecoder("windows-1252").decode(Uint8Array.of(0x92, 0x97, 0x80))).toBe("’—€");
  });

  it("leaves other encodings alone", () => {
    expect(new PackageDecoder("utf-8").decode(new TextEncoder().encode("café ’"))).toBe("café ’");
  });
});

describe("safeName", () => {
  it("keeps attachment names inside the output folder", () => {
    expect(safeName("../../etc/passwd", "x")).toBe("passwd");
    expect(safeName("..\\..\\Windows\\evil.exe", "x")).toBe("evil.exe");
    expect(safeName(".npmrc", "x")).toBe("npmrc");
    expect(safeName("..", "attachment-1")).toBe("attachment-1");
    expect(safeName('rates: "Q3"?.csv', "x")).toBe("rates- -Q3--.csv");
  });
});

describe("writeUnique", () => {
  it("never overwrites an existing file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "msglens-"));
    await writeUnique(dir, "a.csv", "one");
    const second = await writeUnique(dir, "a.csv", "two");
    expect(second).toBe(join(dir, "a (1).csv"));
    expect(await readFile(join(dir, "a.csv"), "utf8")).toBe("one");
    expect((await readdir(dir)).sort()).toEqual(["a (1).csv", "a.csv"]);
  });
});

describe("htmlToText", () => {
  it("drops styles, keeps paragraphs and table cells apart, decodes entities", () => {
    const html = `<html><head><style>p { color: red; }</style></head><body>
      <p>Hi&nbsp;Sam,</p><p>Lead&nbsp;&middot; &#8217;ok&#x2019;</p>
      <table><tr><td>A</td><td>B</td></tr></table>line<br>break</body></html>`;
    expect(htmlToText(html)).toBe("Hi Sam,\nLead · ’ok’\nA\tB\n\nline\nbreak");
  });
});

describe("terminalSafe", () => {
  it("strips escape sequences but keeps newlines and tabs", () => {
    expect(terminalSafe("a\x1b[2Jb\tc\nd\r")).toBe("a[2Jb\tc\nd");
  });
});

describe("parseFile", () => {
  it("reads the sample message with a plain-text body", async () => {
    const email = await parseFile("public/sample-message.msg");
    expect(email.subject).toBe("Q3 supplier review - notes before Thursday");
    expect(email.bodyKind).toBe("html");
    // The site derives this with DOMParser; the package has to do it itself.
    expect(email.bodyText).toMatch(/^Hi Sam,/);
    expect(email.attachments.map((a) => a.fileName)).toEqual(["msglens-logo.png", "q3-supplier-rates.csv"]);
  });
});

describe("MCP server", () => {
  type Res = {
    result: { protocolVersion: string; tools: { name: string }[]; content: { text: string }[]; isError?: boolean };
    error: { code: number };
  };
  const call = (method: string, params?: Record<string, unknown>) =>
    handle({ jsonrpc: "2.0", id: 1, method, params }) as Promise<Res>;

  it("agrees on the client's protocol version when it knows it, else offers its latest", async () => {
    expect((await call("initialize", { protocolVersion: "2025-06-18" })).result.protocolVersion).toBe("2025-06-18");
    expect((await call("initialize", { protocolVersion: "2099-01-01" })).result.protocolVersion).toBe("2025-11-25");
  });

  it("does not answer notifications or stray responses", async () => {
    expect(await handle({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeUndefined();
    expect(await handle({ jsonrpc: "2.0", id: 7 })).toBeUndefined();
  });

  it("lists the three tools", async () => {
    const { result } = await call("tools/list");
    expect(result.tools.map((t) => t.name)).toEqual(["read_email", "save_attachments", "convert_email"]);
  });

  it("reads a message into a summary without attachment bytes", async () => {
    const { result } = await call("tools/call", {
      name: "read_email",
      arguments: { path: "public/sample-message.msg" },
    });
    const out = JSON.parse(result.content[0].text);
    expect(out.subject).toBe("Q3 supplier review - notes before Thursday");
    expect(out.body).toMatch(/^Hi Sam,/);
    expect(out.attachments[0]).not.toHaveProperty("content");
    expect(out.headers).toBeUndefined();
  });

  it("reports a bad path as a tool error the model can read", async () => {
    const { result } = await call("tools/call", { name: "read_email", arguments: { path: "/nope/x.msg" } });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/ENOENT/);
  });

  it("rejects an unknown tool and an unknown method as protocol errors", async () => {
    expect((await call("tools/call", { name: "rm_rf" })).error.code).toBe(-32602);
    expect((await call("resources/list")).error.code).toBe(-32601);
  });
});
