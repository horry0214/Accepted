"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { LocaleContext } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const STORAGE_KEY = "accepted-locale";

export function Providers({ children }: { children: React.ReactNode }) {
  const [localeOverride, setLocaleOverride] = useState<Locale | null>(null);
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
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ locale, setLocale, hydrated }), [hydrated, locale]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </ThemeProvider>
  );
}
