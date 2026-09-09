"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageView } from "@/components/viewer/MessageView";
import { Dropzone } from "@/components/viewer/Dropzone";
import { IconAlert, IconLock } from "@/components/ui/icons";
import type { ParsedEmail } from "@/lib/email/types";
import type { Dictionary } from "@/lib/i18n";

/**
 * Receive a message file from the page that opened this tab.
 *
 * Another application — one that already holds a `.msg` its user cannot read —
 * opens this route in a new tab and posts the bytes across. A new tab is the
 * only supported shape: the site refuses to be framed, so an embedded panel
 * cannot reach this page. Nothing is uploaded: the file
 * travels from one browser tab to another through `postMessage` and is parsed
 * here by the same code a dropped file goes through. msglens.app never
 * receives it, and there is no endpoint that could.
 *
 * That property is why the handoff works this way rather than by passing a URL
 * for us to fetch. A link to someone's document would end up in this site's
 * request logs and in browser history, and it would need the file host to
 * allow cross-origin reads. Bytes over postMessage need neither and leak
 * neither.
 *
 * The protocol is two messages:
 *
 *   1. This page posts `{ type: "msglens:ready" }` to `window.opener`.
 *   2. The opener replies `{ type: "msglens:file", name, bytes }`, where
 *      `bytes` is an ArrayBuffer.
 *
 * Nothing in the payload is ever executed or trusted as markup; it is bytes,
 * parsed by a binary reader. The originating origin is shown on screen so a
 * reader can see where the message came from rather than having to assume.
 */
export function OpenHandoff({ t, locale }: { t: Dictionary; locale: string }) {
  const [stack, setStack] = useState<ParsedEmail[]>([]);
  const [origin, setOrigin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);
  // Guards against a second sender overwriting what is already on screen.
  const claimed = useRef(false);
  // React re-runs effects in development, which would announce readiness twice
  // and make an integrator handle a duplicate they did not cause. One announce.
  const announced = useRef(false);

  useEffect(() => {
    // The opener, and only the opener. An earlier version also accepted
    // `window.parent` so an integrator could embed this in a panel, which was
    // never possible in production: the site is served with
    // `frame-ancestors 'none'` and `X-Frame-Options: DENY`, so no external
    // page can frame it at all. The fallback did nothing except make the
    // comment above it untrue.
    const host = window.opener as Window | null;
    if (!host) {
      // Opened directly rather than handed to. Known only on the client — this
      // page is statically exported, so first render cannot know it and has to
      // hydrate to the same markup before correcting itself.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWaiting(false);
      return;
    }

    let cancelled = false;

    const onMessage = async (event: MessageEvent) => {
      // Only the window that put this page on screen may hand a file over.
      // Anything else is a page trying to place a message in front of someone.
      if (event.source !== host) return;
      const data = event.data as { type?: string; name?: string; bytes?: ArrayBuffer };
      if (data?.type !== "msglens:file" || !(data.bytes instanceof ArrayBuffer)) return;
      if (claimed.current) return;
      claimed.current = true;

      try {
        const name = typeof data.name === "string" ? data.name.slice(0, 300) : "message.msg";
        const { parseEmailFile } = await import("@/lib/email/parse");
        const email = await parseEmailFile(new File([data.bytes], name));
        if (cancelled) return;
        setOrigin(event.origin);
        setStack([email]);
      } catch {
        if (!cancelled) setError(t.errors.parseFailed.replace("{name}", data.name ?? ""));
      } finally {
        if (!cancelled) setWaiting(false);
      }
    };

    window.addEventListener("message", onMessage);
    if (!announced.current) {
      announced.current = true;
      host.postMessage({ type: "msglens:ready" }, "*");
    }

    // If nothing arrives, fall back to the ordinary dropzone rather than
    // leaving a spinner up forever.
    const timeout = window.setTimeout(() => {
      if (!cancelled && !claimed.current) setWaiting(false);
    }, 8000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    };
  }, [t]);

  const openEmbedded = useCallback((email: ParsedEmail) => {
    setStack((s) => [...s, email]);
  }, []);

  const current = stack[stack.length - 1];

  if (waiting) {
    return (
      <div className="mx-auto flex h-64 max-w-3xl items-center justify-center rounded-card border border-line bg-surface">
        <p className="animate-pulse text-[14px] text-ink-muted">{t.handoff.waiting}</p>
      </div>
    );
  }

  if (!current) {
    // No handoff arrived — or this page was opened directly. Behave like the
    // viewer, so the tab is still useful rather than an error.
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger"
          >
            {error}
          </p>
        )}
        <HandoffNotice t={t} origin={null} />
        <Dropzone onFiles={() => {}} onLoadSample={() => {}} t={t} busy={false} progress={null} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <HandoffNotice t={t} origin={origin} />
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <MessageView
          email={current}
          t={t}
          locale={locale}
          stored
          onOpenEmbedded={openEmbedded}
          onError={setError}
        />
      </div>
    </div>
  );
}

/** Says where the message came from, and that it did not travel via a server. */
function HandoffNotice({ t, origin }: { t: Dictionary; origin: string | null }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-line bg-surface-sunken px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-muted">
      {origin ? (
        <IconLock className="mt-px size-4 shrink-0 text-success" />
      ) : (
        <IconAlert className="mt-px size-4 shrink-0 text-ink-subtle" />
      )}
      <span>
        {origin ? (
          <>
            {t.handoff.from} <strong className="text-ink">{origin}</strong>. {t.handoff.local}
          </>
        ) : (
          t.handoff.noFile
        )}
      </span>
    </p>
  );
}
