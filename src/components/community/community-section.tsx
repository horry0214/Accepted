"use client";

import { ChevronUp, Languages, LoaderCircle, MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { CommunityComment, CommunityThreadBundle, Conference } from "@/lib/types";

type CommunitySectionProps = {
  conference: Conference;
  initialThreads: CommunityThreadBundle[];
  isAuthenticated: boolean;
  currentUserId: string | null;
};

export function CommunitySection({
  conference,
  initialThreads,
  isAuthenticated,
  currentUserId,
}: CommunitySectionProps) {
  const [threads, setThreads] = useState(initialThreads);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadContent, setThreadContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function createThread(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/community/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conferenceId: conference.id,
          title: threadTitle,
          content: threadContent,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create thread");
      }

      setThreads((current) => [payload.thread as CommunityThreadBundle, ...current]);
      setThreadTitle("");
      setThreadContent("");
      router.refresh();
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : "Unable to create thread");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel rounded-[2rem] p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-accent/12 p-3 text-accent">
          <MessageSquarePlus className="size-5" />
        </div>
        <div>
          <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">Community</p>
          <h2 className="section-title text-3xl font-semibold">Conference hub</h2>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-muted">
        Share venue fit, reviews, rebuttal tactics, template tips, and internal deadline reminders.
      </p>

      <form className="mt-6 space-y-3" onSubmit={createThread}>
        <input
          value={threadTitle}
          onChange={(event) => setThreadTitle(event.target.value)}
          placeholder="Thread title"
          disabled={!isAuthenticated || !conference.id}
          className="w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/5"
        />
        <textarea
          value={threadContent}
          onChange={(event) => setThreadContent(event.target.value)}
          placeholder="Share your notes, questions, or submission strategy..."
          disabled={!isAuthenticated || !conference.id}
          className="min-h-28 w-full rounded-[1.5rem] border border-border bg-white/70 px-4 py-4 text-sm leading-7 outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/5"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {isAuthenticated
              ? "Only authors can edit their own content. Voting and posting are protected by RLS."
              : "Sign in with Google or GitHub to post, reply, vote, and use translation."}
          </p>
          <button
            type="submit"
            disabled={
              loading ||
              !isAuthenticated ||
              !conference.id ||
              !threadTitle.trim() ||
              !threadContent.trim()
            }
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Post thread
          </button>
        </div>
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      </form>

      <div className="mt-8 space-y-4">
        {threads.length === 0 ? (
          <div className="rounded-[1.7rem] border border-dashed border-border px-5 py-10 text-sm leading-7 text-muted">
            No discussions yet. Start the first thread for this venue.
          </div>
        ) : (
          threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              currentUserId={currentUserId}
              onThreadUpdated={(updatedThread) =>
                setThreads((current) =>
                  current.map((threadItem) =>
                    threadItem.id === updatedThread.id ? updatedThread : threadItem,
                  ),
                )
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

function ThreadCard({
  thread,
  currentUserId,
  onThreadUpdated,
}: {
  thread: CommunityThreadBundle;
  currentUserId: string | null;
  onThreadUpdated: (thread: CommunityThreadBundle) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [translationMap, setTranslationMap] = useState<Record<string, string>>({});
  const [pendingReply, setPendingReply] = useState(false);

  const commentsByParent = useMemo(() => {
    const map = new Map<string | null, CommunityComment[]>();
    for (const comment of thread.comments) {
      const key = comment.parent_comment_id;
      const group = map.get(key) ?? [];
      group.push(comment);
      map.set(key, group);
    }
    return map;
  }, [thread.comments]);

  async function createReply(parentCommentId?: string | null) {
    setPendingReply(true);
    setError(null);

    try {
      const response = await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread.id,
          parentCommentId: parentCommentId ?? null,
          content: replyText,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to post reply");
      }

      onThreadUpdated({
        ...thread,
        comments: [...thread.comments, payload.comment as CommunityComment],
      });
      setReplyText("");
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Unable to post reply");
    } finally {
      setPendingReply(false);
    }
  }

  async function vote(targetId: string, targetType: "thread" | "comment") {
    const response = await fetch("/api/community/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId,
        targetType,
      }),
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();

    if (targetType === "thread") {
      onThreadUpdated({
        ...thread,
        upvotes: payload.upvotes as number,
      });
      return;
    }

    onThreadUpdated({
      ...thread,
      comments: thread.comments.map((comment) =>
        comment.id === targetId ? { ...comment, upvotes: payload.upvotes as number } : comment,
      ),
    });
  }

  async function translate(commentId: string, content: string) {
    const response = await fetch("/api/ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Translation unavailable");
      return;
    }

    setTranslationMap((current) => ({
      ...current,
      [commentId]: payload.translation as string,
    }));
  }

  const rootComments = commentsByParent.get(null) ?? [];

  return (
    <article className="rounded-[1.7rem] border border-border bg-white/70 p-5 dark:bg-white/5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-semibold">{thread.title}</h3>
          <p className="text-sm text-muted">
            {thread.author_name ?? "Accepted user"} ·{" "}
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(thread.created_at),
            )}
          </p>
        </div>
        <VoteButton count={thread.upvotes} onClick={() => vote(thread.id, "thread")} />
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{thread.content}</p>

      <div className="mt-6 space-y-4 border-t border-border pt-5">
        {rootComments.map((comment) => (
          <div key={comment.id} className="space-y-3 rounded-[1.4rem] border border-border p-4">
            <CommentBody
              comment={comment}
              translated={translationMap[comment.id]}
              onTranslate={() => translate(comment.id, comment.content)}
              onVote={() => vote(comment.id, "comment")}
            />
            {(commentsByParent.get(comment.id) ?? []).map((child) => (
              <div
                key={child.id}
                className="ml-3 rounded-[1.2rem] border border-border bg-slate-50/80 p-4 dark:bg-slate-900/40"
              >
                <CommentBody
                  comment={child}
                  translated={translationMap[child.id]}
                  onTranslate={() => translate(child.id, child.content)}
                  onVote={() => vote(child.id, "comment")}
                />
              </div>
            ))}
          </div>
        ))}

        <div className="space-y-3 rounded-[1.4rem] border border-border p-4">
          <textarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder={
              currentUserId
                ? "Write a reply, review note, or submission suggestion..."
                : "Sign in to reply"
            }
            disabled={!currentUserId}
            className="min-h-24 w-full rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm leading-7 outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white/5"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">
              Replies are stored in Supabase comments with one-level threading.
            </span>
            <button
              type="button"
              disabled={pendingReply || !currentUserId || !replyText.trim()}
              onClick={() => createReply(null)}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              {pendingReply ? "Posting..." : "Post reply"}
            </button>
          </div>
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        </div>
      </div>
    </article>
  );
}

function CommentBody({
  comment,
  translated,
  onTranslate,
  onVote,
}: {
  comment: CommunityComment;
  translated?: string;
  onTranslate: () => void;
  onVote: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{comment.author_name ?? "Accepted user"}</p>
          <p className="text-xs text-muted">
            {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(comment.created_at),
            )}
          </p>
        </div>
        <VoteButton count={comment.upvotes} onClick={onVote} />
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7">{comment.content}</p>
      {translated ? (
        <div className="rounded-[1rem] border border-accent/20 bg-accent/6 px-4 py-3 text-sm leading-7">
          {translated}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onTranslate}
        className="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent-strong"
      >
        <Languages className="size-4" />
        Translate
      </button>
    </div>
  );
}

function VoteButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
    >
      <ChevronUp className="size-4" />
      {count}
    </button>
  );
}
