/**
 * Plans and prices.
 *
 * The numbers here are the ones on the pricing page, and they are the source
 * for both locales — a price written twice is a price that will eventually
 * disagree with itself. The price *ids* live in shared/paddle-catalogue.ts,
 * which the webhook reads too, for the same reason.
 */

import { PADDLE_CATALOGUE, type PaddlePlanId } from "@/../shared/paddle-catalogue";

export type PlanId = PaddlePlanId;

export interface Plan {
  id: PlanId;
  /** US dollars. Paddle converts and collects local tax at checkout. */
  price: number;
  /** What the price buys, for the "$3.25 / month, billed yearly" line. */
  perMonth: number | null;
  priceId: string;
}

/**
 * Live by default, because the live catalogue is the only one that exists.
 * Defaulting to a sandbox with no products would leave every build with the
 * Buy buttons switched off and nothing on screen explaining why.
 */
const ENVIRONMENT = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "production") as
  | "sandbox"
  | "production";

/**
 * Paddle.js client-side tokens.
 *
 * Publishable by design — Paddle's own documentation calls these safe to put
 * in frontend code, and this one is in the bundle of every visitor who opens
 * the pricing page. Committed for the same reason as the price ids: a value
 * with no secrecy is worse off in an environment variable, where forgetting it
 * silently removes the Buy buttons instead of failing anything.
 *
 * The API key is the opposite and appears nowhere in this repository.
 */
const CLIENT_TOKENS: Record<typeof ENVIRONMENT, string> = {
  sandbox: "",
  production: "live_231221707447f7fa6ffcbdeb709",
};

export const PADDLE = {
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? CLIENT_TOKENS[ENVIRONMENT],
  environment: ENVIRONMENT,
};

/**
 * Written out longhand on purpose.
 *
 * Next replaces `process.env.NEXT_PUBLIC_X` at build time only where the key
 * is a literal it can see. A computed key is left alone and reads as undefined
 * in the browser, so an override would appear to work in dev and silently do
 * nothing once built.
 */
const OVERRIDES: Record<PlanId, string | undefined> = {
  monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY,
  yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY,
  lifetime: process.env.NEXT_PUBLIC_PADDLE_PRICE_LIFETIME,
};

const priceId = (plan: PlanId): string =>
  OVERRIDES[plan] || PADDLE_CATALOGUE[PADDLE.environment][plan];

/**
 * Yearly is 35% off monthly, and lifetime is 1.26× yearly.
 *
 * That ratio is the whole pricing idea: a year of MsgLens costs $39 and never
 * paying again costs $10 more. Anyone who expects to still be opening .msg
 * files in fourteen months is better off buying lifetime, and most people know
 * that about themselves without doing the arithmetic.
 *
 * The trade is deliberate and worth stating plainly: a lifetime sale earns
 * roughly one year of subscription revenue and commits us to that user's
 * storage indefinitely. It buys conversion and cash now against revenue later.
 */
export const PLANS: Record<PlanId, Plan> = {
  monthly: { id: "monthly", price: 5, perMonth: 5, priceId: priceId("monthly") },
  yearly: { id: "yearly", price: 39, perMonth: 3.25, priceId: priceId("yearly") },
  lifetime: { id: "lifetime", price: 49, perMonth: null, priceId: priceId("lifetime") },
};

/** How many files the free tier holds. Must match FREE_FILE_LIMIT on the server. */
export const FREE_FILE_LIMIT = 5;

/**
 * Can a purchase actually be started?
 *
 * False until both halves are in place: a catalogue for this environment, and
 * a client-side token. The pricing page still renders in full — the prices are
 * real and the comparison is the point — but the buttons say so instead of
 * opening a checkout that would fail.
 */
export const checkoutReady = (): boolean =>
  PADDLE.clientToken !== "" &&
  Object.values(PLANS).every((plan) => plan.priceId !== "");

/** `$39`, or `$3.25` — no trailing `.00`, because prices are not measurements. */
export function formatUsd(amount: number): string {
  return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}
