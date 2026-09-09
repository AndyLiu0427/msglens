import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { WorkspaceLink } from "@/components/workspace/WorkspaceLink";
import { LanguageSwitch } from "./LanguageSwitch";
import { IconMail } from "@/components/ui/icons";
import { getDictionary } from "@/lib/i18n";
import { localizedPath, SITE, type Locale } from "@/lib/site";

interface HeaderProps {
  locale: Locale;
  /** Route path without the locale prefix, e.g. "/faq". Drives the switcher. */
  path: string;
}

export function Header({ locale, path }: HeaderProps) {
  const t = getDictionary(locale);
  const home = localizedPath("/", locale);

  const links = [
    { href: localizedPath("/how-to-open-msg-files", locale), label: t.nav.howTo },
    { href: localizedPath("/what-is-a-msg-file", locale), label: t.nav.whatIs },
    { href: localizedPath("/msg-vs-eml", locale), label: t.nav.msgVsEml },
    { href: localizedPath("/faq", locale), label: t.nav.faq },
    { href: localizedPath("/pricing", locale), label: t.nav.pricing },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href={home}
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-on">
            <IconMail className="size-4" />
          </span>
          <span className="text-[15px]">{SITE.name}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 py-1.5 text-[13.5px] text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitch locale={locale} path={path} label={t.nav.language} />
          <ThemeToggle label={t.nav.theme} />
          <WorkspaceLink locale={locale} t={t} />
        </div>
      </div>
    </header>
  );
}
