import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import type { Conference } from "@/lib/types";
import { formatDeadlineForLocale, getDeadlineProgress, getTimeToDeadline } from "@/lib/utils";

export function ConferenceCard({ conference }: { conference: Conference }) {
  const timing = getTimeToDeadline(conference.next_deadline);
  const progress = getDeadlineProgress(conference.next_deadline);

  return (
    <article className="panel group rounded-[1.7rem] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              CCF-{conference.ccf_rank}
            </span>
            <span className="text-xs uppercase tracking-[0.18em] text-muted">
              {conference.category_name}
            </span>
          </div>
          <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight">{conference.name}</h2>
          <p className="mt-2 min-h-14 text-sm leading-6 text-muted">{conference.full_name}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3 rounded-3xl border border-border bg-white/70 p-4 dark:bg-white/5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted">
            <Clock3 className="size-4" />
            Next deadline
          </span>
          <span className="font-medium">
            {formatDeadlineForLocale(
              conference.next_deadline,
              typeof navigator === "undefined" ? "en-US" : navigator.language,
              conference.deadline_timezone,
            )}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-[#0f4fa8] via-[#3f7ec9] to-[#80b9ff]" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{conference.next_deadline_note ?? "Deadline note pending"}</span>
          <span className={timing?.isPast ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}>
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
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent transition group-hover:gap-3"
      >
        View details
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}
