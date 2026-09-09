"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  IconAlert,
  IconChevronRight,
  IconDownload,
  IconFile,
  IconFolder,
  IconGoogle,
  IconLogOut,
  IconPaperclip,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from "@/components/ui/icons";
import { api, signIn, type StoredFile, type StoredFolder } from "@/lib/workspace/api";
import { useWorkspace, type FolderSelection } from "@/lib/workspace/useWorkspace";
import { format, type Dictionary } from "@/lib/i18n";
import { localizedPath, type Locale } from "@/lib/site";
import { PlanBanner } from "./PlanBanner";
import { TeamPanel } from "./TeamPanel";
import { StoredMessage } from "./StoredMessage";

/** Dragged files travel as a comma-joined id list on a private MIME type. */
const DRAG_TYPE = "application/x-msglens-files";

/** Pick the right singular/plural template. "1 members" reads as a bug. */
function teamMetaTemplate(t: Dictionary, members: number, files: number): string {
  if (members === 1 && files === 1) return t.workspace.teamMetaOneBoth;
  if (members === 1) return t.workspace.teamMetaOneMember;
  if (files === 1) return t.workspace.teamMetaOneFile;
  return t.workspace.teamMeta;
}

export function Workspace({ t, locale }: { t: Dictionary; locale: Locale }) {
  const w = useWorkspace();
  const [showTeam, setShowTeam] = useState(false);
  const [opened, setOpened] = useState<StoredFile | null>(null);
  const [rawSelected, setSelected] = useState<Set<string>>(new Set());

  /*
    Derive the working selection by intersecting with what is on screen, rather
    than clearing it from an effect when the folder or search changes.

    Same result for that case, and it also covers the ones an effect would
    miss: a file deleted from another tab, or a row that drops out of a
    filtered list. A bulk action can then never be aimed at a row the user
    cannot see.
  */
  const selected = useMemo(() => {
    const visible = new Set(w.files.map((f) => f.id));
    return new Set([...rawSelected].filter((id) => visible.has(id)));
  }, [rawSelected, w.files]);

  if (w.loadingUser) {
    return <div className="h-64 animate-pulse rounded-card border border-line bg-surface" />;
  }
  if (!w.user) return <SignedOut t={t} />;

  const moveMany = async (ids: string[], folderId: string | null) => {
    try {
      // One request per file: there is no bulk endpoint, and adding one for the
      // handful of files a person selects at a time would not pay for itself.
      await Promise.all(ids.map((id) => api.moveFile(id, folderId)));
      setSelected(new Set());
      await w.refresh();
    } catch (e) {
      w.report(e);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          {t.workspace.title}
        </h1>
        <PlanBanner t={t} locale={locale} />

        {w.teams.length > 0 && (
          <select
            value={w.teamId ?? ""}
            onChange={(e) => {
              w.setTeamId(e.target.value);
              w.setFolder(null);
            }}
            className="h-9 max-w-full rounded-[10px] border border-line bg-surface px-3 text-[13.5px] text-ink"
            aria-label={t.workspace.teams}
          >
            {w.teams.map((team) => (
              // Counts go in the label because a native <select> cannot hold a
              // second line — and without them nothing distinguishes one team
              // from another beyond its name.
              <option key={team.id} value={team.id}>
                {(team.is_personal ? t.workspace.personal : team.name) +
                  " — " +
                  format(teamMetaTemplate(t, team.member_count, team.file_count), {
                    members: team.member_count,
                    files: team.file_count,
                  })}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowTeam((v) => !v)}>
            <IconUsers className="size-4" />
            {t.workspace.members}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await api.logout().catch(() => {});
              window.location.reload();
            }}
          >
            <IconLogOut className="size-4" />
            {t.workspace.signOut}
          </Button>
        </div>
      </header>

      {/*
        Stated on the screen where files actually get uploaded, not only in the
        privacy policy. The free viewer's claim is absolute; this one is not,
        and the difference has to be visible at the moment of the decision.
      */}
      <p className="flex items-start gap-2 rounded-xl border border-line bg-surface-sunken px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-muted">
        <IconAlert className="mt-px size-4 shrink-0 text-ink-subtle" />
        {t.workspace.uploadNotice}
      </p>

      {w.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger"
        >
          <IconAlert className="mt-px size-4 shrink-0" />
          <span className="flex-1">{w.error}</span>
          <button onClick={() => w.setError(null)} className="opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {showTeam && w.currentTeam && (
        <TeamPanel
          t={t}
          team={w.currentTeam}
          currentUserId={w.user.id}
          onChanged={(select) => {
            void w.refreshTeams(select);
            void w.refresh();
          }}
          onError={w.report}
        />
      )}

      <div className="grid gap-4 md:grid-cols-[230px_1fr]">
        <FolderTree t={t} w={w} onDropFiles={moveMany} />
        <div className="min-w-0 space-y-3">
          {selected.size > 0 && (
            <BulkBar
              t={t}
              w={w}
              selected={selected}
              onClear={() => setSelected(new Set())}
              onMove={(folderId) => moveMany([...selected], folderId)}
            />
          )}
          <FileList
            t={t}
            w={w}
            locale={locale}
            selected={selected}
            setSelected={setSelected}
            onOpen={setOpened}
          />
        </div>
      </div>

      {opened && (
        <StoredMessage file={opened} t={t} locale={locale} onClose={() => setOpened(null)} />
      )}
    </div>
  );
}

function SignedOut({ t }: { t: Dictionary }) {
  /*
    The OAuth failure paths redirect here with ?error=. Without reading it, a
    failed sign-in is indistinguishable from never having tried: the user lands
    back on a sign-in button with no idea why.
  */
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("error");
    if (!reason) return;
    // Has to be an effect, not a lazy initialiser: this page is statically
    // exported, so first render happens at build time with no window. Reading
    // the URL during render would make the server and client markup disagree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFailure(
      reason === "cancelled"
        ? t.workspace.signInCancelled
        : reason === "misconfigured"
          ? t.workspace.signInNotConfigured
          : t.workspace.signInFailed,
    );
    window.history.replaceState(null, "", window.location.pathname);
  }, [t]);

  return (
    <div className="mx-auto max-w-lg rounded-card border border-line bg-surface p-8 text-center">
      {failure && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger"
        >
          {failure}
        </p>
      )}
      <h1 className="text-[24px] font-semibold tracking-tight text-ink">
        {t.workspace.signedOutTitle}
      </h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
        {t.workspace.signedOutBody}
      </p>
      <Button size="lg" variant="secondary" className="mt-6" onClick={() => signIn()}>
        <IconGoogle className="size-5" />
        {t.workspace.signIn}
      </Button>
    </div>
  );
}

