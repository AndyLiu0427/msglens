"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumb, Page } from "./Page";
import { checkoutReady, FREE_FILE_LIMIT, formatUsd, PLANS, type PlanId } from "@/lib/billing";
import { format, getDictionary } from "@/lib/i18n";
import { breadcrumbSchema } from "@/lib/metadata";
import { localizedPath, type Locale } from "@/lib/site";
import { api, signIn, type Entitlement, type WorkspaceUser } from "@/lib/workspace/api";
import { loadHotjar, track } from "@/lib/analytics";
import { openCheckout, resumePaymentLink } from "@/lib/workspace/checkout";

/**
 * Pricing.
 *
 * A client component, unusually for a content page, because the buttons have
 * to know three things that only exist in the browser: whether you are signed
 * in, what you already own, and whether checkout is configured at all. The
 * prices themselves are static and render identically for a crawler.
 */

const PAID: PlanId[] = ["monthly", "yearly", "lifetime"];

/** Monthly-equivalent saving on the yearly plan, from the prices themselves. */
const YEARLY_SAVING = Math.round((1 - PLANS.yearly.price / (PLANS.monthly.price * 12)) * 100);

function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="mt-[3px] size-4 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  );
}

function Features({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-5 space-y-2 text-[14px] text-ink-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <Check />
          <span>{format(item, { limit: FREE_FILE_LIMIT })}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingPage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const ready = checkoutReady();

  // undefined = still asking, null = signed out.
  const [user, setUser] = useState<WorkspaceUser | null | undefined>(undefined);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Paddle sent them here to finish paying — a dunning link, or a payment
    // method update. That has to work before anything else on this page does.
    resumePaymentLink();
    loadHotjar();
    track("pricing_viewed");
  }, []);

  useEffect(() => {
    let live = true;
    api
      .me()
      .then(async ({ user: me }) => {
        if (!live) return;
        setUser(me);
        if (!me) return;
        const { entitlement: e } = await api.billing();
        if (live) setEntitlement(e);
      })
      .catch(() => {
        // Pricing must render for someone who is offline or blocking the API;
        // the buttons simply fall back to the signed-out path.
        if (live) setUser(null);
      });
    return () => {
      live = false;
    };
  }, []);

  async function buy(plan: PlanId) {
    // Fired before the auth branch on purpose. Tracking only inside each arm
    // gave the funnel two different tops depending on whether someone was
    // signed in, so "how many pressed a buy button" was not a question the
    // data could answer.
    track("plan_selected", { plan });

    if (!user) {
      // The purchase has to be attached to an account, so sign-in comes first
      // and returns here rather than to the workspace. This is the drop-off
      // the whole measurement exists for: how many get sent to Google and
      // never come back.
      track("signin_required", { plan });
      signIn(localizedPath("/pricing", locale));
      return;
    }
    setError(null);
    setBusy(plan);
    try {
      await openCheckout(plan, { id: user.id, email: user.email });
      track("checkout_opened", { plan });
    } catch (e) {
      track("checkout_failed", { plan });
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const owned = entitlement?.active ? entitlement.plan : null;

  return (
    <Page
      locale={locale}
      path="/pricing"
      wide
      schemas={[
        breadcrumbSchema(locale, [
          { name: t.nav.viewer, path: "/" },
          { name: t.nav.pricing, path: "/pricing" },
        ]),
      ]}
    >
      <Breadcrumb locale={locale} title={t.nav.pricing} />

      <h1 className="mb-4 text-[32px] leading-tight font-semibold tracking-tight text-ink">
        {t.pricing.title}
      </h1>
      <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
        {t.pricing.intro}
      </p>

      {!ready && (
        <div className="mb-8 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3">
          <p className="text-[14px] font-medium text-ink">{t.pricing.notReady}</p>
          <p className="mt-1 text-[13.5px] text-ink-muted">
            {format(t.pricing.notReadyBody, { limit: FREE_FILE_LIMIT })}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-6 text-[14px] text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Free */}
        <div className="flex flex-col rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-ink">{t.pricing.free.name}</h2>
          <p className="mt-3 text-[30px] leading-none font-semibold tracking-tight text-ink">
            {t.pricing.free.price}
          </p>
          <p className="mt-3 text-[13.5px] text-ink-muted">{t.pricing.free.tagline}</p>
          <div className="flex-1">
            <Features items={t.pricing.freeFeatures} />
          </div>
          <Link
            href={localizedPath("/", locale)}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-line px-4 text-[14px] font-medium text-ink transition-colors hover:bg-surface-raised"
          >
            {t.pricing.free.cta}
          </Link>
        </div>

        {PAID.map((id) => {
          const plan = PLANS[id];
          const copy = t.pricing[id];
          const isLifetime = id === "lifetime";
          const mine = owned === id;
          const off = !ready || busy !== null || mine;
          return (
            <div
              key={id}
              className={`relative flex flex-col rounded-2xl border p-5 ${
                isLifetime
                  ? "border-accent bg-accent-soft shadow-sm"
                  : "border-line bg-surface"
              }`}
            >
              {isLifetime && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-accent-on">
                  {t.pricing.bestValue}
                </span>
              )}

              <h2 className="text-[15px] font-semibold text-ink">{copy.name}</h2>

              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-[30px] leading-none font-semibold tracking-tight text-ink">
                  {formatUsd(plan.price)}
                </span>
                {isLifetime && (
                  <span className="text-[13px] text-ink-muted">{t.pricing.once}</span>
                )}
              </p>

              <p className="mt-2 text-[13px] text-ink-muted">
                {id === "monthly" && t.pricing.billedMonthly}
                {id === "yearly" &&
                  format(t.pricing.perMonthBilledYearly, {
                    price: formatUsd(plan.perMonth ?? 0),
                  })}
                {isLifetime && t.pricing.payOnce}
              </p>

              {id === "yearly" && (
                <p className="mt-2 inline-flex w-fit rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent">
                  {format(t.pricing.save, { percent: YEARLY_SAVING })}
                </p>
              )}
              {isLifetime && (
                <p className="mt-2 text-[13px] font-medium text-ink">
                  {t.pricing.lifetime.pitch}
                </p>
              )}

              <div className="flex-1">
                <Features items={t.pricing.paidFeatures} />
              </div>

              {/*
                Disabled state is a solid colour rather than reduced opacity.
                Fading accent-ink over accent leaves the two within 1.3:1 of
                each other — measured, in dark mode — which made the most
                important button on the page the only unreadable one, in the
                state it ships in until Paddle is configured.
              */}
              <button
                type="button"
                disabled={off}
                onClick={() => buy(id)}
                className={`mt-6 inline-flex h-10 shrink-0 items-center justify-center self-stretch rounded-lg px-4 text-[14px] font-medium transition-colors ${
                  off
                    ? "cursor-not-allowed border border-line bg-surface text-ink-muted"
                    : isLifetime
                      ? "bg-accent text-accent-on hover:bg-accent-hover"
                      : "border border-line text-ink hover:bg-surface-raised"
                }`}
              >
                {mine ? t.pricing.currentPlan : copy.cta}
              </button>
            </div>
          );
        })}
      </div>

      <section className="mt-14">
        <h2 className="mb-5 text-[20px] font-semibold tracking-tight text-ink">
          {t.pricing.faqTitle}
        </h2>
        <dl className="max-w-2xl space-y-6">
          {t.pricing.faq.map((item) => (
            <div key={item.q}>
              <dt className="text-[15px] font-medium text-ink">{item.q}</dt>
              <dd className="mt-1.5 text-[14.5px] leading-relaxed text-ink-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Page>
  );
}
