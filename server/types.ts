/**
 * Shared server types.
 *
 * Kept free of Next.js and React imports: this tree is bundled by the Pages
 * Functions build (esbuild), not by Next, so anything reachable from here has
 * to run in the Workers runtime.
 */

export interface Env {
  DB: D1Database;
  FILES: R2Bucket;

  /** Google OAuth client credentials. */
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  /** Secret used to sign the OAuth state cookie. */
  SESSION_SECRET: string;
  /**
   * Absolute origin, e.g. https://msglens.app.
   *
   * Optional. The request already carries the origin it arrived on, which is
   * the correct one by construction — a deployment cannot be wrong about its
   * own address. Set this only to force a different canonical origin.
   */
  SITE_URL?: string;

  /**
   * Paddle.
   *
   * All optional: with none of them set the workspace still runs, the free
   * tier still works, and the pricing page says checkout is not available yet.
   * Billing that fails closed on a missing variable would take the whole site
   * down for a value that only matters at the moment someone buys.
   *
   * Only the webhook secret. The price ids are committed in
   * shared/paddle-catalogue.ts, which the browser and this webhook both read —
   * they are public by construction, and one copy cannot drift from another.
   */
  PADDLE_WEBHOOK_SECRET?: string;

  /** Server API key, used only to mint customer-portal links. A secret. */
  PADDLE_API_KEY?: string;

  /**
   * Mixpanel project token, so the webhook can close the funnel the pricing
   * page opens. Same token as the browser uses — /track takes the untrusted
   * client token — but read from the environment here because server code has
   * no build step to inline it into.
   */
  MIXPANEL_TOKEN?: string;
}

export type Role = "owner" | "member" | "viewer";

export interface User {
  id: string;
  google_sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  created_at: number;
  last_seen_at: number;
}

export interface Team {
  id: string;
  name: string;
  is_personal: number;
  created_by: string;
  created_at: number;
}

export interface FileRow {
  id: string;
  team_id: string;
  folder_id: string | null;
  r2_key: string;
  file_name: string;
  size_bytes: number;
  sha256: string;
  source_format: string | null;
  subject: string | null;
  from_name: string | null;
  from_address: string | null;
  sent_at: number | null;
  has_attachments: number;
  uploaded_by: string;
  uploaded_at: number;
  /** Added in 0003. Counted rather than logged — see that migration. */
  open_count: number;
  last_opened_at: number | null;
}

export interface FolderRow {
  id: string;
  team_id: string;
  parent_id: string | null;
  name: string;
  created_by: string;
  created_at: number;
}

/**
 * The origin to build absolute URLs from.
 *
 * Prefers the request's own origin over configuration. Requiring a deployment
 * to be told its own address is a step that can be forgotten, and when it is
 * forgotten sign-in breaks with nothing on screen to explain why — which is
 * exactly what happened twice while setting this up.
 *
 * Deriving it cannot be exploited through a forged Host header: Google only
 * redirects to URIs registered on the OAuth client, so an origin we did not
 * register fails at Google rather than sending a code anywhere new.
 */
export const originOf = (ctx: { env: Env; url: URL }): string =>
  ctx.env.SITE_URL?.replace(/\/+$/, "") || ctx.url.origin;

/** Request context assembled by the router before a handler runs. */
export interface Ctx {
  env: Env;
  request: Request;
  url: URL;
  /** Present only on routes that passed `requireUser`. */
  user?: User;
}

/**
 * Errors that carry an HTTP status.
 *
 * Anything else that escapes a handler is a bug, and the router turns it into
 * a bare 500 without echoing the message — an unexpected error string can
 * carry table names, key material or file paths.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export const badRequest = (m: string, code?: string) => new HttpError(400, m, code);
export const unauthorized = (m = "Sign in required") => new HttpError(401, m);
export const forbidden = (m = "You do not have access to this") => new HttpError(403, m);
export const notFound = (m = "Not found") => new HttpError(404, m);
export const conflict = (m: string, code?: string) => new HttpError(409, m, code);
export const tooLarge = (m: string) => new HttpError(413, m);
export const misconfigured = (m: string) => new HttpError(503, m, "misconfigured");
