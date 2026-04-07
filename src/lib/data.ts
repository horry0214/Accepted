import bundledCatalog from "@/data/conferences.generated.json";
import type {
  CommunityComment,
  CommunityNotification,
  CommunityThread,
  CommunityThreadBundle,
  Conference,
  CoreRank,
  UserProfile,
} from "@/lib/types";
import { getDeadlineTimestamp } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type ConferenceRow = {
  id?: string;
  slug: string;
  name: string;
  full_name: string;
  ccf_rank: string;
  core_rank?: string | null;
  category_name: string;
  category_description: string | null;
  subcategories?: string[] | null;
  description: string | null;
  website: string | null;
  annual: string | null;
  deadline?: string | null;
  deadline_note?: string | null;
  last_deadline?: string | null;
  last_deadline_note?: string | null;
  next_deadline?: string | null;
  next_deadline_note?: string | null;
  deadline_timezone: string | null;
  deadline_type: string;
  deadline_extension_probability?: number | string | null;
  conference_date: string | null;
  conference_location: string | null;
  page_limit: string | null;
  acceptance_rate: string | null;
  source_last_modified: string | null;
  metadata?: unknown;
};
type ThreadRow = CommunityThread;
type CommentRow = CommunityComment;
type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
  };
}

function normalizeText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeDeadline(value: unknown) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(normalized) ? normalized : null;
}

