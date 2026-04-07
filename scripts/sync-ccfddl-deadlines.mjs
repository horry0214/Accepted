import fs from "node:fs";
import path from "node:path";

const catalogPath = path.resolve(process.cwd(), "src", "data", "conferences.generated.json");
const ccfddlPath = path.resolve(process.cwd(), "ccfddl-allconf.yml");
const syncDate = process.env.CCFDDL_SYNC_DATE ?? new Date().toISOString().slice(0, 10);
const referenceNow = new Date(process.env.CCFDDL_REFERENCE_NOW ?? new Date().toISOString());

const COMMON_TITLE_PREFIXES = new Set(["ACM", "IEEE", "USENIX", "IFIP", "SIAM", "SIGOPS", "THE"]);
const LOCAL_TO_CCFDDL_ALIASES = {
  ATC: ["USENIXATC", "SIGOPSATC"],
  CEC: ["IEEECEC"],
  RE: ["RE"],
};

function parseKeyValue(text) {
  const separatorIndex = text.indexOf(":");

  if (separatorIndex === -1) {
    return { key: text.trim(), value: "" };
  }

  return {
    key: text.slice(0, separatorIndex).trim(),
    value: text.slice(separatorIndex + 1).trim(),
  };
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, "");
}

function normalizeKey(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function removeCommonPrefixes(value) {
  if (typeof value !== "string") {
    return "";
  }

  const tokens = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);

  while (tokens.length > 1 && COMMON_TITLE_PREFIXES.has(tokens[0])) {
    tokens.shift();
  }

  return tokens.join("");
}

function normalizeCoreRank(value) {
  const normalized = normalizeKey(value);

  switch (normalized) {
    case "A":
    case "B":
    case "C":
      return normalized;
    case "ASTAR":
      return "A*";
    case "N":
      return "Unranked";
    default:
      return null;
  }
}

function parseTimezoneOffset(timezone) {
  if (!timezone) {
    return 0;
  }

  const normalized = timezone.trim();

  if (/^AOE$/i.test(normalized)) {
    return -12;
  }

  if (/^UTC$/i.test(normalized)) {
    return 0;
  }

  const match = normalized.match(/^UTC([+-]\d{1,2})(?::(\d{2}))?$/i);

  if (!match) {
    return 0;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  return hours >= 0 ? hours + minutes / 60 : hours - minutes / 60;
}

function parseDeadlineToMs(deadline, timezone) {
  if (typeof deadline !== "string") {
    return null;
  }

  const normalized = deadline.trim();

  if (!normalized || normalized.toUpperCase() === "TBD") {
    return null;
  }

  const dateTimeMatch = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (!dateTimeMatch) {
    return null;
  }

  const [, year, month, day, rawHour = "23", rawMinute = "59", rawSecond = "59"] = dateTimeMatch;
  const offsetHours = parseTimezoneOffset(timezone);
  const utcMs =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(rawHour),
      Number(rawMinute),
      Number(rawSecond),
    ) -
    offsetHours * 60 * 60 * 1000;

  return utcMs;
}

function parseAllConf(text) {
  const conferences = [];
  let currentConference = null;
  let currentYearConf = null;
  let currentTimelineItem = null;

  const flushTimelineItem = () => {
    if (!currentYearConf || !currentTimelineItem) {
      currentTimelineItem = null;
      return;
    }

    if (
      currentTimelineItem.deadline ||
      currentTimelineItem.abstract_deadline ||
      currentTimelineItem.comment
    ) {
      currentYearConf.timeline.push(currentTimelineItem);
    }

    currentTimelineItem = null;
  };

  const flushYearConf = () => {
    flushTimelineItem();

    if (!currentConference || !currentYearConf) {
      currentYearConf = null;
      return;
    }

    currentConference.confs.push(currentYearConf);
    currentYearConf = null;
  };

  const flushConference = () => {
    flushYearConf();

    if (!currentConference) {
      return;
    }

    conferences.push(currentConference);
    currentConference = null;
  };

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const indent = line.length - line.trimStart().length;

    if (indent === 0 && trimmed.startsWith("- title:")) {
      flushConference();
      const { value } = parseKeyValue(trimmed.slice(2));
      currentConference = {
        title: stripQuotes(value),
        description: null,
        dblp: null,
        ccf_rank: null,
        core_rank: null,
        confs: [],
      };
      continue;
    }

    if (!currentConference) {
      continue;
    }

    if (indent === 2) {
      const { key, value } = parseKeyValue(trimmed);

      if (key === "description") {
        currentConference.description = stripQuotes(value);
        continue;
      }

      if (key === "dblp") {
        currentConference.dblp = stripQuotes(value);
        continue;
      }

      if (trimmed.startsWith("- year:")) {
        flushYearConf();
        currentYearConf = {
          year: Number.parseInt(stripQuotes(value), 10) || stripQuotes(value),
          link: null,
          timezone: null,
          date: null,
          place: null,
          timeline: [],
        };
        continue;
      }

      continue;
    }

    if (indent === 4 && !currentYearConf) {
      const { key, value } = parseKeyValue(trimmed);

      if (key === "ccf") {
        currentConference.ccf_rank = stripQuotes(value);
      }

      if (key === "core") {
        currentConference.core_rank = normalizeCoreRank(stripQuotes(value));
      }

      continue;
    }

    if (!currentYearConf) {
      continue;
    }

    if (indent === 4) {
      if (trimmed.startsWith("- ")) {
        flushTimelineItem();
        const { key, value } = parseKeyValue(trimmed.slice(2));
        currentTimelineItem = {};
        currentTimelineItem[key] = stripQuotes(value);
        continue;
      }

      flushTimelineItem();
      const { key, value } = parseKeyValue(trimmed);

      if (key === "link") {
        currentYearConf.link = stripQuotes(value);
      }

      if (key === "timezone") {
        currentYearConf.timezone = stripQuotes(value);
      }

      if (key === "date") {
        currentYearConf.date = stripQuotes(value);
      }

      if (key === "place") {
        currentYearConf.place = stripQuotes(value);
      }

      continue;
    }

    if (indent === 6 && currentTimelineItem) {
      const { key, value } = parseKeyValue(trimmed);
      currentTimelineItem[key] = stripQuotes(value);
    }
  }

  flushConference();
  return conferences;
}

