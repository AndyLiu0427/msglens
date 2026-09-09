/**
 * Teams, membership and invitations.
 */

import { randomToken, sha256Hex, uuid } from "./crypto";
import { requireTeamRole, requireUser } from "./session";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  originOf,
  type Ctx,
  type Role,
  type Team,
} from "./types";

const INVITE_TTL_SECONDS = 60 * 60 * 24 * 14;
const MAX_MEMBERS = 50;

export async function listTeams(ctx: Ctx): Promise<Response> {
  const user = await requireUser(ctx);
  const { results } = await ctx.env.DB.prepare(
    `SELECT t.*, m.role,
            (SELECT count(*) FROM team_members WHERE team_id = t.id) AS member_count,
            (SELECT count(*) FROM files WHERE team_id = t.id) AS file_count
       FROM teams t
       JOIN team_members m ON m.team_id = t.id
      WHERE m.user_id = ?
      -- Personal team first; it is where a new user's files land by default.
      ORDER BY t.is_personal DESC, t.created_at`,
  )
    .bind(user.id)
    .all<Team & { role: Role; member_count: number; file_count: number }>();

  return Response.json({ teams: results ?? [] });
}

export async function createTeam(ctx: Ctx): Promise<Response> {
  const user = await requireUser(ctx);
  const body = (await ctx.request.json()) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) throw badRequest("A team needs a name");
  if (name.length > 80) throw badRequest("That name is too long");

  const now = Math.floor(Date.now() / 1000);
  const team: Team = { id: uuid(), name, is_personal: 0, created_by: user.id, created_at: now };

  await ctx.env.DB.batch([
    ctx.env.DB.prepare(
      `INSERT INTO teams (id, name, is_personal, created_by, created_at) VALUES (?, ?, 0, ?, ?)`,
    ).bind(team.id, team.name, user.id, now),
    ctx.env.DB.prepare(
      `INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)`,
    ).bind(team.id, user.id, now),
  ]);

  return Response.json({ team: { ...team, role: "owner", member_count: 1 } }, { status: 201 });
}

export async function listMembers(ctx: Ctx, teamId: string): Promise<Response> {
  await requireTeamRole(ctx, teamId);

  const members = await ctx.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.picture, m.role, m.joined_at
       FROM team_members m JOIN users u ON u.id = m.user_id
      WHERE m.team_id = ? ORDER BY m.joined_at`,
  )
    .bind(teamId)
    .all();

  const invites = await ctx.env.DB.prepare(
    `SELECT id, email, role, created_at, expires_at FROM invites
      WHERE team_id = ? AND accepted_at IS NULL AND expires_at > ?
      ORDER BY created_at DESC`,
  )
    .bind(teamId, Math.floor(Date.now() / 1000))
    .all();

  return Response.json({ members: members.results ?? [], invites: invites.results ?? [] });
}

/**
 * Invite someone by email.
 *
 * Returns the invite URL rather than sending it. Delivering mail would mean
 * an outbound provider, a sending domain and a spam-reputation problem, and
 * every one of those is a bigger commitment than the feature is worth right
 * now — the inviter can paste the link into the chat they were already using.
 */
export async function createInvite(ctx: Ctx, teamId: string): Promise<Response> {
  const user = await requireUser(ctx);
  await requireTeamRole(ctx, teamId, "owner");

  const team = await ctx.env.DB.prepare(`SELECT is_personal FROM teams WHERE id = ?`)
    .bind(teamId)
    .first<{ is_personal: number }>();
  if (team?.is_personal) {
    throw badRequest("Your personal space cannot have other members — create a team instead");
  }

  const body = (await ctx.request.json()) as { email?: string; role?: Role };
  const email = (body.email ?? "").trim().toLowerCase();
  // Deliberately permissive: the authority on whether an address is real is
  // Google at sign-in, not a regex here.
  if (!email || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    throw badRequest("That does not look like an email address");
  }
  const role: Role = body.role === "viewer" ? "viewer" : "member";

  const count = await ctx.env.DB.prepare(
    `SELECT count(*) AS n FROM team_members WHERE team_id = ?`,
  )
    .bind(teamId)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_MEMBERS) throw conflict(`A team can hold ${MAX_MEMBERS} people`);

  const already = await ctx.env.DB.prepare(
    `SELECT 1 AS x FROM team_members m JOIN users u ON u.id = m.user_id
      WHERE m.team_id = ? AND lower(u.email) = ?`,
  )
    .bind(teamId, email)
    .first();
  if (already) throw conflict("They are already on this team", "already_member");

  const token = randomToken(32);
  const now = Math.floor(Date.now() / 1000);
  const id = uuid();

  await ctx.env.DB.prepare(
    `INSERT INTO invites (id, team_id, email, role, token_hash, invited_by, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, teamId, email, role, await sha256Hex(token), user.id, now, now + INVITE_TTL_SECONDS)
    .run();

  return Response.json(
    {
      invite: { id, email, role, expires_at: now + INVITE_TTL_SECONDS },
      url: `${originOf(ctx)}/invite/?token=${encodeURIComponent(token)}`,
    },
    { status: 201 },
  );
}

