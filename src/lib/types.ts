export type Locale = "en" | "zh";

export type CoreRank = "A*" | "A" | "B" | "C" | "Unranked";

export type Conference = {
  id?: string;
  slug: string;
  name: string;
  full_name: string;
  ccf_rank: "A" | "B" | "C" | "Other";
  core_rank: CoreRank | null;
  category_name: string;
  category_description: string | null;
  subcategories: string[];
  description: string | null;
  website: string | null;
  annual: string | null;
  deadline: string | null;
  deadline_note: string | null;
  deadline_timezone: string | null;
  deadline_type: "aoe" | "conference_local" | "unknown";
  deadline_extension_probability: number | null;
  conference_date: string | null;
  conference_location: string | null;
  page_limit: string | null;
  acceptance_rate: string | null;
  source_last_modified: string | null;
  metadata?: Record<string, unknown>;
};

export type CommunityThread = {
  id: string;
  conference_id: string;
  user_id: string;
  title: string;
  content: string;
  upvotes: number;
  created_at: string;
  updated_at?: string;
  author_name?: string | null;
  author_avatar?: string | null;
  viewer_has_voted?: boolean;
};

export type CommunityComment = {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  created_at: string;
  parent_comment_id: string | null;
  author_name?: string | null;
  author_avatar?: string | null;
  viewer_has_voted?: boolean;
};

export type CommunityThreadBundle = CommunityThread & {
  comments: CommunityComment[];
};

export type UserProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type CommunityNotification = {
  id: string;
  thread_id: string;
  thread_title: string;
  conference_name: string | null;
  conference_slug: string | null;
  comment_id: string;
  comment_content: string;
  comment_author_name: string | null;
  comment_author_avatar: string | null;
  created_at: string;
};

export type RoutePlanResult = {
  primaryTarget: string;
  rationale: string;
  fallbackTargets: string[];
  timelineAdvice: string[];
};
