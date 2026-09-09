/**
 * Stored files: R2 for the bytes, D1 for everything you can browse by.
 */

import { trackServer } from "./analytics";
import { requireUploadAllowance } from "./billing";
import { sha256Hex, uuid } from "./crypto";
import { requireTeamRole, requireUser } from "./session";
import {
  badRequest,
  conflict,
  notFound,
  tooLarge,
  type Ctx,
  type FileRow,
} from "./types";

/** Matches the client-side cap, so a rejection is not a surprise at the end of an upload. */
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_FILES_PER_TEAM = 5000;

/**
 * Object keys are `team/<team>/<file-id>` and carry no user-supplied text.
 *
 * The display name lives in D1 instead. Putting it in the key would let a file
 * called `../../x` or one with a newline shape the object path, and would leak
 * subjects to anyone who can list the bucket.
 */
const objectKey = (teamId: string, fileId: string) => `team/${teamId}/${fileId}`;

export async function listFiles(ctx: Ctx): Promise<Response> {
  const teamId = ctx.url.searchParams.get("teamId");
  if (!teamId) throw badRequest("teamId is required");
  await requireTeamRole(ctx, teamId);

  const folderParam = ctx.url.searchParams.get("folderId");
  const search = ctx.url.searchParams.get("q")?.trim();

  // Team scope is in every branch. It is never inferred from the folder.
  let sql = `SELECT * FROM files WHERE team_id = ?`;
  const binds: unknown[] = [teamId];

  if (search) {
    sql += ` AND (subject LIKE ? OR file_name LIKE ? OR from_name LIKE ? OR from_address LIKE ?)`;
    const like = `%${search.replace(/[%_]/g, (c) => `\\${c}`)}%`;
    binds.push(like, like, like, like);
  } else if (folderParam === "root") {
    sql += ` AND folder_id IS NULL`;
  } else if (folderParam) {
    sql += ` AND folder_id = ?`;
    binds.push(folderParam);
  }

  sql += ` ORDER BY uploaded_at DESC LIMIT 500`;

  const { results } = await ctx.env.DB.prepare(sql)
    .bind(...binds)
    .all<FileRow>();
  return Response.json({ files: results ?? [] });
}

interface UploadMetadata {
  teamId: string;
  folderId?: string | null;
  fileName: string;
  sourceFormat?: string;
  subject?: string;
  fromName?: string;
  fromAddress?: string;
  sentAt?: number;
  hasAttachments?: boolean;
}

