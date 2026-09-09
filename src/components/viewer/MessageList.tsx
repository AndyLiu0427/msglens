"use client";

import { useMemo, useState } from "react";
import { IconPaperclip, IconSearch, IconTrash } from "@/components/ui/icons";
import { shortAddress } from "@/lib/email/headers";
import type { ParsedEmail } from "@/lib/email/types";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/cn";

interface MessageListProps {
  messages: ParsedEmail[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  t: Dictionary;
  locale: string;
}

/** The most useful thing to put where mail shows its sender. */
function primaryLabel(m: ParsedEmail, t: Dictionary): string {
  switch (m.itemKind) {
    case "contact":
      return m.contact?.displayName || m.subject || t.item.kindContact;
    case "meeting":
    case "appointment":
      return m.from ? shortAddress(m.from) : t.item.kindAppointment;
    case "task":
      return t.item.kindTask;
    default:
      return m.from ? shortAddress(m.from) : t.viewer.unknownSender;
  }
}

function formatListDate(date: Date | null, locale: string): string {
  if (!date) return "";
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  const sameDay = sameYear && date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function MessageList({
  messages,
  selectedId,
  onSelect,
  onRemove,
  t,
  locale,
}: MessageListProps) {
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) =>
      [m.subject, m.from ? shortAddress(m.from) : "", m.sourceFileName, m.bodyText]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [messages, filter]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-2.5">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t.viewer.filterPlaceholder}
            className={cn(
              "h-9 w-full rounded-[10px] border border-line bg-surface-sunken pr-3 pl-8.5",
              "text-[13.5px] text-ink placeholder:text-ink-subtle",
              "transition-colors outline-none focus:border-accent focus:bg-surface",
            )}
          />
        </div>
      </div>

      <ul className="scrollbar-slim flex-1 overflow-y-auto overscroll-contain p-1.5">
        {visible.length === 0 && (
          <li className="px-3 py-8 text-center text-[13px] text-ink-subtle">
            {t.viewer.noResults}
          </li>
        )}

        {visible.map((m) => {
          const active = m.id === selectedId;
          const attachmentCount = m.attachments.filter((a) => !a.inline).length;
          return (
            <li key={m.id}>
              <div
                className={cn(
                  "group relative rounded-[10px] transition-colors duration-100",
                  active ? "bg-accent-soft" : "hover:bg-surface-sunken",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(m.id)}
                  aria-current={active ? "true" : undefined}
                  className="w-full px-3 py-2.5 pr-9 text-left"
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "truncate text-[13.5px] font-medium",
                        active ? "text-accent-ink" : "text-ink",
                      )}
                    >
                      {/* A contact or appointment has no sender; "Unknown
                          sender" there is noise, so the item kind takes the
                          slot instead. */}
                      {primaryLabel(m, t)}
                    </span>
                    <span className="tabular ml-auto shrink-0 text-[11.5px] text-ink-subtle">
                      {formatListDate(m.date, locale)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "mt-0.5 truncate text-[13px]",
                      active ? "text-accent-ink" : "text-ink-muted",
                    )}
                  >
                    {m.subject || t.viewer.noSubject}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11.5px] text-ink-subtle">
                    <span className="truncate">{m.sourceFileName}</span>
                    {attachmentCount > 0 && (
                      <span className="ml-auto inline-flex shrink-0 items-center gap-0.5">
                        <IconPaperclip className="size-3" />
                        {attachmentCount}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onRemove(m.id)}
                  title={t.viewer.remove}
                  aria-label={`${t.viewer.remove}: ${m.subject || m.sourceFileName}`}
                  className={cn(
                    "absolute top-2 right-1.5 grid size-7 place-items-center rounded-lg",
                    "text-ink-subtle opacity-0 transition-all duration-150",
                    "group-hover:opacity-100 hover:bg-danger-soft hover:text-danger",
                    "focus-visible:opacity-100",
                  )}
                >
                  <IconTrash className="size-3.5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
