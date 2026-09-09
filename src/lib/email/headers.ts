import type { EmailAddress } from "./types";

/**
 * Split a raw internet-header block into ordered name/value pairs,
 * unfolding continuation lines as required by RFC 5322 §2.2.3.
 */
export function parseHeaderBlock(raw: string): Array<{ name: string; value: string }> {
  if (!raw) return [];
  const pairs: Array<{ name: string; value: string }> = [];
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  let name = "";
  let value: string[] = [];

  const push = () => {
    if (name) pairs.push({ name, value: decodeWords(value.join(" ").trim()) });
    name = "";
    value = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      // A blank line ends the header block; anything after it is the body.
      push();
      break;
    }
    if (/^[ \t]/.test(line)) {
      value.push(line.trim());
      continue;
    }
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    push();
    name = line.slice(0, idx).trim();
    value = [line.slice(idx + 1).trim()];
  }
  push();
  return pairs;
}

export function findHeader(
  pairs: Array<{ name: string; value: string }>,
  name: string,
): string | undefined {
  const target = name.toLowerCase();
  return pairs.find((p) => p.name.toLowerCase() === target)?.value;
}

/**
 * Decode RFC 2047 encoded-words (`=?utf-8?B?...?=`) found in headers.
 * Outlook writes these into PidTagTransportMessageHeaders verbatim.
 */
export function decodeWords(input: string): string {
  if (!input.includes("=?")) return input;

  return input.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=(\s*)(?==\?|$|[^\s])?/g,
    (match, charset: string, encoding: string, data: string, trailing: string) => {
      try {
        let bytes: Uint8Array;
        if (encoding.toUpperCase() === "B") {
          const bin = atob(data.replace(/\s/g, ""));
          bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        } else {
          const normalised = data.replace(/_/g, " ");
          const out: number[] = [];
          for (let i = 0; i < normalised.length; i++) {
            if (normalised[i] === "=" && i + 2 < normalised.length) {
              const hex = normalised.slice(i + 1, i + 3);
              const byte = parseInt(hex, 16);
              if (!Number.isNaN(byte)) {
                out.push(byte);
                i += 2;
                continue;
              }
            }
            out.push(normalised.charCodeAt(i));
          }
          bytes = new Uint8Array(out);
        }
        const decoded = new TextDecoder(charset.toLowerCase(), { fatal: false }).decode(bytes);
        // Adjacent encoded-words represent one string; the whitespace between
        // them is separator syntax, not content.
        return decoded + (trailing && /\S/.test(trailing) ? trailing : "");
      } catch {
        return match;
      }
    },
  );
}

/** An Exchange legacy DN rather than a usable SMTP address. */
export function isExchangeDn(value: string): boolean {
  return /^\/(o|ou|cn)=/i.test(value.trim());
}

export function makeAddress(name?: string, address?: string): EmailAddress | null {
  const cleanAddress = (address ?? "").trim();
  const cleanName = decodeWords((name ?? "").trim().replace(/^["']|["']$/g, ""));
  const usable = cleanAddress && !isExchangeDn(cleanAddress) ? cleanAddress : "";
  if (!usable && !cleanName) return null;
  // Avoid the "jane@x.com <jane@x.com>" duplication Outlook often produces.
  return { name: cleanName === usable ? "" : cleanName, address: usable };
}

/** Parse an address-list header value into structured addresses. */
export function parseAddressList(value: string | undefined): EmailAddress[] {
  if (!value) return [];
  const out: EmailAddress[] = [];
  let depth = 0;
  let quoted = false;
  let current = "";

  const flush = () => {
    const token = current.trim();
    current = "";
    if (!token) return;
    const angle = /^(.*?)<([^>]+)>\s*$/.exec(token);
    const parsed = angle
      ? makeAddress(angle[1], angle[2])
      : makeAddress(token.includes("@") ? "" : token, token.includes("@") ? token : "");
    if (parsed) out.push(parsed);
  };

  for (const ch of value) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === "<") depth++;
    else if (!quoted && ch === ">") depth--;
    else if (!quoted && depth === 0 && (ch === "," || ch === ";")) {
      flush();
      continue;
    }
    current += ch;
  }
  flush();
  return out;
}

export function displayAddress(addr: EmailAddress): string {
  if (addr.name && addr.address) return `${addr.name} <${addr.address}>`;
  return addr.name || addr.address;
}

export function shortAddress(addr: EmailAddress): string {
  return addr.name || addr.address || "Unknown";
}
