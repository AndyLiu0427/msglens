"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "./Dropzone";
import { MessageList } from "./MessageList";
import { MessageView } from "./MessageView";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { Button, IconButton } from "@/components/ui/Button";
import { AdSlot } from "@/components/ads/AdSlot";
import { IconAlert, IconClose, IconKeyboard, IconPlus, IconPrinter, IconTrash, IconUpload } from "@/components/ui/icons";
import { useMessages } from "@/lib/email/useMessages";
import { printMessages } from "@/lib/email/print";
import { ReportFailure } from "./ReportFailure";
import type { Dictionary } from "@/lib/i18n";
import { SITE, type Locale } from "@/lib/site";
import { cn } from "@/lib/cn";

interface ViewerProps {
  t: Dictionary;
  locale: Locale;
  /** Rendered above the drop zone before any file is opened. */
  intro?: React.ReactNode;
  /** Rendered below the drop zone before any file is opened. */
  children?: React.ReactNode;
}

const INTL_LOCALE: Record<Locale, string> = { en: "en-US", zh: "zh-TW" };

export function Viewer({ t, locale, intro, children }: ViewerProps) {
  const {
    messages,
    selected,
    selectedId,
    setSelectedId,
    addFiles,
    loadSample,
    addParsed,
    remove,
    clear,
    errors,
    pushError,
    dismissError,
    progress,
  } = useMessages(t);

  const [dragging, setDragging] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasMessages = messages.length > 0;

  // Window-level drag handling so a file can be dropped anywhere once the app
  // view has replaced the hero drop zone.
  useEffect(() => {
    if (!hasMessages) return;

    const onEnter = (e: globalThis.DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      dragDepth.current++;
      setDragging(true);
    };
    const onLeave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    };
    const onOver = (e: globalThis.DragEvent) => e.preventDefault();
    const onDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (e.dataTransfer?.files?.length) void addFiles(e.dataTransfer.files);
    };

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [hasMessages, addFiles]);

  // Keyboard navigation. Skipped whenever focus is in a text field so typing a
  // filter query does not jump between messages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "?" && !typing) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }
      if (!hasMessages || typing) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const at = messages.findIndex((m) => m.id === selectedId);
        setSelectedId(messages[Math.min(at + 1, messages.length - 1)].id);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const at = messages.findIndex((m) => m.id === selectedId);
        setSelectedId(messages[Math.max(at - 1, 0)].id);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hasMessages, messages, selectedId, setSelectedId]);

  const onPickFiles = useCallback(() => fileInputRef.current?.click(), []);

  const errorBanner = errors.length > 0 && (
    <div className="no-print space-y-2">
      {errors.map((error) => (
        <div
          key={error.id}
          role="alert"
          className="animate-fade-rise flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger"
        >
          <IconAlert className="mt-px size-4 shrink-0" />
          <span className="flex-1">{error.message}</span>
          {error.detail && <ReportFailure detail={error.detail} t={t} />}
          {error.action === "reload" && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="shrink-0 rounded-lg border border-danger/30 px-2.5 py-1 text-[12.5px] font-medium transition-colors hover:bg-danger/10"
            >
              {t.errors.reload}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismissError(error.id)}
            aria-label={t.errors.dismiss}
            className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          >
            <IconClose className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );

  if (!hasMessages) {
    return (
      <>
        {intro}
        <div className="space-y-4">
          <Dropzone
            onFiles={addFiles}
            onLoadSample={loadSample}
            t={t}
            busy={Boolean(progress)}
            progress={progress}
          />
          {errorBanner}
        </div>
        {children}
      </>
    );
  }

  return (
    <>
      <div className="no-print mb-3 flex items-center gap-2">
        <h2 className="text-[13px] font-semibold tracking-wider text-ink-subtle uppercase">
          {t.viewer.messages}
          <span className="ml-1.5 font-normal">({messages.length})</span>
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <IconButton title={t.viewer.keyboard} onClick={() => setShowShortcuts(true)}>
            <IconKeyboard className="size-4.5" />
          </IconButton>
          {messages.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              title={t.viewer.printAllTitle}
              onClick={() => printMessages(messages, t, INTL_LOCALE[locale])}
            >
              <IconPrinter className="size-4" />
              <span className="hidden sm:inline">{t.viewer.printAll}</span>
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={onPickFiles}>
            <IconPlus className="size-4" />
            {t.viewer.addMore}
          </Button>
          <Button size="sm" variant="ghost" onClick={clear}>
            <IconTrash className="size-4" />
            <span className="hidden sm:inline">{t.viewer.removeAll}</span>
          </Button>
        </div>
      </div>

      {errorBanner && <div className="mb-3">{errorBanner}</div>}

      <div
        className={cn(
          "grid gap-4 lg:grid-cols-[19rem_1fr]",
          // A tall, app-like frame on desktop; natural document flow on mobile.
          "lg:h-[calc(100dvh-11rem)] lg:min-h-[34rem]",
        )}
      >
        <aside className="no-print hidden overflow-hidden rounded-card border border-line bg-surface lg:flex lg:flex-col">
          <MessageList
            messages={messages}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRemove={remove}
            t={t}
            locale={INTL_LOCALE[locale]}
          />
        </aside>

        {/* Mobile: a compact select instead of the sidebar. */}
        <div className="no-print lg:hidden">
          <label className="sr-only" htmlFor="msg-picker">
            {t.viewer.messages}
          </label>
          <select
            id="msg-picker"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[13.5px] text-ink"
          >
            {messages.map((m) => (
              <option key={m.id} value={m.id}>
                {m.subject || t.viewer.noSubject} — {m.sourceFileName}
              </option>
            ))}
          </select>
        </div>

        <main className="print-full overflow-hidden rounded-card border border-line bg-surface">
          {selected ? (
            <MessageView
              key={selected.id}
              email={selected}
              t={t}
              locale={INTL_LOCALE[locale]}
              onOpenEmbedded={addParsed}
              onError={pushError}
            />
          ) : (
            <div className="grid h-full place-items-center p-10 text-center">
              <div>
                <p className="text-[15px] font-medium text-ink">{t.viewer.noSelection}</p>
                <p className="mt-1 text-[13px] text-ink-muted">{t.viewer.noSelectionHint}</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <AdSlot
        slot={SITE.adSlots.viewerFooter}
        format="leaderboard"
        label={t.ads.label}
        className="mt-6"
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".msg,.eml,.dat,application/vnd.ms-outlook,message/rfc822,application/vnd.ms-tnef"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {dragging && (
        <div className="no-print pointer-events-none fixed inset-0 z-50 grid place-items-center bg-accent/10 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-accent bg-surface px-8 py-6 shadow-pop">
            <IconUpload className="size-5 text-accent" />
            <span className="text-[15px] font-medium text-ink">{t.viewer.dropMore}</span>
          </div>
        </div>
      )}

      {showShortcuts && <ShortcutsDialog t={t} onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
