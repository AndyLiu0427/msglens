/**
 * Folders. A plain adjacency tree — depth is capped, so recursion is bounded.
 */

import { uuid } from "./crypto";
import { requireTeamRole, requireUser } from "./session";
import { badRequest, conflict, notFound, type Ctx, type FolderRow } from "./types";

const MAX_DEPTH = 8;
const MAX_FOLDERS_PER_TEAM = 500;

export async function listFolders(ctx: Ctx): Promise<Response> {
  const teamId = ctx.url.searchParams.get("teamId");
  if (!teamId) throw badRequest("teamId is required");
  await requireTeamRole(ctx, teamId);

  // The whole tree in one query. It is capped at 500 rows per team, so paging
  // it would cost a round trip to save nothing.
  const { results } = await ctx.env.DB.prepare(
    `SELECT f.*, (SELECT count(*) FROM files WHERE folder_id = f.id) AS file_count
       FROM folders f WHERE f.team_id = ? ORDER BY f.name COLLATE NOCASE`,
  )
    .bind(teamId)
    .all<FolderRow & { file_count: number }>();

  return Response.json({ folders: results ?? [] });
}

export async function createFolder(ctx: Ctx): Promise<Response> {
  const body = (await ctx.request.json()) as {
    teamId?: string;
    parentId?: string | null;
    name?: string;
  };
  if (!body.teamId) throw badRequest("teamId is required");
  const user = await requireUser(ctx);
  await requireTeamRole(ctx, body.teamId, "member");

  const name = (body.name ?? "").trim();
  if (!name) throw badRequest("A folder needs a name");
  if (name.length > 100) throw badRequest("That name is too long");

  const count = await ctx.env.DB.prepare(`SELECT count(*) AS n FROM folders WHERE team_id = ?`)
    .bind(body.teamId)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_FOLDERS_PER_TEAM) {
    throw conflict(`A team can hold ${MAX_FOLDERS_PER_TEAM} folders`, "too_many_folders");
  }

  if (body.parentId) {
    const depth = await depthOf(ctx, body.parentId, body.teamId);
    if (depth + 1 >= MAX_DEPTH) {
      throw conflict(`Folders can nest ${MAX_DEPTH} deep`, "too_deep");
    }
  }

  // Siblings with the same name are confusing rather than dangerous, but the
  // list gives no way to tell them apart, so reject up front.
  const clash = await ctx.env.DB.prepare(
    `SELECT id FROM folders
      WHERE team_id = ? AND name = ? COLLATE NOCASE
        AND parent_id IS ${body.parentId ? "?" : "NULL"}`,
  )
    .bind(...(body.parentId ? [body.teamId, name, body.parentId] : [body.teamId, name]))
    .first();
  if (clash) throw conflict("A folder with that name is already here", "duplicate_name");

  const row: FolderRow = {
    id: uuid(),
    team_id: body.teamId,
    parent_id: body.parentId ?? null,
    name,
    created_by: user.id,
    created_at: Math.floor(Date.now() / 1000),
  };
  await ctx.env.DB.prepare(
    `INSERT INTO folders (id, team_id, parent_id, name, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(row.id, row.team_id, row.parent_id, row.name, row.created_by, row.created_at)
    .run();

  return Response.json({ folder: row }, { status: 201 });
}

export async function renameFolder(ctx: Ctx, id: string): Promise<Response> {
  const folder = await loadFolderForUser(ctx, id);
  await requireTeamRole(ctx, folder.team_id, "member");

  const body = (await ctx.request.json()) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) throw badRequest("A folder needs a name");
  if (name.length > 100) throw badRequest("That name is too long");

  await ctx.env.DB.prepare(`UPDATE folders SET name = ? WHERE id = ? AND team_id = ?`)
    .bind(name, id, folder.team_id)
    .run();
  return Response.json({ folder: { ...folder, name } });
}

/**
 * Delete a folder and everything under it.
 *
 * The row cascade in SQLite handles child folders and file rows, but R2
 * objects are outside the database, so the keys are collected first and
 * deleted after — otherwise the bytes stay in the bucket, still billed and no
 * longer reachable by anyone.
 */
export async function deleteFolder(ctx: Ctx, id: string): Promise<Response> {
  const folder = await loadFolderForUser(ctx, id);
  await requireTeamRole(ctx, folder.team_id, "member");

  const ids = await subtreeIds(ctx, folder);
  const placeholders = ids.map(() => "?").join(", ");
  const { results } = await ctx.env.DB.prepare(
    `SELECT r2_key FROM files WHERE team_id = ? AND folder_id IN (${placeholders})`,
  )
    .bind(folder.team_id, ...ids)
    .all<{ r2_key: string }>();

  await ctx.env.DB.prepare(`DELETE FROM folders WHERE id = ? AND team_id = ?`)
    .bind(id, folder.team_id)
    .run();

  const keys = (results ?? []).map((r) => r.r2_key);
  // R2 takes up to 1000 keys per delete call.
  for (let i = 0; i < keys.length; i += 1000) {
    await ctx.env.FILES.delete(keys.slice(i, i + 1000)).catch(() => {});
  }

  return Response.json({ deletedFolders: ids.length, deletedFiles: keys.length });
}

/** Walk down from a folder, level by level, within the depth cap. */
async function subtreeIds(ctx: Ctx, folder: FolderRow): Promise<string[]> {
  const all = [folder.id];
  let frontier = [folder.id];
  for (let level = 0; level < MAX_DEPTH && frontier.length; level++) {
    const placeholders = frontier.map(() => "?").join(", ");
    const { results } = await ctx.env.DB.prepare(
      `SELECT id FROM folders WHERE team_id = ? AND parent_id IN (${placeholders})`,
    )
      .bind(folder.team_id, ...frontier)
      .all<{ id: string }>();
    frontier = (results ?? []).map((r) => r.id);
    all.push(...frontier);
  }
  return all;
}

async function depthOf(ctx: Ctx, folderId: string, teamId: string): Promise<number> {
  let depth = 0;
  let current: string | null = folderId;
  while (current && depth < MAX_DEPTH + 1) {
    const row: { parent_id: string | null } | null = await ctx.env.DB.prepare(
      `SELECT parent_id FROM folders WHERE id = ? AND team_id = ?`,
    )
      .bind(current, teamId)
      .first<{ parent_id: string | null }>();
    if (!row) throw badRequest("That folder is not in this team");
    current = row.parent_id;
    depth++;
  }
  return depth;
}

async function loadFolderForUser(ctx: Ctx, id: string): Promise<FolderRow> {
  const user = await requireUser(ctx);
  const row = await ctx.env.DB.prepare(
    `SELECT f.* FROM folders f
       JOIN team_members m ON m.team_id = f.team_id AND m.user_id = ?
      WHERE f.id = ?`,
  )
    .bind(user.id, id)
    .first<FolderRow>();
  if (!row) throw notFound();
  return row;
}
