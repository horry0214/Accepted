"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { ConferenceCard } from "@/components/tracker/conference-card";
import { useDictionary } from "@/lib/i18n";
import type { Conference } from "@/lib/types";

const INITIAL_VISIBLE_COUNT = 36;
const LOAD_MORE_COUNT = 24;

export function TrackerPage({
  conferences,
  dataSource,
}: {
  conferences: Conference[];
  dataSource: "supabase" | "local";
}) {
  const dictionary = useDictionary();
  const [query, setQuery] = useState("");
  const [rank, setRank] = useState("All");
  const [deadlineFilter, setDeadlineFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [referenceTime] = useState(() => Date.now());
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(conferences.map((conference) => conference.category_name)))],
    [conferences],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.toLowerCase();

    return conferences.filter((conference) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        conference.name.toLowerCase().includes(normalizedQuery) ||
        conference.full_name.toLowerCase().includes(normalizedQuery) ||
        conference.subcategories.some((sub) => sub.toLowerCase().includes(normalizedQuery));

      const matchesRank = rank === "All" || conference.ccf_rank === rank;
      const matchesCategory = category === "All" || conference.category_name === category;

      const matchesDeadline =
        deadlineFilter === "All" ||
        (deadlineFilter === "Due Soon" &&
          conference.next_deadline &&
          new Date(conference.next_deadline).getTime() - referenceTime <=
            1000 * 60 * 60 * 24 * 30 &&
          new Date(conference.next_deadline).getTime() > referenceTime) ||
        (deadlineFilter === "Open" &&
          conference.next_deadline &&
          new Date(conference.next_deadline).getTime() > referenceTime) ||
        (deadlineFilter === "Unknown" && !conference.next_deadline);

      return matchesQuery && matchesRank && matchesCategory && matchesDeadline;
    });
  }, [category, conferences, deadlineFilter, deferredQuery, rank, referenceTime]);

  const visibleConferences = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const activeDeadlineCount = useMemo(
    () =>
      conferences.filter(
        (conference) =>
          conference.next_deadline && new Date(conference.next_deadline).getTime() > referenceTime,
      ).length,
    [conferences, referenceTime],
  );

  const ccfACount = useMemo(
    () => conferences.filter((conference) => conference.ccf_rank === "A").length,
    [conferences],
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="panel rounded-[2rem] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="font-condensed text-sm uppercase tracking-[0.3em] text-accent">
                Academic Minimalist
              </p>
              <h1 className="section-title max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                {dictionary.trackerTitle}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted">
                {dictionary.trackerSubtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs uppercase tracking-[0.2em] text-muted">
                <span className="rounded-full border border-border px-3 py-1.5">
                  Source: {dataSource === "supabase" ? "Supabase" : "Local fallback"}
                </span>
                <span className="rounded-full border border-border px-3 py-1.5">
                  Showing {visibleConferences.length} / {filtered.length}
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-white/70 px-4 py-3 text-sm text-muted dark:bg-white/5">
              {dictionary.localTime}
            </div>
          </div>

          <div className="grid gap-3 border-t border-border pt-6 md:grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr]">
            <label className="flex items-center gap-2 rounded-2xl border border-border bg-white/70 px-4 py-3 dark:bg-white/5">
              <Search className="size-4 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dictionary.filterSearch}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </label>
            <FilterSelect label={dictionary.filterRank} value={rank} onChange={setRank} options={["All", "A", "B", "C"]} />
            <FilterSelect
              label={dictionary.filterCategory}
              value={category}
              onChange={setCategory}
              options={categories}
            />
            <FilterSelect
              label={dictionary.filterDeadline}
              value={deadlineFilter}
              onChange={setDeadlineFilter}
              options={["All", "Due Soon", "Open", "Unknown"]}
            />
          </div>
        </div>

        <div className="panel rounded-[2rem] p-8">
          <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">
            Snapshot
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Conferences" value={String(conferences.length)} />
            <StatCard label="Active deadlines" value={String(activeDeadlineCount)} />
            <StatCard label="CCF-A venues" value={String(ccfACount)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleConferences.map((conference) => (
          <ConferenceCard key={conference.slug} conference={conference} />
        ))}
      </div>

      {filtered.length > visibleConferences.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((current) =>
                Math.min(filtered.length, current + LOAD_MORE_COUNT),
              )
            }
            className="rounded-full border border-border bg-white/70 px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent dark:bg-white/5"
          >
            Load more conferences
          </button>
        </div>
      ) : null}
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="space-y-2 rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm dark:bg-white/5">
      <span className="block text-xs uppercase tracking-[0.22em] text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-slate-900 px-5 py-5 text-white dark:bg-slate-100 dark:text-slate-900">
      <p className="text-xs uppercase tracking-[0.22em] text-white/65 dark:text-slate-500">{label}</p>
      <p className="mt-3 font-condensed text-4xl font-semibold">{value}</p>
    </div>
  );
}
