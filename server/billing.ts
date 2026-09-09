/**
 * What a signed-in user is allowed to do.
 *
 * The split is deliberate and is the same one the marketing pages promise:
 *
 *   - The viewer is free, anonymous and offline. It never reaches this file.
 *   - Signing in gives a small free allowance, so the workspace can be tried
 *     before it is bought.
 *   - Paying lifts the allowance and unlocks folders and team sharing.
 *
 * One rule shapes everything below: **reading and downloading are never
 * gated.** A lapsed subscription must not turn someone's own files into
 * something they have to pay to get back. Payment buys the ability to put more
 * in, not the ability to take what is already there out.
 */

import { HttpError, type Ctx, type User } from "./types";

export type Plan = "monthly" | "yearly" | "lifetime";
export type EntitlementStatus = "active" | "past_due" | "canceled" | "expired";

export interface EntitlementRow {
  user_id: string;
  plan: Plan;
  status: EntitlementStatus;
  expires_at: number | null;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  paddle_transaction_id: string | null;
  cancel_at_period_end: number;
  created_at: number;
  updated_at: number;
}

/**
 * What the free tier gets.
 *
 * Five is meant to be enough to see whether the workspace is useful and not
 * enough to live in. It is one constant on purpose — this number is a pricing
 * decision, not an architectural one, and should be changeable without reading
 * any of the code around it.
 */
export const FREE_FILE_LIMIT = 5;

export interface Entitlement {
  /** True when paid features are available right now. */
  active: boolean;
  plan: Plan | null;
  status: EntitlementStatus | null;
  /** Unix seconds; null for lifetime, and for the free tier. */
  expiresAt: number | null;
  cancelAtPeriodEnd: boolean;
  /** How many more files may be saved; null when unlimited. */
  remainingFiles: number | null;
}

const FREE: Entitlement = {
  active: false,
  plan: null,
  status: null,
  expiresAt: null,
  cancelAtPeriodEnd: false,
  remainingFiles: FREE_FILE_LIMIT,
};

/**
 * Does this row grant access at `now`?
 *
 * `expires_at IS NULL` is the lifetime case and must be checked before any
 * comparison — see the note in the migration about NULL comparisons.
 */
function grantsAccess(row: EntitlementRow, now: number): boolean {
  if (row.status === "expired") return false;
  // past_due is deliberately still allowed: the card failed, Paddle is
  // retrying, and locking someone out during a dunning cycle they may not know
  // about is how you turn a payment blip into a cancellation.
  if (row.expires_at === null) return true;
  return row.expires_at > now;
}

export async function readEntitlement(ctx: Ctx, userId: string): Promise<Entitlement> {
  const row = await ctx.env.DB.prepare(`SELECT * FROM entitlements WHERE user_id = ?`)
    .bind(userId)
    .first<EntitlementRow>();

  if (!row) return { ...FREE, remainingFiles: await remainingFreeFiles(ctx, userId) };

  const now = Math.floor(Date.now() / 1000);
  if (!grantsAccess(row, now)) {
    return {
      active: false,
      plan: row.plan,
      status: "expired",
      expiresAt: row.expires_at,
      cancelAtPeriodEnd: false,
      remainingFiles: await remainingFreeFiles(ctx, userId),
    };
  }

  return {
    active: true,
    plan: row.plan,
    status: row.status,
    expiresAt: row.expires_at,
    cancelAtPeriodEnd: row.cancel_at_period_end === 1,
    remainingFiles: null,
  };
}

/**
 * Free-tier headroom, counted across every team the user owns files in.
 *
 * Counting per user rather than per team matters: teams are free to create, so
 * a per-team limit would be lifted by pressing "New team".
 */
async function remainingFreeFiles(ctx: Ctx, userId: string): Promise<number> {
  const row = await ctx.env.DB.prepare(`SELECT count(*) AS n FROM files WHERE uploaded_by = ?`)
    .bind(userId)
    .first<{ n: number }>();
  return Math.max(0, FREE_FILE_LIMIT - (row?.n ?? 0));
}

/**
 * 402 Payment Required.
 *
 * A real status code rather than a 403 so the client can tell "you need to pay"
 * apart from "this is not yours" without matching on message text.
 */
export const paymentRequired = (message: string, code = "payment_required") =>
  new HttpError(402, message, code);

/** Guard for features that are paid outright: folders, teams, invites. */
export async function requirePlan(ctx: Ctx, user: User, feature: string): Promise<void> {
  const entitlement = await readEntitlement(ctx, user.id);
  if (entitlement.active) return;
  throw paymentRequired(`${feature} needs a MsgLens plan.`);
}

/** Guard for saving a file, which the free tier allows a few of. */
export async function requireUploadAllowance(ctx: Ctx, user: User): Promise<void> {
  const entitlement = await readEntitlement(ctx, user.id);
  if (entitlement.active) return;
  if ((entitlement.remainingFiles ?? 0) > 0) return;
  throw paymentRequired(
    `The free workspace holds ${FREE_FILE_LIMIT} files. A plan removes the limit.`,
    "free_limit_reached",
  );
}
