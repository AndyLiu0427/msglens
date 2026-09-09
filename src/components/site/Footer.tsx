import Link from "next/link";
import { IconCode, IconMail, IconShield } from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n";
import { localizedPath, SITE, type Locale } from "@/lib/site";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const p = (path: string) => localizedPath(path, locale);

  const columns = [
    {
      title: t.footer.product,
      links: [
        { href: p("/"), label: t.nav.viewer },
        { href: p("/convert-msg-to-pdf"), label: t.nav.toPdf },
        { href: p("/msg-to-eml"), label: t.nav.toEml },
      ],
    },
    {
      title: t.footer.resources,
      links: [
        { href: p("/how-to-open-msg-files"), label: t.nav.howTo },
        { href: p("/msg-file-wont-open"), label: t.nav.wontOpen },
        { href: p("/open-winmail-dat"), label: t.nav.winmail },
        { href: p("/what-is-a-msg-file"), label: t.nav.whatIs },
        { href: p("/outlook-msg-no-html-body"), label: t.nav.noHtmlBody },
        { href: p("/msg-vs-eml"), label: t.nav.msgVsEml },
        { href: p("/faq"), label: t.nav.faq },
        { href: p("/workspace"), label: t.nav.workspace },
        { href: p("/pricing"), label: t.nav.pricing },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { href: p("/about"), label: t.nav.about },
        { href: p("/contact"), label: t.nav.contact },
        { href: p("/privacy"), label: t.nav.privacy },
        { href: p("/terms"), label: t.nav.terms },
      ],
    },
  ];

  return (
    <footer className="no-print mt-20 border-t border-line bg-surface-sunken">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-on">
                <IconMail className="size-4" />
              </span>
              <span className="text-[15px]">{SITE.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-ink-muted">
              {t.footer.tagline}
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-medium text-success">
              <IconShield className="size-3.5" />
              {t.footer.madeWith}
            </p>
            {/* Directly under the privacy claim: the source is what makes it
                checkable rather than something the reader has to take on faith. */}
            <a
              href={SITE.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-fit items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
            >
              <IconCode className="size-3.5" />
              {t.footer.sourceCode}
            </a>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] font-semibold tracking-wider text-ink-subtle uppercase">
                {col.title}
              </h3>
              <ul className="mt-3.5 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6 text-[12.5px] text-ink-subtle">
          © {new Date().getFullYear()} {SITE.operator}. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