export async function uploadFile(ctx: Ctx): Promise<Response> {
  const user = await requireUser(ctx);

  const form = await ctx.request.formData();
  const blob = form.get("file");
  const metaRaw = form.get("metadata");
  if (!(blob instanceof File)) throw badRequest("file is required");
  if (typeof metaRaw !== "string") throw badRequest("metadata is required");

  let meta: UploadMetadata;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    throw badRequest("metadata is not valid JSON");
  }
  if (!meta.teamId) throw badRequest("teamId is required");
  if (blob.size === 0) throw badRequest("The file is empty");
  if (blob.size > MAX_FILE_BYTES) throw tooLarge("Files are limited to 100 MB");

  // Viewers can read a team's files but not add to them.
  await requireTeamRole(ctx, meta.teamId, "member");

  // Checked after the role, so someone with no business in this team is told
  // that rather than being asked to pay for a team that is not theirs.
  await requireUploadAllowance(ctx, user);

  if (meta.folderId) await assertFolderInTeam(ctx, meta.folderId, meta.teamId);

  const count = await ctx.env.DB.prepare(`SELECT count(*) AS n FROM files WHERE team_id = ?`)
    .bind(meta.teamId)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_FILES_PER_TEAM) {
    throw conflict(`A team can hold ${MAX_FILES_PER_TEAM} files`, "team_full");
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const digest = await sha256Hex(bytes);

  // Re-saving the same message into the same team is common — people open a
  // file, look at it, and save it again later. Return the existing row rather
  // than storing a second copy.
  const duplicate = await ctx.env.DB.prepare(
    `SELECT * FROM files WHERE team_id = ? AND sha256 = ? LIMIT 1`,
  )
    .bind(meta.teamId, digest)
    .first<FileRow>();
  if (duplicate) return Response.json({ file: duplicate, duplicate: true }, { status: 200 });

  const id = uuid();
  const key = objectKey(meta.teamId, id);

  await ctx.env.FILES.put(key, bytes, {
    httpMetadata: { contentType: blob.type || "application/octet-stream" },
    // Enough to re-associate an orphaned object if D1 and R2 ever diverge.
    customMetadata: { teamId: meta.teamId, uploadedBy: user.id },
  });

  const now = Math.floor(Date.now() / 1000);
  const row: FileRow = {
    id,
    team_id: meta.teamId,
    folder_id: meta.folderId ?? null,
    r2_key: key,
    file_name: meta.fileName.slice(0, 300),
    size_bytes: blob.size,
    sha256: digest,
    source_format: meta.sourceFormat ?? null,
    subject: meta.subject?.slice(0, 500) ?? null,
    from_name: meta.fromName?.slice(0, 200) ?? null,
    from_address: meta.fromAddress?.slice(0, 320) ?? null,
    sent_at: meta.sentAt ?? null,
    has_attachments: meta.hasAttachments ? 1 : 0,
    uploaded_by: user.id,
    uploaded_at: now,
    open_count: 0,
    last_opened_at: null,
  };

  try {
    await ctx.env.DB.prepare(
      `INSERT INTO files (id, team_id, folder_id, r2_key, file_name, size_bytes, sha256,
                          source_format, subject, from_name, from_address, sent_at,
                          has_attachments, uploaded_by, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        row.id, row.team_id, row.folder_id, row.r2_key, row.file_name, row.size_bytes,
        row.sha256, row.source_format, row.subject, row.from_name, row.from_address,
        row.sent_at, row.has_attachments, row.uploaded_by, row.uploaded_at,
      )
      .run();
  } catch (error) {
    // R2 and D1 are not in one transaction. If the row fails, drop the object
    // rather than leaving bytes nobody can reach or delete.
    await ctx.env.FILES.delete(key).catch(() => {});
    throw error;
  }

  trackServer(ctx, "file_saved", user.id, {
    source_format: row.source_format ?? "unknown",
    size_bytes: row.size_bytes,
    has_attachments: row.has_attachments === 1,
  });

  return Response.json({ file: row }, { status: 201 });
}

export async function downloadFile(ctx: Ctx, id: string): Promise<Response> {
  const row = await loadFileForUser(ctx, id);

  const object = await ctx.env.FILES.get(row.r2_key);
  if (!object) throw notFound("The stored file is missing");

  trackServer(ctx, "file_opened", row.uploaded_by, {
    source_format: row.source_format ?? "unknown",
    // How many times this one has been read. A workspace people return to
    // looks different from one that was filled once, and the difference is the
    // thing worth knowing about the product.
    open_count: row.open_count + 1,
  });

  // Counted, not logged: a running total and a last-seen, so `pnpm metrics` can
  // tell a workspace that is used from one that was filled once and abandoned.
  // Not awaited — a metrics write must never delay or fail a file the user
  // asked for.
  void ctx.env.DB.prepare(
    `UPDATE files SET open_count = open_count + 1, last_opened_at = ? WHERE id = ?`,
  )
    .bind(Math.floor(Date.now() / 1000), row.id)
    .run()
    .catch(() => {});

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      // Quoted, with the quotes and backslashes escaped — a subject-derived
      // name can contain either, and an unescaped one truncates the header.
      "Content-Disposition": `attachment; filename="${row.file_name.replace(/["\\]/g, "_")}"`,
      "Content-Length": String(row.size_bytes),
      "Cache-Control": "private, no-store",
    },
  });
}

export async function deleteFile(ctx: Ctx, id: string): Promise<Response> {
  const row = await loadFileForUser(ctx, id);
  await requireTeamRole(ctx, row.team_id, "member");

  await ctx.env.DB.prepare(`DELETE FROM files WHERE id = ? AND team_id = ?`)
    .bind(id, row.team_id)
    .run();
  await ctx.env.FILES.delete(row.r2_key).catch(() => {});
  return new Response(null, { status: 204 });
}

export async function moveFile(ctx: Ctx, id: string): Promise<Response> {
  const row = await loadFileForUser(ctx, id);
  await requireTeamRole(ctx, row.team_id, "member");

  const body = (await ctx.request.json()) as { folderId?: string | null };
  const folderId = body.folderId ?? null;
  if (folderId) await assertFolderInTeam(ctx, folderId, row.team_id);

  await ctx.env.DB.prepare(`UPDATE files SET folder_id = ? WHERE id = ? AND team_id = ?`)
    .bind(folderId, id, row.team_id)
    .run();
  return Response.json({ file: { ...row, folder_id: folderId } });
}

/**
 * Fetch a file only if the caller is on its team.
 *
 * The membership join is part of the query rather than a check afterwards, so
 * there is no path where the row is loaded first and the permission is
 * forgotten second.
 */
async function loadFileForUser(ctx: Ctx, id: string): Promise<FileRow> {
  const user = await requireUser(ctx);
  const row = await ctx.env.DB.prepare(
    `SELECT f.* FROM files f
       JOIN team_members m ON m.team_id = f.team_id AND m.user_id = ?
      WHERE f.id = ?`,
  )
    .bind(user.id, id)
    .first<FileRow>();
  if (!row) throw notFound();
  return row;
}

async function assertFolderInTeam(ctx: Ctx, folderId: string, teamId: string): Promise<void> {
  const folder = await ctx.env.DB.prepare(
    `SELECT id FROM folders WHERE id = ? AND team_id = ?`,
  )
    .bind(folderId, teamId)
    .first();
  if (!folder) throw badRequest("That folder is not in this team");
}
