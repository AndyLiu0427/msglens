"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconPlus, IconTrash } from "@/components/ui/icons";
import {
  api,
  type PendingInvite,
  type Role,
  type TeamMember,
  type TeamSummary,
} from "@/lib/workspace/api";
import type { Dictionary } from "@/lib/i18n";

export function TeamPanel({
  t,
  team,
  currentUserId,
  onChanged,
  onError,
}: {
  t: Dictionary;
  team: TeamSummary;
  currentUserId: string;
  /** Called when membership changes; `select` moves to a newly created team. */
  onChanged: (select?: string) => void;
  onError: (e: unknown) => void;
}) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newTeam, setNewTeam] = useState("");
  // Without this the button stays live during the request, and a second press
  // creates a second team. That is how three identical teams appeared.
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const { members, invites } = await api.members(team.id);
      setMembers(members);
      setInvites(invites);
    } catch (e) {
      onError(e);
    }
  }, [team.id, onError]);

  useEffect(() => {
    // Fetch on mount. load() sets state only after an await, so this is a
    // subscription to an external system rather than a cascading render — the
    // rule cannot see through the async boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const isOwner = team.role === "owner";

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="text-[13px] font-semibold tracking-wider text-ink-subtle uppercase">
        {team.is_personal ? t.workspace.personal : team.name} · {t.workspace.members}
      </h2>

      <ul className="mt-3 divide-y divide-line">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] text-ink">{m.name || m.email}</p>
              <p className="truncate text-[12.5px] text-ink-subtle">{m.email}</p>
            </div>
            {isOwner && !team.is_personal ? (
              <select
                value={m.role}
                onChange={async (e) => {
                  try {
                    await api.changeRole(team.id, m.id, e.target.value as Role);
                    await load();
                  } catch (err) {
                    onError(err);
                  }
                }}
                className="h-8 rounded-lg border border-line bg-surface px-2 text-[12.5px] text-ink-muted"
              >
                <option value="owner">{t.workspace.roleOwner}</option>
                <option value="member">{t.workspace.roleMember}</option>
                <option value="viewer">{t.workspace.roleViewer}</option>
              </select>
            ) : (
              <span className="text-[12.5px] text-ink-subtle">
                {m.role === "owner"
                  ? t.workspace.roleOwner
                  : m.role === "member"
                    ? t.workspace.roleMember
                    : t.workspace.roleViewer}
              </span>
            )}
            {isOwner && !team.is_personal && (
              <button
                title={t.workspace.remove}
                onClick={async () => {
                  try {
                    await api.removeMember(team.id, m.id);
                    await load();
                    onChanged();
                  } catch (err) {
                    onError(err);
                  }
                }}
                className="rounded p-1.5 text-ink-subtle hover:bg-danger-soft hover:text-danger"
              >
                <IconTrash className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {invites.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[12px] font-semibold tracking-wider text-ink-subtle uppercase">
            {t.workspace.pendingInvites}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-[13px] text-ink-muted">
                <span className="min-w-0 flex-1 truncate">{i.email}</span>
                {isOwner && (
                  <button
                    onClick={async () => {
                      try {
                        await api.revokeInvite(i.id);
                        await load();
                      } catch (err) {
                        onError(err);
                      }
                    }}
                    className="text-[12.5px] text-danger hover:underline"
                  >
                    {t.workspace.revoke}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOwner && !team.is_personal && (
        <form
          className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const { url } = await api.invite(team.id, email, role);
              setInviteUrl(url);
              setEmail("");
              setCopied(false);
              await load();
            } catch (err) {
              onError(err);
            }
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.workspace.inviteEmail}
            className="h-9 min-w-[200px] flex-1 rounded-[10px] border border-line bg-surface px-3 text-[13.5px] text-ink"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-9 rounded-[10px] border border-line bg-surface px-2 text-[13px] text-ink-muted"
          >
            <option value="member">{t.workspace.roleMember}</option>
            <option value="viewer">{t.workspace.roleViewer}</option>
          </select>
          <Button size="md" variant="primary" type="submit">
            {t.workspace.invite}
          </Button>
          <p className="w-full text-[12.5px] text-ink-subtle">{t.workspace.roleHint}</p>
        </form>
      )}

      {inviteUrl && (
        <div className="mt-3 rounded-xl border border-line bg-surface-sunken p-3">
          <p className="text-[13px] text-ink-muted">{t.workspace.inviteCreated}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-surface px-2 py-1.5 font-mono text-[12px] text-ink">
              {inviteUrl}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteUrl);
                  setCopied(true);
                } catch {
                  // Clipboard access can be denied; the link is selectable.
                }
              }}
            >
              {copied ? t.workspace.copied : t.workspace.copyLink}
            </Button>
          </div>
        </div>
      )}

      {!team.is_personal && (
        <div className="mt-4 border-t border-line pt-3">
          <button
            onClick={async () => {
              if (!confirm(t.workspace.confirmLeave)) return;
              try {
                await api.removeMember(team.id, currentUserId);
                onChanged();
              } catch (err) {
                onError(err);
              }
            }}
            className="text-[13px] text-danger hover:underline"
          >
            {t.workspace.leave}
          </button>
        </div>
      )}

      <form
        className="mt-4 flex items-center gap-2 border-t border-line pt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newTeam.trim() || creating) return;
          setCreating(true);
          try {
            const { team: created } = await api.createTeam(newTeam.trim());
            setNewTeam("");
            // Switch to it: creating a team you cannot then see reads as failure.
            onChanged(created.id);
          } catch (err) {
            onError(err);
          } finally {
            setCreating(false);
          }
        }}
      >
        <input
          value={newTeam}
          onChange={(e) => setNewTeam(e.target.value)}
          placeholder={t.workspace.teamName}
          className="h-9 min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 text-[13.5px] text-ink"
        />
        <Button size="md" variant="secondary" type="submit" disabled={creating}>
          <IconPlus className="size-4" />
          {t.workspace.newTeam}
        </Button>
      </form>
    </section>
  );
}
