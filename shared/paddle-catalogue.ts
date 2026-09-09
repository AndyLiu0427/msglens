/**
 * The Paddle price ids, in one place.
 *
 * This file exists because the browser and the webhook both need them and the
 * two live in different TypeScript programs — `src/` is a DOM app, `server/`
 * is a Worker, and neither may import the other. Left as two copies they would
 * eventually disagree, and the failure mode is the worst one this system has:
 * a customer pays, the webhook does not recognise the price, and no
 * entitlement is written. Money taken, nothing granted.
 *
 * Deliberately plain strings and nothing else, so it can sit in both programs
 * without dragging any platform types across the boundary.
 *
 * Committed rather than configured, for the same reason as `adsenseClient` in
 * site.ts: a price id is public by construction — it appears in the checkout
 * the browser opens — and an unset build variable would take the Buy buttons
 * off the live site without failing the build or reporting anything.
 */

export type PaddleEnvironment = "sandbox" | "production";
export type PaddlePlanId = "monthly" | "yearly" | "lifetime";

export const PADDLE_CATALOGUE: Record<PaddleEnvironment, Record<PaddlePlanId, string>> = {
  // No sandbox account exists. Empty means the pricing page renders in full
  // and says checkout is not open yet, which is the honest thing for a build
  // pointed at an environment that has no catalogue.
  sandbox: { monthly: "", yearly: "", lifetime: "" },
  production: {
    monthly: "pri_01m0z14gpb16kf07vyqmw44cej",
    yearly: "pri_01m0z151qeq1xa9r4fwq3qh9qz",
    lifetime: "pri_01m0z1h0kza6eaxy8qh2090k0h",
  },
};

/**
 * Which plan a price id belongs to, searching both environments.
 *
 * Deliberately not told which environment it is in. Sandbox and live are
 * separate Paddle systems, so an id from one can never arrive in a webhook
 * from the other — which makes the environment an unnecessary thing to
 * configure, and an unnecessary thing to get wrong.
 */
export function planForPriceId(priceId: string): PaddlePlanId | null {
  if (!priceId) return null;
  for (const plans of Object.values(PADDLE_CATALOGUE)) {
    for (const [plan, id] of Object.entries(plans)) {
      if (id && id === priceId) return plan as PaddlePlanId;
    }
  }
  return null;
}

/**
 * The Mixpanel project token.
 *
 * Here rather than in either program because both need it: the pricing page
 * sends the clicks, the webhook sends the purchase that closes the funnel, and
 * two copies of one string is how the two halves stop agreeing.
 *
 * Publishable — Mixpanel calls this the token "intended for untrusted clients"
 * and /track accepts it from a browser. The API secret is not here and is not
 * needed; /import is the endpoint that wants one and nothing here uses it.
 */
export const MIXPANEL_TOKEN = "e2bcbe23925908d4e8d2365632b27720";
