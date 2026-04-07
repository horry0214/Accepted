import Link from "next/link";

import { CommunitySectionV2 } from "@/components/community/community-section-v2";
import type { CommunityThreadBundle, Conference } from "@/lib/types";
import {
  abbreviateText,
  formatDeadlineForLocale,
  formatProbability,
  getDeadlineDisplayLabel,
  getTimeToDeadline,
} from "@/lib/utils";

export function ConferenceDetailShell({
  conference,
  threads,
  isAuthenticated,
  currentUserId,
}: {
  conference: Conference;
  threads: CommunityThreadBundle[];
  isAuthenticated: boolean;
  currentUserId: string | null;
}) {
  const deadline = getTimeToDeadline(conference.deadline, conference.deadline_timezone);
  const deadlineLabel = getDeadlineDisplayLabel(conference.deadline, conference.deadline_timezone);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-muted transition hover:text-accent">
        ← Back to tracker
      </Link>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="panel relative overflow-hidden rounded-[2.2rem] p-8">
            <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,_rgba(15,79,168,0.18),_transparent_62%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  CCF-{conference.ccf_rank}
                </span>
                {conference.core_rank ? (
                  <span className="rounded-full bg-slate-900/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    CORE-{conference.core_rank}
                  </span>
                ) : null}
                <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted">
                  {conference.category_name}
                </span>
                {conference.subcategories.slice(0, 2).map((subcategory) => (
                  <span
                    key={subcategory}
                    className="rounded-full border border-border/80 px-3 py-1 text-xs text-muted"
                  >
                    {subcategory}
                  </span>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <h1 className="section-title text-4xl font-semibold tracking-tight sm:text-5xl">
                  {conference.name}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-muted">{conference.full_name}</p>
                <p className="max-w-3xl text-sm leading-7 text-muted">
                  Accepted presents this venue through both a China-native lens and a global research
                  workflow lens: timing, selectivity, topic fit, archival reputation, and community
                  context.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <InfoTile
                  label={deadlineLabel}
                  value={formatDeadlineForLocale(
                    conference.deadline,
                    "en-US",
                    conference.deadline_timezone,
                  )}
                  hint={
                    deadline
                      ? `${deadline.distance} · ${conference.deadline_note ?? conference.deadline_type}`
                      : conference.deadline_note ?? "TBD"
                  }
                />
                <InfoTile label="Conference date" value={abbreviateText(conference.conference_date)} />
                <InfoTile label="Location" value={abbreviateText(conference.conference_location)} />
                <InfoTile label="Acceptance rate" value={abbreviateText(conference.acceptance_rate)} />
                <InfoTile label="Page limit" value={abbreviateText(conference.page_limit)} />
                <InfoTile label="CORE rank" value={abbreviateText(conference.core_rank)} />
                <InfoTile
                  label="Extension likelihood"
                  value={formatProbability(conference.deadline_extension_probability)}
                />
                <InfoTile label="Deadline basis" value={conference.deadline_type} />
              </div>

              {conference.website ? (
                <a
                  href={conference.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-accent dark:bg-slate-100 dark:text-slate-900"
                >
                  Visit conference website
                </a>
              ) : null}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="panel rounded-[2rem] p-8">
              <p className="eyebrow text-xs text-accent">Historical snapshot</p>
              <dl className="mt-5 grid gap-4 text-sm leading-7">
                <div className="rounded-[1.4rem] border border-border bg-white/70 p-4 dark:bg-white/5">
                  <dt className="text-muted">Annual cadence</dt>
                  <dd className="mt-2 font-medium">{abbreviateText(conference.annual)}</dd>
                </div>
                <div className="rounded-[1.4rem] border border-border bg-white/70 p-4 dark:bg-white/5">
                  <dt className="text-muted">Tracked deadline</dt>
                  <dd className="mt-2 font-medium">{abbreviateText(conference.deadline)}</dd>
                </div>
                <div className="rounded-[1.4rem] border border-border bg-white/70 p-4 dark:bg-white/5">
                  <dt className="text-muted">Deadline notes</dt>
                  <dd className="mt-2 font-medium">
                    {conference.deadline_note ?? "TBD"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="panel rounded-[2rem] p-8">
              <p className="eyebrow text-xs text-accent">Global evaluation lens</p>
              <div className="mt-5 space-y-4">
                <SignalLine
                  title="Selectivity and acceptance rate"
                  description="Outside China, researchers often compare venues using acceptance rate, whether the conference is perceived as archival, and how selective the main track feels."
                />
                <SignalLine
                  title="Ranking systems beyond CCF"
                  description="Global audiences more often recognize CORE rankings, Google Scholar h5-index or h5-median, and whether a venue is part of commonly tracked lists such as CSRankings."
                />
                <SignalLine
                  title="Actual fit over abstract prestige"
                  description="Topic alignment, sponsor reputation, proceedings publisher, and where peer labs are publishing usually matter as much as any single rank label."
                />
              </div>
            </div>
          </section>
        </div>

        <CommunitySectionV2
          conference={conference}
          initialThreads={threads}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
        />
      </section>
    </main>
  );
}

function InfoTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-white/70 p-5 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 font-medium">{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

function SignalLine({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.45rem] border border-border bg-white/70 p-4 dark:bg-white/5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}
