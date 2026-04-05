"use client";

import { LoaderCircle, Route } from "lucide-react";
import { useState } from "react";

import type { RoutePlanResult } from "@/lib/types";

type Summary = {
  name: string;
  fullName: string;
  rank: string;
  category: string;
  subcategories: string[];
  nextDeadline: string | null;
};

export function RoutePlannerCard({
  conferenceSummaries,
  isAuthenticated,
}: {
  conferenceSummaries: Summary[];
  isAuthenticated: boolean;
}) {
  const [abstractText, setAbstractText] = useState("");
  const [result, setResult] = useState<RoutePlanResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/route-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          abstractText,
          conferences: conferenceSummaries.slice(0, 40),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to plan route");
      }

      setResult(payload.result as RoutePlanResult);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to plan route",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="panel rounded-[2rem] p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-accent/12 p-3 text-accent">
            <Route className="size-5" />
          </div>
          <div>
            <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">
              AI Matchmaker
            </p>
            <h2 className="section-title text-3xl font-semibold">Submission route planner</h2>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
          Paste your abstract, contribution summary, or keywords. The server route is ready for
          OpenRouter or Minimax, and already receives a lightweight summary of the conference
          catalog.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <textarea
            value={abstractText}
            onChange={(event) => setAbstractText(event.target.value)}
            placeholder="Paste your abstract or keywords here..."
            className="min-h-48 w-full rounded-[1.75rem] border border-border bg-white/70 px-5 py-4 text-sm leading-7 outline-none ring-0 transition placeholder:text-muted focus:border-accent dark:bg-white/5"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {isAuthenticated
                ? "Authenticated users can invoke the AI planner."
                : "Sign in first to use the route planner."}
            </p>
            <button
              type="submit"
              disabled={pending || !abstractText.trim() || !isAuthenticated}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Generate Route
            </button>
          </div>
        </form>
      </div>

      <div className="panel rounded-[2rem] p-8">
        <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">
          Output
        </p>
        {result ? (
          <div className="mt-6 space-y-5 text-sm leading-7">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Primary Target</p>
              <p className="mt-2 font-serif text-2xl font-semibold">{result.primaryTarget}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Rationale</p>
              <p className="mt-2">{result.rationale}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Fallbacks</p>
              <ul className="mt-2 space-y-2">
                {result.fallbackTargets.map((target) => (
                  <li key={target} className="rounded-2xl border border-border px-4 py-3">
                    {target}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Timeline Advice</p>
              <ul className="mt-2 space-y-2">
                {result.timelineAdvice.map((tip) => (
                  <li key={tip} className="rounded-2xl border border-border px-4 py-3">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-border px-5 py-10 text-sm leading-7 text-muted">
            {error ??
              "The AI route planner is wired through a secure server endpoint. Add an OpenRouter or Minimax key to start getting structured target recommendations here."}
          </div>
        )}
      </div>
    </section>
  );
}
