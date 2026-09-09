/**
 * RTF de-encapsulation.
 *
 * Outlook frequently stores the message body only as compressed RTF
 * (PidTagRtfCompressed). When the original message was HTML or plain text,
 * Outlook *encapsulates* it inside that RTF and marks the stream with
 * `\fromhtml1` / `\fromtext`. Recovering the original body is what the three
 * incumbent .msg viewers get wrong, so this is implemented from the spec
 * rather than bolted on.
 *
 * Implemented from [MS-OXRTFEX]: RTF Extensions Algorithm.
 * Deliberately dependency-free (no Node `stream`/`Buffer` polyfills) so it can
 * run inside a Web Worker and stay out of the main bundle's critical path.
 */

/** Non-content destinations whose entire group is discarded. */
const IGNORED_DESTINATIONS = new Set([
  "fonttbl",
  "colortbl",
  "stylesheet",
  "listtable",
  "listoverridetable",
  "revtbl",
  "rsidtbl",
  "generator",
  "mmathpr",
  "info",
  "pntext",
  "pntxta",
  "pntxtb",
  "atrfstart",
  "atrfend",
  "aftnsep",
  "aftnsepc",
  "aftncn",
  "ftnsep",
  "ftnsepc",
  "ftncn",
  "themedata",
  "colorschememapping",
  "datastore",
  "latentstyles",
  "xmlnstbl",
  "pgptbl",
  // The MHTML variant of htmltag; redundant when htmltag is present and its
  // `cid:` rewriting actively breaks inline-image resolution.
  "mhtmltag",
]);

/** Control words that expand to a literal character in the output. */
const SYMBOL_WORDS: Record<string, string> = {
  par: "\n",
  line: "\n",
  tab: "\t",
  lquote: "‘",
  rquote: "’",
  ldblquote: "“",
  rdblquote: "”",
  bullet: "•",
  endash: "–",
  emdash: "—",
  emspace: " ",
  enspace: " ",
  qmspace: " ",
  "~": " ",
  "-": "­",
  _: "‑",
};

/** Windows code page -> TextDecoder label. */
const CODEPAGE_LABELS: Record<number, string> = {
  437: "ibm866",
  850: "windows-1252",
  874: "windows-874",
  932: "shift_jis",
  936: "gbk",
  949: "euc-kr",
  950: "big5",
  1200: "utf-16le",
  1250: "windows-1250",
  1251: "windows-1251",
  1252: "windows-1252",
  1253: "windows-1253",
  1254: "windows-1254",
  1255: "windows-1255",
  1256: "windows-1256",
  1257: "windows-1257",
  1258: "windows-1258",
  10000: "macintosh",
  65001: "utf-8",
};

function decoderFor(codepage: number): TextDecoder {
  const label = CODEPAGE_LABELS[codepage] ?? "windows-1252";
  try {
    return new TextDecoder(label, { fatal: false });
  } catch {
    return new TextDecoder("windows-1252", { fatal: false });
  }
}

interface GroupState {
  /** Discard everything in this group (unknown or known-noise destination). */
  ignore: boolean;
  /** Inside a `{\*\htmltag..}` destination — content is literal HTML markup. */
  inHtmlTag: boolean;
  /** `\htmlrtf` suppression flag; scoped to the group, per spec. */
  htmlRtf: boolean;
  /** `\ucN` — bytes to skip after a `\uN` Unicode escape. */
  ucSkip: number;
  codepage: number;
}

export interface DeEncapsulateResult {
  mode: "html" | "text";
  content: string;
}

/**
 * De-encapsulate an RTF document back into the HTML or plain text it wraps.
 *
 * Returns `null` when the stream is a genuine RTF document (no `\fromhtml` /
 * `\fromtext` marker), because converting real RTF formatting to HTML is a
 * different problem and a lossy guess would be worse than saying so.
 */
