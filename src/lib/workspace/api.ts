/**
 * Typed client for the workspace API.
 *
 * Every call is same-origin and relies on the session cookie, so there is no
 * token to hold in JavaScript — an XSS on this site cannot read a cookie that
 * is HttpOnly.
 */

export type Role = "owner" | "member" | "viewer";

export interface WorkspaceUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}

export interface TeamSummary {
  id: string;
  name: string;
  is_personal: number;
  role: Role;
  member_count: number;
  file_count: number;
  created_at: number;
}

export interface StoredFolder {
  id: string;
  team_id: string;
  parent_id: string | null;
  name: string;
  created_at: number;
  file_count: number;
}

export interface StoredFile {
  id: string;
  team_id: string;
  folder_id: string | null;
  file_name: string;
  size_bytes: number;
  source_format: string | null;
  subject: string | null;
  from_name: string | null;
  from_address: string | null;
  sent_at: number | null;
  has_attachments: number;
  uploaded_at: number;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: Role;
  joined_at: number;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  created_at: number;
  expires_at: number;
}

export type PlanId = "monthly" | "yearly" | "lifetime";

export interface Entitlement {
  /** True when the paid features are available right now. */
  active: boolean;
  plan: PlanId | null;
  status: "active" | "past_due" | "canceled" | "expired" | null;
  /** Unix seconds. Null on the free tier, and on lifetime, which never ends. */
  expiresAt: number | null;
  cancelAtPeriodEnd: boolean;
  /** Files still allowed on the free tier; null when unlimited. */
  remainingFiles: number | null;
}

/** An API error that kept its message, so the UI can show what went wrong. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, credentials: "same-origin" });
  } catch {
    // Offline, or the request never left. Distinguished from a server error
    // because the fix is different and the user can act on it.
    throw new ApiError(0, "Could not reach the server. Check your connection.", "offline");
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const payload = body as { error?: string; code?: string } | null;
    throw new ApiError(
      response.status,
      payload?.error ?? "Something went wrong",
      payload?.code,
    );
  }
  return body as T;
}

/**
 * Is there any chance this browser is signed in?
 *
 * The session cookie is HttpOnly and unreadable, so without a hint every page
 * load has to ask the API — including the landing page, whose whole promise is
 * that it talks to nothing. The server sets a readable companion cookie on
 * sign-in; its absence is a definite "no" and costs nothing to check.
 */
function maybeSignedIn(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)msglens_signed_in=1(?:;|$)/.test(document.cookie);
}

/**
 * Shared session lookup.
 *
 * Several components need the current user and mounting them all should not
 * mean several identical requests, so the in-flight promise is reused. Anything
 * that changes the session reloads the page, so there is no stale-cache case.
 */
let sessionRequest: Promise<{ user: WorkspaceUser | null }> | null = null;

export const api = {
  me: () => {
    if (!maybeSignedIn()) return Promise.resolve({ user: null });
    sessionRequest ??= call<{ user: WorkspaceUser | null }>("/api/auth/me").catch((e) => {
      // Do not cache a failure — an offline blip would strand the UI as signed
      // out for the rest of the page's life.
      sessionRequest = null;
      throw e;
    });
    return sessionRequest;
  },
  logout: () => call<void>("/api/auth/logout", { method: "POST" }),

  billing: () => call<{ entitlement: Entitlement }>("/api/billing"),
  billingPortal: () => call<{ url: string }>("/api/billing/portal", { method: "POST" }),

  teams: () => call<{ teams: TeamSummary[] }>("/api/teams"),
  createTeam: (name: string) =>
    call<{ team: TeamSummary }>("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),

  members: (teamId: string) =>
    call<{ members: TeamMember[]; invites: PendingInvite[] }>(
      `/api/teams/${encodeURIComponent(teamId)}/members`,
    ),
  invite: (teamId: string, email: string, role: Role) =>
    call<{ invite: PendingInvite; url: string }>(
      `/api/teams/${encodeURIComponent(teamId)}/invites`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      },
    ),
  revokeInvite: (id: string) =>
    call<void>(`/api/invites/${encodeURIComponent(id)}`, { method: "DELETE" }),
  acceptInvite: (token: string) =>
    call<{ teamId: string; teamName: string }>("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
  removeMember: (teamId: string, userId: string) =>
    call<void>(
      `/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    ),
  changeRole: (teamId: string, userId: string, role: Role) =>
    call<{ role: Role }>(
      `/api/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      },
    ),

  folders: (teamId: string) =>
    call<{ folders: StoredFolder[] }>(`/api/folders?teamId=${encodeURIComponent(teamId)}`),
  createFolder: (teamId: string, name: string, parentId: string | null) =>
    call<{ folder: StoredFolder }>("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, name, parentId }),
    }),
  renameFolder: (id: string, name: string) =>
    call<{ folder: StoredFolder }>(`/api/folders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  deleteFolder: (id: string) =>
    call<{ deletedFolders: number; deletedFiles: number }>(
      `/api/folders/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),

  files: (teamId: string, opts: { folderId?: string | null; q?: string } = {}) => {
    const params = new URLSearchParams({ teamId });
    if (opts.q) params.set("q", opts.q);
    // "root" rather than an empty value: an absent folderId means "everything
    // in the team", which is a different list from "the top level".
    else if (opts.folderId !== undefined) params.set("folderId", opts.folderId ?? "root");
    return call<{ files: StoredFile[] }>(`/api/files?${params}`);
  },
  moveFile: (id: string, folderId: string | null) =>
    call<{ file: StoredFile }>(`/api/files/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    }),
  deleteFile: (id: string) =>
    call<void>(`/api/files/${encodeURIComponent(id)}`, { method: "DELETE" }),

  downloadUrl: (id: string) => `/api/files/${encodeURIComponent(id)}/content`,

  upload: (file: Blob, metadata: UploadMetadata) => {
    const form = new FormData();
    form.append("file", file, metadata.fileName);
    form.append("metadata", JSON.stringify(metadata));
    return call<{ file: StoredFile; duplicate?: boolean }>("/api/files", {
      method: "POST",
      body: form,
    });
  },
};

export interface UploadMetadata {
  teamId: string;
  folderId: string | null;
  fileName: string;
  sourceFormat?: string;
  subject?: string;
  fromName?: string;
  fromAddress?: string;
  sentAt?: number;
  hasAttachments?: boolean;
}

/**
 * Start the Google sign-in redirect, returning to `next` afterwards.
 *
 * A full document navigation on purpose. `/api/auth/google` is a Worker route,
 * not a Next page — the client router would try to resolve it as one and 404,
 * and the flow ends on accounts.google.com regardless.
 */
export function signIn(next: string = "/workspace/"): void {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
}
