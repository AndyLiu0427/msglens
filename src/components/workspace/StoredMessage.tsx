"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageView } from "@/components/viewer/MessageView";
import { IconClose } from "@/components/ui/icons";
import { api, type StoredFile } from "@/lib/workspace/api";
import type { ParsedEmail } from "@/lib/email/types";
import type { Dictionary } from "@/lib/i18n";

/**
 * Open a stored message in the viewer.
 *
 * The file comes back from R2 as bytes and is parsed by the same
 * `parseEmailFile` a dropped file goes through — the server never renders a
 * message, it only hands back what was stored. So the fidelity is identical to
 * the anonymous viewer, and the parsing libraries stay dynamically imported.
 *
 * Before this, a saved message could only be downloaded, which is a strange
 * hole in a product whose entire purpose is reading these files.
 */
export function StoredMessage({
  file,
  t,
  locale,
  onClose,
}: {
  file: StoredFile;
  t: Dictionary;
  locale: string;
  onClose: () => void;
}) {
  // A stack, so opening an embedded .msg can be backed out of.
  const [stack, setStack] = useState<ParsedEmail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(api.downloadUrl(file.id), {
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        const { parseEmailFile } = await import("@/lib/email/parse");
        const email = await parseEmailFile(new File([blob], file.file_name));
        if (!cancelled) setStack([email]);
      } catch {
        if (!cancelled) setError(t.errors.parseFailed.replace("{name}", file.file_name));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file.id, file.file_name, t]);

  // Escape closes, which is what a full-screen overlay has to honour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (stack.length > 1) setStack((s) => s.slice(0, -1));
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [stack.length, onClose]);

  const openEmbedded = useCallback((email: ParsedEmail) => {
    setStack((s) => [...s, email]);
  }, []);

  const current = stack[stack.length - 1];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={file.subject || file.file_name}
      className="fixed inset-0 z-50 flex flex-col bg-canvas/95 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        {stack.length > 1 && (
          <button
            onClick={() => setStack((s) => s.slice(0, -1))}
            className="rounded-lg px-2 py-1 text-[13px] text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            ← {t.workspace.back}
          </button>
        )}
        <p className="min-w-0 flex-1 truncate text-[13.5px] text-ink-muted">
          {file.file_name}
        </p>
        <button
          onClick={onClose}
          aria-label={t.workspace.close}
          className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          <IconClose className="size-4.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        {loading && (
          <div className="h-full animate-pulse rounded-card border border-line bg-surface" />
        )}
        {error && (
          <p role="alert" className="p-6 text-center text-[14px] text-danger">
            {error}
          </p>
        )}
        {current && (
          <div className="mx-auto h-full max-w-4xl overflow-hidden rounded-card border border-line bg-surface">
            <MessageView
              email={current}
              t={t}
              locale={locale}
              stored
              onOpenEmbedded={openEmbedded}
              onError={setError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
