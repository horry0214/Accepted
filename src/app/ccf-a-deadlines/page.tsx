import type { Metadata } from "next";
import Link from "next/link";

import { getConferenceCatalog } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "CCF-A Conference Deadlines 2026",
  description:
    "Track CCF-A conference deadlines, compare top-tier CS venues, and monitor upcoming submission windows on Accepted.",
  alternates: {
    canonical: `${getSiteUrl()}/ccf-a-deadlines`,
  },
  openGraph: {
    title: "CCF-A Conference Deadlines 2026",
    description:
      "Track CCF-A conference deadlines, compare top-tier CS venues, and monitor upcoming submission windows on Accepted.",
    url: `${getSiteUrl()}/ccf-a-deadlines`,
    siteName: "Accepted",
    type: "article",
  },
};

function formatDeadline(deadline: string | null) {
  if (!deadline) {
    return "TBD";
  }

  return deadline.replace(" 23:59:59", "");
}

export default async function CcfADeadlinePage() {
  const catalog = await getConferenceCatalog();
  const ccfAConferences = catalog
    .filter((conference) => conference.ccf_rank === "A")
    .sort((left, right) => {
      if (!left.deadline && !right.deadline) return left.name.localeCompare(right.name);
      if (!left.deadline) return 1;
      if (!right.deadline) return -1;
      return left.deadline.localeCompare(right.deadline);
    });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">
          CCF-A Deadlines
        </p>
        <h1 className="mt-4 font-serif text-4xl text-slate-900 dark:text-white">
          CCF-A conference deadlines for 2026
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
          This page focuses on top-tier CCF-A venues so researchers can quickly scan major deadlines, compare categories, and jump into venue pages without searching conference by conference.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <h2 className="font-serif text-3xl text-slate-900 dark:text-white">Top-tier venues</h2>
        <div className="mt-6 space-y-4">
          {ccfAConferences.map((conference) => (
            <article
              key={conference.slug}
              className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200/70 bg-slate-50/90 p-5 md:flex-row md:items-center md:justify-between dark:border-white/10 dark:bg-white/5"
            >
              <div className="space-y-2">
                <h3 className="font-serif text-2xl text-slate-900 dark:text-white">{conference.name}</h3>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {conference.full_name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {conference.category_name} · {conference.core_rank ? `CORE ${conference.core_rank}` : "CORE TBD"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                  {formatDeadline(conference.deadline)}
                </span>
                <Link
                  href={`/conference/${conference.slug}`}
                  className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-white/15 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950"
                >
                  View venue
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
