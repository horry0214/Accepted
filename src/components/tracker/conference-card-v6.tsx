"use client";

import Link from "next/link";
import { ArrowRight, Clock3, MapPin, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useLocale } from "@/lib/i18n";
import type { Conference } from "@/lib/types";
import {
  formatDeadlineForLocale,
  getDeadlineDate,
  getDeadlineDisplayLabel,
  getDeadlineProgress,
} from "@/lib/utils";

type Copy = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  closed: string;
  daysLeft: string;
  deadlineFallback: string;
  extensionProbability: string;
  pageLimit: string;
  location: string;
  notAvailable: string;
  details: string;
  unknown: string;
  likely: string;
  possible: string;
  low: string;
};

type UrgencyTone = {
  text: string;
  panel: string;
  bar: string;
  secondsDot: string;
};

const CATEGORY_SHORT_LABELS: Record<string, string> = {
  "计算机科学理论": "计算理论",
  "计算机体系结构": "体系结构",
  "计算机图形学与多媒体": "图形与多媒体",
  "计算机网络": "计算机网络",
  "交叉/综合/新兴": "交叉与新兴",
  "人工智能": "人工智能",
  "人机交互与普适计算": "交互与普适",
  "软件工程": "软件工程",
  "数据库": "数据库",
  "网络与信息安全": "网络与安全",
};

