"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconClose } from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n";
import { localizedPath, type Locale } from "@/lib/site";

/**
 * Shown once, after a brand-new account comes back from Google (`?welcome=1`,
 * set in server/auth.ts). Every outside sign-up so far signed in and left,
 * probably believing an account was needed to open a file. This says it is not.
 */
export function WelcomeNotice({ locale }: { locale: Locale }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("welcome") !== "1") return;
    // The URL is the only trigger, so it must not survive a reload or a share.
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    // Reading the URL needs the browser, so this runs after mount by design.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
  }, []);

  if (!show) return null;
  const t = getDictionary(locale).workspace;

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-card border border-accent/30 bg-accent-soft px-4 py-3.5 text-[14px] text-ink"
    >
      <div className="flex-1">
        <p className="font-semibold">{t.welcomeTitle}</p>
        <p className="mt-1 leading-relaxed text-ink-muted">{t.welcomeBody}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-medium">
          <Link href={localizedPath("/", locale)} className="text-accent hover:underline">
            {t.welcomeOpenFile}
          </Link>
          <Link href={localizedPath("/workspace", locale)} className="text-accent hover:underline">
            {t.welcomeWorkspace}
          </Link>
        </p>
      </div>
      <button
        onClick={() => setShow(false)}
        aria-label={t.welcomeDismiss}
        className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <IconClose className="size-4" />
      </button>
    </div>
  );
}
