"use client";

import { ArrowRight, Search } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { ConferenceCardV6 } from "@/components/tracker/conference-card-v6";
import { useDictionary, useLocale } from "@/lib/i18n";
import type { Conference } from "@/lib/types";
import { getDeadlineTimestamp } from "@/lib/utils";

const PAGE_SIZE = 12;

export function TrackerPage({
  conferences,
}: {
  conferences: Conference[];
}) {
  const dictionary = useDictionary();
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [rank, setRank] = useState("All");
  const [deadlineFilter, setDeadlineFilter] = useState("All");
  const [category, setCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [referenceTime] = useState(() => Date.now());
  const deferredQuery = useDeferredValue(query);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const didMountPageRef = useRef(false);

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
      const deadlineTime = getDeadlineTimestamp(conference.deadline, conference.deadline_timezone);

      const matchesDeadline =
        deadlineFilter === "All" ||
        (deadlineFilter === "Due Soon" &&
          deadlineTime !== null &&
          deadlineTime - referenceTime <= 1000 * 60 * 60 * 24 * 30 &&
          deadlineTime > referenceTime) ||
        (deadlineFilter === "Open" && deadlineTime !== null && deadlineTime > referenceTime) ||
        (deadlineFilter === "Unknown" && !conference.deadline);

      return matchesQuery && matchesRank && matchesCategory && matchesDeadline;
    });
  }, [category, conferences, deadlineFilter, deferredQuery, rank, referenceTime]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const paginatedConferences = useMemo(() => {
    const start = (effectiveCurrentPage - 1) * PAGE_SIZE;

    return filtered.slice(start, start + PAGE_SIZE);
  }, [effectiveCurrentPage, filtered]);

  const pageNumbers = useMemo(() => {
    const pages = new Set<number>([1, totalPages]);

    for (let page = effectiveCurrentPage - 1; page <= effectiveCurrentPage + 1; page += 1) {
      if (page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }

    return Array.from(pages).sort((left, right) => left - right);
  }, [effectiveCurrentPage, totalPages]);

  useEffect(() => {
    if (!didMountPageRef.current) {
      didMountPageRef.current = true;
      return;
    }

    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const heroCopy =
    locale === "zh"
      ? {
          brand: "Accepted",
          headline: "更全的会议信息，更清晰的投稿判断。",
          brandLine:
            "围绕 CCF 与工科会议，提供更完整的会议信息、投稿路线规划与讨论入口。",
          trackerCta: "Open tracker",
          plannerCta: "Submission route planning",
          workspaceEyebrow: "Tracker workspace",
          paginationPrev: "上一页",
          paginationNext: "下一页",
        }
      : {
          brand: "Accepted",
          headline: "Fuller conference intelligence. Clearer submission judgment.",
          brandLine:
            "Built for fuller conference intelligence, submission route planning, and calmer research discussion.",
          trackerCta: "Open tracker",
          plannerCta: "Submission route planning",
          workspaceEyebrow: "Tracker workspace",
          paginationPrev: "Prev",
          paginationNext: "Next",
        };

  return (
    <section className="space-y-6">
      <div className="panel relative overflow-hidden rounded-[2.2rem] px-6 py-6 sm:px-10 sm:py-7 lg:px-14 lg:py-8">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(244,248,255,0.96)_0%,rgba(255,255,255,0.88)_44%,rgba(244,248,255,0.96)_100%)] dark:bg-[linear-gradient(180deg,rgba(7,17,26,0.96)_0%,rgba(6,14,24,0.88)_44%,rgba(8,16,27,0.96)_100%)]" />
        <div className="absolute -left-24 top-6 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(80,145,255,0.2),_transparent_68%)] blur-3xl" />
        <div className="absolute -right-16 top-8 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(145,196,255,0.22),_transparent_68%)] blur-3xl" />
        <div className="absolute left-1/2 top-12 h-44 w-44 -translate-x-1/2 rounded-full border border-accent/15 bg-[radial-gradient(circle,_rgba(255,255,255,0.72)_0%,_rgba(255,255,255,0)_72%)] dark:bg-[radial-gradient(circle,_rgba(122,182,255,0.08)_0%,_rgba(122,182,255,0)_72%)]" />
        <div className="absolute left-1/2 top-8 h-[18rem] w-[18rem] -translate-x-1/2 rounded-full border border-accent/8 opacity-70" />
        <div className="absolute left-1/2 top-12 h-[14rem] w-[14rem] -translate-x-1/2 rounded-full border border-accent/10 opacity-70" />
        <div className="absolute inset-x-12 top-16 h-px bg-gradient-to-r from-transparent via-accent/14 to-transparent" />
        <div className="absolute inset-x-24 bottom-8 h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="w-full space-y-4">
            <div className="space-y-3">
              <p className="font-condensed text-[2.8rem] font-semibold uppercase tracking-[0.16em] text-accent sm:text-[4rem] lg:text-[5.15rem]">
                {heroCopy.brand}
              </p>
              <h1 className="mx-auto max-w-4xl text-[1.18rem] font-medium leading-[1.2] tracking-[-0.04em] text-foreground/88 sm:text-[1.45rem] lg:text-[1.95rem]">
                {heroCopy.headline}
              </h1>
            </div>

            <div className="mx-auto max-w-3xl text-sm leading-6 text-muted">
              <div className="rounded-[1.25rem] border border-white/70 bg-white/58 px-4 py-2.5 shadow-[0_14px_28px_rgba(15,79,168,0.05)] backdrop-blur-md dark:border-white/6 dark:bg-white/4">
                <p>{heroCopy.brandLine}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-0">
              <a
                href="#tracker-workspace"
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-full bg-[#cfe3ff] px-4.5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-accent hover:text-white dark:bg-[#d8e8ff] dark:text-slate-950"
              >
                {heroCopy.trackerCta}
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#planner"
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-full border border-border bg-white/72 px-4.5 py-2.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent dark:bg-white/5"
              >
                {heroCopy.plannerCta}
              </a>
            </div>
          </div>
        </div>
      </div>

      <section id="tracker-workspace" ref={workspaceRef} className="panel rounded-[2.2rem] p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="eyebrow text-xs text-accent">{heroCopy.workspaceEyebrow}</p>
            <h2 className="section-title max-w-3xl text-4xl font-semibold tracking-tight">
              {dictionary.trackerTitle}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted">{dictionary.trackerSubtitle}</p>
          </div>
          <div className="rounded-3xl border border-border bg-white/70 px-4 py-3 text-sm text-muted dark:bg-white/5">
            {dictionary.localTime}
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr]">
          <label className="flex items-center gap-2 rounded-2xl border border-border bg-white/70 px-4 py-3 dark:bg-white/5">
            <Search className="size-4 text-muted" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={dictionary.filterSearch}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </label>
          <FilterSelect
            label={dictionary.filterRank}
            value={rank}
            onChange={(value) => {
              setRank(value);
              setCurrentPage(1);
            }}
            options={["All", "A", "B", "C"]}
          />
          <FilterSelect
            label={dictionary.filterCategory}
            value={category}
            onChange={(value) => {
              setCategory(value);
              setCurrentPage(1);
            }}
            options={categories}
          />
          <FilterSelect
            label={dictionary.filterDeadline}
            value={deadlineFilter}
            onChange={(value) => {
              setDeadlineFilter(value);
              setCurrentPage(1);
            }}
            options={["All", "Due Soon", "Open", "Unknown"]}
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedConferences.map((conference) => (
            <ConferenceCardV6 key={conference.slug} conference={conference} />
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={effectiveCurrentPage === 1}
              className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5"
            >
              {heroCopy.paginationPrev}
            </button>

            {pageNumbers.map((page, index) => {
              const previousPage = pageNumbers[index - 1];
              const shouldShowGap = previousPage && page - previousPage > 1;

              return (
                <div key={page} className="flex items-center gap-2">
                  {shouldShowGap ? <span className="px-1 text-sm text-muted">…</span> : null}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === effectiveCurrentPage ? "page" : undefined}
                    className={
                      page === effectiveCurrentPage
                        ? "rounded-full bg-accent px-4 py-2 text-sm font-medium text-white"
                        : "rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent dark:bg-white/5"
                    }
                  >
                    {page}
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={effectiveCurrentPage === totalPages}
              className="rounded-full border border-border bg-white/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/5"
            >
              {heroCopy.paginationNext}
            </button>
          </div>
        ) : null}
      </section>
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