export function ConferenceCardV6({ conference }: { conference: Conference }) {
  const { locale, hydrated } = useLocale();
  const [nowMs, setNowMs] = useState<number | null>(null);

  const copy: Copy =
    locale === "zh"
      ? {
          days: "天",
          hours: "时",
          minutes: "分",
          seconds: "秒",
          closed: "已截止",
          daysLeft: "剩余天数",
          deadlineFallback: "待公布",
          extensionProbability: "延期概率",
          pageLimit: "页数限制",
          location: "开会地点",
          notAvailable: "暂无",
          details: "查看详情",
          unknown: "未知",
          likely: "较高",
          possible: "可能",
          low: "较低",
        }
      : {
          days: "D",
          hours: "H",
          minutes: "M",
          seconds: "S",
          closed: "Closed",
          daysLeft: "Days left",
          deadlineFallback: "TBD",
          extensionProbability: "Extension probability",
          pageLimit: "Page limit",
          location: "Location",
          notAvailable: "Not available",
          details: "View details",
          unknown: "Unknown",
          likely: "Likely",
          possible: "Possible",
          low: "Low",
        };

  const deadlineDate = useMemo(
    () => getDeadlineDate(conference.deadline, conference.deadline_timezone),
    [conference.deadline, conference.deadline_timezone],
  );

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

    return {
      isPast: false,
      totalSeconds,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [deadlineDate, nowMs]);

  const deadlineLabel = getDeadlineDisplayLabel(conference.deadline, conference.deadline_timezone);
  const progress = getDeadlineProgress(conference.deadline, conference.deadline_timezone);
  const tone = getUrgencyTone(countdown);
  const extensionStatus = getExtensionStatus(conference.deadline_extension_probability, copy);
  const categoryLabel = getCategoryLabel(conference.category_name);
  const ccfTagClassName = getCcfTagClassName(conference.ccf_rank);
  const coreTagClassName = getCoreTagClassName(conference.core_rank);

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
    <article className="panel group relative overflow-hidden rounded-[1.45rem] p-4.5 transition duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${ccfTagClassName}`}>
            CCF-{conference.ccf_rank}
          </span>
          {conference.core_rank ? (
            <span className={`rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] ${coreTagClassName}`}>
              CORE-{conference.core_rank}
            </span>
          ) : null}
          <span
            title={conference.category_name}
            className="rounded-full border border-border bg-white/72 px-3 py-1 text-[0.72rem] tracking-[0.08em] text-slate-600 dark:bg-white/[0.04] dark:text-slate-300"
          >
            {categoryLabel}
          </span>
        </div>

        <h2 className="mt-3 font-serif text-[2.05rem] font-semibold leading-none tracking-tight">{conference.name}</h2>
        <p className="mt-2 line-clamp-2 min-h-11 text-sm leading-6 text-muted">{conference.full_name}</p>
      </div>

      <div className={`mt-4 rounded-[1.35rem] p-3.5 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)] ${tone.panel}`}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-muted">
            <Clock3 className="size-4" />
            {deadlineLabel}
          </span>
          <span className="text-right font-medium">
            {formatDeadlineForLocale(
              conference.deadline,
              locale === "zh" ? "zh-CN" : "en-US",
              conference.deadline_timezone,
            )}
          </span>
        </div>

        <div className="mt-3">
          {countdown && hydrated && !countdown.isPast ? (
            <div className="flex items-end gap-3">
              <div className="shrink-0">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">{copy.daysLeft}</p>
                <div className="mt-1 flex items-end gap-2">
                  <span
                    className={`font-condensed text-[3.3rem] font-semibold leading-none tracking-[-0.08em] tabular-nums ${tone.text}`}
                  >
                    {String(countdown.days).padStart(2, "0")}
                  </span>
                  <span className="pb-1 text-sm font-medium text-muted">{copy.days}</span>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
                <TimeUnit value={countdown.hours} label={copy.hours} />
                <TimeUnit value={countdown.minutes} label={copy.minutes} />
                <TimeUnit value={countdown.seconds} label={copy.seconds} live dotClassName={tone.secondsDot} />
              </div>
            </div>
          ) : countdown && hydrated && countdown.isPast ? (
            <div className="py-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">{copy.daysLeft}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{copy.closed}</p>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <div className="shrink-0">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">{copy.daysLeft}</p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="font-condensed text-[3.3rem] font-semibold leading-none tracking-[-0.08em] tabular-nums text-foreground">
                    00
                  </span>
                  <span className="pb-1 text-sm font-medium text-muted">{copy.days}</span>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
                <TimeUnit value={0} label={copy.hours} />
                <TimeUnit value={0} label={copy.minutes} />
                <TimeUnit value={0} label={copy.seconds} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
          <div
            className={`deadline-progress-shimmer h-full rounded-full bg-gradient-to-r ${tone.bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-[0.78rem]">
          <span className="line-clamp-1 text-muted">{conference.deadline_note ?? copy.extensionProbability}</span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 font-semibold ${extensionStatus.className}`}>
            <TimerReset className="mr-1 inline size-3.5 opacity-70" />
            {extensionStatus.value}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-[1.15rem] bg-slate-50/80 p-3 dark:bg-white/[0.04]">
          <dt className="flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            <MapPin className="size-3.5 opacity-70" />
            {copy.location}
          </dt>
          <dd className="mt-2 line-clamp-2 min-h-10 font-medium">
            {formatCardLocation(conference.conference_location, copy.notAvailable)}
          </dd>
        </div>
        <div className="rounded-[1.15rem] bg-slate-50/80 p-3 dark:bg-white/[0.04]">
          <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">{copy.pageLimit}</dt>
          <dd className="mt-2 line-clamp-2 min-h-10 font-medium">{conference.page_limit ?? copy.notAvailable}</dd>
        </div>
      </dl>

      <Link
        href={`/conference/${conference.slug}`}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-accent transition group-hover:gap-3 group-hover:border-accent/35"
      >
        {copy.details}
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function TimeUnit({
  value,
  label,
  live = false,
  dotClassName = "",
}: {
  value: number;
  label: string;
  live?: boolean;
  dotClassName?: string;
}) {
  return (
    <div className="relative rounded-[1rem] bg-white/65 px-2.5 py-2.5 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] dark:bg-white/[0.045] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      {live ? <span className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${dotClassName}`} /> : null}
      <div className="font-condensed text-[1.18rem] font-semibold leading-none tracking-[0.02em] tabular-nums text-foreground">
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-1 text-[0.52rem] uppercase tracking-[0.22em] text-muted">{label}</div>
    </div>
  );
}

function getUrgencyTone(
  countdown:
    | {
        isPast: boolean;
        totalSeconds: number;
      }
    | null,
): UrgencyTone {
  if (!countdown || countdown.isPast) {
    return {
      text: "text-foreground",
      panel: "bg-white/72 dark:bg-white/5",
      bar: "from-slate-500 via-slate-400 to-slate-300",
      secondsDot: "bg-slate-300 dark:bg-slate-600",
    };
  }

  const totalDays = countdown.totalSeconds / 86400;

  if (totalDays < 7) {
    return {
      text: "text-rose-700 dark:text-rose-200",
      panel:
        "bg-[linear-gradient(180deg,rgba(255,245,247,0.96)_0%,rgba(255,250,245,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(55,18,29,0.55)_0%,rgba(48,22,17,0.5)_100%)]",
      bar: "from-rose-600 via-orange-500 to-amber-400",
      secondsDot: "bg-rose-400",
    };
  }

  if (totalDays < 14) {
    return {
      text: "text-orange-700 dark:text-orange-200",
      panel:
        "bg-[linear-gradient(180deg,rgba(255,248,240,0.96)_0%,rgba(255,252,246,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(58,31,15,0.52)_0%,rgba(47,27,12,0.48)_100%)]",
      bar: "from-orange-500 via-amber-400 to-yellow-300",
      secondsDot: "bg-orange-400",
    };
  }

  if (totalDays < 28) {
    return {
      text: "text-amber-700 dark:text-amber-200",
      panel:
        "bg-[linear-gradient(180deg,rgba(255,252,242,0.96)_0%,rgba(255,255,248,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(56,43,14,0.45)_0%,rgba(42,37,14,0.42)_100%)]",
      bar: "from-amber-500 via-yellow-400 to-lime-300",
      secondsDot: "bg-amber-400",
    };
  }

  if (totalDays < 56) {
    return {
      text: "text-sky-700 dark:text-sky-200",
      panel:
        "bg-[linear-gradient(180deg,rgba(243,249,255,0.96)_0%,rgba(248,252,255,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(13,36,55,0.52)_0%,rgba(12,29,44,0.48)_100%)]",
      bar: "from-sky-600 via-blue-500 to-cyan-400",
      secondsDot: "bg-sky-400",
    };
  }

  return {
    text: "text-teal-700 dark:text-teal-200",
    panel:
      "bg-[linear-gradient(180deg,rgba(241,251,248,0.96)_0%,rgba(247,253,251,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(11,43,37,0.5)_0%,rgba(10,34,31,0.46)_100%)]",
    bar: "from-teal-600 via-emerald-500 to-cyan-400",
    secondsDot: "bg-teal-400",
  };
}

function getExtensionStatus(
  probability: number | null,
  copy: Pick<Copy, "unknown" | "likely" | "possible" | "low">,
) {
  if (typeof probability !== "number") {
    return {
      value: copy.unknown,
      className: "bg-slate-900/5 text-slate-600 dark:bg-white/6 dark:text-slate-300",
    };
  }

  if (probability >= 60) {
    return {
      value: `${copy.likely} ${probability.toFixed(0)}%`,
      className: "bg-amber-100/90 text-amber-700 dark:bg-amber-400/12 dark:text-amber-200",
    };
  }

  if (probability >= 30) {
    return {
      value: `${copy.possible} ${probability.toFixed(0)}%`,
      className: "bg-sky-100/90 text-sky-700 dark:bg-sky-400/12 dark:text-sky-200",
    };
  }

  return {
    value: `${copy.low} ${probability.toFixed(0)}%`,
    className: "bg-emerald-100/90 text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200",
  };
}

function getCategoryLabel(categoryName: string) {
  return CATEGORY_SHORT_LABELS[categoryName] ?? categoryName;
}

function getCcfTagClassName(rank: string | null | undefined) {
  switch ((rank ?? "").toUpperCase()) {
    case "A":
      return "bg-[#d9e8ff] text-[#0f4fa8] dark:bg-[#1a3e70] dark:text-[#cfe3ff]";
    case "B":
      return "bg-[#e4efff] text-[#2c61b7] dark:bg-[#1a3459] dark:text-[#d7e6ff]";
    case "C":
      return "bg-[#edf4ff] text-[#4a78c6] dark:bg-[#182b47] dark:text-[#dbe8ff]";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200";
  }
}

function getCoreTagClassName(rank: string | null | undefined) {
  switch ((rank ?? "").toUpperCase()) {
    case "A*":
      return "bg-[#d9f3ee] text-[#0f766e] dark:bg-[#11423d] dark:text-[#bff4e9]";
    case "A":
      return "bg-[#e2f6f1] text-[#0f766e] dark:bg-[#113b38] dark:text-[#c8f8ef]";
    case "B":
      return "bg-[#e8f8f4] text-[#167c72] dark:bg-[#143633] dark:text-[#d0f4ee]";
    case "C":
      return "bg-[#eefaf7] text-[#2b857a] dark:bg-[#17302e] dark:text-[#d8f2ed]";
    case "UNRANKED":
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200";
  }
}

function formatCardLocation(location: string | null, fallback: string) {
  if (!location || location.trim().length === 0) {
    return fallback;
  }

  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(", ");
  }

  return parts.slice(-2).join(", ");
}
