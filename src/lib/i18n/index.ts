import type { Locale } from "../site";
import { en, type Dictionary } from "./en";
import { zh } from "./zh";
import { ja } from "./ja";

const DICTIONARIES: Record<Locale, Dictionary> = { en, zh, ja };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? en;
}

export type { Dictionary };

/**
 * Interpolate `{name}` placeholders in a dictionary string.
 *
 * Dictionary values are plain strings rather than functions so the whole
 * dictionary stays serialisable across the server/client component boundary.
 */
export function format(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
