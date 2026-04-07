import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConferenceDetailShell } from "@/components/conference/conference-detail-shell";
import { CommunitySectionV2 } from "@/components/community/community-section-v2";
import { getConferenceBySlug, getCurrentUser, getThreadsForConference } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";
import {
  abbreviateText,
  formatDeadlineForLocale,
  formatProbability,
  getDeadlineDisplayLabel,
  getTimeToDeadline,
} from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const conference = await getConferenceBySlug(slug);

  if (!conference) {
    return { title: "Conference not found" };
  }

  const title = `${conference.name} Deadline, Acceptance Rate, and Discussion`;
  const description = `${conference.name} (${conference.full_name}) on Accepted: deadline timing, CCF context, acceptance rate, page limit, and researcher discussion in one place.`;

  return {
    title,
    description,
    keywords: [
      `${conference.name} deadline`,
      `${conference.name} acceptance rate`,
      `${conference.name} conference`,
      conference.full_name,
      conference.category_name,
      "conference ranking",
      "conference deadline",
      "ccf ddl",
    ],
    alternates: {
      canonical: `${getSiteUrl()}/conference/${conference.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${getSiteUrl()}/conference/${conference.slug}`,
      siteName: "Accepted",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ConferenceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const conference = await getConferenceBySlug(slug);

  if (!conference) {
    notFound();
  }

  const [user, threads] = await Promise.all([
    getCurrentUser(),
    conference.id ? getThreadsForConference(conference.id) : Promise.resolve([]),
  ]);
  const deadline = getTimeToDeadline(conference.deadline, conference.deadline_timezone);
  const deadlineLabel = getDeadlineDisplayLabel(conference.deadline, conference.deadline_timezone);

  if (process.env.NEXT_PUBLIC_DETAIL_SHELL !== "legacy") {
    return (
      <ConferenceDetailShell
        conference={conference}
        threads={threads}
        isAuthenticated={Boolean(user)}
        currentUserId={user?.id ?? null}
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-muted transition hover:text-accent">
        ← Back to tracker
      </Link>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel rounded-[2rem] p-8">
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
          </div>
          <div className="mt-6 space-y-4">
            <h1 className="section-title text-4xl font-semibold tracking-tight sm:text-5xl">
              {conference.name}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted">{conference.full_name}</p>
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

          <div className="mt-8 rounded-[1.7rem] border border-border bg-white/70 p-6 dark:bg-white/5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Historical snapshot</p>
            <dl className="mt-4 grid gap-4 text-sm leading-7 sm:grid-cols-2">
              <div>
                <dt className="text-muted">Annual cadence</dt>
                <dd>{abbreviateText(conference.annual)}</dd>
              </div>
              <div>
                <dt className="text-muted">Tracked deadline</dt>
                <dd>{abbreviateText(conference.deadline)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Deadline notes</dt>
                <dd>{conference.deadline_note ?? "TBD"}</dd>
              </div>
            </dl>
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

        <CommunitySectionV2
          conference={conference}
          initialThreads={threads}
          isAuthenticated={Boolean(user)}
          currentUserId={user?.id ?? null}
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
