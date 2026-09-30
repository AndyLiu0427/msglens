import { describe, expect, it } from "vitest";
import { readEntitlement, FREE_FILE_LIMIT } from "./billing";
import { paddleWebhook } from "./paddle";
import { PADDLE_CATALOGUE } from "../shared/paddle-catalogue";
import type { Ctx, Env } from "./types";

/**
 * The money path.
 *
 * Two things here are the kind that break quietly rather than loudly, which is
 * why they are tested directly rather than through the UI:
 *
 *   - A lifetime entitlement stores `expires_at = NULL`. Any check written as
 *     a comparison silently excludes exactly the customers who paid the most,
 *     because `NULL > x` is NULL in SQL and falsy in JavaScript.
 *   - A webhook whose signature is not really checked looks identical to one
 *     that is, until someone grants themselves a plan with a curl command.
 */

type Responder = (args: unknown[]) => unknown;

/** Minimal D1 stand-in: match the SQL by pattern, return a canned row. */
function fakeDb(responses: Array<[RegExp, Responder]>) {
  const runs: Array<{ sql: string; args: unknown[] }> = [];
  const db = {
    runs,
    prepare(sql: string) {
      let bound: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) {
          bound = args;
          return stmt;
        },
        async first() {
          for (const [re, fn] of responses) if (re.test(sql)) return fn(bound);
          return null;
        },
        async run() {
          runs.push({ sql, args: bound });
          for (const [re, fn] of responses) if (re.test(sql)) return fn(bound);
          return { success: true };
        },
      };
      return stmt;
    },
  };
  return db;
}

function ctxWith(db: ReturnType<typeof fakeDb>, env: Partial<Env> = {}): Ctx {
  return {
    env: { DB: db, ...env } as unknown as Env,
    request: new Request("https://msglens.app/api/billing"),
    url: new URL("https://msglens.app/api/billing"),
  };
}

const NOW = () => Math.floor(Date.now() / 1000);

const row = (over: Record<string, unknown> = {}) => ({
  user_id: "u1",
  plan: "yearly",
  status: "active",
  expires_at: NOW() + 86_400,
  paddle_customer_id: "ctm_1",
  paddle_subscription_id: "sub_1",
  paddle_transaction_id: null,
  cancel_at_period_end: 0,
  created_at: 0,
  updated_at: 0,
  ...over,
});

describe("entitlements", () => {
  it("treats a null expiry as lifetime rather than as already expired", async () => {
    const db = fakeDb([
      [/FROM entitlements/, () => row({ plan: "lifetime", expires_at: null })],
    ]);
    const e = await readEntitlement(ctxWith(db), "u1");
    expect(e.active).toBe(true);
    expect(e.plan).toBe("lifetime");
    expect(e.expiresAt).toBeNull();
    expect(e.remainingFiles).toBeNull(); // unlimited
  });

  it("keeps access during the period a cancelled subscription already paid for", async () => {
    const db = fakeDb([
      [
        /FROM entitlements/,
        () => row({ status: "canceled", cancel_at_period_end: 1 }),
      ],
    ]);
    const e = await readEntitlement(ctxWith(db), "u1");
    expect(e.active).toBe(true);
    expect(e.cancelAtPeriodEnd).toBe(true);
  });

  it("keeps access while a payment is being retried", async () => {
    // Locking someone out mid-dunning turns a card blip into a cancellation.
    const db = fakeDb([[/FROM entitlements/, () => row({ status: "past_due" })]]);
    expect((await readEntitlement(ctxWith(db), "u1")).active).toBe(true);
  });

  it("drops a lapsed subscription back to the free allowance, not to nothing", async () => {
    const db = fakeDb([
      [/FROM entitlements/, () => row({ expires_at: NOW() - 60 })],
      [/count\(\*\) AS n FROM files/, () => ({ n: 2 })],
    ]);
    const e = await readEntitlement(ctxWith(db), "u1");
    expect(e.active).toBe(false);
    expect(e.status).toBe("expired");
    expect(e.remainingFiles).toBe(FREE_FILE_LIMIT - 2);
  });

  it("counts the free allowance across teams, so a new team does not reset it", async () => {
    const db = fakeDb([
      [/FROM entitlements/, () => null],
      [/count\(\*\) AS n FROM files/, () => ({ n: FREE_FILE_LIMIT + 3 })],
    ]);
    const e = await readEntitlement(ctxWith(db), "u1");
    expect(e.active).toBe(false);
    // Never negative: an over-quota user is at zero, not at minus three.
    expect(e.remainingFiles).toBe(0);
  });
});

// The ids the live site ships with; using them here means a webhook that
// stops recognising the real catalogue fails a test rather than a customer.
const PRICE = PADDLE_CATALOGUE.production;

const SECRET = "pdl_ntfset_test_secret";

