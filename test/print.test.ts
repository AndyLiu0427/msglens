import { afterEach, describe, expect, it, vi } from "vitest";
import { printDocument, printMessages, scopeStyles } from "@/lib/email/print";
import { getDictionary } from "@/lib/i18n";
import type { ParsedEmail } from "@/lib/email/types";

/**
 * A combined PDF puts every message's own CSS into one document. Unscoped, the
 * last message loaded restyles all the others, and nothing fails: the PDF just
 * looks wrong. These pin the scoping and the page breaks.
 */

const t = getDictionary("en");

const message = (overrides: Partial<ParsedEmail> = {}): ParsedEmail => ({
  id: "1",
  sourceFileName: "a.msg",
  sourceFormat: "msg",
  sourceSize: 100,
  subject: "First",
  from: { name: "Dana", address: "dana@northwind.example" },
  to: [],
  cc: [],
  bcc: [],
  replyTo: [],
  date: null,
  dateLabel: null,
  bodyKind: "html",
  body: "<style>p { color: red; }</style><p>One</p>",
  bodyText: "One",
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

describe("scopeStyles", () => {
  it("confines a message's CSS to its own body", () => {
    expect(scopeStyles("p { color: red; }", "m2-body", true)).toBe(
      "@scope (#m2-body) {\np { color: red; }\n}",
    );
  });

  it("points body and html rules at the scope root, nowhere else", () => {
    const out = scopeStyles(
      "body { font-family: Aptos; }\nhtml, p { margin: 0; }\ntbody td { color: red; }\ndiv { content: 'body'; }",
      "m0-body",
      true,
    );
    expect(out).toContain(":scope { font-family: Aptos; }");
    expect(out).toContain(":scope, p { margin: 0; }");
    // Not a body selector, and not a selector at all.
    expect(out).toContain("tbody td { color: red; }");
    expect(out).toContain("content: 'body';");
  });

  it("handles a stylesheet that starts with whitespace, as real ones do", () => {
    // Lifted <style> contents begin with a newline and indent. The first rule
    // was missed when the pattern only allowed `body` at the very start.
    expect(scopeStyles("\n  body { font-family: Aptos; }", "m0-body", true)).toContain(
      ":scope { font-family: Aptos; }",
    );
  });

  it("drops the CSS rather than leak it where @scope is missing", () => {
    expect(scopeStyles("p { color: red; }", "m2-body", false)).toBe("");
  });
});

describe("printDocument", () => {
  it("escapes the title and wraps each section for page breaks", () => {
    const doc = printDocument("<b>x</b>", "", ["one", "two"]);
    expect(doc).toContain("<title>&lt;b&gt;x&lt;/b&gt;</title>");
    expect(doc.match(/<article class="msg">/g)).toHaveLength(2);
    expect(doc).toContain(".msg + .msg { break-before: page; }");
  });
});

describe("printMessages", () => {
  afterEach(() => vi.restoreAllMocks());

  function captureWrites() {
    let written = "";
    const doc = {
      open: () => {},
      write: (s: string) => {
        written += s;
      },
      close: () => {},
      readyState: "loading",
    };
    const win = { document: doc, addEventListener: () => {}, focus: () => {}, print: () => {} };
    vi.spyOn(window, "open").mockReturnValue(win as unknown as Window);
    return () => written;
  }

  it("puts every message in one document, each body's CSS under its own scope", () => {
    // jsdom has no @scope; without this the styles are dropped and the
    // assertions below would pass for the wrong reason.
    vi.stubGlobal("CSSScopeRule", class {});
    const written = captureWrites();
    printMessages(
      [
        message(),
        message({ id: "2", subject: "Second", body: "<style>p { color: blue; }</style><p>Two</p>" }),
      ],
      t,
      "en-US",
    );

    const doc = written();
    expect(doc).toContain(">First<");
    expect(doc).toContain(">Second<");
    expect(doc).toContain('id="m0-body"');
    expect(doc).toContain('id="m1-body"');
    // Each message's colour appears only inside its own scope, never bare.
    expect(doc).toMatch(/@scope \(#m0-body\) \{[^}]*color: red/);
    expect(doc).toMatch(/@scope \(#m1-body\) \{[^}]*color: blue/);
    expect(doc).not.toMatch(/<style>\s*p \{ color: (red|blue)/);
    vi.unstubAllGlobals();
  });

  it("says so when the print window is blocked", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    printMessages([message()], t, "en-US");
    expect(alert).toHaveBeenCalledWith(t.viewer.printBlocked);
  });
});
