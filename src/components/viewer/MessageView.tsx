"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BodyFrame } from "./BodyFrame";
import { AttachmentList } from "./AttachmentList";
import { HeadersDialog } from "./HeadersDialog";
import { AppointmentHeader, ContactCard } from "./ItemDetails";
import { Button, IconButton } from "@/components/ui/Button";
import {
  IconAlert,
  IconChevronDown,
  IconClose,
  IconCode,
  IconDownload,
  IconEye,
  IconPrinter,
  IconSearch,
} from "@/components/ui/icons";
import { createCidUrls, releaseCidUrls, sanitizeBody, textToHtml } from "@/lib/email/sanitize";
import { highlightHtml } from "@/lib/email/highlight";
import { buildEml, buildPlainText, downloadBlob, safeFileName } from "@/lib/email/export";
import { SaveToWorkspace } from "@/components/workspace/SaveToWorkspace";
import { printMessage } from "@/lib/email/print";
import { displayAddress, shortAddress } from "@/lib/email/headers";
import { formatBytes } from "@/lib/email/mime";
import type { EmailAddress, ParsedEmail } from "@/lib/email/types";
import { format, type Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/cn";

interface MessageViewProps {
  email: ParsedEmail;
  t: Dictionary;
  locale: string;
  onOpenEmbedded: (email: ParsedEmail, afterId: string) => void;
  onError: (message: string) => void;
  /**
   * True when this message is already in the workspace, which hides the save
   * action — offering to save something you are reading *from* storage is
   * confusing, and the deduplication would make it a no-op anyway.
   */
  stored?: boolean;
}

export function MessageView({
  email,
  t,
  locale,
  onOpenEmbedded,
  onError,
  stored = false,
}: MessageViewProps) {
  const [allowRemote, setAllowRemote] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [hit, setHit] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const frameWrapRef = useRef<HTMLDivElement>(null);

  // No per-message reset effect is needed: Viewer renders this component with
  // key={message.id}, so each message gets a fresh instance. That is what keeps
  // one message's "load remote images" decision from leaking into the next.

  // Object URLs for inline images live as long as this message is displayed.
  //
  // Created in an effect, not a memo: the URLs are a resource that must be
  // revoked, and React may discard or re-run a memo independently of the
  // cleanup that revokes them. Pairing creation and revocation inside one
  // effect keeps them in lockstep — including under StrictMode's deliberate
  // mount/unmount/remount, which otherwise leaves every inline image pointing
  // at an already-revoked blob.
  const [cidUrls, setCidUrls] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    const map = createCidUrls(email.attachments);
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- Object URLs are an external resource whose creation must be paired with revocation in the same effect. Creating them during render instead (useMemo, or a useState initialiser) leaves them revoked-but-not-recreated after StrictMode's mount/unmount/remount, silently breaking every inline image. */
    setCidUrls(map);
    return () => releaseCidUrls(map);
  }, [email.attachments]);

  const sanitized = useMemo(() => {
    const raw = email.bodyKind === "html" ? email.body : textToHtml(email.body);
    return sanitizeBody(raw, cidUrls, allowRemote);
  }, [email.body, email.bodyKind, cidUrls, allowRemote]);

  const { html: bodyHtml, count: hitCount } = useMemo(() => {
    if (!query.trim()) return { html: sanitized.html, count: 0 };
    const result = highlightHtml(sanitized.html, query);
    return { html: result.html, count: result.count };
  }, [sanitized.html, query]);

  // Move the active highlight inside the frame. Reaching into contentDocument
  // is safe here: the frame runs without `allow-scripts`, so it is inert.
  useEffect(() => {
    if (hitCount === 0) return;
    const frame = frameWrapRef.current?.querySelector("iframe");
    const doc = frame?.contentDocument;
    if (!doc) return;
    doc.querySelectorAll("mark.msg-hit-active").forEach((el) => {
      el.classList.remove("msg-hit-active");
    });
    const target = doc.querySelector<HTMLElement>(`mark[data-hit="${hit}"]`);
    if (!target) return;
    target.classList.add("msg-hit-active");
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [hit, hitCount, bodyHtml]);

  const isAppointment = email.itemKind === "meeting" || email.itemKind === "appointment";
  const isContact = email.itemKind === "contact";
  // Only true mail gets the From/To block; everything else has its own header.
  const isMail = !isAppointment && !isContact;
  const kindLabel =
    email.itemKind === "meeting"
      ? t.item.kindMeeting
      : email.itemKind === "appointment"
        ? t.item.kindAppointment
        : email.itemKind === "contact"
          ? t.item.kindContact
          : email.itemKind === "task"
            ? t.item.kindTask
            : email.itemKind === "other"
              ? t.item.kindOther
              : "";

  const hasBody = email.body.trim().length > 0;
  const dateLabel = email.dateLabel ? t.viewer[email.dateLabel] : t.viewer.date;

  return (
    <article className="flex h-full flex-col overflow-hidden">
      <Toolbar
        email={email}
        t={t}
        locale={locale}
        stored={stored}
        onPrint={() => printMessage(email, sanitized.html, sanitized.styles, t, locale)}
        showSearch={showSearch}
        onToggleSearch={() => {
          setShowSearch((s) => !s);
          if (!showSearch) setTimeout(() => searchRef.current?.focus(), 30);
          else setQuery("");
        }}
        onShowHeaders={() => setShowHeaders(true)}
      />

      {showSearch && (
        <div className="no-print flex items-center gap-2 border-b border-line bg-surface-sunken px-4 py-2">
          <IconSearch className="size-4 shrink-0 text-ink-subtle" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHit(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (hitCount > 0) setHit((h) => (h + (e.shiftKey ? -1 : 1) + hitCount) % hitCount);
              }
              if (e.key === "Escape") {
                setShowSearch(false);
                setQuery("");
              }
            }}
            placeholder={t.viewer.search}
            className="h-8 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-subtle"
          />
          {query.trim().length >= 2 && (
            <span className="tabular shrink-0 text-[12px] text-ink-subtle">
              {hitCount > 0
                ? format(t.viewer.searchResults, { index: hit + 1, total: hitCount })
                : t.viewer.noResults}
            </span>
          )}
          <IconButton
            title={t.viewer.shortcuts.close}
            className="size-7"
            onClick={() => {
              setShowSearch(false);
              setQuery("");
            }}
          >
            <IconClose className="size-4" />
          </IconButton>
        </div>
      )}

      <div className="scrollbar-slim print-full flex-1 overflow-y-auto overscroll-contain">
        <header className="border-b border-line px-5 pt-5 pb-4 sm:px-7">
          <div className="flex items-start gap-3">
            <h1 className="flex-1 text-[19px] leading-snug font-semibold tracking-tight text-ink sm:text-[21px]">
              {email.subject || t.viewer.noSubject}
            </h1>
            {kindLabel && (
              <span className="mt-1 shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-ink">
                {kindLabel}
              </span>
            )}
            {email.importance === "high" && (
              <span className="mt-1 shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">
                {t.viewer.importance.high}
              </span>
            )}
          </div>

          {isAppointment && <AppointmentHeader email={email} t={t} locale={locale} />}
          {isContact && <ContactCard email={email} t={t} />}

          {isMail && (
          <div className="mt-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-[13.5px]">
            <span className="font-medium text-ink">
              {email.from ? shortAddress(email.from) : t.viewer.unknownSender}
            </span>
            {email.from?.address && email.from.name && (
              <span className="text-ink-subtle">&lt;{email.from.address}&gt;</span>
            )}
            {email.date && (
              <time
                dateTime={email.date.toISOString()}
                className="tabular ml-auto shrink-0 text-ink-muted"
              >
                {email.date.toLocaleString(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            )}
          </div>
          )}

          {isMail && (
            <div className="mt-2 text-[13px] text-ink-muted">
              <AddressLine label={t.viewer.to} list={email.to} />
              <AddressLine label={t.viewer.cc} list={email.cc} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="no-print mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-subtle transition-colors hover:text-ink"
          >
            <IconChevronDown
              className={cn("size-3.5 transition-transform duration-200", showDetails && "rotate-180")}
            />
            {showDetails ? t.viewer.hideDetails : t.viewer.details}
          </button>

          {showDetails && (
            <dl className="animate-fade-rise mt-3 grid gap-x-4 gap-y-1.5 rounded-xl bg-surface-sunken p-3.5 text-[12.5px] sm:grid-cols-[auto_1fr]">
              <Detail label={t.viewer.from} value={email.from ? displayAddress(email.from) : "—"} />
              {email.replyTo.length > 0 && (
                <Detail
                  label={t.viewer.replyTo}
                  value={email.replyTo.map(displayAddress).join(", ")}
                />
              )}
              {email.bcc.length > 0 && (
                <Detail label={t.viewer.bcc} value={email.bcc.map(displayAddress).join(", ")} />
              )}
              <Detail
                label={dateLabel}
                value={email.date ? email.date.toString() : "—"}
              />
              <Detail
                label="File"
                value={`${email.sourceFileName} · ${formatBytes(email.sourceSize)} · ${email.sourceFormat.toUpperCase()}`}
              />
              <Detail label="Body" value={t.viewer.bodySource[email.bodySource]} />
              {email.messageClass && <Detail label="Class" value={email.messageClass} />}
            </dl>
          )}
        </header>

        {email.warnings.map((warning, i) => (
          <Notice key={i} tone="warning" icon={<IconAlert className="size-4" />}>
            {warning}
          </Notice>
        ))}

        {sanitized.blockedRemoteCount > 0 && !allowRemote && (
          <Notice tone="info" icon={<IconEye className="size-4" />}>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong className="font-semibold">{t.viewer.remoteBlocked.title}</strong>
              <span>
                {sanitized.blockedRemoteCount === 1
                  ? t.viewer.remoteBlocked.bodyOne
                  : format(t.viewer.remoteBlocked.bodyOther, {
                      count: sanitized.blockedRemoteCount,
                    })}
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="no-print ml-auto"
                onClick={() => setAllowRemote(true)}
              >
                {t.viewer.remoteBlocked.action}
              </Button>
            </span>
          </Notice>
        )}

        <div ref={frameWrapRef} className="px-5 py-5 sm:px-7">
          {hasBody ? (
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="p-5 sm:p-6">
                <BodyFrame html={bodyHtml} styles={sanitized.styles} allowRemote={allowRemote} />
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-[13.5px] text-ink-subtle">{t.viewer.empty}</p>
          )}
        </div>

        <AttachmentList
          email={email}
          t={t}
          onOpenEmbedded={onOpenEmbedded}
          onError={onError}
        />
      </div>

      {showHeaders && (
        <HeadersDialog email={email} t={t} onClose={() => setShowHeaders(false)} />
      )}
    </article>
  );
}

function Toolbar({
  email,
  t,
  showSearch,
  onToggleSearch,
  onShowHeaders,
  onPrint,
  locale,
  stored,
}: {
  email: ParsedEmail;
  t: Dictionary;
  showSearch: boolean;
  onToggleSearch: () => void;
  onShowHeaders: () => void;
  onPrint: () => void;
  locale: string;
  stored: boolean;
}) {
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (!exportOpen) return;
    const close = () => setExportOpen(false);
    // Any click outside dismisses; capture phase so it fires before the menu
    // items' own handlers re-open it.
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [exportOpen]);

  return (
    <div className="no-print flex items-center gap-1 border-b border-line bg-surface px-3 py-2">
      <IconButton
        title={t.viewer.search}
        onClick={onToggleSearch}
        className={cn(showSearch && "bg-surface-sunken text-ink")}
      >
        <IconSearch className="size-4.5" />
      </IconButton>

      <IconButton title={t.viewer.showHeaders} onClick={onShowHeaders}>
        <IconCode className="size-4.5" />
      </IconButton>

      <div className="ml-auto flex items-center gap-1">
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setExportOpen((o) => !o);
            }}
          >
            <IconDownload className="size-4" />
            {t.viewer.exportMenu}
            <IconChevronDown className="size-3.5" />
          </Button>

          {exportOpen && (
            <div
              className="animate-fade-rise absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-surface-raised py-1 shadow-pop"
              role="menu"
            >
              <MenuItem
                onClick={() =>
                  downloadBlob(buildEml(email), safeFileName(email.subject, "message", "eml"))
                }
              >
                {t.viewer.exportEml}
              </MenuItem>
              <MenuItem
                onClick={() =>
                  downloadBlob(
                    buildPlainText(email),
                    safeFileName(email.subject, "message", "txt"),
                  )
                }
              >
                {t.viewer.exportTxt}
              </MenuItem>
            </div>
          )}
        </div>

        <Button size="sm" variant="secondary" onClick={onPrint}>
          <IconPrinter className="size-4" />
          <span className="hidden sm:inline">{t.viewer.print}</span>
        </Button>

        {/*
          Keyed by message id: switching messages must reset the button back to
          "save", and React's answer to "reset state when a prop changes" is a
          new key rather than an effect that synchronises it.
        */}
        {!stored && (
          <SaveToWorkspace key={email.id} email={email} t={t} locale={locale} />
        )}
      </div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="block w-full px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface-sunken"
    >
      {children}
    </button>
  );
}

function AddressLine({ label, list }: { label: string; list: EmailAddress[] }) {
  if (list.length === 0) return null;
  return (
    <div className="flex gap-1.5">
      <span className="shrink-0 text-ink-subtle">{label}:</span>
      <span className="min-w-0 break-words">{list.map(shortAddress).join(", ")}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-medium text-ink-subtle">{label}</dt>
      <dd className="mb-1 break-words text-ink-muted sm:mb-0">{value}</dd>
    </>
  );
}

function Notice({
  tone,
  icon,
  children,
}: {
  tone: "info" | "warning";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-5 py-2.5 text-[12.5px] sm:px-7",
        tone === "warning"
          ? "bg-warning-soft text-warning"
          : "bg-accent-soft text-accent-ink",
      )}
    >
      <span className="mt-px shrink-0">{icon}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
