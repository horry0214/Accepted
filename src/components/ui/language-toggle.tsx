"use client";

import { Languages } from "lucide-react";

import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-white/60 p-1 text-sm dark:bg-white/5">
      <Languages className="ml-2 size-4 text-muted" />
      {[
        ["zh", "中文"],
        ["en", "EN"],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value as "zh" | "en")}
          className={cn(
            "rounded-full px-3 py-1.5 transition",
            locale === value
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-muted hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