function normalizeCoreRank(value: unknown): CoreRank | null {
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

function normalizeDeadlineExtensionProbability(value: unknown) {
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

function asMetadataRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function resolveDeadline(row: ConferenceRow, metadata: Record<string, unknown>) {
  const nextDeadline = normalizeDeadline(row.next_deadline);
  const lastDeadline = normalizeDeadline(row.last_deadline);
  const deadline =
    normalizeDeadline(row.deadline) ?? normalizeDeadline(metadata.deadline) ?? nextDeadline ?? lastDeadline;
  const deadlineNote =
    normalizeText(row.deadline_note) ??
    normalizeText(metadata.deadline_note) ??
    (nextDeadline
      ? normalizeText(row.next_deadline_note)
      : normalizeText(row.last_deadline_note) ?? normalizeText(row.next_deadline_note));

  return { deadline, deadlineNote };
}

function mapConference(row: ConferenceRow): Conference {
  const metadata = asMetadataRecord(row.metadata);
  const { deadline, deadlineNote } = resolveDeadline(row, metadata);

  return {
    ...row,
    ccf_rank: ["A", "B", "C"].includes(row.ccf_rank) ? (row.ccf_rank as "A" | "B" | "C") : "Other",
    core_rank: normalizeCoreRank(row.core_rank ?? metadata.core_rank),
    subcategories: row.subcategories ?? [],
    deadline,
    deadline_note: deadlineNote,
    deadline_type:
      row.deadline_type === "aoe" || row.deadline_type === "conference_local"
        ? row.deadline_type
        : "unknown",
    deadline_extension_probability: normalizeDeadlineExtensionProbability(
      row.deadline_extension_probability ?? metadata.deadline_extension_probability,
    ),
    metadata,
  };
}

function sortConferencesByDeadline(conferences: Conference[]) {
  const now = Date.now();

  return [...conferences].sort((left, right) => {
    const leftTimestamp = getDeadlineTimestamp(left.deadline, left.deadline_timezone);
    const rightTimestamp = getDeadlineTimestamp(right.deadline, right.deadline_timezone);
    const leftIsFuture = leftTimestamp !== null && leftTimestamp >= now;
    const rightIsFuture = rightTimestamp !== null && rightTimestamp >= now;

    if (leftIsFuture && rightIsFuture) {
      if (leftTimestamp !== rightTimestamp) {
        return leftTimestamp - rightTimestamp;
      }
    } else if (leftIsFuture !== rightIsFuture) {
      return leftIsFuture ? -1 : 1;
    } else if (leftTimestamp !== null && rightTimestamp !== null) {
      if (leftTimestamp !== rightTimestamp) {
        return rightTimestamp - leftTimestamp;
      }
    } else if (leftTimestamp !== null || rightTimestamp !== null) {
      return leftTimestamp !== null ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

function mapThread(row: ThreadRow, profile?: ProfileRow | null): CommunityThread {
  return {
    ...row,
    author_name: profile?.full_name ?? profile?.username ?? null,
    author_avatar: profile?.avatar_url ?? null,
  };
}

function mapComment(row: CommentRow, profile?: ProfileRow | null): CommunityComment {
  return {
    ...row,
    author_name: profile?.full_name ?? profile?.username ?? null,
    author_avatar: profile?.avatar_url ?? null,
  };
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getCurrentUser() {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getConferenceCatalog() {
  const supabase = await createClient();

  if (!supabase) {
    return sortConferencesByDeadline((bundledCatalog.conferences as ConferenceRow[]).map(mapConference));
  }

  const { data, error } = await supabase.from("conferences").select("*");

  if (error || !data) {
    return sortConferencesByDeadline((bundledCatalog.conferences as ConferenceRow[]).map(mapConference));
  }

  return sortConferencesByDeadline((data as ConferenceRow[]).map(mapConference));
}

export async function getConferenceBySlug(slug: string) {
  const supabase = await createClient();

  if (!supabase) {
    return (
      (bundledCatalog.conferences as ConferenceRow[])
        .map(mapConference)
        .find((conference) => conference.slug === slug) ?? null
    );
  }

  const { data, error } = await supabase
    .from("conferences")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return (
      (bundledCatalog.conferences as ConferenceRow[])
        .map(mapConference)
        .find((conference) => conference.slug === slug) ?? null
    );
  }

  return mapConference(data as ConferenceRow);
}

export async function getThreadsForConference(conferenceId: string) {
  const supabase = await createClient();

  if (!supabase) {
    return [] as CommunityThreadBundle[];
  }

  const [{ data: threads, error: threadError }, { data: comments, error: commentError }] =
    await Promise.all([
      supabase.from("threads").select("*").eq("conference_id", conferenceId).order("created_at", {
        ascending: false,
      }),
      supabase.from("comments").select("*").order("created_at", { ascending: true }),
    ]);

  if (threadError || commentError || !threads) {
    return [] as CommunityThreadBundle[];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userIds = Array.from(
    new Set([
      ...threads.map((thread) => thread.user_id),
      ...(comments ?? []).map((comment) => comment.user_id),
    ]),
  );

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("*").in("id", userIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const voteTargetIds = [...threads.map((thread) => thread.id), ...(comments ?? []).map((comment) => comment.id)];
  const { data: votes } =
    user && voteTargetIds.length > 0
      ? await supabase
          .from("votes")
          .select("target_id")
          .eq("user_id", user.id)
          .in("target_id", voteTargetIds)
      : { data: [] as { target_id: string }[] };
  const voteSet = new Set((votes ?? []).map((vote) => vote.target_id));

  const commentsByThread = new Map<string, CommunityComment[]>();
  for (const comment of comments ?? []) {
    const list = commentsByThread.get(comment.thread_id) ?? [];
    list.push({
      ...mapComment(comment, profileMap.get(comment.user_id)),
      viewer_has_voted: voteSet.has(comment.id),
    });
    commentsByThread.set(comment.thread_id, list);
  }

  return threads.map((thread) => ({
    ...mapThread(thread, profileMap.get(thread.user_id)),
    viewer_has_voted: voteSet.has(thread.id),
    comments: commentsByThread.get(thread.id) ?? [],
  }));
}

export async function getCurrentProfile() {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function getThreadsForCurrentUser() {
  const supabase = await createClient();

  if (!supabase) {
    return [] as Array<CommunityThreadBundle & { conference_name?: string; conference_slug?: string }>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [] as Array<CommunityThreadBundle & { conference_name?: string; conference_slug?: string }>;
  }

  const { data: threads, error } = await supabase
    .from("threads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !threads) {
    return [] as Array<CommunityThreadBundle & { conference_name?: string; conference_slug?: string }>;
  }

  const threadIds = threads.map((thread) => thread.id);
  const conferenceIds = Array.from(new Set(threads.map((thread) => thread.conference_id)));
  const [{ data: comments }, { data: conferences }, { data: profile }] = await Promise.all([
    threadIds.length
      ? supabase.from("comments").select("*").in("thread_id", threadIds).order("created_at", { ascending: true })
      : { data: [] as CommentRow[] },
    conferenceIds.length
      ? supabase.from("conferences").select("id,name,slug").in("id", conferenceIds)
      : { data: [] as Array<{ id: string; name: string; slug: string }> },
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  const conferenceMap = new Map((conferences ?? []).map((conference) => [conference.id, conference]));
  const commentsByThread = new Map<string, CommunityComment[]>();

  for (const comment of comments ?? []) {
    const list = commentsByThread.get(comment.thread_id) ?? [];
    list.push({
      ...mapComment(comment as CommentRow, profile ? (profile as ProfileRow) : null),
      viewer_has_voted: false,
    });
    commentsByThread.set(comment.thread_id, list);
  }

  return threads.map((thread) => {
    const conference = conferenceMap.get(thread.conference_id);
    return {
      ...mapThread(thread as ThreadRow, profile ? (profile as ProfileRow) : null),
      comments: commentsByThread.get(thread.id) ?? [],
      conference_name: conference?.name,
      conference_slug: conference?.slug,
    };
  });
}

export async function getNotificationsForCurrentUser() {
  const supabase = await createClient();

  if (!supabase) {
    return [] as CommunityNotification[];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [] as CommunityNotification[];
  }

  const { data: threads, error: threadError } = await supabase
    .from("threads")
    .select("id,title,conference_id")
    .eq("user_id", user.id);

  if (threadError || !threads || threads.length === 0) {
    return [] as CommunityNotification[];
  }

  const threadIds = threads.map((thread) => thread.id);
  const conferenceIds = Array.from(new Set(threads.map((thread) => thread.conference_id)));
  const [{ data: comments }, { data: conferences }, { data: profiles }] = await Promise.all([
    supabase
      .from("comments")
      .select("*")
      .in("thread_id", threadIds)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false }),
    conferenceIds.length
      ? supabase.from("conferences").select("id,name,slug").in("id", conferenceIds)
      : { data: [] as Array<{ id: string; name: string; slug: string }> },
    supabase.from("profiles").select("*"),
  ]);

  const threadMap = new Map(threads.map((thread) => [thread.id, thread]));
  const conferenceMap = new Map((conferences ?? []).map((conference) => [conference.id, conference]));
  const profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));

  return (comments ?? []).map((comment) => {
    const thread = threadMap.get(comment.thread_id);
    const conference = thread ? conferenceMap.get(thread.conference_id) : null;
    const profile = profileMap.get(comment.user_id);

    return {
      id: `${comment.id}:${thread?.id ?? "thread"}`,
      thread_id: comment.thread_id,
      thread_title: thread?.title ?? "Thread",
      conference_name: conference?.name ?? null,
      conference_slug: conference?.slug ?? null,
      comment_id: comment.id,
      comment_content: comment.content,
      comment_author_name: profile?.full_name ?? profile?.username ?? null,
      comment_author_avatar: profile?.avatar_url ?? null,
      created_at: comment.created_at,
    };
  });
}