async function sign(body: string, ts: string, secret = SECRET): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}:${body}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `ts=${ts};h1=${hex}`;
}

function webhookCtx(db: ReturnType<typeof fakeDb>, body: string, signature: string): Ctx {
  const request = new Request("https://msglens.app/api/billing/webhook", {
    method: "POST",
    body,
    headers: { "Paddle-Signature": signature },
  });
  return {
    env: { DB: db, PADDLE_WEBHOOK_SECRET: SECRET } as unknown as Env,
    request,
    url: new URL(request.url),
  };
}

const lifetimeEvent = (id = "evt_1") =>
  JSON.stringify({
    event_id: id,
    event_type: "transaction.completed",
    data: {
      id: "txn_1",
      customer_id: "ctm_1",
      subscription_id: null,
      custom_data: { user_id: "u1" },
      items: [{ price: { id: PRICE.lifetime } }],
    },
  });

describe("paddle webhook", () => {
  it("grants lifetime on a correctly signed transaction", async () => {
    const body = lifetimeEvent();
    const db = fakeDb([]);
    const res = await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));
    expect(res.status).toBe(200);

    const upsert = db.runs.find((r) => /INSERT INTO entitlements/.test(r.sql));
    expect(upsert).toBeTruthy();
    // (user_id, plan, status, expires_at, ...) — a lifetime row must carry a
    // null expiry, which is the thing the entitlement check keys on.
    expect(upsert!.args.slice(0, 4)).toEqual(["u1", "lifetime", "active", null]);
  });

  it("rejects a body that was altered after signing", async () => {
    const signature = await sign(lifetimeEvent(), String(NOW()));
    const tampered = lifetimeEvent().replace('"u1"', '"someone-else"');
    const res = await paddleWebhook(webhookCtx(fakeDb([]), tampered, signature));
    expect(res.status).toBe(403);
  });

  it("rejects a signature made with the wrong secret", async () => {
    const body = lifetimeEvent();
    const res = await paddleWebhook(
      webhookCtx(fakeDb([]), body, await sign(body, String(NOW()), "not-the-secret")),
    );
    expect(res.status).toBe(403);
  });

  it("rejects a replay of an old but genuinely signed request", async () => {
    const body = lifetimeEvent();
    const stale = String(NOW() - 3600);
    const res = await paddleWebhook(webhookCtx(fakeDb([]), body, await sign(body, stale)));
    expect(res.status).toBe(403);
  });

  it("applies a redelivered event only once", async () => {
    const body = lifetimeEvent();
    const signature = await sign(body, String(NOW()));
    // Second delivery: the idempotency insert fails on the primary key.
    const db = fakeDb([
      [
        /INSERT INTO billing_events/,
        () => {
          throw new Error("UNIQUE constraint failed: billing_events.event_id");
        },
      ],
    ]);
    const res = await paddleWebhook(webhookCtx(db, body, signature));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, duplicate: true });
    expect(db.runs.some((r) => /INSERT INTO entitlements/.test(r.sql))).toBe(false);
  });

  it("ignores a transaction that belongs to a subscription", async () => {
    // Those carry no period dates; the subscription events have them.
    const body = JSON.stringify({
      event_id: "evt_2",
      event_type: "transaction.completed",
      data: {
        id: "txn_2",
        subscription_id: "sub_1",
        custom_data: { user_id: "u1" },
        items: [{ price: { id: PRICE.yearly } }],
      },
    });
    const db = fakeDb([]);
    await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));
    expect(db.runs.some((r) => /INSERT INTO entitlements/.test(r.sql))).toBe(false);
  });

  const adjustment = (over: Record<string, unknown> = {}, id = "evt_adj") =>
    JSON.stringify({
      event_id: id,
      event_type: "adjustment.updated",
      data: {
        id: "adj_1",
        action: "refund",
        status: "approved",
        transaction_id: "txn_1",
        customer_id: "ctm_1",
        items: [{ id: "adjitm_1", item_id: "txnitm_1", type: "full" }],
        ...over,
      },
    });

  /** The UPDATE that revokes, or undefined if none was issued. */
  const revocation = (db: ReturnType<typeof fakeDb>) =>
    db.runs.find((r) => /UPDATE entitlements/.test(r.sql));

  it("revokes a lifetime purchase when its refund is approved", async () => {
    // Without this the row keeps expires_at = NULL and nothing ever expires
    // it: the money goes back and the access stays.
    const body = adjustment();
    const db = fakeDb([]);
    await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));

    const update = revocation(db);
    expect(update).toBeTruthy();
    expect(update!.sql).toContain("status = 'expired'");
    expect(update!.args.at(-1)).toBe("txn_1"); // keyed on the transaction
  });

  it("waits for approval rather than acting on a pending refund", async () => {
    // Live refunds arrive as pending_approval first and may still be rejected.
    const body = adjustment({ status: "pending_approval" }, "evt_adj_pending");
    const db = fakeDb([]);
    await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));
    expect(revocation(db)).toBeUndefined();
  });

  it("keeps access after a partial refund", async () => {
    // A partial refund is a goodwill gesture, not a withdrawal of the sale.
    const body = adjustment(
      { items: [{ id: "adjitm_1", item_id: "txnitm_1", type: "partial", amount: "1000" }] },
      "evt_adj_partial",
    );
    const db = fakeDb([]);
    await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));
    expect(revocation(db)).toBeUndefined();
  });

  it("revokes on a chargeback too", async () => {
    const body = adjustment({ action: "chargeback" }, "evt_adj_cb");
    const db = fakeDb([]);
    await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));
    expect(revocation(db)).toBeTruthy();
  });

  it("ignores a chargeback warning, which is not a loss of funds", async () => {
    const body = adjustment(
      { action: "chargeback_warning", status: "approved" },
      "evt_adj_warn",
    );
    const db = fakeDb([]);
    await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));
    expect(revocation(db)).toBeUndefined();
  });

  it("sends purchase_completed keyed on the checkout's session id", async () => {
    const sent: Array<Record<string, unknown>> = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      if (String(url).includes("mixpanel")) {
        sent.push(JSON.parse(String(init?.body))[0] as Record<string, unknown>);
      }
      return Promise.resolve(new Response("{}"));
    }) as typeof fetch;

    const body = JSON.stringify({
      event_id: "evt_track2",
      event_type: "transaction.completed",
      data: {
        id: "txn_9",
        customer_id: "ctm_1",
        subscription_id: null,
        custom_data: { user_id: "u1", session_id: "sess-1" },
        items: [{ price: { id: PRICE.lifetime } }],
      },
    });
    const ctx = webhookCtx(fakeDb([]), body, await sign(body, String(NOW())));
    (ctx.env as unknown as { MIXPANEL_TOKEN: string }).MIXPANEL_TOKEN = "tok";
    await paddleWebhook(ctx);
    globalThis.fetch = realFetch;

    expect(sent).toHaveLength(1);
    const props = sent[0].properties as Record<string, unknown>;
    expect(sent[0].event).toBe("purchase_completed");
    expect(props.distinct_id).toBe("sess-1");
    expect(props.plan).toBe("lifetime");
  });

  it("stays silent when the checkout carried no session id", async () => {
    const sent: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = ((url: string) => {
      sent.push(String(url));
      return Promise.resolve(new Response("{}"));
    }) as typeof fetch;

    const body = lifetimeEvent("evt_track3"); // custom_data has user_id only
    const ctx = webhookCtx(fakeDb([]), body, await sign(body, String(NOW())));
    (ctx.env as unknown as { MIXPANEL_TOKEN: string }).MIXPANEL_TOKEN = "tok";
    await paddleWebhook(ctx);
    globalThis.fetch = realFetch;

    expect(sent.filter((u) => u.includes("mixpanel"))).toHaveLength(0);
  });

  it("does not downgrade a lifetime customer on a trailing subscription event", async () => {
    const body = JSON.stringify({
      event_id: "evt_3",
      event_type: "subscription.updated",
      data: {
        id: "sub_1",
        customer_id: "ctm_1",
        status: "canceled",
        custom_data: { user_id: "u1" },
        current_billing_period: { ends_at: new Date().toISOString() },
        items: [{ price: { id: PRICE.yearly } }],
      },
    });
    const db = fakeDb([[/FROM entitlements WHERE user_id = \? AND plan = 'lifetime'/, () => ({ ok: 1 })]]);
    await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));
    expect(db.runs.some((r) => /INSERT INTO entitlements/.test(r.sql))).toBe(false);
  });

  it("ends an immediately cancelled subscription instead of making it lifetime", async () => {
    // Paddle sends no current_billing_period for an immediate cancel. NULL
    // expires_at means lifetime here, so writing it would give the plan away.
    const cancelledAt = "2026-09-30T06:09:59Z";
    const body = JSON.stringify({
      event_id: "evt_4",
      event_type: "subscription.canceled",
      data: {
        id: "sub_1",
        customer_id: "ctm_1",
        status: "canceled",
        canceled_at: cancelledAt,
        current_billing_period: null,
        scheduled_change: null,
        custom_data: { user_id: "u1" },
        items: [{ price: { id: PRICE.monthly } }],
      },
    });
    const db = fakeDb([]);
    await paddleWebhook(webhookCtx(db, body, await sign(body, String(NOW()))));

    const upsert = db.runs.find((r) => /INSERT INTO entitlements/.test(r.sql));
    expect(upsert).toBeDefined();
    const [, plan, status, expiresAt] = upsert!.args;
    expect(plan).toBe("monthly");
    expect(status).toBe("canceled");
    expect(expiresAt).toBe(Math.floor(Date.parse(cancelledAt) / 1000));
  });
});
