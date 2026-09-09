"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconGoogle, IconUsers } from "@/components/ui/icons";
import { api, ApiError, signIn } from "@/lib/workspace/api";
import { format, type Dictionary } from "@/lib/i18n";

type State =
  | { kind: "loading" }
  | { kind: "signin"; token: string }
  | { kind: "ready"; token: string }
  | { kind: "done"; team: string }
  | { kind: "error"; message: string };

export function InviteAccept({ t }: { t: Dictionary }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    // The token comes from the URL rather than a prop: this page is statically
    // exported, so there is no server render that could receive one.
    const token = new URLSearchParams(window.location.search).get("token");
    api
      .me()
      .then(({ user }) => {
        if (!token) {
          setState({ kind: "error", message: "That invitation link is not valid" });
        } else {
          setState(user ? { kind: "ready", token } : { kind: "signin", token });
        }
      })
      .catch(() =>
        setState(
          token
            ? { kind: "signin", token }
            : { kind: "error", message: "That invitation link is not valid" },
        ),
      );
  }, []);

  return (
    <div className="mx-auto max-w-md rounded-card border border-line bg-surface p-8 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
        <IconUsers className="size-5" />
      </span>
      <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-ink">
        {t.workspace.inviteTitle}
      </h1>

      {state.kind === "signin" && (
        <>
          <p className="mt-3 text-[14px] text-ink-muted">{t.workspace.inviteSignIn}</p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-5"
            onClick={() =>
              signIn(`/invite/?token=${encodeURIComponent(state.token)}`)
            }
          >
            <IconGoogle className="size-5" />
            {t.workspace.signIn}
          </Button>
        </>
      )}

      {state.kind === "ready" && (
        <Button
          size="lg"
          variant="primary"
          className="mt-5"
          onClick={async () => {
            try {
              const { teamName } = await api.acceptInvite(state.token);
              setState({ kind: "done", team: teamName });
            } catch (error) {
              setState({
                kind: "error",
                message:
                  error instanceof ApiError ? error.message : "Could not accept the invitation",
              });
            }
          }}
        >
          {t.workspace.inviteAccept}
        </Button>
      )}

      {state.kind === "done" && (
        <>
          <p className="mt-3 text-[14px] text-ink-muted">
            {format(t.workspace.inviteAccepted, { team: state.team })}
          </p>
          <Button
            size="lg"
            variant="primary"
            className="mt-5"
            // A full navigation, not a client route: the session cookie was
            // just set by the API and the workspace must load with it applied.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            onClick={() => (window.location.href = "/workspace/")}
          >
            {t.workspace.title}
          </Button>
        </>
      )}

      {state.kind === "error" && (
        <p className="mt-3 text-[14px] text-danger">{state.message}</p>
      )}
    </div>
  );
}
