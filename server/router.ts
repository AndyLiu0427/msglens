/**
 * The API router.
 *
 * Deliberately platform-agnostic — it takes a Request and an Env and returns a
 * Response. The Pages Function in `functions/` is a four-line adapter, so
 * moving to a Worker with static assets later is a change to that file only.
 */

import { completeGoogleLogin, logout, startGoogleLogin } from "./auth";
import { readEntitlement, requirePlan } from "./billing";
import { paddleWebhook } from "./paddle";
import { deleteFile, downloadFile, listFiles, moveFile, uploadFile } from "./files";
import { createFolder, deleteFolder, listFolders, renameFolder } from "./folders";
import { currentUser, requireUser } from "./session";
import {
  acceptInvite,
  changeRole,
  createInvite,
  createTeam,
  listMembers,
  listTeams,
  removeMember,
  revokeInvite,
} from "./teams";
import { HttpError, notFound, type Ctx, type Env } from "./types";

type Handler = (ctx: Ctx, ...params: string[]) => Promise<Response>;

/**
 * Mark a route as needing a paid plan.
 *
 * Written as a wrapper in the route table rather than a check inside each
 * handler so the paywall can be read off one screen. Note which routes are
 * *not* wrapped: every GET that returns a user's own files or folders, and the
 * download endpoint. Losing a subscription must not lock anyone out of data
 * they already have.
 */
const paid =
  (feature: string, handler: Handler): Handler =>
  async (ctx, ...params) => {
    const user = await requireUser(ctx);
    await requirePlan(ctx, user, feature);
    return handler(ctx, ...params);
  };

interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
}

const route = (method: string, path: string, handler: Handler): Route => ({
  method,
  // `:name` becomes a capture group; everything else is matched literally.
  pattern: new RegExp(
    `^${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:([a-z]+)/gi, "([^/]+)")}/?$`,
  ),
  handler,
});

const ROUTES: Route[] = [
  route("GET", "/api/auth/google", startGoogleLogin),
  route("GET", "/api/auth/callback", completeGoogleLogin),
  route("POST", "/api/auth/logout", logout),
  route("GET", "/api/auth/me", async (ctx) => {
    // The only endpoint that answers for anonymous callers, because the UI
    // asks it on every page load to decide whether to show a sign-in button.
    const user = await currentUser(ctx);
    return Response.json(
      user
        ? { user: { id: user.id, email: user.email, name: user.name, picture: user.picture } }
        : { user: null },
    );
  }),

  route("GET", "/api/teams", listTeams),
  route("POST", "/api/teams", paid("Shared teams", createTeam)),
  route("GET", "/api/teams/:id/members", (ctx, id) => listMembers(ctx, id)),
  route("POST", "/api/teams/:id/invites", paid("Inviting people", (ctx, id) =>
    createInvite(ctx, id),
  )),
  route("DELETE", "/api/invites/:id", (ctx, id) => revokeInvite(ctx, id)),
  route("POST", "/api/invites/accept", acceptInvite),
  route("DELETE", "/api/teams/:id/members/:userId", (ctx, id, userId) =>
    removeMember(ctx, id, userId),
  ),
  route("PATCH", "/api/teams/:id/members/:userId", (ctx, id, userId) =>
    changeRole(ctx, id, userId),
  ),

  route("GET", "/api/folders", listFolders),
  route("POST", "/api/folders", paid("Folders", createFolder)),
  route("PATCH", "/api/folders/:id", (ctx, id) => renameFolder(ctx, id)),
  route("DELETE", "/api/folders/:id", (ctx, id) => deleteFolder(ctx, id)),

  route("GET", "/api/billing", async (ctx) => {
    const user = await requireUser(ctx);
    return Response.json({ entitlement: await readEntitlement(ctx, user.id) });
  }),
  // No session and no CSRF check: the caller is Paddle, not a browser, and it
  // authenticates by signing the body. Excluded from the same-origin check
  // below for the same reason.
  route("POST", "/api/billing/webhook", paddleWebhook),

  route("GET", "/api/files", listFiles),
  route("POST", "/api/files", uploadFile),
  route("GET", "/api/files/:id/content", (ctx, id) => downloadFile(ctx, id)),
  route("PATCH", "/api/files/:id", (ctx, id) => moveFile(ctx, id)),
  route("DELETE", "/api/files/:id", (ctx, id) => deleteFile(ctx, id)),
];

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const ctx: Ctx = { env, request, url };

  /**
   * Cross-origin requests are rejected outright.
   *
   * The session cookie is SameSite=Lax, which already blocks cross-site POSTs,
   * but Lax still permits top-level GET navigations — and `/api/files/:id/content`
   * is a GET that returns a private file. Checking Origin and Sec-Fetch-Site
   * makes the boundary explicit rather than resting on cookie policy alone.
   */
  const origin = request.headers.get("Origin");
  const site = request.headers.get("Sec-Fetch-Site");
  const sameOrigin = !origin || origin === url.origin;
  const oauthCallback = url.pathname.startsWith("/api/auth/");
  const signedWebhook = url.pathname === "/api/billing/webhook";
  if (!oauthCallback && !signedWebhook && (!sameOrigin || site === "cross-site")) {
    return Response.json({ error: "Cross-origin requests are not allowed" }, { status: 403 });
  }

  try {
    for (const r of ROUTES) {
      if (r.method !== request.method) continue;
      const match = r.pattern.exec(url.pathname);
      if (!match) continue;
      const response = await r.handler(ctx, ...match.slice(1).map(decodeURIComponent));
      // No API response is ever cacheable: they are all per-session.
      if (!response.headers.has("Cache-Control")) {
        response.headers.set("Cache-Control", "private, no-store");
      }
      return response;
    }
    throw notFound("No such endpoint");
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    // Unexpected: log for the tail, return nothing that describes the internals.
    console.error("api error", url.pathname, error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
