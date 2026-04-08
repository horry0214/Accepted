"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/lib/i18n";
import type { Conference } from "@/lib/types";
import {
  formatDeadlineForLocale,
  getDeadlineDate,
  getDeadlineDisplayLabel,
  getDeadlineProgress,
  getTimeToDeadline,
} from "@/lib/utils";

export function ConferenceCard({ conference }: { conference: Conference }) {
  const { locale, hydrated } = useLocale();
  const [nowMs, setNowMs] = useState<number | null>(null);
  const deadlineDate = useMemo(
    () => getDeadlineDate(conference.deadline, conference.deadline_timezone),
    [conference.deadline, conference.deadline_timezone],
  );
  const timing = getTimeToDeadline(conference.deadline, conference.deadline_timezone);
  const progress = getDeadlineProgress(conference.deadline, conference.deadline_timezone);
  const deadlineLabel = getDeadlineDisplayLabel(conference.deadline, conference.deadline_timezone);
  const countdown = useMemo(() => {
    if (!deadlineDate || nowMs === null) {
      return null;
    }

    const diffMs = deadlineDate.getTime() - nowMs;

    if (diffMs <= 0) {
      return {
        isPast: true,
        totalSeconds: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      isPast: false,
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
    };
  }, [deadlineDate, nowMs]);
  const countdownTone =
    countdown && !countdown.isPast
      ? countdown.totalSeconds <= 24 * 60 * 60
        ? "urgent"
        : countdown.totalSeconds <= 3 * 24 * 60 * 60
          ? "soon"
          : "steady"
      : "idle";
  const countdownAccentClass =
    countdownTone === "urgent"
      ? "text-rose-600 dark:text-rose-400"
      : countdownTone === "soon"
        ? "text-amber-600 dark:text-amber-300"
        : "text-emerald-600 dark:text-emerald-400";
  const barGradientClass =
    countdownTone === "urgent"
      ? "from-rose-500 via-orange-400 to-amber-300"
      : countdownTone === "soon"
        ? "from-amber-500 via-orange-400 to-yellow-300"
        : "from-[#0f4fa8] via-[#3f7ec9] to-[#80b9ff]";
  const countdownLabels =
    locale === "zh"
      ? { days: "天", hours: "时", minutes: "分", seconds: "秒", closed: "已截止", live: "秒级倒计时" }
      : { days: "D", hours: "H", minutes: "M", seconds: "S", closed: "Closed", live: "Live countdown" };

  useEffect(() => {
    if (!hydrated || !deadlineDate) {
      return;
    }

    const tick = () => setNowMs(Date.now());
    tick();

    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [deadlineDate, hydrated]);

  return (
    <article className="panel group rounded-[1.8rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              CCF-{conference.ccf_rank}
            </span>
            {conference.core_rank ? (
              <span className="rounded-full bg-slate-900/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 dark:bg-white/10 dark:text-slate-200">
                CORE-{conference.core_rank}
              </span>
            ) : null}
            <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted">
              {conference.category_name}
            </span>
          </div>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight">{conference.name}</h2>
          <p className="mt-2 min-h-14 text-sm leading-6 text-muted">{conference.full_name}</p>
        </div>
      </div>

      <div
        className={`mt-6 space-y-4 rounded-3xl border border-border bg-white/70 p-4 dark:bg-white/5 ${
          countdownTone === "urgent" ? "deadline-card-pulse" : ""
        }`}
      >
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted">
            <Clock3 className="size-4" />
            {deadlineLabel}
          </span>
          <span className="font-medium">
            {formatDeadlineForLocale(
              conference.deadline,
              locale === "zh" ? "zh-CN" : "en-US",
              conference.deadline_timezone,
            )}
          </span>
        </div>

        {countdown && hydrated ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted">
                {countdownLabels.live}
              </p>
              <span className={`text-sm font-semibold ${countdownAccentClass}`}>
                {countdown.isPast ? countdownLabels.closed : timing?.distance ?? "TBD"}
              </span>
            </div>

            {countdown.isPast ? (
              <div className="rounded-[1.4rem] border border-rose-200/70 bg-rose-50/80 px-4 py-4 text-center text-base font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                {countdownLabels.closed}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <CountdownCell value={countdown.days} label={countdownLabels.days} tone={countdownTone} />
                <CountdownCell value={countdown.hours} label={countdownLabels.hours} tone={countdownTone} />
                <CountdownCell value={countdown.minutes} label={countdownLabels.minutes} tone={countdownTone} />
                <CountdownCell value={countdown.seconds} label={countdownLabels.seconds} tone={countdownTone} />
              </div>
            )}
          </div>
        ) : null}

        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`deadline-progress-shimmer h-full rounded-full bg-gradient-to-r ${barGradientClass} transition-[width] duration-700 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="line-clamp-1 text-muted">{conference.deadline_note ?? "Deadline note pending"}</span>
          <span className={timing?.isPast ? "text-rose-500" : countdownAccentClass}>
            {timing ? timing.distance : "TBD"}
          </span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-border p-3">
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Acceptance</dt>
          <dd className="mt-2 font-medium">{conference.acceptance_rate ?? "Not available"}</dd>
        </div>
        <div className="rounded-2xl border border-border p-3">
          <dt className="text-xs uppercase tracking-[0.18em] text-muted">Page limit</dt>
          <dd className="mt-2 font-medium">{conference.page_limit ?? "Not available"}</dd>
        </div>
      </dl>

      <Link
        href={`/conference/${conference.slug}`}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-accent transition group-hover:gap-3 group-hover:border-accent/35"
      >
        View details
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function CountdownCell({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "urgent" | "soon" | "steady" | "idle";
}) {
  const toneClass =
    tone === "urgent"
      ? "border-rose-200/70 bg-rose-50/80 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
      : tone === "soon"
        ? "border-amber-200/70 bg-amber-50/80 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
        : "border-accent/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(227,239,255,0.92)_100%)] text-slate-900 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(18,31,50,0.92)_0%,rgba(11,24,42,0.88)_100%)] dark:text-white";

  return (
    <div className={`rounded-[1.2rem] border px-3 py-3 text-center ${toneClass}`}>
      <div className="font-condensed text-[1.55rem] font-semibold leading-none tracking-[0.08em] tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-2 text-[0.62rem] uppercase tracking-[0.26em] opacity-70">{label}</div>
    </div>
  );
}
