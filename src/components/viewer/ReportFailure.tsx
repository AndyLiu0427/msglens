"use client";

import { IconMail } from "@/components/ui/icons";
import { SITE } from "@/lib/site";
import type { FailureDetail } from "@/lib/email/useMessages";
import type { Dictionary } from "@/lib/i18n";

/**
 * "Report this" on a failed file.
 *
 * A mailto rather than a telemetry call, for two reasons.
 *
 * The viewer's central proof is that opening a file produces no network
 * request — a beacon on failure would break that demonstration for the exact
 * users most likely to be checking. And a counter would only ever say how many
 * files failed; every real parser bug in this project was found from a
 * description of what the file was, which is what an email carries and a
 * counter never can.
 *
 * The body is assembled here so the sender can read every word before it goes.
 * It contains the extension, size and error — never the file name, which in
 * real corpora is often a person's name, and never any message content.
 */
export function ReportFailure({ detail, t }: { detail: FailureDetail; t: Dictionary }) {
  const compose = () => {
    const lines = [
      t.errors.reportIntro,
      "",
      t.errors.reportAsk,
      "",
      "",
      "---",
      `File type: .${detail.extension || "(none)"}`,
      `Size: ${detail.sizeBytes.toLocaleString()} bytes`,
      `Error: ${detail.errorName}: ${detail.errorMessage}`,
      `Browser: ${navigator.userAgent}`,
      `Page: ${window.location.href}`,
    ];
    const href =
      `mailto:${SITE.contactEmail}` +
      `?subject=${encodeURIComponent(t.errors.reportSubject)}` +
      `&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = href;
  };

  return (
    <button
      onClick={compose}
      className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[12.5px] font-medium underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
    >
      <IconMail className="size-3.5" />
      {t.errors.report}
    </button>
  );
}
