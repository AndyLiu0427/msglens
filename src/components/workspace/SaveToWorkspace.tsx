"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconArchive, IconGoogle } from "@/components/ui/icons";
import { ApiError, api, signIn, type TeamSummary } from "@/lib/workspace/api";
import type { ParsedEmail } from "@/lib/email/types";
import type { Dictionary } from "@/lib/i18n";

type State = "idle" | "saving" | "saved" | "duplicate";

/** 402 from the API: the free allowance is used up, or the feature is paid. */
const isPaywall = (error: unknown) => error instanceof ApiError && error.status === 402;

/**
 * "Save to workspace" in the message toolbar.
 *
 * Renders nothing until the session is resolved, so the button never flickers
 * between states on load. Signed-out visitors then get a button that starts
 * sign-in rather than one that uploads: the anonymous viewer stays a viewer,
 * and no file moves anywhere without an account and a deliberate click.
 */
export function SaveToWorkspace({
  email,
  t,
  locale,
}: {
  email: ParsedEmail;
  t: Dictionary;
  locale: string;
}) {
  const [teams, setTeams] = useState<TeamSummary[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(async ({ user }) => {
        if (cancelled) return;
        setSignedIn(Boolean(user));
        if (!user) return;
        const { teams } = await api.teams();
        if (!cancelled) setTeams(teams);
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // An embedded message has no file of its own to store.
  if (!email.sourceFile) return null;

  if (signedIn === null) return null;

  if (signedIn === false) {
    const here = locale === "en" ? "/" : `/${locale}/`;
    return (
      <Button size="sm" variant="ghost" onClick={() => signIn(here)} title={t.workspace.signIn}>
        <IconGoogle className="size-4" />
        <span className="hidden sm:inline">{t.workspace.save}</span>
      </Button>
    );
  }

  const target = teams?.find((team) => team.is_personal) ?? teams?.[0];
  if (!target) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={state === "saving" || state === "saved"}
        onClick={async () => {
          setState("saving");
          setMessage(null);
          try {
            const { duplicate } = await api.upload(email.sourceFile!, {
              teamId: target.id,
              folderId: null,
              fileName: email.sourceFileName,
              sourceFormat: email.sourceFormat,
              subject: email.subject,
              fromName: email.from?.name ?? undefined,
              fromAddress: email.from?.address ?? undefined,
              sentAt: email.date ? Math.floor(email.date.getTime() / 1000) : undefined,
              hasAttachments: email.attachments.some((a) => !a.inline),
            });
            setState(duplicate ? "duplicate" : "saved");
          } catch (error) {
            setState("idle");
            setBlocked(isPaywall(error));
            setMessage(error instanceof Error ? error.message : "Save failed");
          }
        }}
      >
        <IconArchive className="size-4" />
        {state === "saving"
          ? t.workspace.saving
          : state === "saved"
            ? t.workspace.saved
            : state === "duplicate"
              ? t.workspace.alreadySaved
              : t.workspace.save}
      </Button>
      {/*
        The way back, offered at the moment it is wanted. Before this, saving a
        message left you with a "Saved" label and no route to what you had just
        saved into.
      */}
      {(state === "saved" || state === "duplicate") && (
        <a
          href={locale === "en" ? "/workspace/" : `/${locale}/workspace/`}
          className="text-[12.5px] text-accent underline underline-offset-2 hover:text-accent-hover"
        >
          {t.workspace.openWorkspace}
        </a>
      )}
      {message && (
        <span className={`text-[12.5px] ${blocked ? "text-ink-muted" : "text-danger"}`}>
          {message}{" "}
          {/*
            Running out of free saves is not an error, and colouring it like
            one makes a pricing limit read as a malfunction. It is also the
            single best moment to show the plans — the user is holding a file
            they wanted to keep.
          */}
          {blocked && (
            <a
              href={locale === "en" ? "/pricing/" : `/${locale}/pricing/`}
              className="text-accent underline underline-offset-2 hover:text-accent-hover"
            >
              {t.workspace.seePlans}
            </a>
          )}
        </span>
      )}
    </div>
  );
}
