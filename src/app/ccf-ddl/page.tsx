import type { Metadata } from "next";
import Link from "next/link";

import { getConferenceCatalog } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "CCF DDL Tracker and Conference Deadlines 2026",
  description:
    "Browse CCF DDL updates, computer science conference deadlines, and ranking context for major venues on Accepted.",
  alternates: {
    canonical: `${getSiteUrl()}/ccf-ddl`,
  },
  openGraph: {
    title: "CCF DDL Tracker and Conference Deadlines 2026",
    description:
      "Browse CCF DDL updates, computer science conference deadlines, and ranking context for major venues on Accepted.",
    url: `${getSiteUrl()}/ccf-ddl`,
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

export default async function CcfDeadlinePage() {
  const catalog = await getConferenceCatalog();
  const featured = catalog
    .filter((conference) => ["A", "B", "C"].includes(conference.ccf_rank ?? ""))
    .sort((left, right) => {
      if (!left.deadline && !right.deadline) return 0;
      if (!left.deadline) return 1;
      if (!right.deadline) return -1;
      return left.deadline.localeCompare(right.deadline);
    })
    .slice(0, 24);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 dark:text-blue-300">
          CCF DDL
        </p>
        <h1 className="mt-4 font-serif text-4xl text-slate-900 dark:text-white">
          CCF DDL tracker for computer science conference deadlines
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
          Accepted tracks CCF-ranked conference deadlines, venue metadata, and ranking context for researchers who want a fast way to scan upcoming submission windows. This page focuses on broad deadline discovery for computer science venues across CCF-A, CCF-B, and CCF-C.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <h2 className="font-serif text-3xl text-slate-900 dark:text-white">Featured CCF deadlines</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {featured.map((conference) => (
            <article
              key={conference.slug}
              className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/90 p-5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    CCF-{conference.ccf_rank}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl text-slate-900 dark:text-white">
                    {conference.name}
                  </h3>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-white dark:text-slate-900">
                  {formatDeadline(conference.deadline)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {conference.full_name}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span>{conference.category_name}</span>
                <span>{conference.core_rank ? `CORE ${conference.core_rank}` : "CORE TBD"}</span>
              </div>
              <Link
                href={`/conference/${conference.slug}`}
                className="mt-5 inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-white/15 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950"
              >
                Open conference page
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
