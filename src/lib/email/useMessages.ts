"use client";

import { useCallback, useRef, useState } from "react";
import {
  FileReadError,
  isStaleBuildError,
  parseEmailFile,
  UnsupportedFileError,
  WrongFormatError,
} from "./parse";
import { track } from "@/lib/analytics";
import { htmlToText } from "./sanitize";
import { formatBytes } from "./mime";
import type { ParsedEmail } from "./types";
import { SITE } from "@/lib/site";
import { format, type Dictionary } from "@/lib/i18n";

/**
 * What a failure report may carry.
 *
 * Deliberately not the file name. Real ones look like
 * "RE Offer - PB ARM - <candidate>.msg" — the name alone leaks who the message
 * is about, and the extension is the only part that helps diagnose anything.
 * The contents never appear here at all.
 */
/**
 * Remove the file name from a message before it can be reported.
 *
 * Several of the error types embed it — `Unsupported file: ${fileName}` — and
 * a real file name is routinely a person's name: "RE Offer - PB ARM - <someone>".
 * Redacting at the point of capture means no future error type can leak one by
 * accident, which a rule about how to write error strings would not guarantee.
 */
function redactName(message: string, fileName: string): string {
  const stem = fileName.replace(/\.[^.]*$/, "");
  let out = message;
  for (const needle of [fileName, stem]) {
    if (needle.length < 3) continue;
    out = out.split(needle).join("<file>");
  }
  return out;
}

export interface FailureDetail {
  extension: string;
  sizeBytes: number;
  errorName: string;
  errorMessage: string;
}

export interface LoadError {
  id: string;
  message: string;
  /** Rendered as a recovery button next to the message. */
  action?: "reload";
  /**
   * Present when the failure is worth hearing about. Every real parser bug in
   * this project was found from a description of a file, not from a counter
   * saying how many failed — so the app asks rather than measures.
   */
  detail?: FailureDetail;
}

/**
 * Owns the loaded-message collection: intake, parsing, selection and errors.
 *
 * Parsing is sequential rather than `Promise.all` — a user can drop 50 files
 * and each one allocates its full attachment set, so running them all at once
 * is the difference between a progress bar and an out-of-memory tab.
 */
