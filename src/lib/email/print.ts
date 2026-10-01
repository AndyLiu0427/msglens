/**
 * Printing / "Save as PDF".
 *
 * The on-screen body lives in an iframe so that message CSS cannot escape into
 * the application shell. That isolation is non-negotiable, but it costs us
 * pagination: browsers do not break iframe content across printed pages, so
 * printing the page directly truncates any message longer than one sheet.
 *
 * So printing gets its own document — the same approach Gmail takes. A blank
 * same-origin window is populated with a header block we control plus the
 * already-sanitised body, and printed from there. That gives correct
 * pagination, a document that is light-themed regardless of the app's theme,
 * and complete CSS isolation for free, since the message is the only thing in
 * that document.
 */

import type { ParsedEmail } from "./types";
import { displayAddress } from "./headers";
import { formatBytes } from "./mime";
import { createCidUrls, releaseCidUrls, sanitizeBody, textToHtml } from "./sanitize";
import type { Dictionary } from "@/lib/i18n";

const PRINT_BASE = `
  @page { margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #16161a;
    background: #fff;
  }
  .meta {
    border-bottom: 1.5px solid #16161a;
    padding-bottom: 10px;
    margin-bottom: 18px;
  }
  .meta h1 {
    margin: 0 0 10px;
    font-size: 15pt;
    line-height: 1.3;
    font-weight: 600;
  }
  .meta dl {
    margin: 0;
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 2px 12px;
    font-size: 9.5pt;
  }
  .meta dt { color: #6b6b76; }
  .meta dd { margin: 0; word-break: break-word; }
  .attachments {
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1px solid #c9c9d2;
    font-size: 9.5pt;
  }
  .attachments h2 { margin: 0 0 6px; font-size: 10pt; font-weight: 600; }
  .attachments ul { margin: 0; padding-left: 18px; }
  .body { overflow-wrap: break-word; word-break: break-word; }
  /* In a combined export each message starts on its own page. */
  .msg + .msg { break-before: page; }
  .body img { max-width: 100%; height: auto; }
  .body table { max-width: 100%; }
  .body pre.msg-plaintext {
    font-family: inherit;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }
  .body blockquote {
    margin: 0 0 1em;
    padding-left: 12px;
    border-left: 2px solid #c9c9d2;
    color: #4a4a55;
  }
  /* Blocked images would otherwise print as empty dashed boxes. */
  .body img[data-remote-blocked], .body img[data-unresolved-cid] { display: none; }
  /* Search highlighting is a screen affordance, not part of the message. */
  .body mark.msg-hit, .body mark.msg-hit-active {
    background: none;
    color: inherit;
  }
`;

/**
 * Applied after the message's own CSS, mirroring the on-screen frame: message
 * stylesheets routinely set `body {}` and would otherwise restyle the header
 * block and footer this document adds around the message.
 */
const PRINT_OVERRIDE = `
  .meta, .meta *, .attachments, .attachments *, .footer {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "PingFang TC", "Microsoft JhengHei", Arial, sans-serif !important;
    color: #16161a;
  }
  .meta dt { color: #6b6b76 !important; }
  .meta h1 { font-size: 15pt !important; font-weight: 600 !important; }
  .footer {
    margin-top: 22px;
    padding-top: 8px;
    border-top: 1px solid #e2e2e8;
    font-size: 8pt;
    color: #8a8a95 !important;
  }
  /* Nothing in a message should be able to force a page-wide dark fill. */
  html, body { background: #fff !important; }
  .body img { max-width: 100% !important; height: auto; }
  .body img[data-remote-blocked], .body img[data-unresolved-cid] {
    display: none !important;
  }
  .body mark.msg-hit, .body mark.msg-hit-active {
    background: none !important;
    color: inherit !important;
  }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Header block, body and attachment list for one message. Every value is escaped. */
function messageSection(
  email: ParsedEmail,
  bodyHtml: string,
  t: Dictionary,
  locale: string,
  bodyId?: string,
): string {
  const row = (label: string, value: string) =>
    value ? `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>` : "";

  const rows = [
    row(t.viewer.from, email.from ? displayAddress(email.from) : ""),
    row(t.viewer.to, email.to.map(displayAddress).join(", ")),
    row(t.viewer.cc, email.cc.map(displayAddress).join(", ")),
    row(
      email.dateLabel ? t.viewer[email.dateLabel] : t.viewer.date,
      email.date ? email.date.toLocaleString(locale, { dateStyle: "full", timeStyle: "short" }) : "",
    ),
  ].join("");

  const visibleAttachments = email.attachments.filter((a) => !a.inline);
  const attachments = visibleAttachments.length
    ? `<section class="attachments">
         <h2>${escapeHtml(t.viewer.attachments)} (${visibleAttachments.length})</h2>
         <ul>${visibleAttachments
           .map((a) => `<li>${escapeHtml(a.fileName)} (${formatBytes(a.size)})</li>`)
           .join("")}</ul>
       </section>`
    : "";

  return `<header class="meta">
  <h1>${escapeHtml(email.subject || t.viewer.noSubject)}</h1>
  <dl>${rows}</dl>
