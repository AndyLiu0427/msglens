"use client";

import { useCallback, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type StoredFile,
  type StoredFolder,
  type TeamSummary,
  type WorkspaceUser,
} from "./api";

/** "root" means the top level; null means every file in the team. */
export type FolderSelection = string | "root" | null;

const LAST_TEAM_KEY = "msglens.lastTeam";

export function useWorkspace() {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [folders, setFolders] = useState<StoredFolder[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [folder, setFolder] = useState<FolderSelection>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const report = useCallback((e: unknown) => {
    setError(e instanceof ApiError ? e.message : "Something went wrong");
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ user }) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        // An unreachable API on a page the user may only be browsing is not
        // worth an error banner — it just means signed out.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingUser(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Reload the team list.
   *
   * Exposed rather than kept inside the mount effect because creating or
   * leaving a team has to update the selector. When it did not, creating a
   * team looked like it had failed — the new team never appeared — so people
   * pressed the button again, and again, and ended up with duplicates.
   *
   * `select` moves to a specific team once it exists, which is what you want
   * immediately after creating one.
   */
  const refreshTeams = useCallback(
    async (select?: string) => {
      try {
        const { teams } = await api.teams();
        setTeams(teams);
        const remembered =
          typeof localStorage !== "undefined" ? localStorage.getItem(LAST_TEAM_KEY) : null;
        setTeamId((current) => {
          if (select && teams.some((t) => t.id === select)) return select;
          if (current && teams.some((t) => t.id === current)) return current;
          const pick =
            teams.find((t) => t.id === remembered) ??
            teams.find((t) => t.is_personal) ??
            teams[0];
          return pick?.id ?? null;
        });
      } catch (e) {
        report(e);
      }
    },
    [report],
  );

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshTeams();
  }, [user, refreshTeams]);

  useEffect(() => {
    if (!teamId) return;
    try {
      localStorage.setItem(LAST_TEAM_KEY, teamId);
    } catch {
      // Private-mode Safari throws on setItem. Remembering the team is a
      // convenience, not a requirement.
    }
  }, [teamId]);

  const refresh = useCallback(async () => {
    if (!teamId) return;
    setBusy(true);
    try {
      const [f, l] = await Promise.all([
        api.folders(teamId),
        api.files(teamId, query ? { q: query } : { folderId: folder === "root" ? null : folder }),
      ]);
      setFolders(f.folders);
      setFiles(l.files);
      setError(null);
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }, [teamId, folder, query, report]);

  useEffect(() => {
    // Refetch whenever the team, folder or query changes — the "synchronise
    // with an external system" case effects exist for, the external system
    // being the API. refresh() only sets state after an await, which the rule
    // cannot see through.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const currentTeam = teams.find((t) => t.id === teamId) ?? null;
  const canEdit = currentTeam ? currentTeam.role !== "viewer" : false;

  return {
    user,
    loadingUser,
    teams,
    teamId,
    currentTeam,
    canEdit,
    setTeamId,
    folders,
    files,
    folder,
    setFolder,
    query,
    setQuery,
    busy,
    error,
    setError,
    refresh,
    refreshTeams,
    report,
  };
}
