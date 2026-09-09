"use client";

import { useEffect } from "react";
import { IconButton } from "@/components/ui/Button";
import { IconClose } from "@/components/ui/icons";
import type { Dictionary } from "@/lib/i18n";

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-line-strong bg-surface-sunken px-1.5 font-sans text-[11.5px] font-medium text-ink-muted">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog({ t, onClose }: { t: Dictionary; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows: Array<{ keys: string[]; label: string }> = [
    { keys: ["J", "↓"], label: t.viewer.shortcuts.nextMessage },
    { keys: ["K", "↑"], label: t.viewer.shortcuts.prevMessage },
    { keys: ["Esc"], label: t.viewer.shortcuts.close },
    { keys: ["?"], label: t.viewer.shortcuts.title },
  ];

  return (
    <div
      className="no-print fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.viewer.shortcuts.title}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-rise w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <h2 className="text-[14px] font-semibold text-ink">{t.viewer.shortcuts.title}</h2>
          <IconButton title={t.viewer.shortcuts.close} className="ml-auto" onClick={onClose}>
            <IconClose className="size-4.5" />
          </IconButton>
        </div>
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center gap-4 px-5 py-2.5">
              <span className="flex gap-1">
                {row.keys.map((k) => (
                  <Key key={k}>{k}</Key>
                ))}
              </span>
              <span className="ml-auto text-[13px] text-ink-muted">{row.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
