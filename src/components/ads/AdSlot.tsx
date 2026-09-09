"use client";

import { useEffect, useRef } from "react";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/cn";

type Format = "leaderboard" | "rectangle" | "sidebar";

/**
 * Reserved heights per breakpoint. Ad slots are the classic source of
 * cumulative layout shift, so the container always occupies its final space
 * before the network fills it — this protects both Core Web Vitals and the
 * reading experience.
 */
const RESERVED: Record<Format, string> = {
  leaderboard: "min-h-[100px] sm:min-h-[90px]",
  rectangle: "min-h-[250px]",
  sidebar: "min-h-[250px] lg:min-h-[600px]",
};

interface AdSlotProps {
  /** AdSense ad unit id (`data-ad-slot`). */
  slot: string;
  format?: Format;
  label: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({ slot, format = "leaderboard", label, className }: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    // `slot` is part of the guard, not just the render check below: hooks run
    // regardless of what the component returns, so without it every
    // unconfigured slot still called push() and AdSense reported
    // "All 'ins' elements ... already have ads" on each page load.
    if (!SITE.adsenseClient || !slot || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded (blocked, offline, or not yet approved). The
      // reserved box simply stays empty; nothing else on the page is affected.
    }
  }, [slot]);

  // Nothing to render without both a publisher id and a real ad unit id.
  // Requesting an unconfigured unit produces console errors and an empty box,
  // which is worse than showing no ad at all.
  if (!SITE.adsenseClient || !slot) return null;

  return (
    <aside
      className={cn("no-print w-full", className)}
      aria-label={label}
      data-ad-container=""
    >
      <div className="mb-1.5 text-center text-[10.5px] font-medium tracking-widest text-ink-subtle uppercase">
        {label}
      </div>
      <div
        className={cn(
          "flex w-full items-center justify-center overflow-hidden rounded-card",
          "border border-line bg-surface-sunken",
          RESERVED[format],
        )}
      >
        <ins
          ref={ref}
          className="adsbygoogle block w-full"
          style={{ display: "block" }}
          data-ad-client={SITE.adsenseClient}
          data-ad-slot={slot}
          data-ad-format={format === "sidebar" ? "vertical" : "auto"}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