export function deEncapsulateRtf(rtf: string): DeEncapsulateResult | null {
  const header = rtf.slice(0, 4096);
  const isHtml = /\\fromhtml1?[^0-9]/.test(header) || /\\fromhtml1?$/.test(header);
  const isText = /\\fromtext[^0-9a-z]/i.test(header);
  if (!isHtml && !isText) return null;

  const mode: "html" | "text" = isHtml ? "html" : "text";
  const out: string[] = [];

  // Pending `\'hh` bytes, flushed as a unit so multi-byte code pages (Big5,
  // Shift-JIS, GBK) decode correctly instead of one mojibake byte at a time.
  let pending: number[] = [];
  let pendingCodepage = 1252;

  const flushBytes = () => {
    if (pending.length === 0) return;
    out.push(decoderFor(pendingCodepage).decode(new Uint8Array(pending)));
    pending = [];
  };

  const stack: GroupState[] = [];
  let state: GroupState = {
    ignore: false,
    inHtmlTag: false,
    htmlRtf: false,
    ucSkip: 1,
    codepage: 1252,
  };

  /**
   * Content is emitted when we are not inside an ignored destination and
   * either not suppressed by `\htmlrtf`, or inside an `\*\htmltag` destination
   * (which the spec exempts from suppression).
   */
  const emitting = () => !state.ignore && (!state.htmlRtf || state.inHtmlTag);

  const emit = (s: string) => {
    if (!emitting()) return;
    flushBytes();
    out.push(s);
  };

  const emitByte = (b: number) => {
    if (!emitting()) return;
    if (pending.length > 0 && pendingCodepage !== state.codepage) flushBytes();
    pendingCodepage = state.codepage;
    pending.push(b);
  };

  // Number of upcoming characters to swallow, set by `\uN` (the ANSI fallback).
  let skipChars = 0;

  const i = { pos: 0 };
  const len = rtf.length;

  while (i.pos < len) {
    const ch = rtf[i.pos];

    if (ch === "{") {
      i.pos++;
      stack.push(state);
      state = { ...state };
      skipChars = 0;
      continue;
    }

    if (ch === "}") {
      i.pos++;
      flushBytes();
      const restored = stack.pop();
      if (restored) state = restored;
      skipChars = 0;
      continue;
    }

    if (ch === "\\") {
      const next = rtf[i.pos + 1];

      // Escaped literals: \\ \{ \}
      if (next === "\\" || next === "{" || next === "}") {
        i.pos += 2;
        if (skipChars > 0) {
          skipChars--;
          continue;
        }
        emit(next);
        continue;
      }

      // Hex escape: \'hh
      if (next === "'") {
        const hex = rtf.slice(i.pos + 2, i.pos + 4);
        i.pos += 4;
        if (skipChars > 0) {
          skipChars--;
          continue;
        }
        const byte = parseInt(hex, 16);
        if (!Number.isNaN(byte)) emitByte(byte);
        continue;
      }

      // Ignorable-destination marker: \*
      if (next === "*") {
        i.pos += 2;
        // Peek at the control word that follows to decide whether to keep it.
        const m = /^\\([a-zA-Z]+)(-?\d+)?[ ]?/.exec(rtf.slice(i.pos));
        if (!m) {
          state.ignore = true;
          continue;
        }
        const word = m[1];
        if (word === "htmltag") {
          i.pos += m[0].length;
          state.inHtmlTag = true;
          // `\htmltag` content is literal markup; make sure it is not dropped
          // by an enclosing `\htmlrtf`.
          state.ignore = false;
          continue;
        }
        // Any other starred destination is optional and safe to discard.
        state.ignore = true;
        continue;
      }

      // Control word: \word[-]?[digits]?[space]
      const m = /^\\([a-zA-Z]+)(-?\d+)?[ ]?/.exec(rtf.slice(i.pos));
      if (m) {
        i.pos += m[0].length;
        const word = m[1];
        const param = m[2] === undefined ? null : parseInt(m[2], 10);

        switch (word) {
          case "htmlrtf":
            // `\htmlrtf0` turns suppression off, bare `\htmlrtf` turns it on.
            state.htmlRtf = param !== 0;
            continue;
          case "htmltag":
            state.inHtmlTag = true;
            state.ignore = false;
            continue;
          case "uc":
            if (param !== null && param >= 0) state.ucSkip = param;
            continue;
          case "u": {
            if (param === null) continue;
            skipChars = state.ucSkip;
            // RTF writes code units above 32767 as negative signed 16-bit.
            const code = param < 0 ? param + 65536 : param;
            emit(String.fromCharCode(code));
            continue;
          }
          case "ansicpg":
            if (param !== null) state.codepage = param;
            continue;
          case "cpg":
            if (param !== null) state.codepage = param;
            continue;
          case "bin": {
            // Skip the raw binary payload entirely.
            const n = param ?? 0;
            if (n > 0) i.pos += n;
            continue;
          }
          case "fromhtml":
          case "fromtext":
            continue;
          default: {
            if (Object.prototype.hasOwnProperty.call(SYMBOL_WORDS, word)) {
              // In HTML mode a bare `\par` is RTF-side layout that duplicates
              // the real `<p>`/`<br>` markup, so it is dropped.
              //
              // Inside an `\*\htmltag` destination it means the opposite: it
              // encodes a newline that was present in the original HTML source
              // (Outlook writes `{\*\htmltag4 \par }` for one). HTML collapses
              // that newline to a space, and dropping it silently welds
              // adjacent words together — "the prevailing9% GST".
              if (
                mode === "html" &&
                (word === "par" || word === "line") &&
                !state.inHtmlTag
              ) {
                continue;
              }
              emit(SYMBOL_WORDS[word]);
              continue;
            }
            if (IGNORED_DESTINATIONS.has(word)) {
              state.ignore = true;
              continue;
            }
            // Every other control word is formatting we do not need.
            continue;
          }
        }
      }

      // Control symbol (single non-alphabetic char after the backslash).
      i.pos += 2;
      if (next !== undefined && Object.prototype.hasOwnProperty.call(SYMBOL_WORDS, next)) {
        if (skipChars > 0) skipChars--;
        else emit(SYMBOL_WORDS[next]);
      }
      continue;
    }

    // Literal text run — consume up to the next RTF-significant character.
    let end = i.pos;
    while (end < len) {
      const c = rtf[end];
      if (c === "\\" || c === "{" || c === "}") break;
      end++;
    }
    let text = rtf.slice(i.pos, end);
    i.pos = end;

    // CR/LF inside an RTF stream are line-wrapping artefacts, not content.
    text = text.replace(/[\r\n]/g, "");
    if (!text) continue;

    if (skipChars > 0) {
      const drop = Math.min(skipChars, text.length);
      skipChars -= drop;
      text = text.slice(drop);
      if (!text) continue;
    }

    emit(text);
  }

  flushBytes();

  const content = out.join("");
  if (!content.trim()) return null;
  return { mode, content };
}

/**
 * Decompress PidTagRtfCompressed and de-encapsulate it in one step.
 * Returns `null` when the body is not recoverable as HTML or text.
 */
export async function rtfBodyFromCompressed(
  compressed: Uint8Array,
): Promise<DeEncapsulateResult | null> {
  const { decompressRTF } = await import("@kenjiuno/decompressrtf");
  let raw: number[];
  try {
    raw = decompressRTF(Array.from(compressed));
  } catch {
    return null;
  }
  if (!raw || raw.length === 0) return null;
  // The RTF container itself is 7-bit ASCII; non-ASCII arrives via `\'hh`
  // escapes, which the de-encapsulator decodes with the declared code page.
  const rtf = new TextDecoder("windows-1252", { fatal: false }).decode(new Uint8Array(raw));
  return deEncapsulateRtf(rtf);
}
