/**
 * Opening a Paddle checkout.
 *
 * Paddle.js is loaded on demand rather than in the document head. Two reasons,
 * and the second is the important one:
 *
 *   - Nobody who is reading a guide about .msg files should be downloading a
 *     payments SDK.
 *   - The site's whole differentiator is that the viewer talks to nothing, and
 *     a third-party script in every page's <head> would make that untrue no
 *     matter what the script did. This one loads when someone presses a Buy
 *     button, and not before.
 */

import { PADDLE, PLANS, type PlanId } from "@/lib/billing";
import { sessionId } from "@/lib/analytics";

const SDK = "https://cdn.paddle.com/paddle/v2/paddle.js";

interface PaddleCheckoutOptions {
  items: Array<{ priceId: string; quantity: number }>;
  customData?: Record<string, string>;
  customer?: { email: string };
  settings?: Record<string, string>;
}

interface PaddleGlobal {
  Environment: { set(env: string): void };
  Initialize(options: { token: string }): void;
  Checkout: { open(options: PaddleCheckoutOptions): void };
}

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

let loading: Promise<PaddleGlobal> | null = null;

function loadPaddle(): Promise<PaddleGlobal> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Paddle) return Promise.resolve(window.Paddle);

  loading ??= new Promise<PaddleGlobal>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK;
    script.async = true;
    script.onload = () => {
      const paddle = window.Paddle;
      if (!paddle) {
        reject(new Error("Paddle loaded but did not register"));
        return;
      }
      // Must be set before Initialize, and only once per page.
      if (PADDLE.environment === "sandbox") paddle.Environment.set("sandbox");
      paddle.Initialize({ token: PADDLE.clientToken });
      resolve(paddle);
    };
    script.onerror = () => {
      // Do not cache the failure: a blocked request on a flaky connection
      // would otherwise make every later attempt fail without trying.
      loading = null;
      reject(new Error("Could not load the checkout"));
    };
    document.head.append(script);
  });

  return loading;
}

/**
 * Paddle's own name for the parameter it appends to the default payment link.
 */
const TRANSACTION_PARAM = "_ptxn";

/**
 * Load Paddle.js when Paddle has sent someone here to finish paying.
 *
 * The default payment link is where a subscriber lands from a dunning email —
 * their card expired, Paddle asked them to update it, and this is the page the
 * link points at. Paddle.js opens the checkout by itself once it sees the
 * transaction id, but only if it is on the page at all, and the whole design
 * here is that it is not until someone presses Buy.
 *
 * So this is the one case where it loads without a click. Without it the
 * failure is silent and expensive: the customer arrives, nothing happens, and
 * the subscription lapses.
 *
 * Returns false when there is no transaction to resume, which is every normal
 * visit to the page.
 */
export function resumePaymentLink(): boolean {
  if (typeof window === "undefined") return false;
  if (!new URLSearchParams(window.location.search).has(TRANSACTION_PARAM)) return false;
  // Errors are swallowed on purpose: Paddle renders its own message inside the
  // checkout, and there is nothing useful this page can add.
  void loadPaddle().catch(() => {});
  return true;
}

/**
 * Start a purchase.
 *
 * `userId` travels as custom_data and is how the webhook knows whose account
 * to credit. Everything else — card details, address, tax — happens inside
 * Paddle's iframe and never reaches this origin.
 */
export async function openCheckout(
  plan: PlanId,
  user: { id: string; email: string },
): Promise<void> {
  const { priceId } = PLANS[plan];
  if (!priceId) throw new Error("This plan is not available yet");

  /**
   * Never open a live checkout from anywhere but the live site.
   *
   * There is no sandbox account, so the default environment is production —
   * which means a Buy button pressed on localhost would charge a real card.
   * Paddle's own domain approval would refuse it too, but with an opaque
   * error; this says what happened.
   */
  const host = window.location.hostname;
  const onLiveSite = host === "msglens.app" || host.endsWith(".msglens.app");
  if (PADDLE.environment === "production" && !onLiveSite) {
    throw new Error(`Live checkout is disabled on ${host}. Open it on msglens.app.`);
  }

  const paddle = await loadPaddle();
  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    // The session id rides along so the webhook's purchase event lands on the
    // same Mixpanel profile as the click that started it. Without it the funnel
    // is two disconnected numbers and checkout abandonment is invisible.
    customData: { user_id: user.id, session_id: sessionId() },
    // Prefilled, but Paddle still lets it be changed — the receipt should go
    // wherever the buyer wants it, which is not necessarily their Google login.
    customer: { email: user.email },
    settings: {
      displayMode: "overlay",
      theme: "light",
      // Comes back to the workspace, where the new entitlement is visible.
      successUrl: `${window.location.origin}/workspace/?purchased=1`,
    },
  });
}
