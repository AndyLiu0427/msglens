/**
 * Google sign-in — OAuth 2.0 authorization code flow with PKCE.
 *
 * Implemented directly rather than through a library because the whole flow is
 * three requests and the libraries that wrap it assume a Node runtime.
 *
 * The ID token is verified by fetching it over TLS from Google's token
 * endpoint rather than by checking its signature locally: a token handed back
 * on a direct, authenticated call to the issuer is trustworthy by transport
 * (this is what OpenID Connect calls the "code flow" shortcut, §3.1.3.7).
 * Nothing here ever accepts an ID token that arrived from the browser.
 */

import { b64url, pkce, randomToken, sign, unsign, uuid } from "./crypto";
import {
  cookieHeader,
  clearCookie,
  clearHintCookie,
  createSession,
  destroySession,
  hintCookie,
  readCookie,
  sessionCookie,
  SESSION_COOKIE,
} from "./session";
import { badRequest, misconfigured, originOf, type Ctx, type User } from "./types";

const STATE_COOKIE = "msglens_oauth";
const STATE_TTL_SECONDS = 600;

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

const redirectUri = (ctx: Ctx) => `${originOf(ctx)}/api/auth/callback`;

/**
 * Fail loudly when sign-in has not been configured.
 *
 * Without this, an unset secret produces a generic 500 that reads like a bug
 * in the code. This project has already lost time to exactly that shape of
 * problem — a missing build variable silently removing the AdSense snippet —
 * so a misconfiguration should say which name is missing rather than leaving
 * it to be guessed from a stack trace.
 */
function missingConfig(ctx: Ctx): string[] {
  // SITE_URL is deliberately absent: it is optional now that the origin comes
  // from the request.
  return (["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SESSION_SECRET"] as const).filter(
    (key) => !ctx.env[key],
  );
}

function assertConfigured(ctx: Ctx): void {
  const missing = missingConfig(ctx);
  if (missing.length) {
    console.error("sign-in is not configured; missing:", missing.join(", "));
    throw misconfigured(`Sign-in is not configured on this deployment (${missing.join(", ")})`);
  }
}

/**
 * Step 1 — send the browser to Google.
 *
 * The verifier and the CSRF state both go into one short-lived signed cookie
 * rather than into server storage: they are needed exactly once, a few seconds
 * later, by the same browser.
 */
export async function startGoogleLogin(ctx: Ctx): Promise<Response> {
  // Reached by a full navigation, so an error body would be all the user sees.
  // Send them back to a real page that can explain itself.
  const missing = missingConfig(ctx);
  if (missing.length) {
    console.error("sign-in is not configured; missing:", missing.join(", "));
    return new Response(null, {
      status: 302,
      headers: { Location: "/workspace/?error=misconfigured", "Cache-Control": "no-store" },
    });
  }
  const { verifier, challenge } = await pkce();
  const state = randomToken(16);

  // Where to land after signing in. Only same-origin paths are honoured, so a
  // crafted link cannot turn the callback into an open redirect.
  const raw = ctx.url.searchParams.get("next") ?? "/workspace/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/workspace/";

  const payload = b64url(new TextEncoder().encode(JSON.stringify({ verifier, state, next })));
  const signed = await sign(payload, ctx.env.SESSION_SECRET);

  const authorize = new URL(AUTH_ENDPOINT);
  authorize.search = new URLSearchParams({
    client_id: ctx.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(ctx),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    // Ask for an account choice rather than silently reusing one — people open
    // work mail from a personal browser profile more often than not.
    prompt: "select_account",
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      "Set-Cookie": cookieHeader(STATE_COOKIE, signed, STATE_TTL_SECONDS),
      "Cache-Control": "no-store",
    },
  });
}

interface GoogleClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/** Decode a JWT payload. Safe only because the token came straight from Google. */
function decodeIdToken(idToken: string): GoogleClaims {
  const part = idToken.split(".")[1];
  if (!part) throw badRequest("Malformed ID token");
  const padded = part.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  // atob yields a latin1 string; email and name can be non-ASCII.
  const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as GoogleClaims;
}

