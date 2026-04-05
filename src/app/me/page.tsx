import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentProfile, getCurrentUser, getThreadsForCurrentUser } from "@/lib/data";

export default async function MyProfilePage() {
  const [user, profile, threads] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getThreadsForCurrentUser(),
  ]);

  if (!user) {
    redirect("/");
  }

  const displayName =
    profile?.full_name ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="panel rounded-[2rem] p-8">
          <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">Profile</p>
          <h1 className="section-title mt-4 text-4xl font-semibold">{displayName}</h1>
          <div className="mt-6 space-y-3 text-sm text-muted">
            <p>Email: {user.email ?? "Not available"}</p>
            <p>Username: {profile?.username ?? "Not set"}</p>
            <p>Total threads: {threads.length}</p>
          </div>
        </div>

        <div className="panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">
                My Posts
              </p>
              <h2 className="section-title mt-3 text-3xl font-semibold">Threads you started</h2>
            </div>
            <Link
              href="/"
              className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
            >
              Back home
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {threads.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-10 text-sm text-muted">
                You have not posted any threads yet.
              </div>
            ) : (
              threads.map((thread) => (
                <article
                  key={thread.id}
                  className="rounded-[1.5rem] border border-border bg-white/70 p-5 dark:bg-white/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-2xl font-semibold">{thread.title}</h3>
                      <p className="mt-2 text-sm text-muted">
                        {thread.conference_name ?? "Conference"} ·{" "}
                        {new Intl.DateTimeFormat("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(thread.created_at))}
                      </p>
                    </div>
                    {thread.conference_slug ? (
                      <Link
                        href={`/conference/${thread.conference_slug}`}
                        className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
                      >
                        Open thread venue
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{thread.content}</p>
                  <div className="mt-4 text-sm text-muted">
                    {thread.upvotes} upvotes · {thread.comments.length} comments
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
