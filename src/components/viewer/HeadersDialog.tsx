"use client";

import { useEffect, useRef } from "react";
import { IconButton } from "@/components/ui/Button";
import { IconClose } from "@/components/ui/icons";
import type { ParsedEmail } from "@/lib/email/types";
import type { Dictionary } from "@/lib/i18n";

/**
 * Raw internet headers. Useful for the audience that actually needs a .msg
 * viewer at work — IT, legal discovery, deliverability debugging — and absent
 * from every free alternative.
 */
export function HeadersDialog({
  email,
  t,
  onClose,
}: {
  email: ParsedEmail;
  t: Dictionary;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Move focus into the dialog so Escape and tabbing behave as expected.
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasHeaders = email.headerPairs.length > 0;

  return (
    <div
      className="no-print fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t.viewer.headers}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-rise flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop outline-none"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <h2 className="text-[14px] font-semibold text-ink">{t.viewer.headers}</h2>
          <IconButton title={t.viewer.shortcuts.close} className="ml-auto" onClick={onClose}>
            <IconClose className="size-4.5" />
          </IconButton>
        </div>

        <div className="scrollbar-slim flex-1 overflow-y-auto p-5">
          {hasHeaders ? (
            <dl className="grid gap-x-5 gap-y-2 font-mono text-[12px] sm:grid-cols-[minmax(8rem,auto)_1fr]">
              {email.headerPairs.map((pair, i) => (
                <div key={i} className="contents">
                  <dt className="font-medium break-words text-accent-ink">{pair.name}</dt>
                  <dd className="mb-2 break-all whitespace-pre-wrap text-ink-muted sm:mb-0">
                    {pair.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="py-8 text-center text-[13px] text-ink-subtle">
              This message does not carry internet headers. Outlook omits them for items
              that never travelled over SMTP, such as drafts and internal Exchange mail.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
