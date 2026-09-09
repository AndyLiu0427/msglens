-- Paid workspace.
--
-- The anonymous viewer stays free and stays offline: nothing in this file is
-- reachable without a session, so a visitor reading a guide is as untouched by
-- billing as they are by the rest of the database.

-- One row per user who has ever paid. Absence means "free tier", which is the
-- normal state and needs no row — a signed-in user is not a customer.
CREATE TABLE entitlements (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,

  -- 'monthly' | 'yearly' | 'lifetime'
  plan   TEXT NOT NULL,
  -- 'active' | 'past_due' | 'canceled' | 'expired'
  --
  -- 'canceled' still grants access until expires_at: the user paid for the
  -- period and cancelling only stops the next renewal.
  status TEXT NOT NULL,

  -- NULL means no expiry, which is what makes a lifetime plan a lifetime plan.
  -- Any query that reads this has to treat NULL as "not expired" rather than
  -- comparing it, because `NULL > ?` is NULL in SQL and would silently exclude
  -- exactly the customers who paid the most.
  expires_at INTEGER,

  -- Paddle's identifiers. The subscription id is absent for lifetime, which is
  -- a one-off transaction and never becomes a subscription.
  paddle_customer_id     TEXT,
  paddle_subscription_id TEXT UNIQUE,
  paddle_transaction_id  TEXT,

  -- Set when the user cancels but the paid period has not run out yet. Only
  -- used to word the UI honestly ("access until 3 May"), never for access.
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,

  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX entitlements_customer ON entitlements (paddle_customer_id);

-- Webhook idempotency.
--
-- Paddle retries on any non-2xx and can deliver the same event more than once
-- even after a success. Without this, a redelivered `transaction.completed`
-- would be applied twice; with a lifetime purchase that is harmless, but with
-- a renewal it would extend the period twice for one payment.
--
-- The primary key does the work: the insert fails on a duplicate and the
-- handler stops there.
CREATE TABLE billing_events (
  event_id    TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
