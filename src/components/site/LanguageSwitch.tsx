import Link from "next/link";
import { IconGlobe } from "@/components/ui/icons";
import { HREFLANG, LOCALES, localizedPath, type Locale } from "@/lib/site";
import { cn } from "@/lib/cn";

const NAMES: Record<Locale, string> = { en: "English", zh: "繁體中文", ja: "日本語" };
const SHORT: Record<Locale, string> = { en: "EN", zh: "中", ja: "日" };

/**
 * Rendered as real links (not a JS dropdown) so each translation is
 * crawlable and the set reinforces the hreflang alternates.
 */
export function LanguageSwitch({
  locale,
  path,
  label,
}: {
  locale: Locale;
  path: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center">
      <IconGlobe className="mr-0.5 size-[17px] text-ink-muted" aria-hidden />
      {LOCALES.filter((l) => l !== locale).map((other) => (
        <Link
          key={other}
          href={localizedPath(path, other)}
          hrefLang={HREFLANG[other]}
          lang={HREFLANG[other]}
          title={`${label}: ${NAMES[other]}`}
          className={cn(
            "inline-flex h-9 items-center rounded-[10px] px-2",
            "text-[13px] font-medium text-ink-muted transition-colors",
            "hover:bg-surface-sunken hover:text-ink",
          )}
        >
          {SHORT[other]}
        </Link>
      ))}
    </span>
  );
}
