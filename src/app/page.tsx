import type { Metadata } from "next";
import Link from "next/link";

import { RoutePlannerCard } from "@/components/tracker/route-planner-card";
import { TrackerPage } from "@/components/tracker/tracker-page";
import { getConferenceCatalog, getCurrentUser, isSupabaseConfigured } from "@/lib/data";
import { getSiteUrl, homeKeywords } from "@/lib/site";

export const metadata: Metadata = {
  title: "CCF DDL Tracker for Computer Science Conference Deadlines",
  description:
    "Track CCF DDL timelines, browse computer science conference deadlines, and compare CCF and CORE rankings on Accepted.",
  keywords: homeKeywords,
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: "Accepted | CCF DDL Tracker and Conference Deadlines",
    description:
      "Track CCF DDL timelines, compare computer science conference deadlines, and browse CCF and CORE rankings.",
    url: getSiteUrl(),
    siteName: "Accepted",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Accepted | CCF DDL Tracker and Conference Deadlines",
    description:
      "Track CCF DDL timelines, compare computer science conference deadlines, and browse CCF and CORE rankings.",
  },
};

export default async function Home() {
  const [catalog, user] = await Promise.all([getConferenceCatalog(), getCurrentUser()]);
  const usingSupabase = isSupabaseConfigured();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      {!usingSupabase ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Supabase is not configured yet, so Accepted is currently showing the bundled local conference dataset.
        </div>
      ) : null}
      <TrackerPage conferences={catalog} />
      <section className="grid gap-4 rounded-[2rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.45)] backdrop-blur xl:grid-cols-3 dark:border-white/10 dark:bg-slate-900/70">
        <article className="space-y-3 rounded-[1.5rem] bg-slate-50/90 p-5 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700 dark:text-blue-300">
            CCF DDL
          </p>
          <h2 className="font-serif text-2xl text-slate-900 dark:text-white">
            Track CCF conference deadlines in one place
          </h2>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            Browse rolling deadline updates, compare CCF and CORE rankings, and keep an eye on upcoming submission windows for top CS venues.
          </p>
          <Link
            href="/ccf-ddl"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-white/15 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950"
          >
            Explore CCF DDL
          </Link>
        </article>
        <article className="space-y-3 rounded-[1.5rem] bg-slate-50/90 p-5 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">
            CCF-A
          </p>
          <h2 className="font-serif text-2xl text-slate-900 dark:text-white">
            Watch CCF-A deadlines for 2026
          </h2>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            Follow high-impact CCF-A venues and use a dedicated landing page for quicker scanning and better search visibility.
          </p>
          <Link
            href="/ccf-a-deadlines"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-white/15 dark:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950"
          >
            View CCF-A deadlines
          </Link>
        </article>
        <article className="space-y-3 rounded-[1.5rem] bg-slate-50/90 p-5 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-300">
            Keywords
          </p>
          <h2 className="font-serif text-2xl text-slate-900 dark:text-white">
            Built for conference deadline discovery
          </h2>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            Accepted focuses on terms researchers actually search for, including CCF DDL, conference deadlines, CCF-A deadlines, and computer science conference rankings.
          </p>
        </article>
      </section>
      <RoutePlannerCard
        conferenceSummaries={catalog.map((conference) => ({
          name: conference.name,
          fullName: conference.full_name,
          rank: conference.ccf_rank,
          coreRank: conference.core_rank,
          category: conference.category_name,
          subcategories: conference.subcategories,
          deadline: conference.deadline,
        }))}
        isAuthenticated={Boolean(user)}
      />
    </main>
  );
}
