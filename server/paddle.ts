/**
 * Paddle Billing: webhooks in, and the customer-portal link out.
 *
 * Paddle is the merchant of record, which is the reason it was chosen over a
 * gateway: it is the legal seller, so it collects and files VAT/GST in every
 * jurisdiction a customer might buy from. Nothing in this file needs to know
 * about tax, and nothing anywhere needs to know about card numbers — this
 * endpoint only ever sees Paddle's own identifiers.
 */

import type { EntitlementRow, EntitlementStatus, Plan } from "./billing";
import { MIXPANEL_TOKEN, planForPriceId } from "../shared/paddle-catalogue";
import { requireUser } from "./session";
import { badRequest, misconfigured, notFound, type Ctx } from "./types";

const encoder = new TextEncoder();

/**
 * Verify `Paddle-Signature: ts=<unix>;h1=<hex>`.
 *
 * The signed payload is `${ts}:${rawBody}`, so the body has to be verified
 * exactly as it arrived — re-serialising parsed JSON changes key order and
 * whitespace and the signature stops matching.
 */
async function verifySignature(
  header: string | null,
  rawBody: string,
  secret: string,
): Promise<boolean> {
  if (!header) return false;

  let ts = "";
  let h1 = "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "ts") ts = value;
    else if (key === "h1") h1 = value;
  }
  if (!ts || !/^[0-9a-f]+$/i.test(h1) || h1.length % 2 !== 0) return false;

  /**
   * Reject anything older than five minutes.
   *
   * A signature stays valid forever otherwise, so a request captured from a
   * log or a proxy could be replayed later. The idempotency table already
   * stops a replay from being *applied* twice, but rows there are prunable and
   * this costs one subtraction.
   */
  const age = Math.floor(Date.now() / 1000) - Number(ts);
  if (!Number.isFinite(age) || age > 300 || age < -300) return false;

  const signature = new Uint8Array(h1.length / 2);
  for (let i = 0; i < signature.length; i++) {
    signature[i] = Number.parseInt(h1.slice(i * 2, i * 2 + 2), 16);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  // crypto.subtle.verify rather than comparing hex strings: `===` on a MAC
  // leaks its correct prefix through timing.
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature as BufferSource,
    encoder.encode(`${ts}:${rawBody}`),
  );
}

/** Paddle sends ISO 8601; the database stores unix seconds. */
function toUnix(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

interface PaddleEvent {
  event_id?: string;
  event_type?: string;
  data?: Record<string, unknown>;
}

/**
 * Which of our users this event is about.
 *
 * Three ways, in descending order of reliability:
 *
 *   1. `custom_data.user_id`, which the checkout attaches. Authoritative.
 *   2. A customer id already recorded against an entitlement — the path for
 *      renewals, where the checkout that carried custom_data was months ago.
 *   3. The billing email. Last resort, and only an exact match, because email
 *      is the one identifier the OIDC spec warns is reassignable.
 */
async function resolveUserId(ctx: Ctx, data: Record<string, unknown>): Promise<string | null> {
  const custom = data.custom_data as { user_id?: unknown } | null | undefined;
  if (custom && typeof custom.user_id === "string" && custom.user_id) {
    return custom.user_id;
  }

  const customerId = typeof data.customer_id === "string" ? data.customer_id : null;
  if (customerId) {
    const row = await ctx.env.DB.prepare(
      `SELECT user_id FROM entitlements WHERE paddle_customer_id = ?`,
    )
      .bind(customerId)
      .first<{ user_id: string }>();
    if (row) return row.user_id;
  }

  const email = (data.customer as { email?: unknown } | undefined)?.email;
  if (typeof email === "string" && email) {
    const row = await ctx.env.DB.prepare(`SELECT id FROM users WHERE email = ?`)
      .bind(email)
      .first<{ id: string }>();
    if (row) return row.id;
  }

  return null;
}

/** The first price id on the event's line items. */
function firstPriceId(data: Record<string, unknown>): string | null {
  const items = data.items;
  if (!Array.isArray(items)) return null;
  for (const item of items) {
    const price = (item as { price?: { id?: unknown } }).price;
    if (price && typeof price.id === "string") return price.id;
  }
  return null;
}

/**
 * Tell Mixpanel a purchase completed.
 *
 * Keyed on the session id the checkout carried in custom_data, so this lands
 * on the same profile as the click that started it. Without that the funnel
 * stops at "checkout opened" and abandonment inside Paddle's window — the last
 * and most expensive step — is invisible.
 *
 * Never awaited and never able to fail the webhook. Paddle retries a non-2xx,
 * and retrying a payment because an analytics host was slow would be an
 * absurd way to lose an entitlement.
 */
function trackPurchase(
  ctx: Ctx,
  data: Record<string, unknown>,
  plan: string,
  /**
   * A number, never Paddle's decimal string. A quoted numeric is stored as a
   * string in Mixpanel and cannot be summed or averaged afterwards, and the
   * type cannot be changed retroactively for events already ingested.
   */
  amount: number | null,
): void {
  const token = ctx.env.MIXPANEL_TOKEN ?? MIXPANEL_TOKEN;
  const custom = data.custom_data as { session_id?: unknown } | null | undefined;
  const distinctId = typeof custom?.session_id === "string" ? custom.session_id : null;
  if (!token || !distinctId) return;

  void fetch("https://api.mixpanel.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      {
        event: "purchase_completed",
        properties: {
          plan,
          amount,
          platform: "web",
          token,
          distinct_id: distinctId,
          $insert_id: typeof data.id === "string" ? data.id : crypto.randomUUID(),
          time: Date.now(),
        },
      },
    ]),
  }).catch(() => {});
}

