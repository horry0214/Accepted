export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim() ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const fallback = "http://localhost:3000";

  const base = explicit || (vercel ? `https://${vercel}` : fallback);
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export const homeKeywords = [
  "ccf ddl",
  "ccf deadline",
  "ccfddl",
  "conference deadline tracker",
  "computer science conference deadlines",
  "conference deadlines",
  "academic conference tracker",
  "research submission planner",
  "conference acceptance rate",
  "conference ranking",
  "CORE ranking",
  "Google Scholar h5-index",
];
