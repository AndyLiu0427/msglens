"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Renders a sanitised message body inside an isolated frame.
 *
 * An iframe rather than a plain div, because real email HTML ships `<style>`
 * blocks with global selectors (`a {}`, `table {}`, even `body {}`). Injected
 * inline those would restyle the application shell around the message. The
 * frame gives the message its own CSS scope, which is what makes "render it
 * the way Outlook does" safe to promise.
 *
 * Security model — three independent layers:
 *   1. The HTML is DOMPurify-sanitised before it ever reaches this component.
 *   2. `sandbox` deliberately omits `allow-scripts`, so no JavaScript can
 *      execute inside the frame at all. `allow-same-origin` is therefore not
 *      an escape hatch (the dangerous pairing is same-origin *with* scripts);
 *      it only lets the parent measure content height and lets `blob:` inline
 *      images resolve without base64-inflating them into the document.
 *   3. A CSP meta tag inside the document enforces the remote-content policy
 *      even if an `src` slipped past the attribute rewrite.
 */

interface BodyFrameProps {
  html: string;
  /** CSS lifted from the message's own `<style>` blocks. */
  styles?: string;
  allowRemote: boolean;
  /** Bumped by the parent to force a reload (e.g. when search marks change). */
  revision?: number;
  className?: string;
}

const BASE_STYLES = `
  :root { color-scheme: light; }
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 15px;
    line-height: 1.65;
    color: #1a1a1f;
    overflow-wrap: break-word;
    word-break: break-word;
    padding: 0;
  }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
  a { color: #4f46e5; }
  pre.msg-plaintext {
    font-family: inherit;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }
  blockquote {
    margin: 0 0 1em;
    padding-left: 1em;
    border-left: 3px solid #d4d4d8;
    color: #52525b;
  }
`;

/**
 * Applied after the message's own CSS so it cannot suppress them. Blocked-image
 * placeholders and search highlights are viewer affordances, not content — a
 * message that styles `img {}` or `mark {}` must not be able to hide them.
 */
const OVERRIDE_STYLES = `
  img[data-remote-blocked], img[data-unresolved-cid] {
    display: inline-block !important;
    min-width: 84px;
    min-height: 32px;
    border: 1px dashed #c4c4cc !important;
    border-radius: 6px;
    background: #f6f6f8 !important;
  }
  mark.msg-hit {
    background: #fde68a !important;
    color: inherit !important;
    padding: 0 1px;
    border-radius: 2px;
  }
  mark.msg-hit-active { background: #fb923c !important; color: #fff !important; }
`;

/**
 * Message bodies are authored for white backgrounds; forcing them into a dark
 * palette produces unreadable results (black text on dark grey). The frame
 * stays light and sits on a light card, which is what every serious mail
 * client does with HTML mail in dark mode.
 */
function buildDocument(html: string, styles: string, allowRemote: boolean): string {
  const imgSrc = allowRemote ? "blob: data: https: http:" : "blob: data:";
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src data:",
    "form-action 'none'",
  ].join("; ");

  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<base target="_blank">
<style>${BASE_STYLES}</style>
<style>${styles}</style>
<style>${OVERRIDE_STYLES}</style>
</head><body>${html}</body></html>`;
}

export function BodyFrame({
  html,
  styles = "",
  allowRemote,
  revision = 0,
  className,
}: BodyFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);

  const measure = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.documentElement) return;
    const next = Math.max(
      doc.documentElement.scrollHeight,
      doc.body?.scrollHeight ?? 0,
      120,
    );
    setHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let observer: ResizeObserver | undefined;

    const onLoad = () => {
      measure();
      const doc = frame.contentDocument;
      if (!doc?.body) return;

      // Images and web fonts settle after the initial load, so keep measuring
      // until the layout stops changing rather than snapshotting once.
      observer?.disconnect();
      observer = new ResizeObserver(measure);
      observer.observe(doc.body);
      doc.querySelectorAll("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", measure, { once: true });
      });
    };

    frame.addEventListener("load", onLoad);
    // srcDoc may already have committed before this effect ran.
    if (frame.contentDocument?.readyState === "complete") onLoad();

    return () => {
      frame.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [measure, html, styles, allowRemote, revision]);

  return (
    <iframe
      ref={frameRef}
      title="Message body"
      srcDoc={buildDocument(html, styles, allowRemote)}
      // No `allow-scripts`: nothing inside the frame can execute.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      loading="lazy"
      className={cn("print-full w-full border-0 bg-white", className)}
      style={{ height }}
    />
  );
}
