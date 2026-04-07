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
const existingCatalog = readJsonIfExists(outputPath);
const existingByIdentity = new Map(
  (existingCatalog?.conferences ?? []).map((conference) => [getIdentityKey(conference), conference]),
);
const conferences = [];

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

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

  return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(normalized) ? normalized : null;
}

function normalizeCoreRank(value) {
  const normalized = normalizeText(value)?.toUpperCase().replace(/\s+/g, "");

  switch (normalized) {
    case "A*":
    case "A":
    case "B":
    case "C":
      return normalized;
    case "UNRANKED":
      return "Unranked";
    default:
      return null;
  }
}

function normalizeDeadlineExtensionProbability(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const numeric = Number.parseFloat(trimmed.replace("%", ""));

  if (!Number.isFinite(numeric)) {
    return null;
  }

  const percentage = trimmed.includes("%") ? numeric : numeric <= 1 ? numeric * 100 : numeric;
  return Math.max(0, Math.min(100, Math.round(percentage * 10) / 10));
}

function resolveDeadlineFields(record) {
  const nextDeadline = normalizeDeadline(record.next_deadline);
  const lastDeadline = normalizeDeadline(record.last_deadline);
  const deadline = normalizeDeadline(record.deadline) ?? nextDeadline ?? lastDeadline;
  const deadlineNote =
    normalizeText(record.deadline_note) ??
    (nextDeadline
      ? normalizeText(record.next_deadline_note)
      : normalizeText(record.last_deadline_note) ?? normalizeText(record.next_deadline_note));

  return { deadline, deadlineNote };
}

function inferDeadlineType(note, deadlineTimezone) {
  if (deadlineTimezone && /aoe/i.test(deadlineTimezone)) {
    return "aoe";
  }

  if (!note) {
    return "unknown";
  }

  if (/aoe/i.test(note)) {
    return "aoe";
  }

  return "conference_local";
}

function isBlank(value) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getIdentityKey(conference) {
  return `${String(conference.full_name ?? "").toLowerCase()}::${String(conference.category_name ?? "").toLowerCase()}`;
}

function mergeConferenceRecords(primary, candidate) {
  const merged = { ...primary };

  for (const [key, value] of Object.entries(candidate)) {
    if (isBlank(merged[key])) {
      merged[key] = value;
      continue;
    }

    if (
      typeof value === "string" &&
      typeof merged[key] === "string" &&
      value.length > merged[key].length &&
      [
        "website",
        "annual",
        "conference_date",
        "conference_location",
        "page_limit",
        "acceptance_rate",
        "deadline_note",
      ].includes(key)
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

function toMillis(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isExistingFresher(existingConference, generatedConference) {
  const existingTime = toMillis(existingConference.source_last_modified);
  const generatedTime = toMillis(generatedConference.source_last_modified);

  if (existingTime === null) {
    return false;
  }

  if (generatedTime === null) {
    return true;
  }

  return existingTime > generatedTime;
}

const FRESHNESS_PREFERRED_FIELDS = [
  "website",
  "annual",
  "deadline",
  "deadline_note",
  "deadline_timezone",
  "deadline_type",
  "conference_date",
  "conference_location",
  "page_limit",
  "acceptance_rate",
  "source_last_modified",
  "core_rank",
  "deadline_extension_probability",
];

function mergeWithExistingConference(generatedConference, existingConference) {
  const merged = { ...existingConference, ...generatedConference };

  for (const [key, value] of Object.entries(existingConference)) {
    if (isBlank(merged[key]) && !isBlank(value)) {
      merged[key] = value;
    }
  }

  const existingDeadlineFields = resolveDeadlineFields(existingConference);
  const existingCoreRank = normalizeCoreRank(existingConference.core_rank);
  const existingExtensionProbability = normalizeDeadlineExtensionProbability(
    existingConference.deadline_extension_probability,
  );

  if (isBlank(merged.deadline) && existingDeadlineFields.deadline) {
    merged.deadline = existingDeadlineFields.deadline;
  }

  if (isBlank(merged.deadline_note) && existingDeadlineFields.deadlineNote) {
    merged.deadline_note = existingDeadlineFields.deadlineNote;
  }

  if (isBlank(merged.core_rank) && existingCoreRank) {
    merged.core_rank = existingCoreRank;
  }

  if (merged.deadline_extension_probability === null && existingExtensionProbability !== null) {
    merged.deadline_extension_probability = existingExtensionProbability;
  }

  if (isExistingFresher(existingConference, generatedConference)) {
    for (const key of FRESHNESS_PREFERRED_FIELDS) {
      if (!isBlank(existingConference[key])) {
        merged[key] = existingConference[key];
      }
    }

    if (existingDeadlineFields.deadline) {
      merged.deadline = existingDeadlineFields.deadline;
    }

    if (existingDeadlineFields.deadlineNote) {
      merged.deadline_note = existingDeadlineFields.deadlineNote;
    }

    if (existingCoreRank) {
      merged.core_rank = existingCoreRank;
    }

    if (existingExtensionProbability !== null) {
      merged.deadline_extension_probability = existingExtensionProbability;
    }
  }

  const generatedMetadata = asRecord(generatedConference.metadata);
  const existingMetadata = asRecord(existingConference.metadata);
  merged.metadata = isExistingFresher(existingConference, generatedConference)
    ? { ...generatedMetadata, ...existingMetadata }
    : { ...existingMetadata, ...generatedMetadata };

  delete merged.last_deadline;
  delete merged.last_deadline_note;
  delete merged.next_deadline;
  delete merged.next_deadline_note;

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
      const { deadline, deadlineNote } = resolveDeadlineFields(entry);
      const noteParts = [
        normalizeText(entry.next_deadline_note),
        normalizeText(entry.last_deadline_note),
        rawNextDeadline && !normalizedNextDeadline ? `raw next deadline: ${rawNextDeadline}` : null,
        rawLastDeadline && !normalizedLastDeadline ? `raw last deadline: ${rawLastDeadline}` : null,
      ].filter(Boolean);
      const note = noteParts.length > 0 ? noteParts.join(" | ") : null;
      const deadlineTimezone = normalizeText(entry.deadline_timezone);

      conferences.push({
        slug: slugify(entry.name),
        name: entry.name,
        full_name: entry.full_name,
        ccf_rank: ["A", "B", "C"].includes(rank) ? rank : "Other",
        core_rank: normalizeCoreRank(entry.core_rank),
        category_name: categoryName,
        category_description: categoryDescription,
        subcategories,
        description: categoryDescription,
        website: normalizeText(entry.website),
        annual: normalizeText(entry.annual),
        deadline,
        deadline_note: deadlineNote,
        deadline_timezone: deadlineTimezone,
        deadline_type: inferDeadlineType(deadlineNote ?? note, deadlineTimezone),
        deadline_extension_probability: normalizeDeadlineExtensionProbability(
          entry.deadline_extension_probability,
        ),
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
  const identityKey = getIdentityKey(conference);
  const existingConference = mergedByIdentity.get(identityKey);

  if (existingConference) {
    mergedByIdentity.set(identityKey, mergeConferenceRecords(existingConference, conference));
    continue;
  }

  mergedByIdentity.set(identityKey, conference);
}

for (const conference of mergedByIdentity.values()) {
  const existingConference = existingByIdentity.get(getIdentityKey(conference));
  dedupedConferences.push(
    existingConference ? mergeWithExistingConference(conference, existingConference) : conference,
  );
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
  const leftDate = left.deadline ?? "9999-12-31";
  const rightDate = right.deadline ?? "9999-12-31";
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