export async function revokeInvite(ctx: Ctx, inviteId: string): Promise<Response> {
  const user = await requireUser(ctx);
  const invite = await ctx.env.DB.prepare(
    `SELECT i.team_id FROM invites i
       JOIN team_members m ON m.team_id = i.team_id AND m.user_id = ? AND m.role = 'owner'
      WHERE i.id = ?`,
  )
    .bind(user.id, inviteId)
    .first<{ team_id: string }>();
  if (!invite) throw notFound();

  await ctx.env.DB.prepare(`DELETE FROM invites WHERE id = ?`).bind(inviteId).run();
  return new Response(null, { status: 204 });
}

/**
 * Accept an invite from its link.
 *
 * The address is checked against the signed-in account: an invite link that
 * leaked into a shared channel should not admit whoever opened it first.
 */
export async function acceptInvite(ctx: Ctx): Promise<Response> {
  const user = await requireUser(ctx);
  const body = (await ctx.request.json()) as { token?: string };
  if (!body.token) throw badRequest("token is required");

  const now = Math.floor(Date.now() / 1000);
  const invite = await ctx.env.DB.prepare(
    `SELECT i.*, t.name AS team_name FROM invites i JOIN teams t ON t.id = i.team_id
      WHERE i.token_hash = ?`,
  )
    .bind(await sha256Hex(body.token))
    .first<{
      id: string;
      team_id: string;
      email: string;
      role: Role;
      expires_at: number;
      accepted_at: number | null;
      team_name: string;
    }>();

  if (!invite) throw notFound("That invitation link is not valid");
  if (invite.accepted_at) throw conflict("That invitation has already been used", "used");
  if (invite.expires_at <= now) throw conflict("That invitation has expired", "expired");
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    throw forbidden(`That invitation was sent to ${invite.email}`);
  }

  await ctx.env.DB.batch([
    ctx.env.DB.prepare(
      `INSERT OR IGNORE INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)`,
    ).bind(invite.team_id, user.id, invite.role, now),
    ctx.env.DB.prepare(`UPDATE invites SET accepted_at = ?, accepted_by = ? WHERE id = ?`).bind(
      now,
      user.id,
      invite.id,
    ),
  ]);

  return Response.json({ teamId: invite.team_id, teamName: invite.team_name });
}

export async function removeMember(ctx: Ctx, teamId: string, userId: string): Promise<Response> {
  const user = await requireUser(ctx);
  // Leaving a team yourself needs no special role; removing someone else does.
  if (userId !== user.id) await requireTeamRole(ctx, teamId, "owner");
  else await requireTeamRole(ctx, teamId);

  const team = await ctx.env.DB.prepare(`SELECT is_personal FROM teams WHERE id = ?`)
    .bind(teamId)
    .first<{ is_personal: number }>();
  if (team?.is_personal) throw badRequest("You cannot leave your personal space");

  // A team with no owner cannot be administered again, and its files would be
  // stranded — every member could read them, nobody could invite or remove.
  const owners = await ctx.env.DB.prepare(
    `SELECT count(*) AS n FROM team_members WHERE team_id = ? AND role = 'owner'`,
  )
    .bind(teamId)
    .first<{ n: number }>();
  const target = await ctx.env.DB.prepare(
    `SELECT role FROM team_members WHERE team_id = ? AND user_id = ?`,
  )
    .bind(teamId, userId)
    .first<{ role: Role }>();
  if (!target) throw notFound();
  if (target.role === "owner" && (owners?.n ?? 0) <= 1) {
    throw conflict("Make someone else an owner first — a team needs one", "last_owner");
  }

  await ctx.env.DB.prepare(`DELETE FROM team_members WHERE team_id = ? AND user_id = ?`)
    .bind(teamId, userId)
    .run();
  return new Response(null, { status: 204 });
}

export async function changeRole(ctx: Ctx, teamId: string, userId: string): Promise<Response> {
  await requireTeamRole(ctx, teamId, "owner");
  const body = (await ctx.request.json()) as { role?: Role };
  const role = body.role;
  if (role !== "owner" && role !== "member" && role !== "viewer") throw badRequest("Unknown role");

  const owners = await ctx.env.DB.prepare(
    `SELECT count(*) AS n FROM team_members WHERE team_id = ? AND role = 'owner'`,
  )
    .bind(teamId)
    .first<{ n: number }>();
  const current = await ctx.env.DB.prepare(
    `SELECT role FROM team_members WHERE team_id = ? AND user_id = ?`,
  )
    .bind(teamId, userId)
    .first<{ role: Role }>();
  if (!current) throw notFound();
  if (current.role === "owner" && role !== "owner" && (owners?.n ?? 0) <= 1) {
    throw conflict("A team needs at least one owner", "last_owner");
  }

  await ctx.env.DB.prepare(`UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?`)
    .bind(role, teamId, userId)
    .run();
  return Response.json({ userId, role });
}
