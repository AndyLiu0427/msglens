const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  ndash: "–", mdash: "—", hellip: "…", copy: "©", euro: "€",
  middot: "·", bull: "•", reg: "®", trade: "™", deg: "°",
  times: "×", laquo: "«", raquo: "»", pound: "£", yen: "¥",
};

/**
 * Plain text from a message's HTML body. The site does this with DOMParser,
 * which Node lacks; this covers what Outlook and webmail actually emit.
 * ponytail: regex, not a parser, and a short entity list; switch to a real
 * HTML parser if bodies with odd markup come out wrong.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(head|style|script)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]\s*>/gi, "\t")
    .replace(/<\/(p|div|tr|li|h[1-6]|table|blockquote|pre)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    })
    .split("\n")
    .map((line) => line.trim().replace(/ *\t */g, "\t"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Mail text is untrusted: drop control characters so it cannot drive the terminal. */
export function terminalSafe(text: string): string {
  return text.replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, "");
}
