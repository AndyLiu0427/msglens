import Link from "next/link";
import { IconGlobe } from "@/components/ui/icons";
import { localizedPath, type Locale } from "@/lib/site";
import { cn } from "@/lib/cn";

const NAMES: Record<Locale, string> = { en: "English", zh: "繁體中文" };
const SHORT: Record<Locale, string> = { en: "EN", zh: "中" };

/**
 * Rendered as real links (not a JS dropdown) so each translation is
 * crawlable and the pair reinforces the hreflang alternates.
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
  const other: Locale = locale === "en" ? "zh" : "en";

  return (
    <Link
      href={localizedPath(path, other)}
      hrefLang={other === "zh" ? "zh-Hant" : "en"}
      title={`${label}: ${NAMES[other]}`}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5",
        "text-[13px] font-medium text-ink-muted transition-colors",
        "hover:bg-surface-sunken hover:text-ink",
      )}
    >
      <IconGlobe className="size-[17px]" />
      <span>{SHORT[other]}</span>
    </Link>
  );
}
