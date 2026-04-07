import type { Metadata } from "next";

import { RoutePlannerCard } from "@/components/tracker/route-planner-card";
import { TrackerPage } from "@/components/tracker/tracker-page";
import { getConferenceCatalog, getCurrentUser, isSupabaseConfigured } from "@/lib/data";
import { getSiteUrl, homeKeywords } from "@/lib/site";

export const metadata: Metadata = {
  title: "CCF DDL Tracker, Conference Deadlines, and Research Community",
  description:
    "Track CCF DDL timelines, compare computer science conference deadlines, and explore community discussion plus AI-assisted submission planning on Accepted.",
  keywords: homeKeywords,
  alternates: {
    canonical: getSiteUrl(),
  },
  openGraph: {
    title: "Accepted | CCF DDL Tracker and Research Community",
    description:
      "Track CCF DDL timelines, compare conference deadlines, and plan submissions with community context.",
    url: getSiteUrl(),
    siteName: "Accepted",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Accepted | CCF DDL Tracker and Research Community",
    description:
      "Track CCF DDL timelines, compare conference deadlines, and plan submissions with community context.",
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
