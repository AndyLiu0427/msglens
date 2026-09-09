/**
 * Analytics, on the pricing page and nowhere else.
 *
 * The viewer is the reason this restriction exists rather than a preference.
 * Its promise — checkable in the Network tab, which people do check — is that
 * it talks to nothing, and the privacy policy says in as many words that the
 * number of files you open is not counted. An event from that page would make
 * both untrue.
 *
 * Hotjar is a stronger case still: it records the screen. People drop real
 * business mail into this site. Session replay anywhere near the viewer or the
 * workspace would capture message bodies, subjects and senders, which is the
 * single thing every page here promises never leaves the device.
 *
 * So both load from /pricing, which is a static marketing page with no message
 * on it, and which is where the only question worth asking lives: how many
 * people press the buy button and do not finish.
 *
 * Both are off until their tokens are set. Empty means no script, no request.
 */

import { MIXPANEL_TOKEN } from "@/../shared/paddle-catalogue";

export const ANALYTICS = {
  mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ?? MIXPANEL_TOKEN,
  hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID ?? "",
};

/**
 * A per-session id, not a per-person one.
 *
 * Enough to join "pressed the button" to "opened the checkout" in the same
 * visit, which is the whole question. A persistent id would follow someone
 * across visits and buy nothing this page needs to know.
 */
export function sessionId(): string {
  const KEY = "msglens_session_id";
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    // Private mode, or storage blocked. An unjoined event still counts.
    return crypto.randomUUID();
  }
}

/**
 * Send one event to Mixpanel.
 *
 * No SDK: /track takes a project token from a browser, so the whole client is
 * one fetch. `keepalive` because the interesting events happen immediately
 * before a navigation that would otherwise cancel the request.
 *
 * Form-encoded rather than JSON, which is not a style choice. A JSON
 * content-type is outside the CORS safelist, so the browser sends a preflight —
 * and Mixpanel's OPTIONS response allows the method but returns no
 * `access-control-allow-headers`, so the preflight fails and the request never
 * leaves. Server to server it works either way, which is exactly how this
 * shipped looking verified: curl succeeded, the browser silently did not.
 */
export function track(event: string, props: Record<string, unknown> = {}): void {
  if (!ANALYTICS.mixpanelToken || typeof window === "undefined") return;
  const payload = JSON.stringify([
    {
      event,
      properties: {
        ...props,
        platform: "web",
        token: ANALYTICS.mixpanelToken,
        distinct_id: sessionId(),
        // Mixpanel dedupes on (event, time, distinct_id, $insert_id), which
        // matters because keepalive requests can be retried by the browser.
        $insert_id: crypto.randomUUID(),
        time: Date.now(),
      },
    },
  ]);

  void fetch("https://api.mixpanel.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    keepalive: true,
    body: new URLSearchParams({ data: payload }),
    // Analytics must never surface an error to someone trying to buy something.
  }).catch(() => {});
}

let hotjarLoaded = false;

/** Load Hotjar. Call from the pricing page only — see the note at the top. */
export function loadHotjar(): void {
  if (hotjarLoaded || !ANALYTICS.hotjarId || typeof window === "undefined") return;
  hotjarLoaded = true;
  const w = window as unknown as Record<string, unknown>;
  w._hjSettings = { hjid: Number(ANALYTICS.hotjarId), hjsv: 6 };
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://static.hotjar.com/c/hotjar-${ANALYTICS.hotjarId}.js?sv=6`;
  document.head.append(script);
}
