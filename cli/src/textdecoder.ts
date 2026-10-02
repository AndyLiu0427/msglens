/**
 * Node's ICU decodes windows-1252 bytes 0x80-0x9F as C1 control characters.
 * Browsers follow WHATWG and return curly quotes, dashes and the euro sign.
 * The parsers were written for the browser, so the bundle injects this
 * decoder in place of the global one; without it, RTF bodies print as mojibake.
 */

const C1 = String.fromCodePoint(
  0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021,
  0x2c6, 0x2030, 0x160, 0x2039, 0x152, 0x8d, 0x17d, 0x8f,
  0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e, 0x178,
);

const Native = globalThis.TextDecoder;

class WhatwgTextDecoder extends Native {
  decode(input?: AllowSharedBufferSource, options?: TextDecodeOptions): string {
    const text = super.decode(input, options);
    if (this.encoding !== "windows-1252") return text;
    return text.replace(/[\u0080-\u009f]/g, (c) => C1[c.charCodeAt(0) - 0x80]);
  }
}

const nativeIsWhatwg = new Native("windows-1252").decode(Uint8Array.of(0x92)) === "’";

export const TextDecoder: typeof Native = nativeIsWhatwg ? Native : WhatwgTextDecoder;