interface Upsert {
  userId: string;
  plan: Plan;
  status: EntitlementStatus;
  expiresAt: number | null;
  customerId: string | null;
  subscriptionId: string | null;
  transactionId: string | null;
  cancelAtPeriodEnd: boolean;
}

async function upsertEntitlement(ctx: Ctx, u: Upsert): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await ctx.env.DB.prepare(
    `INSERT INTO entitlements (
       user_id, plan, status, expires_at, paddle_customer_id,
       paddle_subscription_id, paddle_transaction_id, cancel_at_period_end,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       plan = excluded.plan,
       status = excluded.status,
       -- Only lifetime may clear the date; any other event lacking one keeps it.
       expires_at = CASE WHEN excluded.plan = 'lifetime' THEN excluded.expires_at
                         ELSE coalesce(excluded.expires_at, entitlements.expires_at) END,
       paddle_customer_id = coalesce(excluded.paddle_customer_id, entitlements.paddle_customer_id),
       paddle_subscription_id =
         coalesce(excluded.paddle_subscription_id, entitlements.paddle_subscription_id),
       paddle_transaction_id =
         coalesce(excluded.paddle_transaction_id, entitlements.paddle_transaction_id),
       cancel_at_period_end = excluded.cancel_at_period_end,
       updated_at = excluded.updated_at`,
  )
    .bind(
      u.userId,
      u.plan,
      u.status,
      u.expiresAt,
      u.customerId,
      u.subscriptionId,
      u.transactionId,
      u.cancelAtPeriodEnd ? 1 : 0,
      now,
      now,
    )
    .run();
}

/**
 * A lifetime purchase must never be downgraded by a later subscription event.
 *
 * Paddle emits `transaction.completed` for subscription renewals too, and a
 * user who bought lifetime after having had a monthly plan would otherwise be
 * knocked back to monthly by a trailing event for the old subscription.
 */
async function hasLifetime(ctx: Ctx, userId: string): Promise<boolean> {
  const row = await ctx.env.DB.prepare(
    `SELECT 1 AS ok FROM entitlements WHERE user_id = ? AND plan = 'lifetime'`,
  )
    .bind(userId)
    .first<{ ok: number }>();
  return !!row;
}

/** Paddle's subscription statuses, narrowed to the four we store. */
function mapStatus(raw: unknown): EntitlementStatus {
  switch (raw) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "paused":
      return "expired";
    default:
      return "active";
  }
}

