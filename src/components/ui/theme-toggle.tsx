"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-2 text-sm text-muted transition hover:text-foreground dark:bg-white/5"
    >
      {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
