"use client";

import { IconButton } from "@/components/ui/Button";
import { IconMoon, IconSun } from "@/components/ui/icons";

/**
 * Theme toggle with no React state at all.
 *
 * Which icon shows is decided by CSS from the `.dark` class that ThemeScript
 * already set on <html> before first paint. Mirroring that class into state
 * would mean rendering one frame with the wrong icon on every page load, and
 * would need an effect to read the DOM back — the exact "synchronise React
 * with something React does not own" pattern worth avoiding.
 */
export function ThemeToggle({ label }: { label: string }) {
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private browsing with storage disabled: the toggle still works for
      // this session, it just will not be remembered.
    }
  };

  return (
    <IconButton title={label} onClick={toggle}>
      <IconSun className="hidden size-[18px] dark:block" />
      <IconMoon className="size-[18px] dark:hidden" />
    </IconButton>
  );
}