async function handleSubscription(ctx: Ctx, data: Record<string, unknown>): Promise<void> {
  const userId = await resolveUserId(ctx, data);
  if (!userId) {
    // Nothing to attach it to. Logged rather than thrown: returning non-2xx
    // makes Paddle retry forever for an event we will never be able to place.
    console.error("paddle: no user for subscription", data.id);
    return;
  }
  if (await hasLifetime(ctx, userId)) return;

  const priceId = firstPriceId(data);
  const plan = priceId ? planForPriceId(priceId) : null;
  if (!plan) {
    console.error("paddle: unknown price on subscription", priceId);
    return;
  }

  const period = data.current_billing_period as { ends_at?: string } | null | undefined;
  const scheduled = data.scheduled_change as { action?: string } | null | undefined;
  const status = mapStatus(data.status);
  // A subscription must never write NULL, which means lifetime here. An
  // immediate cancel has no billing period left, so it ends when cancelled.
  const endedAt =
    status === "canceled"
      ? (toUnix(data.canceled_at as string | undefined) ?? Math.floor(Date.now() / 1000))
      : null;

  if (status === "active" && !scheduled) trackPurchase(ctx, data, plan, null);

  await upsertEntitlement(ctx, {
    userId,
    plan,
    // Paddle reports a cancelled-but-not-yet-ended subscription as `active`
    // with a scheduled change, so status alone would lose the distinction.
    status: scheduled?.action === "cancel" && status === "active" ? "canceled" : status,
    expiresAt: toUnix(period?.ends_at) ?? endedAt,
    customerId: typeof data.customer_id === "string" ? data.customer_id : null,
    subscriptionId: typeof data.id === "string" ? data.id : null,
    transactionId: null,
    cancelAtPeriodEnd: scheduled?.action === "cancel",
  });
}

async function handleTransaction(ctx: Ctx, data: Record<string, unknown>): Promise<void> {
  // Subscription payments also arrive here, and the subscription events carry
  // the period dates this one lacks. Let those handle it.
  if (data.subscription_id) return;

  const priceId = firstPriceId(data);
  const plan = priceId ? planForPriceId(priceId) : null;
  if (plan !== "lifetime") return;

  const userId = await resolveUserId(ctx, data);
  if (!userId) {
    console.error("paddle: no user for transaction", data.id);
    return;
  }

  // Paddle reports totals in minor units as a decimal string.
  const raw = (data.details as { totals?: { total?: unknown } } | undefined)?.totals?.total;
  const minor = typeof raw === "string" ? Number(raw) : NaN;
  trackPurchase(ctx, data, "lifetime", Number.isFinite(minor) ? minor / 100 : null);

  await upsertEntitlement(ctx, {
    userId,
    plan: "lifetime",
    status: "active",
    // The whole point of the plan.
    expiresAt: null,
    customerId: typeof data.customer_id === "string" ? data.customer_id : null,
    subscriptionId: null,
    transactionId: typeof data.id === "string" ? data.id : null,
    cancelAtPeriodEnd: false,
  });
}

/**
 * Refunds and chargebacks.
 *
 * Without this a lifetime purchase survives its own refund: the row has
 * `expires_at = NULL`, nothing ever expires it, and the money goes back while
 * the access stays. Subscriptions were already covered — Paddle cancels them
 * and `subscription.canceled` arrives — so this closes the one-off case.
 *
 * Matched on `transaction_id`, which only lifetime rows carry. That is not a
 * coincidence to rely on quietly: a subscription's periodic refund should not
 * revoke a subscription that Paddle still considers active, and keying on the
 * transaction is what keeps this away from those.
 */