type W = ReturnType<typeof useWorkspace>;

/* ------------------------------------------------------------------ *
 * Folders
 * ------------------------------------------------------------------ */

function FolderTree({
  t,
  w,
  onDropFiles,
}: {
  t: Dictionary;
  w: W;
  onDropFiles: (ids: string[], folderId: string | null) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const render = (parent: string | null, depth: number): React.ReactNode =>
    w.folders
      .filter((f) => f.parent_id === parent)
      .map((f) => (
        <div key={f.id}>
          <FolderRow t={t} w={w} folder={f} depth={depth} onDropFiles={onDropFiles} />
          {render(f.id, depth + 1)}
        </div>
      ));

  return (
    <aside className="h-fit rounded-card border border-line bg-surface p-2">
      <DropRow
        label={t.workspace.allFiles}
        active={w.folder === null && !w.query}
        onClick={() => {
          w.setQuery("");
          w.setFolder(null);
        }}
      />
      <DropRow
        label={t.workspace.topLevel}
        active={w.folder === "root"}
        canDrop={w.canEdit}
        onDropFiles={(ids) => onDropFiles(ids, null)}
        onClick={() => {
          w.setQuery("");
          w.setFolder("root");
        }}
      />

      <div className="my-2 border-t border-line" />
      {render(null, 0)}

      {w.canEdit &&
        (adding ? (
          <form
            className="mt-2 flex gap-1.5 px-1"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim() || !w.teamId) return;
              try {
                await api.createFolder(w.teamId, name.trim(), null);
                setName("");
                setAdding(false);
                await w.refresh();
              } catch (err) {
                w.report(err);
              }
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.workspace.folderName}
              className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-[13px] text-ink"
            />
            <Button size="sm" variant="primary" type="submit">
              +
            </Button>
          </form>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 w-full justify-start"
            onClick={() => setAdding(true)}
          >
            <IconPlus className="size-4" />
            {t.workspace.newFolder}
          </Button>
        ))}
    </aside>
  );
}

