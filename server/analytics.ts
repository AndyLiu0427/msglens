/**
 * Server-side events.
 *
 * Only workspace actions and purchases reach this. The anonymous viewer does
 * not and will not: it has no server to send from, which is the point of it,
 * and the privacy policy says the number of files opened there is not counted.
 *
 * Identity here is the user id, not the pricing page's per-visit id. Workspace
 * actions are by definition authenticated — the server already knows who is
 * asking, stores their files and serves them back — so a durable id adds no
 * knowledge it did not have. The visitor on the pricing page is a stranger and
 * stays one.
 *
 * That does mean the project holds two kinds of profile: sessions on the
 * marketing funnel and users in the product. They answer different questions
 * and are not meant to join.
 */

import { MIXPANEL_TOKEN } from "../shared/paddle-catalogue";
import type { Ctx } from "./types";

/**
 * Send one event, and never let it matter.
 *
 * Not awaited anywhere it is called. A save that failed because an analytics
 * host was slow would be a bad trade, and a webhook that returned non-2xx for
 * the same reason would make Paddle retry a payment.
 */
export function trackServer(
  ctx: Ctx,
  event: string,
  distinctId: string,
  props: Record<string, unknown> = {},
): void {
  const token = ctx.env.MIXPANEL_TOKEN ?? MIXPANEL_TOKEN;
  if (!token || !distinctId) return;

  void fetch("https://api.mixpanel.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      {
        event,
        properties: {
          ...props,
          platform: "server",
          token,
          distinct_id: distinctId,
          $insert_id: crypto.randomUUID(),
          time: Date.now(),
        },
      },
    ]),
  }).catch(() => {});
}