</header>
<main class="body"${bodyId ? ` id="${bodyId}"` : ""}>${bodyHtml}</main>
${attachments}
<footer class="footer">${escapeHtml(email.sourceFileName)}</footer>`;
}

/**
 * A complete print document. `styles` sits between the base and override
 * sheets, so message CSS can style the body but never the header we add.
 */
export function printDocument(title: string, styles: string, sections: string[]): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src blob: data: https: http:; font-src data:">
<title>${escapeHtml(title)}</title>
<style>${PRINT_BASE}</style>
<style>${styles}</style>
<style>${PRINT_OVERRIDE}</style>
</head><body>
${sections.map((s) => `<article class="msg">${s}</article>`).join("\n")}
</body></html>`;
}

/**
 * Open a print window for a finished document. Returns false when the popup
 * was blocked, after telling the user; printing the app page instead would
 * silently produce a truncated PDF.
 */
function openPrintWindow(doc: string, t: Dictionary, onDone?: () => void): boolean {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    window.alert(t.viewer.printBlocked);
    return false;
  }

  // document.write rather than DOM construction: the CSP meta tag has to be
  // present when the document is parsed to take effect, and it is what makes
  // this safe. `default-src 'none'` with no script-src means nothing in the
  // document can execute. Bodies arrive already DOMPurify-sanitised and every
  // interpolated value is escaped.
  win.document.open();
  win.document.write(doc);
  win.document.close();

  if (onDone) {
    win.addEventListener("afterprint", onDone, { once: true });
    win.addEventListener("pagehide", onDone, { once: true });
  }

  // Let images settle, or the dialog can capture the layout before inline
  // images have reserved their space.
  const start = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === "complete") {
    setTimeout(start, 250);
  } else {
    win.addEventListener("load", () => setTimeout(start, 250), { once: true });
  }
  return true;
}

/**
 * @param bodyHtml already sanitised by `sanitizeBody`; this function never
 *        sees raw message markup.
 * @param bodyStyles the message's own CSS, lifted out by `sanitizeBody`.
 *        Without it the PDF loses table borders, fonts and colours.
 */
export function printMessage(
  email: ParsedEmail,
  bodyHtml: string,
  bodyStyles: string,
  t: Dictionary,
  locale: string,
): void {
  openPrintWindow(
    printDocument(email.subject || t.viewer.noSubject, bodyStyles, [
      messageSection(email, bodyHtml, t, locale),
    ]),
    t,
  );
}

/**
 * Confine one message's CSS to its own body. Every message in a combined
 * document brings its own `p {}` and `.MsoNormal {}`, and without this the
 * last one loaded would restyle all the others. Where `@scope` is missing the
 * message CSS is dropped instead: plainer output, but never cross-contaminated.
 */
export function scopeStyles(styles: string, bodyId: string, supported: boolean): string {
  if (!styles.trim() || !supported) return "";
  // Outlook puts the message's base font on `body`, which sits outside the
  // scope and would match nothing. Point it at the scope root instead. Only
  // selector positions are rewritten: the lookahead must reach a `{` before
  // any `}`, which a declaration value never does.
  const rooted = styles.replace(/(^\s*|[{},]\s*)(?:html|body)\b(?=[^{}]*\{)/g, "$1:scope");
  return `@scope (#${bodyId}) {\n${rooted}\n}`;
}

/**
 * Every open message in one print document, each starting on a new page, so
 * "Save as PDF" produces a single file for the whole batch. Remote images stay
 * blocked, matching the viewer's default.
 */
export function printMessages(emails: ParsedEmail[], t: Dictionary, locale: string): void {
  const scopeSupported = typeof window !== "undefined" && "CSSScopeRule" in window;
  const cidMaps: Map<string, string>[] = [];
  const sections: string[] = [];
  const styles: string[] = [];

  emails.forEach((email, i) => {
    const cids = createCidUrls(email.attachments);
    cidMaps.push(cids);
    const raw = email.bodyKind === "html" ? email.body : textToHtml(email.body);
    const sanitized = sanitizeBody(raw, cids, false);
    const bodyId = `m${i}-body`;
    sections.push(messageSection(email, sanitized.html, t, locale, bodyId));
    styles.push(scopeStyles(sanitized.styles, bodyId, scopeSupported));
  });

  const title = `${emails.length} ${t.viewer.messagesNoun}`;
  const release = () => cidMaps.forEach(releaseCidUrls);
  if (!openPrintWindow(printDocument(title, styles.join("\n"), sections), t, release)) {
    release();
  }
}