/**
 * A row in the folder rail that can also receive dragged files.
 *
 * Dropping is the fast way to file a message. It is deliberately not the only
 * way: drag is invisible on touch and to anyone who does not think to try it,
 * so the explicit control lives in the selection bar and this is a shortcut.
 */
function DropRow({
  label,
  active,
  onClick,
  depth = 0,
  icon,
  after,
  canDrop = false,
  onDropFiles,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  depth?: number;
  icon?: React.ReactNode;
  after?: React.ReactNode;
  canDrop?: boolean;
  onDropFiles?: (ids: string[]) => void;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      className="group flex items-center"
      onDragOver={
        canDrop
          ? (e) => {
              if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(true);
            }
          : undefined
      }
      onDragLeave={canDrop ? () => setOver(false) : undefined}
      onDrop={
        canDrop
          ? (e) => {
              e.preventDefault();
              setOver(false);
              const ids = e.dataTransfer.getData(DRAG_TYPE).split(",").filter(Boolean);
              if (ids.length) onDropFiles?.(ids);
            }
          : undefined
      }
    >
      <button
        onClick={onClick}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={`flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg pr-2 text-left text-[13px] transition-colors ${
          over
            ? "bg-accent text-accent-on"
            : active
              ? "bg-accent-soft text-accent"
              : "text-ink-muted hover:bg-surface-sunken"
        }`}
      >
        {icon}
        <span className="truncate">{label}</span>
      </button>
      {after}
    </div>
  );
}

