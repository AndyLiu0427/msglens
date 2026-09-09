import { describe, expect, it } from "vitest";
import { createCidUrls, sanitizeBody, textToHtml } from "@/lib/email/sanitize";
import type { Attachment } from "@/lib/email/types";

/**
 * Message bodies are untrusted input, and this is the layer that decides what
 * survives. The two behaviours worth guarding hardest are opposite failures:
 * letting something dangerous through, and stripping so much that a designed
 * email becomes unreadable.
 */

const noCids = new Map<string, string>();

const attachment = (contentId: string): Attachment => ({
  id: "0",
  fileName: "logo.png",
  mimeType: "image/png",
  size: 4,
  content: new Uint8Array([1, 2, 3, 4]),
  contentId,
  inline: true,
  isEmbeddedMessage: false,
});

describe("sanitizeBody security", () => {
  it("removes scripts and event handlers", () => {
    const { html } = sanitizeBody(
      `<p onclick="steal()">hi</p><script>steal()</script><img src=x onerror="steal()">`,
      noCids,
      false,
    );
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("onerror");
    expect(html).toContain("hi");
  });

  it("strips javascript: hrefs but keeps the text", () => {
    const { html } = sanitizeBody(`<a href="javascript:alert(1)">click</a>`, noCids, false);
    expect(html).not.toContain("javascript:");
    expect(html).toContain("click");
  });

  it("forces external links to open safely", () => {
    const { html } = sanitizeBody(`<a href="https://example.com">x</a>`, noCids, false);
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
  });

  it("removes form and frame elements", () => {
    const { html } = sanitizeBody(
      `<form action="/x"><input name="p"></form><iframe src="https://e.com"></iframe>`,
      noCids,
      false,
    );
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<iframe");
  });
});

describe("sanitizeBody formatting fidelity", () => {
  it("lifts the message's own stylesheets out of head", () => {
    // Outlook writes formatting into <head><style>, not inline attributes.
    // Keeping only the body fragment silently drops table borders, fonts and
    // colours from most real mail — it looks like the message was plain.
    const { html, styles } = sanitizeBody(
      `<html><head><style>td { border: 1px solid #000 }</style></head>
       <body><table><tr><td class="c">x</td></tr></table></body></html>`,
      noCids,
      false,
    );
    expect(styles).toContain("border: 1px solid #000");
    // The elements move to the frame head, so they must not remain in the body.
    expect(html).not.toContain("<style");
    expect(html).toContain('class="c"');
  });

  it("keeps inline style attributes", () => {
    const { html } = sanitizeBody(`<p style="color:#f00">x</p>`, noCids, false);
    expect(html).toContain("color");
  });
});

describe("sanitizeBody images", () => {
  it("defers remote images and counts them", () => {
    // Senders use remote images as read receipts. Loading them on open would
    // report back before the reader has chosen anything.
    const { html, blockedRemoteCount } = sanitizeBody(
      `<img src="https://tracker.example/pixel.gif"><img src="https://x/y.png">`,
      noCids,
      false,
    );
    expect(blockedRemoteCount).toBe(2);
    expect(html).toContain("data-deferred-src");
    // Assert on the DOM, not the string: `data-deferred-src="…"` itself
    // contains the substring `src="…"`, so a text match proves nothing.
    const el = document.createElement("div");
    el.innerHTML = html;
    for (const img of el.querySelectorAll("img")) {
      expect(img.hasAttribute("src")).toBe(false);
      expect(img.getAttribute("data-deferred-src")).toMatch(/^https:/);
    }
  });

  it("loads remote images once opted in", () => {
    const { html, blockedRemoteCount } = sanitizeBody(
      `<img src="https://x/y.png">`,
      noCids,
      true,
    );
    expect(blockedRemoteCount).toBe(0);
    expect(html).toContain('src="https://x/y.png"');
  });

  it("neutralises remote CSS backgrounds too", () => {
    const { html } = sanitizeBody(
      `<div style="background:url('https://tracker.example/p.gif')">x</div>`,
      noCids,
      false,
    );
    expect(html).not.toContain("tracker.example");
  });

  it("resolves cid: references against the message's attachments", () => {
    const cidUrls = createCidUrls([attachment("logo@01D9")]);
    const { html, unresolvedCids } = sanitizeBody(
      `<img src="cid:logo@01D9">`,
      cidUrls,
      false,
    );
    expect(unresolvedCids).toHaveLength(0);
    expect(html).toContain("blob:");
  });

  it("matches cid references case-insensitively and ignores angle brackets", () => {
    const cidUrls = createCidUrls([attachment("<Logo@01D9>")]);
    const { unresolvedCids } = sanitizeBody(`<img src="cid:logo@01d9">`, cidUrls, false);
    expect(unresolvedCids).toHaveLength(0);
  });

  it("reports a cid with no matching attachment instead of leaving a broken src", () => {
    const { html, unresolvedCids } = sanitizeBody(`<img src="cid:missing@1">`, noCids, false);
    expect(unresolvedCids).toEqual(["missing@1"]);
    expect(html).toContain("data-unresolved-cid");
  });
});

describe("textToHtml", () => {
  it("escapes markup so a plain-text body cannot inject HTML", () => {
    const html = textToHtml("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("linkifies URLs and email addresses", () => {
    const html = textToHtml("see https://example.com or mail a@b.co");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('href="mailto:a@b.co"');
  });
});