async function handleAdjustment(ctx: Ctx, data: Record<string, unknown>): Promise<void> {
  const action = data.action;
  if (action !== "refund" && action !== "chargeback") return;

  // Live refunds start as pending_approval and only become real once Paddle
  // approves them, which arrives as adjustment.updated. Acting on the earlier
  // event would revoke access for a refund that may yet be rejected.
  if (data.status !== "approved") return;

  const transactionId = typeof data.transaction_id === "string" ? data.transaction_id : null;
  if (!transactionId) return;

  // `full` and `partial` are Paddle's own item types, so the distinction needs
  // no stored amount to compute. A partial refund is a goodwill gesture, not a
  // withdrawal of the purchase, and taking access away for one would be wrong.
  const items = Array.isArray(data.items) ? data.items : [];
  const full = items.some((item) => (item as { type?: unknown })?.type === "full");
  if (!full) {
    console.log("paddle: partial adjustment, access kept", transactionId);
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  await ctx.env.DB.prepare(
    `UPDATE entitlements
        SET status = 'expired', expires_at = ?, updated_at = ?
      WHERE paddle_transaction_id = ?`,
  )
    .bind(now, now, transactionId)
    .run();
}

export async function paddleWebhook(ctx: Ctx): Promise<Response> {
  const secret = ctx.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) throw misconfigured("Billing is not configured");

  const rawBody = await ctx.request.text();
  const ok = await verifySignature(
    ctx.request.headers.get("Paddle-Signature"),
    rawBody,
    secret,
  );
  // 403 rather than 400: an unsigned request is not a malformed one, and
  // Paddle does not retry a 403, which is the right outcome for a forgery.
  if (!ok) return Response.json({ error: "Bad signature" }, { status: 403 });

  let event: PaddleEvent;
  try {
    event = JSON.parse(rawBody) as PaddleEvent;
  } catch {
    throw badRequest("Malformed webhook body");
  }

  const { event_id: eventId, event_type: type, data } = event;
  if (!eventId || !type || !data) throw badRequest("Incomplete webhook body");

  // Idempotency. The insert failing on a duplicate primary key is the check —
  // a SELECT first would leave a window for two concurrent redeliveries.
  try {
    await ctx.env.DB.prepare(
      `INSERT INTO billing_events (event_id, event_type, received_at) VALUES (?, ?, ?)`,
    )
      .bind(eventId, type, Math.floor(Date.now() / 1000))
      .run();
  } catch {
    return Response.json({ ok: true, duplicate: true });
  }

  switch (type) {
    case "subscription.created":
    case "subscription.updated":
    case "subscription.canceled":
      await handleSubscription(ctx, data);
      break;
    case "transaction.completed":
      await handleTransaction(ctx, data);
      break;
    case "adjustment.created":
    case "adjustment.updated":
      await handleAdjustment(ctx, data);
      break;
    default:
      // Everything else is acknowledged and ignored. Paddle sends a lot of
      // event types and a 404 for the ones we do not want would look like an
      // outage on their dashboard.
      break;
  }

  return Response.json({ ok: true });
}

/**
 * A signed link to Paddle's customer portal, where the user can cancel,
 * change card or download invoices. Paddle hosts it, so nothing here handles
 * payment details; the link is short-lived, so it is minted per click.
 */
export async function billingPortal(ctx: Ctx): Promise<Response> {
  const user = await requireUser(ctx);
  const apiKey = ctx.env.PADDLE_API_KEY;
  if (!apiKey) throw misconfigured("Billing management is not configured");

  const row = await ctx.env.DB.prepare(
    `SELECT paddle_customer_id, paddle_subscription_id FROM entitlements WHERE user_id = ?`,
  )
    .bind(user.id)
    .first<Pick<EntitlementRow, "paddle_customer_id" | "paddle_subscription_id">>();
  if (!row?.paddle_customer_id) throw notFound("No billing account for this user");

  // The key's own prefix says which Paddle system it belongs to.
  const base = apiKey.includes("_sdbx_")
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

  const res = await fetch(`${base}/customers/${row.paddle_customer_id}/portal-sessions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription_ids: row.paddle_subscription_id ? [row.paddle_subscription_id] : [],
    }),
  });
  if (!res.ok) {
    console.error("paddle: portal session failed", res.status, await res.text());
    throw misconfigured("Could not open billing management");
  }

  const body = (await res.json()) as { data?: { urls?: { general?: { overview?: string } } } };
  const url = body.data?.urls?.general?.overview;
  if (!url) throw misconfigured("Could not open billing management");
  return Response.json({ url });
}