function getSelectedDeadline(conference) {
  const deadlines = [];

  for (const yearConf of conference.confs) {
    for (const timelineItem of yearConf.timeline) {
      const deadline = timelineItem.deadline;
      const deadlineMs = parseDeadlineToMs(deadline, yearConf.timezone);

      if (deadlineMs === null) {
        continue;
      }

      deadlines.push({
        deadline,
        deadlineMs,
        deadline_note: timelineItem.comment ?? null,
        deadline_timezone: yearConf.timezone ?? null,
        conference_date: yearConf.date ?? null,
        conference_location: yearConf.place ?? null,
        website: yearConf.link ?? null,
        selected_year: yearConf.year ?? null,
      });
    }
  }

  if (deadlines.length === 0) {
    return null;
  }

  const futureDeadlines = deadlines
    .filter((item) => item.deadlineMs >= referenceNow.getTime())
    .sort((left, right) => left.deadlineMs - right.deadlineMs);

  if (futureDeadlines.length > 0) {
    return futureDeadlines[0];
  }

  return deadlines.sort((left, right) => right.deadlineMs - left.deadlineMs)[0];
}

function buildCandidateKeys(conference) {
  const keys = new Set();
  const normalizedTitle = normalizeKey(conference.title);
  const titleWithoutPrefixes = removeCommonPrefixes(conference.title);
  const normalizedDescription = normalizeKey(conference.description);
  const normalizedDblp = normalizeKey(conference.dblp);

  if (normalizedTitle) {
    keys.add(normalizedTitle);
  }

  if (titleWithoutPrefixes) {
    keys.add(titleWithoutPrefixes);
  }

  if (normalizedDescription) {
    keys.add(normalizedDescription);
  }

  if (normalizedDblp) {
    keys.add(normalizedDblp);
  }

  return {
    keys,
    normalizedTitle,
    titleWithoutPrefixes,
    normalizedDescription,
    normalizedDblp,
  };
}

function getLocalMatchKeys(conference) {
  const normalizedName = normalizeKey(conference.name);
  const normalizedSlug = normalizeKey(conference.slug);
  const normalizedFullName = normalizeKey(conference.full_name);
  const nameWithoutPrefixes = removeCommonPrefixes(conference.name);
  const aliasKeys = LOCAL_TO_CCFDDL_ALIASES[normalizedName] ?? [];
  const keys = new Set([
    normalizedName,
    normalizedSlug,
    normalizedFullName,
    nameWithoutPrefixes,
    ...aliasKeys,
  ]);

  keys.delete("");

  return {
    keys,
    normalizedName,
    normalizedSlug,
    normalizedFullName,
    nameWithoutPrefixes,
  };
}

function scoreMatch(localConference, ccfddlConference) {
  const local = getLocalMatchKeys(localConference);
  const remote = buildCandidateKeys(ccfddlConference);
  let score = 0;
  const reasons = [];

  if (local.normalizedName && local.normalizedName === remote.normalizedTitle) {
    score += 100;
    reasons.push("title=name");
  }

  if (local.normalizedName && local.normalizedName === remote.titleWithoutPrefixes) {
    score += 92;
    reasons.push("titleSansPrefix=name");
  }

  if (local.normalizedSlug && local.normalizedSlug === remote.normalizedDblp) {
    score += 90;
    reasons.push("dblp=slug");
  }

  if (local.normalizedSlug && local.normalizedSlug === remote.normalizedTitle) {
    score += 82;
    reasons.push("title=slug");
  }

  if (local.normalizedFullName && local.normalizedFullName === remote.normalizedDescription) {
    score += 80;
    reasons.push("description=full_name");
  }

  if (local.nameWithoutPrefixes && local.nameWithoutPrefixes === remote.titleWithoutPrefixes) {
    score += 70;
    reasons.push("prefixless");
  }

  for (const key of local.keys) {
    if (remote.keys.has(key)) {
      score += 20;
      reasons.push(`shared:${key}`);
      break;
    }
  }

  if (ccfddlConference.ccf_rank && ccfddlConference.ccf_rank === localConference.ccf_rank) {
    score += 5;
    reasons.push("ccf_rank");
  }

  return { score, reasons };
}

