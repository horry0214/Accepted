import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve(process.cwd(), "..", "data.json");
const outputPath = path.resolve(
  process.cwd(),
  "src",
  "data",
  "conferences.generated.json",
);

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const conferences = [];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "not found") {
    return null;
  }

  return trimmed;
}

function normalizeDeadline(value) {
  const normalized = normalizeText(value);

  if (!normalized || normalized.toUpperCase() === "TBD") {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(normalized)) {
    return normalized;
  }

  return null;
}

function inferDeadlineType(note) {
  if (!note) {
    return "unknown";
  }

  if (/aoe/i.test(note)) {
    return "aoe";
  }

  return "conference_local";
}

function mergeConferenceRecords(primary, candidate) {
  const merged = { ...primary };

  for (const [key, value] of Object.entries(candidate)) {
    if (
      merged[key] === null ||
      merged[key] === "" ||
      (Array.isArray(merged[key]) && merged[key].length === 0)
    ) {
      merged[key] = value;
      continue;
    }

    if (
      typeof value === "string" &&
      typeof merged[key] === "string" &&
      value.length > merged[key].length &&
      ["website", "annual", "conference_date", "conference_location", "page_limit", "acceptance_rate"].includes(key)
    ) {
      merged[key] = value;
    }
  }

  merged.metadata = {
    ...(primary.metadata ?? {}),
    ...(candidate.metadata ?? {}),
  };

  return merged;
}

for (const [, category] of Object.entries(raw.categories ?? {})) {
  const categoryName = normalizeText(category.name) ?? "Unknown";
  const categoryDescription = normalizeText(category.description);
  const subcategories = Array.isArray(category.subcategories)
    ? category.subcategories.filter(Boolean)
    : [];

  for (const [rank, entries] of Object.entries(category.conferences ?? {})) {
    for (const entry of entries) {
      const rawLastDeadline = normalizeText(entry.last_deadline);
      const rawNextDeadline = normalizeText(entry.next_deadline);
      const normalizedLastDeadline = normalizeDeadline(entry.last_deadline);
      const normalizedNextDeadline = normalizeDeadline(entry.next_deadline);
      const noteParts = [
        normalizeText(entry.next_deadline_note),
        normalizeText(entry.last_deadline_note),
        rawNextDeadline && !normalizedNextDeadline ? `raw next deadline: ${rawNextDeadline}` : null,
        rawLastDeadline && !normalizedLastDeadline ? `raw last deadline: ${rawLastDeadline}` : null,
      ].filter(Boolean);
      const note = noteParts.length > 0 ? noteParts.join(" | ") : null;

      conferences.push({
        slug: slugify(entry.name),
        name: entry.name,
        full_name: entry.full_name,
        ccf_rank: ["A", "B", "C"].includes(rank) ? rank : "Other",
        category_name: categoryName,
        category_description: categoryDescription,
        subcategories,
        description: categoryDescription,
        website: normalizeText(entry.website),
        annual: normalizeText(entry.annual),
        last_deadline: normalizedLastDeadline,
        last_deadline_note: normalizeText(entry.last_deadline_note),
        next_deadline: normalizedNextDeadline,
        next_deadline_note: normalizeText(entry.next_deadline_note),
        deadline_timezone: null,
        deadline_type: inferDeadlineType(note),
        conference_date: normalizeText(entry.conference_date),
        conference_location: normalizeText(entry.conference_location),
        page_limit: normalizeText(entry.page_limit),
        acceptance_rate: normalizeText(entry.acceptance_rate),
        source_last_modified: normalizeText(entry.last_modified),
        metadata: {
          source: raw.source ?? null,
          category_code: category.code ?? null,
          notes: note,
        },
      });
    }
  }
}

const dedupedConferences = [];
const mergedByIdentity = new Map();

for (const conference of conferences) {
  const identityKey = `${conference.full_name.toLowerCase()}::${conference.category_name.toLowerCase()}`;
  const existing = mergedByIdentity.get(identityKey);

  if (existing) {
    mergedByIdentity.set(identityKey, mergeConferenceRecords(existing, conference));
    continue;
  }

  mergedByIdentity.set(identityKey, conference);
}

for (const conference of mergedByIdentity.values()) {
  dedupedConferences.push(conference);
}

const usedSlugs = new Map();
for (const conference of dedupedConferences) {
  const count = usedSlugs.get(conference.slug) ?? 0;

  if (count > 0) {
    const categorySuffix = slugify(conference.category_name);
    const fallbackSuffix = slugify(conference.full_name).slice(0, 24);
    const suffix = categorySuffix || fallbackSuffix || String(count + 1);
    conference.slug = `${conference.slug}-${suffix}`;
  }

  usedSlugs.set(conference.slug, count + 1);
}

dedupedConferences.sort((left, right) => {
  const leftDate = left.next_deadline ?? left.last_deadline ?? "9999-12-31";
  const rightDate = right.next_deadline ?? right.last_deadline ?? "9999-12-31";
  return leftDate.localeCompare(rightDate);
});

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: raw.source ?? null,
      conferences: dedupedConferences,
    },
    null,
    2,
  ),
);

console.log(`Wrote ${dedupedConferences.length} conference records to ${outputPath}`);
