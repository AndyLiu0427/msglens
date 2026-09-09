/**
 * Crypto helpers, all on Web Crypto — the Workers runtime has no Node crypto.
 */

const encoder = new TextEncoder();

/** URL-safe base64 without padding, which is what OAuth and cookies want. */
export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomToken(bytes = 32): string {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function uuid(): string {
  return crypto.randomUUID();
}

export async function sha256Hex(input: string | ArrayBuffer | Uint8Array): Promise<string> {
  const data =
    typeof input === "string"
      ? encoder.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);
  // BufferSource wants a plain ArrayBuffer view; a Uint8Array is one.
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function sign(value: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return `${value}.${b64url(mac)}`;
}

/**
 * Verify a `value.signature` pair and return the value, or null.
 *
 * Uses crypto.subtle.verify rather than comparing strings: a `===` on the
 * signature leaks its correct prefix through timing.
 */
export async function unsign(signed: string, secret: string): Promise<string | null> {
  const cut = signed.lastIndexOf(".");
  if (cut <= 0) return null;
  const value = signed.slice(0, cut);
  const mac = signed.slice(cut + 1);

  let raw: Uint8Array;
  try {
    const padded = mac.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    raw = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }

  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify("HMAC", key, raw as BufferSource, encoder.encode(value));
  return ok ? value : null;
}

/** PKCE verifier/challenge pair (RFC 7636, S256). */
export async function pkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomToken(32);
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  return { verifier, challenge: b64url(digest) };
}
