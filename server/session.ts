/**
 * Session cookies and the access checks every handler runs through.
 */

import { randomToken, sha256Hex } from "./crypto";
import { forbidden, unauthorized, type Ctx, type Role, type User } from "./types";

const COOKIE = "msglens_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

export function cookieHeader(name: string, value: string, maxAge: number): string {
  // SameSite=Lax rather than Strict: the OAuth callback is a top-level
  // navigation back from accounts.google.com, and Strict would withhold the
  // cookie on that first request, so the user would land signed out.
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  return parts.join("; ");
}

export const clearCookie = (name: string) => cookieHeader(name, "", 0);
export const SESSION_COOKIE = COOKIE;

/**
 * A readable companion to the session cookie.
 *
 * The session itself is HttpOnly, so JavaScript cannot tell whether one
 * exists and has to ask the API on every page load — including for the
 * anonymous visitors who are most of the traffic and who came for a landing
 * page that promises to talk to nothing.
 *
 * This carries no identity and grants no access: it is the string "1". Forging
 * it only makes the browser ask a question it would otherwise have skipped,
 * and the answer is still decided by the real session.
 */
export const HINT_COOKIE = "msglens_signed_in";

function hintHeader(value: string, maxAge: number): string {
  // Deliberately not HttpOnly — being readable is the entire point.
  return [
    `${HINT_COOKIE}=${value}`,
    "Path=/",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

export const hintCookie = () => hintHeader("1", MAX_AGE_SECONDS);
export const clearHintCookie = () => hintHeader("", 0);

export async function createSession(ctx: Ctx, userId: string): Promise<string> {
  const token = randomToken(32);
  const now = Math.floor(Date.now() / 1000);
  await ctx.env.DB.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      await sha256Hex(token),
      userId,
      now,
      now + MAX_AGE_SECONDS,
      (ctx.request.headers.get("User-Agent") ?? "").slice(0, 200),
    )
    .run();
  return token;
}

export function sessionCookie(token: string): string {
  return cookieHeader(COOKIE, token, MAX_AGE_SECONDS);
}

export async function destroySession(ctx: Ctx): Promise<void> {
  const token = readCookie(ctx.request, COOKIE);
  if (!token) return;
  await ctx.env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`)
    .bind(await sha256Hex(token))
    .run();
}

/** Resolve the signed-in user, or null. Never throws for anonymous callers. */
export async function currentUser(ctx: Ctx): Promise<User | null> {
  const token = readCookie(ctx.request, COOKIE);
  if (!token) return null;

  const row = await ctx.env.DB.prepare(
    `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(await sha256Hex(token), Math.floor(Date.now() / 1000))
    .first<User>();

  return row ?? null;
}

export async function requireUser(ctx: Ctx): Promise<User> {
  if (ctx.user) return ctx.user;
  const user = await currentUser(ctx);
  if (!user) throw unauthorized();
  ctx.user = user;
  return user;
}

const RANK: Record<Role, number> = { viewer: 0, member: 1, owner: 2 };

/**
 * Assert the signed-in user belongs to a team, and return their role.
 *
 * Every handler that touches a team-owned row calls this first, and no query
 * elsewhere is allowed to select by id alone — a bare `WHERE id = ?` on files
 * or folders would hand any signed-in user another team's data as soon as
 * they guessed or saw an id.
 */
export async function requireTeamRole(
  ctx: Ctx,
  teamId: string,
  atLeast: Role = "viewer",
): Promise<Role> {
  const user = await requireUser(ctx);
  const row = await ctx.env.DB.prepare(
    `SELECT role FROM team_members WHERE team_id = ? AND user_id = ?`,
  )
    .bind(teamId, user.id)
    .first<{ role: Role }>();

  // Deliberately the same error for "no such team" and "not a member", so the
  // API cannot be used to probe which team ids exist.
  if (!row) throw forbidden();
  if (RANK[row.role] < RANK[atLeast]) {
    throw forbidden("Your role on this team does not allow that");
  }
  return row.role;
}
