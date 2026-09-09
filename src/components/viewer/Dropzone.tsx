"use client";

import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { IconLock, IconUpload } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";

interface DropzoneProps {
  onFiles: (files: FileList | File[]) => void;
  onLoadSample: () => void;
  t: Dictionary;
  busy?: boolean;
  progress?: { done: number; total: number } | null;
}

/**
 * The hero drop target. Deliberately the largest element on the page — the
 * whole product is "put a file in", so the primary action should not be a
 * button hiding under three paragraphs of marketing copy.
 */
export function Dropzone({ onFiles, onLoadSample, t, busy, progress }: DropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  // Drag events fire for every child element; a counter is the reliable way to
  // know when the pointer has genuinely left the zone.
  const depth = useRef(0);

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    depth.current++;
    setOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setOver(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setOver(false);
      if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
    },
    [onFiles],
  );

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-dashed",
        "transition-[border-color,background-color,transform] duration-200 ease-out-quart",
        over
          ? "scale-[1.01] border-accent bg-accent-soft"
          : "border-line-strong bg-surface hover:border-accent/60 hover:bg-surface-sunken",
      )}
    >
      <label
        htmlFor={inputId}
        className="group flex cursor-pointer flex-col items-center gap-4 px-6 py-14 text-center sm:py-20"
      >
        <span
          className={cn(
            "grid size-14 place-items-center rounded-2xl transition-all duration-200",
            over ? "scale-110 bg-accent text-accent-on" : "bg-accent-soft text-accent",
          )}
        >
          <IconUpload className="size-6" />
        </span>

        <span className="space-y-1.5">
          <span className="block text-lg font-semibold tracking-tight text-ink sm:text-xl">
            {over ? t.hero.dropActive : t.hero.dropTitle}
          </span>
          <span className="block text-sm text-ink-muted">{t.hero.dropSubtitle}</span>
        </span>

        {/* Visual affordance only — the whole label is the click target, so a
            real <button> here would just be a second focus stop for one action. */}
        <span
          aria-hidden="true"
          className="inline-flex h-12 items-center rounded-xl bg-accent px-6 text-[15px] font-medium text-accent-on shadow-sm transition-colors duration-150 group-hover:bg-accent-hover"
        >
          {t.hero.browse}
        </span>

        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-subtle">
          <IconLock className="size-3.5" />
          {t.hero.privacyNote}
        </span>
      </label>

      {/* Outside the <label>: this must not open the file picker. Sits low in
          the zone so it reads as the fallback for visitors with no .msg to hand
          rather than competing with the primary action. */}
      <div className="-mt-6 pb-8 text-center">
        <button
          type="button"
          onClick={onLoadSample}
          disabled={busy}
          className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-hover disabled:opacity-50"
        >
          {busy ? t.hero.sampleLoading : t.hero.sample}
        </button>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple
        accept=".msg,.eml,.dat,application/vnd.ms-outlook,message/rfc822,application/vnd.ms-tnef"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          // Reset so re-selecting the same file fires change again.
          e.target.value = "";
        }}
      />

      {busy && progress && (
        <div
          className="absolute inset-x-0 bottom-0 h-1 bg-accent-soft"
          role="progressbar"
          aria-valuenow={progress.done}
          aria-valuemin={0}
          aria-valuemax={progress.total}
        >
          <div
            className="h-full bg-accent transition-[width] duration-200"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