export function useMessages(t: Dictionary) {
  const [messages, setMessages] = useState<ParsedEmail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<LoadError[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const errorSeq = useRef(0);

  const pushError = useCallback(
    (message: string, action?: LoadError["action"], detail?: FailureDetail) => {
      setErrors((prev) => [
        ...prev,
        { id: `err${errorSeq.current++}`, message, action, detail },
      ]);
    },
    [],
  );

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const all = Array.from(fileList);
      if (all.length === 0) return;

      const files = all.slice(0, SITE.maxFiles);
      if (all.length > SITE.maxFiles) {
        pushError(format(t.errors.tooMany, { limit: SITE.maxFiles }));
      }

      setProgress({ done: 0, total: files.length });
      const parsed: ParsedEmail[] = [];

      for (const [index, file] of files.entries()) {
        if (file.size > SITE.maxFileBytes) {
          pushError(
            format(t.errors.tooLarge, {
              name: file.name,
              limit: formatBytes(SITE.maxFileBytes),
            }),
          );
          setProgress({ done: index + 1, total: files.length });
          continue;
        }
        try {
          const email = await parseEmailFile(file);
          email.bodyText =
            email.bodyText ||
            (email.bodyKind === "html" ? htmlToText(email.body) : email.body);
          parsed.push(email);
          /**
           * The one event the viewer sends.
           *
           * Format and whether it parsed — nothing else. Not the name, which
           * for a real message is "RE Offer - <a person>.msg" and identifies
           * someone on its own; not the size, which fingerprints a specific
           * file; not the contents, ever.
           *
           * This is a real cost and worth naming: until now the viewer made no
           * request at all, and that was checkable in the Network tab. It is
           * not any more. What survives is that the file itself still never
           * leaves the tab, and that remains checkable the same way.
           */
          track("viewer_file_opened", { source_format: email.sourceFormat ?? "unknown", ok: true });
        } catch (err) {
          track("viewer_file_opened", {
            source_format: file.name.split(".").pop()?.toLowerCase() ?? "unknown",
            ok: false,
          });
          // Surface the underlying cause. The user-facing message is
          // deliberately vague, but without this a parse failure is
          // undiagnosable from a bug report — only the file name comes back,
          // and the file itself cannot be shared.
          console.error(
            `[msglens] parse failed for a ${file.name.split(".").pop()} file:`,
            err instanceof Error ? `${err.name}: ${err.message}` : err,
            err instanceof Error ? err.stack : undefined,
          );
          if (isStaleBuildError(err)) {
            // Not a bad file — the app updated underneath this tab. Report it
            // once and stop, rather than repeating it for every remaining file.
            pushError(t.errors.staleBuild, "reload");
            setProgress(null);
            return;
          }
          // Only an unexplained failure is worth reporting. A calendar file, a
          // vCard or an unhydrated cloud placeholder are all situations with a
          // known cause and an answer already on screen.
          const reportable =
            !(err instanceof WrongFormatError) && !(err instanceof FileReadError);

          pushError(
            format(
              err instanceof WrongFormatError
                ? err.format === "ical"
                  ? t.errors.isCalendar
                  : t.errors.isVcard
                : err instanceof FileReadError
                  ? t.errors.notDownloaded
                  : err instanceof UnsupportedFileError
                    ? t.errors.unsupported
                    : t.errors.parseFailed,
              { name: file.name },
            ),
            undefined,
            reportable
              ? {
                  extension: (file.name.split(".").pop() ?? "").slice(0, 12).toLowerCase(),
                  sizeBytes: file.size,
                  errorName: err instanceof Error ? err.name : "Unknown",
                  errorMessage: redactName(
                    err instanceof Error ? err.message : String(err),
                    file.name,
                  ).slice(0, 300),
                }
              : undefined,
          );
        }
        setProgress({ done: index + 1, total: files.length });
        // Yield to the event loop so the progress indicator actually paints
        // between files instead of freezing until the whole batch is done.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setProgress(null);
      if (parsed.length === 0) return;

      setMessages((prev) => [...prev, ...parsed]);
      setSelectedId((prev) => prev ?? parsed[0].id);
    },
    [pushError, t],
  );

  /**
   * Load the bundled demo message.
   *
   * Fetched from our own origin and then run through `addFiles`, so it takes
   * exactly the same path a dropped file does — the demo cannot drift from the
   * real behaviour, and the "nothing is uploaded" claim is untouched (this is
   * a download of a file we ship, not an upload of one of yours).
   */
  const loadSample = useCallback(async () => {
    setProgress({ done: 0, total: 1 });
    try {
      const response = await fetch(SITE.sampleFile);
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      const file = new File([blob], "sample-message.msg", {
        type: "application/vnd.ms-outlook",
      });
      await addFiles([file]);
    } catch {
      setProgress(null);
      pushError(t.errors.sampleFailed);
    }
  }, [addFiles, pushError, t]);

  /** Insert an embedded message next to its parent and select it. */
  const addParsed = useCallback((email: ParsedEmail, afterId?: string) => {
    email.bodyText =
      email.bodyText || (email.bodyKind === "html" ? htmlToText(email.body) : email.body);
    setMessages((prev) => {
      if (!afterId) return [...prev, email];
      const at = prev.findIndex((m) => m.id === afterId);
      if (at === -1) return [...prev, email];
      return [...prev.slice(0, at + 1), email, ...prev.slice(at + 1)];
    });
    setSelectedId(email.id);
  }, []);

  const remove = useCallback((id: string) => {
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== id);
      setSelectedId((current) => {
        if (current !== id) return current;
        const at = prev.findIndex((m) => m.id === id);
        return next[Math.min(at, next.length - 1)]?.id ?? null;
      });
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setSelectedId(null);
    setErrors([]);
  }, []);

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  return {
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
  };
}
