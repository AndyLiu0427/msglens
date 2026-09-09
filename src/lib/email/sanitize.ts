/**
 * HTML body sanitisation and inline-image resolution.
 *
 * Message bodies are fully untrusted input. Everything rendered goes through
 * DOMPurify first, then through a rewrite pass that:
 *   - resolves `cid:` references against the message's own attachments,
 *   - defers remote images so opening a message cannot phone home to a
 *     tracking pixel until the reader explicitly asks for it,
 *   - forces links to open safely in a new tab.
 */

import DOMPurify from "dompurify";
import type { Attachment } from "./types";

const BLOCKED_SRC_ATTR = "data-deferred-src";
const BLOCKED_MARKER_ATTR = "data-remote-blocked";

/** Protocols allowed to survive sanitisation on `href`. */
const SAFE_LINK_PROTOCOLS = /^(https?|mailto|tel|callto|sms|xmpp):/i;

export interface SanitizeResult {
  html: string;
  /**
   * CSS lifted out of the message's `<style>` blocks.
   *
   * Outlook writes its formatting into `<head><style>` rather than inline
   * attributes, and so does the HTML recovered from encapsulated RTF. Dropping
   * it — which is what happens if you only keep the body fragment — silently
   * strips table borders, fonts and colours from most real mail.
   */
  styles: string;
  /** Number of remote images that were deferred. Drives the UI banner. */
  blockedRemoteCount: number;
  /** cid: references that had no matching attachment. */
  unresolvedCids: string[];
}

/**
 * Build a `cid -> object URL` map for the attachments a body can reference.
 * The caller owns the returned URLs and must revoke them (see `releaseCidUrls`).
 */
export function createCidUrls(attachments: Attachment[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const att of attachments) {
    if (!att.contentId) continue;
    const key = normaliseCid(att.contentId);
    if (!key || map.has(key)) continue;
    const blob = new Blob([att.content as unknown as BlobPart], { type: att.mimeType });
    map.set(key, URL.createObjectURL(blob));
  }
  return map;
}

export function releaseCidUrls(map: Map<string, string>): void {
  for (const url of map.values()) URL.revokeObjectURL(url);
  map.clear();
}

function normaliseCid(raw: string): string {
  return raw.trim().replace(/^<|>$/g, "").toLowerCase();
}

/**
 * Sanitise a message body and prepare it for rendering.
 *
 * @param allowRemote when false (the default) remote images are stashed on
 *        `data-deferred-src` instead of `src` and never fetched.
 */
export function sanitizeBody(
  html: string,
  cidUrls: Map<string, string>,
  allowRemote: boolean,
): SanitizeResult {
  const unresolvedCids = new Set<string>();
  let blockedRemoteCount = 0;

  const purify = DOMPurify(window);

  const hook = (node: Element) => {
    const tag = node.tagName?.toLowerCase();

    if (tag === "a") {
      const href = node.getAttribute("href") ?? "";
      if (href && !SAFE_LINK_PROTOCOLS.test(href) && !href.startsWith("#")) {
        node.removeAttribute("href");
      } else if (href) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer nofollow");
      }
      return;
    }

    if (tag === "img") {
      const src = node.getAttribute("src") ?? "";
      if (/^cid:/i.test(src)) {
        const key = normaliseCid(src.slice(4));
        const resolved = cidUrls.get(key);
        if (resolved) {
          node.setAttribute("src", resolved);
        } else {
          unresolvedCids.add(key);
          node.removeAttribute("src");
          node.setAttribute("data-unresolved-cid", key);
        }
        return;
      }
      if (/^data:image\//i.test(src)) return;
      if (/^https?:/i.test(src)) {
        if (allowRemote) return;
        node.setAttribute(BLOCKED_SRC_ATTR, src);
        node.setAttribute(BLOCKED_MARKER_ATTR, "");
        node.removeAttribute("src");
        node.removeAttribute("srcset");
        blockedRemoteCount++;
        return;
      }
      // Anything else (file:, relative paths from the original host) is dead
      // weight that would only produce a broken-image icon.
      node.removeAttribute("src");
      return;
    }

    // Remote CSS backgrounds are the other common tracking vector.
    if (!allowRemote && node.hasAttribute?.("style")) {
      const style = node.getAttribute("style") ?? "";
      if (/url\(\s*['"]?https?:/i.test(style)) {
        node.setAttribute("style", style.replace(/url\(\s*['"]?https?:[^)]*\)/gi, "none"));
      }
    }
  };

  purify.addHook("afterSanitizeAttributes", hook);

  let root: HTMLElement;
  try {
    root = purify.sanitize(html, {
      // `style` is kept deliberately: stripping it turns a designed HTML email
      // into unreadable soup, which is exactly the failure mode of the
      // existing viewers. DOMPurify still removes expression()/behaviour hacks.
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|callto|sms|xmpp|cid|blob|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ["form", "input", "button", "textarea", "select", "iframe", "object", "embed"],
      FORBID_ATTR: ["formaction", "ping"],
      ADD_ATTR: ["target", BLOCKED_SRC_ATTR, BLOCKED_MARKER_ATTR, "data-unresolved-cid"],
      // Keep the whole document so `<head><style>` survives, and take the DOM
      // back instead of a string so head and body can be split without a
      // second parse.
      WHOLE_DOCUMENT: true,
      RETURN_DOM: true,
      RETURN_TRUSTED_TYPE: false,
    }) as HTMLElement;
  } finally {
    purify.removeHook("afterSanitizeAttributes");
  }

  // Lift the stylesheets out so the frame can put them in its head. Leaving the
  // elements in the body as well would apply every rule twice.
  const styleNodes = root.querySelectorAll("style");
  const styles = [...styleNodes].map((node) => node.textContent ?? "").join("\n");
  styleNodes.forEach((node) => node.remove());

  const body = root.querySelector("body");

  return {
    html: (body ?? root).innerHTML,
    styles,
    blockedRemoteCount,
    unresolvedCids: [...unresolvedCids],
  };
}

/** Convert a plain-text body into safe, readable HTML. */
export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Linkify bare URLs and email addresses — the incumbents render them dead.
  const linked = escaped
    .replace(
      /\b(https?:\/\/[^\s<>"')\]]+)/gi,
      (m) => `<a href="${m}" target="_blank" rel="noopener noreferrer nofollow">${m}</a>`,
    )
    .replace(
      /\b([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi,
      (m) => `<a href="mailto:${m}">${m}</a>`,
    );

  return `<pre class="msg-plaintext">${linked}</pre>`;
}

/** Strip tags for search indexing, previews and .txt export. */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, head").forEach((el) => el.remove());
  return (doc.body?.textContent ?? "").replace(/ /g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
