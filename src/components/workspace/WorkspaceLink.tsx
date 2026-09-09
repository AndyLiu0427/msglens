"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconFolder, IconGoogle } from "@/components/ui/icons";
import { api, signIn, type WorkspaceUser } from "@/lib/workspace/api";
import { localizedPath, type Locale } from "@/lib/site";
import type { Dictionary } from "@/lib/i18n";

/**
 * Account control in the header.
 *
 * Signed in: avatar and a link to the workspace. Signed out: a quiet "Sign in".
 *
 * The first version showed nothing at all to anonymous visitors, on the theory
 * that an account affordance argues against a landing page whose proposition is
 * "no account, nothing uploaded". That was wrong in practice: it left no way to
 * reach the workspace, or to sign back in after signing out, without first
 * opening a file so the Save button would appear. A workspace nobody can find
 * is not a feature.
 *
 * A small text link does not undercut the proposition — the page still says the
 * viewer needs no account, and the two modes are explained wherever they
 * matter. Being unable to log in does undercut the product.
 */
export function WorkspaceLink({ locale, t }: { locale: Locale; t: Dictionary }) {
  // undefined = not resolved yet, null = signed out.
  const [user, setUser] = useState<WorkspaceUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ user }) => {
        if (!cancelled) setUser(user);
      })
      .catch(() => {
        // The API is unreachable. Offering sign-in that cannot work is worse
        // than offering nothing, so leave it unresolved.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing on the first paint: this page is statically exported, so the markup
  // is built with no session and must hydrate to the same thing. For anonymous
  // visitors the check is a cookie read with no request behind it, so the gap
  // is a frame rather than a round trip.
  if (user === undefined) return null;

  if (user === null) {
    return (
      <button
        onClick={() => signIn(window.location.pathname)}
        className="ml-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13.5px] text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
      >
        <IconGoogle className="size-4" />
        <span className="hidden sm:inline">{t.workspace.signIn}</span>
        <span className="sm:hidden">{t.workspace.signInShort}</span>
      </button>
    );
  }

  const initial = (user.name || user.email).trim().charAt(0).toUpperCase();

  return (
    <Link
      href={localizedPath("/workspace", locale)}
      title={`${t.workspace.title} — ${user.email}`}
      className="ml-1 flex items-center gap-2 rounded-lg py-1.5 pr-2 pl-1.5 text-[13.5px] text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
    >
      {user.picture ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           next/image needs an optimiser and this is a static export with
           `images.unoptimized`, so <Image> would render the same <img> after
           shipping the component. One 24px avatar from Google's CDN. */
        <img
          src={user.picture}
          alt=""
          width={24}
          height={24}
          className="size-6 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
          {initial}
        </span>
      )}
      <span className="hidden sm:inline">{t.workspace.nav}</span>
      <IconFolder className="size-4 sm:hidden" />
    </Link>
  );
}
