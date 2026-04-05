import { RoutePlannerCard } from "@/components/tracker/route-planner-card";
import { TrackerPage } from "@/components/tracker/tracker-page";
import { getConferenceCatalog, getCurrentUser, isSupabaseConfigured } from "@/lib/data";

export default async function Home() {
  const [catalog, user] = await Promise.all([getConferenceCatalog(), getCurrentUser()]);
  const usingSupabase = isSupabaseConfigured();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      {!usingSupabase ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Supabase is not configured yet, so the app is showing the bundled local conference dataset.
        </div>
      ) : null}
      <TrackerPage conferences={catalog} dataSource={usingSupabase ? "supabase" : "local"} />
      <RoutePlannerCard
        conferenceSummaries={catalog.map((conference) => ({
          name: conference.name,
          fullName: conference.full_name,
          rank: conference.ccf_rank,
          category: conference.category_name,
          subcategories: conference.subcategories,
          nextDeadline: conference.next_deadline,
        }))}
        isAuthenticated={Boolean(user)}
      />
    </main>
  );
}
