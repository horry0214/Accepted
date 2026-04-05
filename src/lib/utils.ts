import { clsx, type ClassValue } from "clsx";
import { differenceInDays, formatDistanceStrict, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function safeDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value.replace(" ", "T"));
  return isValid(parsed) ? parsed : null;
}

export function getTimeToDeadline(deadline: string | null) {
  const date = safeDate(deadline);

  if (!date) {
    return null;
  }

  const now = new Date();
  const dayDiff = differenceInDays(date, now);
  const distance = formatDistanceStrict(date, now, { addSuffix: true });

  return {
    dayDiff,
    distance,
    isPast: date.getTime() < now.getTime(),
    date,
  };
}

export function getDeadlineProgress(deadline: string | null, horizonDays = 180) {
  const info = getTimeToDeadline(deadline);

  if (!info) {
    return 0;
  }

  const remaining = Math.max(0, Math.min(horizonDays, info.dayDiff));
  return Math.round(((horizonDays - remaining) / horizonDays) * 100);
}

export function formatDeadlineForLocale(
  deadline: string | null,
  locale: string,
  timeZone?: string | null,
) {
  const date = safeDate(deadline);

  if (!date) {
    return locale.startsWith("zh") ? "待公布" : "TBD";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timeZone ?? undefined,
  }).format(date);
}

export function abbreviateText(value: string | null, fallback = "Not available") {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value;
}
