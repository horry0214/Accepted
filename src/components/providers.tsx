"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { LocaleContext } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const STORAGE_KEY = "accepted-locale";
const THEME_STORAGE_KEY = "accepted-theme";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const ThemeContext = createContext<{
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => undefined,
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [localeOverride, setLocaleOverride] = useState<Locale | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const browserLocale = useSyncExternalStore(
    () => () => undefined,
    () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "zh") {
        return stored as Locale;
      }

      return navigator.language.startsWith("zh") ? "zh" : "en";
    },
    () => "zh" as Locale,
  );

  const locale: Locale = localeOverride ?? browserLocale;

  function setLocale(locale: Locale) {
    setLocaleOverride(locale);
  }

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [hydrated, locale]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (nextTheme: ThemePreference) => {
      const nextResolvedTheme = nextTheme === "system" ? getSystemTheme() : nextTheme;
      setResolvedTheme(nextResolvedTheme);
      document.documentElement.classList.toggle("dark", nextResolvedTheme === "dark");
      document.documentElement.style.colorScheme = nextResolvedTheme;
    };
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [hydrated, theme]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ locale, setLocale, hydrated }), [hydrated, locale]);
  const themeValue = useMemo(() => ({ theme, resolvedTheme, setTheme }), [resolvedTheme, theme]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </ThemeContext.Provider>
  );
}
