"use client";

import { useState } from "react";
import {
  IconArchive,
  IconDownload,
  IconFile,
  IconImage,
  IconMail,
  IconPaperclip,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { attachmentKind, formatBytes, type AttachmentKind } from "@/lib/email/mime";
import { downloadAllAttachments, downloadAttachment } from "@/lib/email/export";
import { parseEmbedded } from "@/lib/email/parse";
import type { Attachment, ParsedEmail } from "@/lib/email/types";
import { format, type Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const KIND_STYLES: Record<AttachmentKind, string> = {
  image: "bg-[oklch(0.95_0.05_155)] text-[oklch(0.45_0.13_155)]",
  pdf: "bg-[oklch(0.95_0.05_25)] text-[oklch(0.5_0.16_25)]",
  document: "bg-[oklch(0.95_0.05_255)] text-[oklch(0.48_0.15_255)]",
  spreadsheet: "bg-[oklch(0.95_0.05_150)] text-[oklch(0.45_0.13_150)]",
  presentation: "bg-[oklch(0.95_0.05_45)] text-[oklch(0.5_0.14_45)]",
  archive: "bg-[oklch(0.95_0.04_85)] text-[oklch(0.48_0.12_85)]",
  audio: "bg-[oklch(0.95_0.05_320)] text-[oklch(0.5_0.15_320)]",
  video: "bg-[oklch(0.95_0.05_300)] text-[oklch(0.5_0.15_300)]",
  email: "bg-accent-soft text-accent-ink",
  text: "bg-surface-sunken text-ink-muted",
  other: "bg-surface-sunken text-ink-muted",
};

function KindIcon({ kind }: { kind: AttachmentKind }) {
  if (kind === "image") return <IconImage className="size-4.5" />;
  if (kind === "archive") return <IconArchive className="size-4.5" />;
  if (kind === "email") return <IconMail className="size-4.5" />;
  return <IconFile className="size-4.5" />;
}

interface AttachmentListProps {
  email: ParsedEmail;
  t: Dictionary;
  /** Opens an embedded .msg/.eml as a new message in the list. */
  onOpenEmbedded: (email: ParsedEmail, afterId: string) => void;
  onError: (message: string) => void;
}

export function AttachmentList({
  email,
  t,
  onOpenEmbedded,
  onError,
}: AttachmentListProps) {
  const [zipping, setZipping] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Attachment | null>(null);

  // Inline images are part of the body, not something the reader chose to
  // attach — listing them alongside real attachments is noise.
  const visible = email.attachments.filter((a) => !a.inline);
  if (visible.length === 0) return null;

  const openEmbedded = async (att: Attachment) => {
    setOpening(att.id);
    try {
      const parsed = await parseEmbedded(att.content, att.fileName);
      onOpenEmbedded(parsed, email.id);
    } catch {
      onError(format(t.errors.parseFailed, { name: att.fileName }));
    } finally {
      setOpening(null);
    }
  };

  return (
    <section className="border-t border-line px-5 py-4 sm:px-7">
      <div className="mb-3 flex items-center gap-2">
        <IconPaperclip className="size-4 text-ink-subtle" />
        <h3 className="text-[13px] font-semibold text-ink">
          {t.viewer.attachments}
          <span className="ml-1.5 font-normal text-ink-subtle">({visible.length})</span>
        </h3>
        {visible.length > 1 && (
          <Button
            size="sm"
            variant="ghost"
            className="no-print ml-auto"
            disabled={zipping}
            onClick={async () => {
              setZipping(true);
              try {
                await downloadAllAttachments({ ...email, attachments: visible });
              } finally {
                setZipping(false);
              }
            }}
          >
            <IconDownload className="size-3.5" />
            {t.viewer.downloadAll}
          </Button>
        )}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {visible.map((att) => {
          const kind = attachmentKind(att.fileName, att.mimeType);
          return (
            <li
              key={att.id}
              className={cn(
                "group flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5",
                "transition-colors duration-150 hover:border-line-strong",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg",
                  KIND_STYLES[kind],
                )}
              >
                <KindIcon kind={kind} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">
                  {att.fileName}
                </span>
                <span className="tabular block text-[11.5px] text-ink-subtle">
                  {formatBytes(att.size)}
                </span>
              </span>

              <span className="no-print flex shrink-0 items-center gap-0.5">
                {att.isEmbeddedMessage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={opening === att.id}
                    onClick={() => openEmbedded(att)}
                  >
                    {t.viewer.open}
                  </Button>
                )}
                {kind === "image" && (
                  <Button size="sm" variant="ghost" onClick={() => setPreviewing(att)}>
                    {t.viewer.preview}
                  </Button>
                )}
                <button
                  type="button"
                  title={`${t.viewer.download}: ${att.fileName}`}
                  aria-label={`${t.viewer.download}: ${att.fileName}`}
                  onClick={() => downloadAttachment(att)}
                  className="grid size-8 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
                >
                  <IconDownload className="size-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      {previewing && (
        <ImagePreview
          attachment={previewing}
          onClose={() => setPreviewing(null)}
          downloadLabel={t.viewer.download}
        />
      )}
    </section>
  );
}

function ImagePreview({
  attachment,
  onClose,
  downloadLabel,
}: {
  attachment: Attachment;
  onClose: () => void;
  downloadLabel: string;
}) {
  const [url] = useState(() =>
    URL.createObjectURL(
      new Blob([attachment.content.slice() as unknown as BlobPart], {
        type: attachment.mimeType,
      }),
    ),
  );

  return (
    <div
      className="no-print fixed inset-0 z-50 grid place-items-center bg-black/70 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={attachment.fileName}
      onClick={() => {
        URL.revokeObjectURL(url);
        onClose();
      }}
    >
      <div
        className="animate-fade-rise flex max-h-full max-w-3xl flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={attachment.fileName}
          className="max-h-[75vh] rounded-xl bg-white object-contain shadow-pop"
        />
        <div className="flex items-center gap-3 text-white">
          <span className="truncate text-[13px]">{attachment.fileName}</span>
          <span className="tabular ml-auto shrink-0 text-[12px] opacity-70">
            {formatBytes(attachment.size)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadAttachment(attachment)}
          >
            <IconDownload className="size-3.5" />
            {downloadLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
