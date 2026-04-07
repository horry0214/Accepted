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

function parseFixedOffsetMinutes(timeZone: string | null | undefined) {
  if (!timeZone) {
    return null;
  }

  const normalized = timeZone.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "AOE") {
    return -12 * 60;
  }

  if (normalized === "UTC" || normalized === "GMT") {
    return 0;
  }

  const match = normalized.match(/^(?:UTC|GMT)([+-])(\d{1,2})(?::?(\d{2}))?$/);

  if (!match) {
    return null;
  }

  const [, sign, rawHours, rawMinutes = "0"] = match;
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  const totalMinutes = hours * 60 + minutes;
  return sign === "+" ? totalMinutes : -totalMinutes;
}

export function getDeadlineDate(deadline: string | null, timeZone?: string | null) {
  if (!deadline) {
    return null;
  }

  const normalized = deadline.trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  const offsetMinutes = parseFixedOffsetMinutes(timeZone);

  if (match && offsetMinutes !== null) {
    const [, year, month, day, hour = "23", minute = "59", second = "59"] = match;
    const utcMs =
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ) -
      offsetMinutes * 60 * 1000;
    const parsed = new Date(utcMs);

    return isValid(parsed) ? parsed : null;
  }

  return safeDate(deadline);
}

export function getDeadlineTimestamp(deadline: string | null, timeZone?: string | null) {
  const date = getDeadlineDate(deadline, timeZone);
  return date ? date.getTime() : null;
}

export function getTimeToDeadline(deadline: string | null, timeZone?: string | null) {
  const date = getDeadlineDate(deadline, timeZone);

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

export function getDeadlineProgress(deadline: string | null, timeZone?: string | null, horizonDays = 180) {
  const info = getTimeToDeadline(deadline, timeZone);

  if (!info) {
    return 0;
  }

  const remaining = Math.max(0, Math.min(horizonDays, info.dayDiff));
  return Math.round(((horizonDays - remaining) / horizonDays) * 100);
}

export function getDeadlineDisplayLabel(deadline: string | null, timeZone?: string | null) {
  const info = getTimeToDeadline(deadline, timeZone);

  if (!info) {
    return "Tracked deadline";
  }

  return info.isPast ? "Most recent deadline" : "Next deadline";
}

export function formatDeadlineForLocale(
  deadline: string | null,
  locale: string,
  timeZone?: string | null,
) {
  const date = getDeadlineDate(deadline, timeZone);

  if (!date) {
    return locale.startsWith("zh") ? "待公布" : "TBD";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

export function abbreviateText(value: string | null, fallback = "Not available") {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return value;
}

export function formatProbability(value: number | null, fallback = "Not available") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}