function findBestMatch(localConference, ccfddlConferences) {
  let bestMatch = null;
  let bestScore = 0;
  let bestReasons = [];

  for (const candidate of ccfddlConferences) {
    const { score, reasons } = scoreMatch(localConference, candidate);

    if (score > bestScore) {
      bestMatch = candidate;
      bestScore = score;
      bestReasons = reasons;
    }
  }

  if (bestScore < 80) {
    return null;
  }

  return {
    conference: bestMatch,
    score: bestScore,
    reasons: bestReasons,
  };
}

function parseCatalogDeadlineMs(conference) {
  const parsed = parseDeadlineToMs(conference.deadline, conference.deadline_timezone);

  if (parsed !== null) {
    return parsed;
  }

  if (typeof conference.deadline !== "string" || !conference.deadline.trim()) {
    return null;
  }

  const guessed = Date.parse(conference.deadline.replace(" ", "T"));
  return Number.isFinite(guessed) ? guessed : null;
}

function shouldUseCcfddlDeadline(localConference, selectedDeadline) {
  if (!selectedDeadline) {
    return false;
  }

  const localDeadlineMs = parseCatalogDeadlineMs(localConference);

  if (localDeadlineMs === null) {
    return true;
  }

  const nowMs = referenceNow.getTime();
  const localIsFuture = localDeadlineMs >= nowMs;
  const remoteIsFuture = selectedDeadline.deadlineMs >= nowMs;

  if (remoteIsFuture && !localIsFuture) {
    return true;
  }

  if (!remoteIsFuture && localIsFuture) {
    return false;
  }

  if (remoteIsFuture && localIsFuture) {
    return true;
  }

  return selectedDeadline.deadlineMs > localDeadlineMs;
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const ccfddlConferences = parseAllConf(fs.readFileSync(ccfddlPath, "utf8"));

let matchedCount = 0;
let updatedCount = 0;
const unmatched = [];

for (const conference of catalog.conferences) {
  const match = findBestMatch(conference, ccfddlConferences);

  if (!match) {
    unmatched.push(conference.name);
    continue;
  }

  matchedCount += 1;
  const selectedDeadline = getSelectedDeadline(match.conference);
  const shouldReplaceDeadline = shouldUseCcfddlDeadline(conference, selectedDeadline);
  const currentCoreRank = conference.core_rank ?? null;
  const nextCoreRank = match.conference.core_rank ?? currentCoreRank;
  let changed = false;

  if (nextCoreRank !== currentCoreRank) {
    conference.core_rank = nextCoreRank;
    changed = true;
  }

  if (shouldReplaceDeadline && selectedDeadline) {
    if (conference.deadline !== selectedDeadline.deadline) {
      conference.deadline = selectedDeadline.deadline;
      changed = true;
    }

    const nextDeadlineNote = selectedDeadline.deadline_note ?? conference.deadline_note ?? null;
    if (conference.deadline_note !== nextDeadlineNote) {
      conference.deadline_note = nextDeadlineNote;
      changed = true;
    }

    if (selectedDeadline.deadline_timezone && conference.deadline_timezone !== selectedDeadline.deadline_timezone) {
      conference.deadline_timezone = selectedDeadline.deadline_timezone;
      changed = true;
    }

    if (selectedDeadline.website && conference.website !== selectedDeadline.website) {
      conference.website = selectedDeadline.website;
      changed = true;
    }

    if (selectedDeadline.conference_date && conference.conference_date !== selectedDeadline.conference_date) {
      conference.conference_date = selectedDeadline.conference_date;
      changed = true;
    }

    if (
      selectedDeadline.conference_location &&
      conference.conference_location !== selectedDeadline.conference_location
    ) {
      conference.conference_location = selectedDeadline.conference_location;
      changed = true;
    }

    if (conference.source_last_modified !== syncDate) {
      conference.source_last_modified = syncDate;
      changed = true;
    }
  }

  conference.metadata = {
    ...(conference.metadata ?? {}),
    ccfddl_sync: {
      source: "https://ccfddl.github.io/conference/allconf.yml",
      synced_at: syncDate,
      matched_title: match.conference.title,
      matched_by: match.reasons,
      selected_year: selectedDeadline?.selected_year ?? null,
    },
  };

  if (changed) {
    updatedCount += 1;
  }
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(`Matched ${matchedCount} / ${catalog.conferences.length} conferences with ccfddl.`);
console.log(`Updated ${updatedCount} conferences using ccfddl deadline data.`);

if (unmatched.length > 0) {
  console.log("Unmatched conferences:");
  console.log(unmatched.join(", "));
}
