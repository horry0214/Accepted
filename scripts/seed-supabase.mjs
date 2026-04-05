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

const payload = source.conferences.map((conference) => ({
  ...conference,
  last_deadline: sanitizeTimestamp(conference.last_deadline),
  next_deadline: sanitizeTimestamp(conference.next_deadline),
  metadata: conference.metadata ?? {},
}));

const { error } = await supabase
  .from("conferences")
  .upsert(payload, { onConflict: "slug" });

if (error) {
  console.error("Supabase seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${payload.length} conferences into Supabase.`);
