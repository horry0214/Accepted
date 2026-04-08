import fs from "node:fs";
import path from "node:path";

const { createClient } = await import("@supabase/supabase-js");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Populate .env.local before seeding.",
  );
  process.exit(1);
}

const sourcePath = path.resolve(
  process.cwd(),
  "src",
  "data",
  "conferences.generated.json",
);

if (!fs.existsSync(sourcePath)) {
  console.error(
    "Missing src/data/conferences.generated.json. Run `npm run prepare-data` first.",
  );
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const supabase = createClient(url, serviceRoleKey);

function sanitizeTimestamp(value) {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value.trim())
  ) {
    return value;
  }

  return null;
}

function buildLegacyMetadata(conference) {
  const {
    metadata,
    deadline,
    deadline_note,
    core_rank,
    deadline_extension_probability,
    ...extraFields
  } = conference;

  return {
    ...(metadata ?? {}),
    ...extraFields,
    deadline: sanitizeTimestamp(deadline),
    deadline_note: deadline_note ?? null,
    core_rank: core_rank ?? null,
    deadline_extension_probability: deadline_extension_probability ?? null,
  };
}

const payload = source.conferences.map((conference) => ({
  ...conference,
  deadline: sanitizeTimestamp(conference.deadline),
  metadata: conference.metadata ?? {},
}));

const { error } = await supabase.from("conferences").upsert(payload, { onConflict: "slug" });

if (!error) {
  console.log(`Seeded ${payload.length} conferences into Supabase.`);
  process.exit(0);
}

const legacyPayload = source.conferences.map((conference) => ({
  slug: conference.slug,
  name: conference.name,
  full_name: conference.full_name,
  ccf_rank: conference.ccf_rank,
  category_name: conference.category_name,
  category_description: conference.category_description,
  subcategories: conference.subcategories ?? [],
  description: conference.description,
  website: conference.website,
  annual: conference.annual,
  last_deadline: sanitizeTimestamp(conference.deadline),
  last_deadline_note: conference.deadline_note,
  next_deadline: sanitizeTimestamp(conference.deadline),
  next_deadline_note: conference.deadline_note,
  deadline_timezone: conference.deadline_timezone,
  deadline_type: conference.deadline_type,
  conference_date: conference.conference_date,
  conference_location: conference.conference_location,
  page_limit: conference.page_limit,
  acceptance_rate: conference.acceptance_rate,
  source_last_modified: conference.source_last_modified,
  metadata: buildLegacyMetadata(conference),
}));

const { error: legacyError } = await supabase
  .from("conferences")
  .upsert(legacyPayload, { onConflict: "slug" });

if (legacyError) {
  console.error("Supabase seed failed:", legacyError.message);
  process.exit(1);
}

console.warn(
  "Seeded conferences using the legacy conference schema. Run the updated SQL schema to persist deadline/core fields as first-class columns.",
);
console.log(`Seeded ${legacyPayload.length} conferences into Supabase.`);