/** Step 2 — Google sends the browser back here with a code. */
export async function completeGoogleLogin(ctx: Ctx): Promise<Response> {
  const fail = (reason: string) =>
    new Response(null, {
      status: 302,
      headers: {
        Location: `/workspace/?error=${encodeURIComponent(reason)}`,
        "Set-Cookie": clearCookie(STATE_COOKIE),
        "Cache-Control": "no-store",
      },
    });

  assertConfigured(ctx);
  if (ctx.url.searchParams.get("error")) return fail("cancelled");

  const code = ctx.url.searchParams.get("code");
  const returnedState = ctx.url.searchParams.get("state");
  const cookie = readCookie(ctx.request, STATE_COOKIE);
  if (!code || !returnedState || !cookie) return fail("expired");

  const payload = await unsign(cookie, ctx.env.SESSION_SECRET);
  if (!payload) return fail("expired");

  let verifier: string;
  let state: string;
  let next: string;
  try {
    const bytes = Uint8Array.from(atob(payload.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0),
    );
    ({ verifier, state, next } = JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return fail("expired");
  }

  if (state !== returnedState) return fail("state_mismatch");

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ctx.env.GOOGLE_CLIENT_ID,
      client_secret: ctx.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(ctx),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) return fail("token_exchange_failed");
  const tokens = (await tokenResponse.json()) as { id_token?: string };
  if (!tokens.id_token) return fail("no_id_token");

  const claims = decodeIdToken(tokens.id_token);
  // An unverified address would let someone claim a colleague's pending invite.
  if (!claims.email || claims.email_verified === false) return fail("email_unverified");

  const user = await upsertUser(ctx, claims);
  const token = await createSession(ctx, user.id);

  const headers = new Headers({ Location: next, "Cache-Control": "no-store" });
  // Two Set-Cookie headers: install the session and expire the one-shot OAuth
  // cookie. Headers.append keeps them separate — assigning twice would replace.
  headers.append("Set-Cookie", sessionCookie(token));
  headers.append("Set-Cookie", hintCookie());
  headers.append("Set-Cookie", clearCookie(STATE_COOKIE));
  return new Response(null, { status: 302, headers });
}

async function upsertUser(ctx: Ctx, claims: GoogleClaims): Promise<User> {
  const now = Math.floor(Date.now() / 1000);
  const existing = await ctx.env.DB.prepare(`SELECT * FROM users WHERE google_sub = ?`)
    .bind(claims.sub)
    .first<User>();

  if (existing) {
    // Refresh the profile every sign-in: names and avatars change, and the
    // email on a Google Workspace account can be renamed by an admin.
    await ctx.env.DB.prepare(
      `UPDATE users SET email = ?, name = ?, picture = ?, last_seen_at = ? WHERE id = ?`,
    )
      .bind(claims.email!, claims.name ?? null, claims.picture ?? null, now, existing.id)
      .run();
    await claimPendingInvites(ctx, existing.id, claims.email!);
    return { ...existing, email: claims.email!, last_seen_at: now };
  }

  const id = uuid();
  const user: User = {
    id,
    google_sub: claims.sub,
    email: claims.email!,
    name: claims.name ?? null,
    picture: claims.picture ?? null,
    created_at: now,
    last_seen_at: now,
  };

  const teamId = uuid();
  await ctx.env.DB.batch([
    ctx.env.DB.prepare(
      `INSERT INTO users (id, google_sub, email, name, picture, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, user.google_sub, user.email, user.name, user.picture, now, now),
    // The personal team exists so files always belong to a team, never to a
    // user directly. One ownership model instead of two.
    ctx.env.DB.prepare(
      `INSERT INTO teams (id, name, is_personal, created_by, created_at) VALUES (?, ?, 1, ?, ?)`,
    ).bind(teamId, "My files", id, now),
    ctx.env.DB.prepare(
      `INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)`,
    ).bind(teamId, id, now),
  ]);

  await claimPendingInvites(ctx, id, user.email);
  return user;
}

/**
 * Join any team that invited this address before the account existed.
 *
 * Without this, being invited then signing up for the first time lands you in
 * an empty workspace with no sign the invite ever happened.
 */
async function claimPendingInvites(ctx: Ctx, userId: string, email: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const pending = await ctx.env.DB.prepare(
    `SELECT id, team_id, role FROM invites
      WHERE lower(email) = lower(?) AND accepted_at IS NULL AND expires_at > ?`,
  )
    .bind(email, now)
    .all<{ id: string; team_id: string; role: string }>();

  if (!pending.results?.length) return;

  await ctx.env.DB.batch(
    pending.results.flatMap((invite) => [
      ctx.env.DB.prepare(
        `INSERT OR IGNORE INTO team_members (team_id, user_id, role, joined_at)
         VALUES (?, ?, ?, ?)`,
      ).bind(invite.team_id, userId, invite.role, now),
      ctx.env.DB.prepare(
        `UPDATE invites SET accepted_at = ?, accepted_by = ? WHERE id = ?`,
      ).bind(now, userId, invite.id),
    ]),
  );
}

export async function logout(ctx: Ctx): Promise<Response> {
  await destroySession(ctx);
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", clearCookie(SESSION_COOKIE));
  headers.append("Set-Cookie", clearHintCookie());
  return new Response(null, { status: 204, headers });
}
