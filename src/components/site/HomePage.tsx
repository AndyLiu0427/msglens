import Link from "next/link";
import { Page } from "./Page";
import { Viewer } from "@/components/viewer/Viewer";
import { AdSlot } from "@/components/ads/AdSlot";
import {
  IconChevronRight,
  IconLock,
  IconPaperclip,
  IconShield,
  IconSparkle,
  IconWifiOff,
} from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n";
import { faqSchema, softwareSchema } from "@/lib/metadata";
import { localizedPath, SITE, type Locale } from "@/lib/site";

export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

  // Component references rather than elements: JSX created inside an array
  // literal is flagged by React as needing a key even when it is only ever
  // rendered as a single child.
  const pillars = [
    { Icon: IconShield, ...t.trust.local },
    { Icon: IconSparkle, ...t.trust.fidelity },
    { Icon: IconPaperclip, ...t.trust.attachments },
    { Icon: IconWifiOff, ...t.trust.offline },
  ];

  const guides = [
    { path: "/how-to-open-msg-files", label: t.nav.howTo },
    { path: "/msg-file-wont-open", label: t.nav.wontOpen },
    { path: "/what-is-a-msg-file", label: t.nav.whatIs },
    { path: "/msg-vs-eml", label: t.nav.msgVsEml },
    { path: "/convert-msg-to-pdf", label: t.nav.toPdf },
    { path: "/msg-to-eml", label: t.nav.toEml },
    { path: "/open-winmail-dat", label: t.nav.winmail },
  ];

  return (
    <Page
      locale={locale}
      path="/"
      wide
      schemas={[
        softwareSchema(locale, t.hero.subtitle),
        faqSchema(t.faq.items),
      ]}
    >
      <Viewer
        t={t}
        locale={locale}
        intro={
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] font-medium text-ink-muted">
              <IconLock className="size-3.5 text-success" />
              {t.hero.badge}
            </p>
            <h1 className="mt-5 text-[32px] leading-[1.12] font-semibold tracking-tight text-ink sm:text-[42px]">
              {t.hero.title}
            </h1>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-muted">
              {t.hero.subtitle}
            </p>
          </div>
        }
      >
        {/* One wrapper element, not a list of siblings: these children cross
            the server/client boundary into <Viewer>, and a multi-element array
            arrives there without the owner React needs to key it implicitly. */}
        <div>
          <section className="mt-14">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-card border border-line bg-surface p-5"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent">
                    <pillar.Icon className="size-5" />
                  </span>
                  <h2 className="mt-3.5 text-[14.5px] font-semibold text-ink">
                    {pillar.title}
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <AdSlot
            slot={SITE.adSlots.homeLeaderboard}
            format="leaderboard"
            label={t.ads.label}
            className="mt-14"
          />

          <section className="mt-16">
            <h2 className="text-center text-[26px] font-semibold tracking-tight text-ink">
              {t.faq.title}
            </h2>
            <div className="mx-auto mt-8 max-w-3xl divide-y divide-line rounded-card border border-line bg-surface">
              {t.faq.items.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-start gap-3 text-[15px] font-medium text-ink marker:hidden">
                    <IconChevronRight className="mt-0.5 size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-90" />
                    {item.q}
                  </summary>
                  <p className="mt-2.5 pl-7 text-[14px] leading-relaxed text-ink-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-[20px] font-semibold tracking-tight text-ink">
              {t.nav.guides}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {guides.map((guide) => (
                <Link
                  key={guide.path}
                  href={localizedPath(guide.path, locale)}
                  className="group flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong hover:bg-surface-sunken"
                >
                  <span className="text-[14.5px] font-medium text-ink">
                    {guide.label}
                  </span>
                  <IconChevronRight className="ml-auto size-4 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </Viewer>
    </Page>
  );
}
