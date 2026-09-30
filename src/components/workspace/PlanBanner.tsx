"use client";

import { useEffect, useState } from "react";
import { FREE_FILE_LIMIT } from "@/lib/billing";
import { format, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/site";
import { api, type Entitlement } from "@/lib/workspace/api";

/**
 * The plan strip at the top of the workspace.
 *
 * Two jobs, and the order matters: tell someone on the free tier how much room
 * is left *before* they hit the wall, and tell a paying customer what they are
 * paying for and when it renews. A meter that only appears once it is full is
 * a surprise, and a surprise about money reads as a trick.
 *
 * Renders nothing at all for a lifetime customer with nothing to say. There is
 * no reason to keep reminding someone who already paid.
 */
export function PlanBanner({ t, locale }: { t: Dictionary; locale: Locale }) {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);

  useEffect(() => {
    let live = true;
    api
      .billing()
      .then(({ entitlement: e }) => {
        if (live) setEntitlement(e);
      })
      // Silent: a workspace that works is more useful than a banner about
      // billing, and every real feature reports its own failures.
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!entitlement) return null;

  const pricingHref = locale === "en" ? "/pricing/" : `/${locale}/pricing/`;

  if (entitlement.active) {
    const name =
      entitlement.plan === "lifetime"
        ? t.workspace.planLifetime
        : entitlement.plan === "yearly"
          ? t.workspace.planYearly
          : t.workspace.planMonthly;

    // A lifetime plan has no date to show and no renewal to explain.
    if (entitlement.plan === "lifetime") return null;

    const date = entitlement.expiresAt
      ? new Date(entitlement.expiresAt * 1000).toLocaleDateString(
          locale === "zh" ? "zh-TW" : "en-GB",
          { year: "numeric", month: "short", day: "numeric" },
        )
      : null;

    return (
      <p className="text-[12.5px] text-ink-subtle">
        {format(t.workspace.planActive, { plan: name })}
        {date && (
          <>
            {" · "}
            {format(
              entitlement.cancelAtPeriodEnd ? t.workspace.endsOn : t.workspace.renewsOn,
              { date },
            )}
          </>
        )}
        {" · "}
        <ManageBilling t={t} />
      </p>
    );
  }

  const remaining = entitlement.remainingFiles ?? 0;
  const used = FREE_FILE_LIMIT - remaining;

  return (
    <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
      <span className={remaining === 0 ? "text-ink" : "text-ink-subtle"}>
        {remaining === 0
          ? t.workspace.freeFull
          : format(t.workspace.freeUsed, { used, limit: FREE_FILE_LIMIT })}
      </span>
      <a
        href={pricingHref}
        className="font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
      >
        {t.workspace.upgrade}
      </a>
    </div>
  );
}

/**
 * Opens Paddle's portal to cancel, change card or get invoices. The link is
 * minted on click because it expires; same-tab navigation, so no popup blocker.
 */
function ManageBilling({ t }: { t: Dictionary }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const open = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { url } = await api.billingPortal();
      window.location.href = url;
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="cursor-pointer font-medium text-accent underline underline-offset-2 hover:text-accent-hover disabled:cursor-default disabled:opacity-60"
      >
        {t.workspace.manageBilling}
      </button>
      {failed && (
        <span role="alert" className="ml-2 text-ink">
          {t.workspace.manageBillingFailed}
        </span>
      )}
    </>
  );
}