function FolderRow({
  t,
  w,
  folder,
  depth,
  onDropFiles,
}: {
  t: Dictionary;
  w: W;
  folder: StoredFolder;
  depth: number;
  onDropFiles: (ids: string[], folderId: string | null) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(folder.name);

  if (renaming) {
    return (
      <form
        className="flex gap-1.5 py-0.5 pr-1"
        style={{ paddingLeft: 8 + depth * 14 }}
        onSubmit={async (e) => {
          e.preventDefault();
          const next = name.trim();
          if (!next || next === folder.name) return setRenaming(false);
          try {
            await api.renameFolder(folder.id, next);
            setRenaming(false);
            await w.refresh();
          } catch (err) {
            w.report(err);
            setRenaming(false);
          }
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setRenaming(false)}
          className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-[13px] text-ink"
        />
      </form>
    );
  }

  return (
    <DropRow
      depth={depth}
      icon={<IconFolder className="size-4 shrink-0" />}
      label={folder.name}
      active={w.folder === folder.id}
      canDrop={w.canEdit}
      onDropFiles={(ids) => onDropFiles(ids, folder.id)}
      onClick={() => {
        w.setQuery("");
        w.setFolder(folder.id);
      }}
      after={
        <div className="flex shrink-0 items-center">
          {folder.file_count ? (
            <span className="mr-1 text-[11.5px] tabular-nums text-ink-subtle">
              {folder.file_count}
            </span>
          ) : null}
          {w.canEdit && (
            <>
              <button
                title={t.workspace.rename}
                aria-label={`${t.workspace.rename}: ${folder.name}`}
                onClick={() => {
                  setName(folder.name);
                  setRenaming(true);
                }}
                className="rounded p-1 text-[12px] leading-none text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink focus:opacity-100"
              >
                ✎
              </button>
              <button
                title={t.workspace.delete}
                aria-label={`${t.workspace.delete}: ${folder.name}`}
                onClick={async () => {
                  if (!confirm(t.workspace.confirmDeleteFolder)) return;
                  try {
                    await api.deleteFolder(folder.id);
                    if (w.folder === folder.id) w.setFolder(null);
                    await w.refresh();
                  } catch (err) {
                    w.report(err);
                  }
                }}
                className="mr-1 rounded p-1 text-ink-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus:opacity-100"
              >
                <IconTrash className="size-3.5" />
              </button>
            </>
          )}
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ *
 * Files
 * ------------------------------------------------------------------ */

function BulkBar({
  t,
  w,
  selected,
  onClear,
  onMove,
}: {
  t: Dictionary;
  w: W;
  selected: Set<string>;
  onClear: () => void;
  onMove: (folderId: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-2.5">
      <span className="text-[13px] font-medium text-accent">
        {format(t.workspace.selectedCount, { count: selected.size })}
      </span>

      {w.canEdit && (
        <>
          <select
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              onMove(e.target.value === "__root" ? null : e.target.value);
              e.target.value = "";
            }}
            className="h-8 rounded-lg border border-line bg-surface px-2 text-[12.5px] text-ink"
          >
            <option value="" disabled>
              {t.workspace.moveSelected}
            </option>
            <option value="__root">{t.workspace.topLevel}</option>
            {w.folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (!confirm(format(t.workspace.confirmDeleteMany, { count: selected.size }))) {
                return;
              }
              try {
                await Promise.all([...selected].map((id) => api.deleteFile(id)));
                onClear();
                await w.refresh();
              } catch (err) {
                w.report(err);
              }
            }}
          >
            <IconTrash className="size-3.5" />
            {t.workspace.deleteSelected}
          </Button>
        </>
      )}

      <Button size="sm" variant="ghost" className="ml-auto" onClick={onClear}>
        {t.workspace.clearSelection}
      </Button>
    </div>
  );
}

/** Ancestors of the current folder, outermost first. */
function useTrail(folders: StoredFolder[], folder: FolderSelection): StoredFolder[] {
  return useMemo(() => {
    if (!folder || folder === "root") return [];
    const byId = new Map(folders.map((f) => [f.id, f]));
    const trail: StoredFolder[] = [];
    let current = byId.get(folder);
    // The server caps nesting depth; this bound only guards against a cycle
    // that should be impossible but would otherwise hang the render.
    while (current && trail.length < 16) {
      trail.unshift(current);
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    return trail;
  }, [folders, folder]);
}

function FileList({
  t,
  w,
  locale,
  selected,
  setSelected,
  onOpen,
}: {
  t: Dictionary;
  w: W;
  locale: Locale;
  selected: Set<string>;
  setSelected: (next: Set<string>) => void;
  onOpen: (file: StoredFile) => void;
}) {
  const trail = useTrail(w.folders, w.folder);
  const allChecked = w.files.length > 0 && selected.size === w.files.length;

  return (
    <section className="min-w-0 rounded-card border border-line bg-surface">
      {/* Where am I. Nothing on this side of the screen used to say. */}
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-4 py-2.5 text-[13px]">
        <button
          onClick={() => {
            w.setQuery("");
            w.setFolder(null);
          }}
          className="text-ink-muted transition-colors hover:text-ink"
        >
          {t.workspace.allFiles}
        </button>

        {w.query ? (
          <>
            <IconChevronRight className="size-3.5 text-ink-subtle" />
            <span className="font-medium text-ink">{`“${w.query}”`}</span>
          </>
        ) : (
          <>
            {w.folder === "root" && (
              <>
                <IconChevronRight className="size-3.5 text-ink-subtle" />
                <span className="font-medium text-ink">{t.workspace.topLevel}</span>
              </>
            )}
            {trail.map((f, i) => (
              <span key={f.id} className="flex items-center gap-1">
                <IconChevronRight className="size-3.5 text-ink-subtle" />
                {i === trail.length - 1 ? (
                  <span className="font-medium text-ink">{f.name}</span>
                ) : (
                  <button
                    onClick={() => w.setFolder(f.id)}
                    className="text-ink-muted transition-colors hover:text-ink"
                  >
                    {f.name}
                  </button>
                )}
              </span>
            ))}
          </>
        )}

        <span className="ml-auto text-[12.5px] tabular-nums text-ink-subtle">
          {format(
            w.files.length === 1 ? t.workspace.folderMetaOne : t.workspace.folderMeta,
            { count: w.files.length },
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 border-b border-line px-4 py-2">
        <IconSearch className="size-4 shrink-0 text-ink-subtle" />
        <input
          value={w.query}
          onChange={(e) => w.setQuery(e.target.value)}
          placeholder={t.workspace.search}
          className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none"
        />
        {w.files.length > 0 && (
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12.5px] text-ink-subtle">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) =>
                setSelected(e.target.checked ? new Set(w.files.map((f) => f.id)) : new Set())
              }
              className="size-3.5"
            />
            {t.workspace.selectAll}
          </label>
        )}
      </div>

      {w.files.length === 0 ? (
        <EmptyState t={t} w={w} locale={locale} />
      ) : (
        <ul className="divide-y divide-line">
          {w.files.map((file) => (
            <FileRow
              key={file.id}
              t={t}
              w={w}
              file={file}
              checked={selected.has(file.id)}
              onToggle={(on) => {
                const next = new Set(selected);
                if (on) next.add(file.id);
                else next.delete(file.id);
                setSelected(next);
              }}
              selectedIds={selected}
              onOpen={onOpen}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Three different situations that used to share one flat line of text. */
function EmptyState({ t, w, locale }: { t: Dictionary; w: W; locale: Locale }) {
  if (w.query) {
    return (
      <div className="px-5 py-14 text-center">
        <p className="text-[14.5px] font-medium text-ink">{t.workspace.emptySearchTitle}</p>
        <p className="mt-1.5 text-[13px] text-ink-subtle">{t.workspace.emptySearchBody}</p>
      </div>
    );
  }
  if (w.folder && w.folder !== "root") {
    return (
      <div className="px-5 py-14 text-center">
        <p className="text-[13.5px] text-ink-subtle">{t.workspace.emptyFolder}</p>
      </div>
    );
  }
  return (
    <div className="px-5 py-14 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-surface-sunken text-ink-subtle">
        <IconFile className="size-5" />
      </span>
      <p className="mt-4 text-[15px] font-medium text-ink">{t.workspace.emptyTeamTitle}</p>
      <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-muted">
        {t.workspace.emptyTeamBody}
      </p>
      <Button
        size="md"
        variant="primary"
        className="mt-5"
        onClick={() => {
          window.location.href = localizedPath("/", locale);
        }}
      >
        {t.workspace.emptyTeamCta}
      </Button>
    </div>
  );
}

function FileRow({
  t,
  w,
  file,
  checked,
  onToggle,
  selectedIds,
  onOpen,
}: {
  t: Dictionary;
  w: W;
  file: StoredFile;
  checked: boolean;
  onToggle: (on: boolean) => void;
  selectedIds: Set<string>;
  onOpen: (file: StoredFile) => void;
}) {
  return (
    <li
      draggable={w.canEdit}
      onDragStart={(e) => {
        // Dragging a row inside the selection drags the whole selection;
        // dragging an unselected row drags only that one, which is what every
        // file manager does.
        const ids = selectedIds.has(file.id) ? [...selectedIds] : [file.id];
        e.dataTransfer.setData(DRAG_TYPE, ids.join(","));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group flex items-center gap-3 px-4 py-3 transition-colors ${
        checked ? "bg-accent-soft/40" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={file.subject || file.file_name}
        className="size-3.5 shrink-0"
      />
      <IconFile className="size-4 shrink-0 text-ink-subtle" />

      <div className="min-w-0 flex-1">
        <button
          onClick={() => onOpen(file)}
          title={t.workspace.openInViewer}
          className="block w-full truncate text-left text-[14px] font-medium text-ink underline-offset-2 hover:text-accent hover:underline"
        >
          {file.subject || file.file_name}
        </button>
        <p className="truncate text-[12.5px] text-ink-subtle">
          {[
            file.from_name || file.from_address,
            file.sent_at ? new Date(file.sent_at * 1000).toLocaleDateString() : null,
            `${Math.max(1, Math.round(file.size_bytes / 1024))} KB`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {file.has_attachments === 1 && (
        <IconPaperclip className="size-3.5 shrink-0 text-ink-subtle" />
      )}

      {/* Always visible rather than hover-gated: hover controls do not exist on touch. */}
      <a
        href={api.downloadUrl(file.id)}
        download={file.file_name}
        title={t.workspace.download}
        className="shrink-0 rounded p-1.5 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
      >
        <IconDownload className="size-4" />
      </a>

      {w.canEdit && (
        <button
          title={t.workspace.delete}
          onClick={async () => {
            if (!confirm(t.workspace.confirmDeleteFile)) return;
            try {
              await api.deleteFile(file.id);
              await w.refresh();
            } catch (err) {
              w.report(err);
            }
          }}
          className="shrink-0 rounded p-1.5 text-ink-subtle hover:bg-danger-soft hover:text-danger"
        >
          <IconTrash className="size-4" />
        </button>
      )}
    </li>
  );
}
