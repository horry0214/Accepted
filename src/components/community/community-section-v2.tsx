"use client";

import {
  ChevronUp,
  Pencil,
  Languages,
  LoaderCircle,
  MessageSquarePlus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { CommunityComment, CommunityThreadBundle, Conference } from "@/lib/types";
import { cn } from "@/lib/utils";

type CommunitySectionProps = {
  conference: Conference;
  initialThreads: CommunityThreadBundle[];
  isAuthenticated: boolean;
  currentUserId: string | null;
};

type ThreadSortMode = "latest" | "top" | "replies";
type ThreadFilterMode = "all" | "mine" | "discussed" | "unanswered";
const INITIAL_THREAD_COUNT = 6;
const LOAD_MORE_THREADS = 4;

export function CommunitySectionV2({
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
  const [success, setSuccess] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<ThreadSortMode>("latest");
  const [filterMode, setFilterMode] = useState<ThreadFilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleThreadCount, setVisibleThreadCount] = useState(INITIAL_THREAD_COUNT);
  const router = useRouter();

  const sortedThreads = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const nextThreads = threads.filter((thread) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        thread.title.toLowerCase().includes(normalizedQuery) ||
        thread.content.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "mine" && currentUserId === thread.user_id) ||
        (filterMode === "discussed" && thread.comments.length > 0) ||
        (filterMode === "unanswered" && thread.comments.length === 0);

      return matchesQuery && matchesFilter;
    });

    if (sortMode === "top") {
      nextThreads.sort((left, right) => {
        if (right.upvotes !== left.upvotes) {
          return right.upvotes - left.upvotes;
        }
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
      return nextThreads;
    }

    if (sortMode === "replies") {
      nextThreads.sort((left, right) => {
        if (right.comments.length !== left.comments.length) {
          return right.comments.length - left.comments.length;
        }
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
      return nextThreads;
    }

    nextThreads.sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
    return nextThreads;
  }, [currentUserId, filterMode, searchQuery, sortMode, threads]);

  const visibleThreads = useMemo(
    () => sortedThreads.slice(0, visibleThreadCount),
    [sortedThreads, visibleThreadCount],
  );

  async function createThread(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

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
      setSuccess("Thread posted successfully.");
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
              ? "Only authors can delete their own content. Voting and posting are protected by RLS."
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
        {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {sortedThreads.length} thread{sortedThreads.length === 1 ? "" : "s"} in this venue · showing{" "}
          {Math.min(sortedThreads.length, visibleThreadCount)}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-full border border-border bg-white/70 px-4 py-2 text-sm dark:bg-white/5">
            <Search className="size-4 text-muted" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setVisibleThreadCount(INITIAL_THREAD_COUNT);
              }}
              placeholder="Search threads"
              className="w-44 bg-transparent outline-none placeholder:text-muted"
            />
          </label>
          <div className="inline-flex rounded-full border border-border bg-white/70 p-1 text-sm dark:bg-white/5">
            <SortButton active={sortMode === "latest"} onClick={() => setSortMode("latest")}>
              Latest
            </SortButton>
            <SortButton active={sortMode === "top"} onClick={() => setSortMode("top")}>
              Top
            </SortButton>
            <SortButton active={sortMode === "replies"} onClick={() => setSortMode("replies")}>
              Replies
            </SortButton>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterChip
          active={filterMode === "all"}
          onClick={() => {
            setFilterMode("all");
            setVisibleThreadCount(INITIAL_THREAD_COUNT);
          }}
        >
          All
        </FilterChip>
        <FilterChip
          active={filterMode === "mine"}
          onClick={() => {
            setFilterMode("mine");
            setVisibleThreadCount(INITIAL_THREAD_COUNT);
          }}
        >
          My threads
        </FilterChip>
        <FilterChip
          active={filterMode === "discussed"}
          onClick={() => {
            setFilterMode("discussed");
            setVisibleThreadCount(INITIAL_THREAD_COUNT);
          }}
        >
          With replies
        </FilterChip>
        <FilterChip
          active={filterMode === "unanswered"}
          onClick={() => {
            setFilterMode("unanswered");
            setVisibleThreadCount(INITIAL_THREAD_COUNT);
          }}
        >
          Unanswered
        </FilterChip>
      </div>

      <div className="mt-4 space-y-4">
        {sortedThreads.length === 0 ? (
          <div className="rounded-[1.7rem] border border-dashed border-border px-5 py-10 text-sm leading-7 text-muted">
            No discussions yet. Start the first thread for this venue.
          </div>
        ) : (
          visibleThreads.map((thread) => (
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
              onThreadDeleted={(threadId) =>
                setThreads((current) => current.filter((threadItem) => threadItem.id !== threadId))
              }
            />
          ))
        )}
      </div>

      {sortedThreads.length > visibleThreadCount ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisibleThreadCount((current) =>
                Math.min(sortedThreads.length, current + LOAD_MORE_THREADS),
              )
            }
            className="rounded-full border border-border bg-white/70 px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent dark:bg-white/5"
          >
            Load more threads
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ThreadCard({
  thread,
  currentUserId,
  onThreadUpdated,
  onThreadDeleted,
}: {
  thread: CommunityThreadBundle;
  currentUserId: string | null;
  onThreadUpdated: (thread: CommunityThreadBundle) => void;
  onThreadDeleted: (threadId: string) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [translationMap, setTranslationMap] = useState<Record<string, string>>({});
  const [pendingReply, setPendingReply] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editingThreadTitle, setEditingThreadTitle] = useState(thread.title);
  const [editingThreadContent, setEditingThreadContent] = useState(thread.content);
  const [pendingThreadSave, setPendingThreadSave] = useState(false);

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
    setSuccess(null);

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
      setSuccess("Reply posted.");
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Unable to post reply");
    } finally {
      setPendingReply(false);
    }
  }

  async function vote(targetId: string, targetType: "thread" | "comment") {
    setError(null);
    const response = await fetch("/api/community/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId,
        targetType,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Unable to update vote");
      return;
    }

    if (targetType === "thread") {
      onThreadUpdated({
        ...thread,
        upvotes: payload.upvotes as number,
        viewer_has_voted: payload.voted as boolean,
      });
      return;
    }

    onThreadUpdated({
      ...thread,
      comments: thread.comments.map((comment) =>
        comment.id === targetId
          ? {
              ...comment,
              upvotes: payload.upvotes as number,
              viewer_has_voted: payload.voted as boolean,
            }
          : comment,
      ),
    });
  }

  async function deleteThread() {
    setPendingDelete(thread.id);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/community/threads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: thread.id }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Unable to delete thread");
      setPendingDelete(null);
      return;
    }

    onThreadDeleted(thread.id);
  }

  async function updateThread() {
    setPendingThreadSave(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/community/threads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: thread.id,
        title: editingThreadTitle,
        content: editingThreadContent,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Unable to update thread");
      setPendingThreadSave(false);
      return;
    }

    onThreadUpdated({
      ...thread,
      ...(payload.thread as Partial<CommunityThreadBundle>),
      comments: thread.comments,
      viewer_has_voted: thread.viewer_has_voted,
    });
    setIsEditingThread(false);
    setSuccess("Thread updated.");
    setPendingThreadSave(false);
  }

  async function deleteComment(commentId: string) {
    setPendingDelete(commentId);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/community/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Unable to delete comment");
      setPendingDelete(null);
      return;
    }

    onThreadUpdated({
      ...thread,
      comments: thread.comments.filter(
        (comment) => comment.id !== commentId && comment.parent_comment_id !== commentId,
      ),
    });
    setSuccess("Comment deleted.");
    setPendingDelete(null);
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
  const isOwnThread = currentUserId === thread.user_id;

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
        <div className="flex items-center gap-2">
          {isOwnThread ? (
            <button
              type="button"
              onClick={() => {
                setIsEditingThread((current) => !current);
                setEditingThreadTitle(thread.title);
                setEditingThreadContent(thread.content);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
            >
              <Pencil className="size-4" />
              Edit
            </button>
          ) : null}
          {isOwnThread ? (
            <button
              type="button"
              onClick={deleteThread}
              disabled={pendingDelete === thread.id}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:border-rose-400 hover:text-rose-500 disabled:opacity-60"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          ) : null}
          <VoteButton
            count={thread.upvotes}
            active={Boolean(thread.viewer_has_voted)}
            onClick={() => vote(thread.id, "thread")}
          />
        </div>
      </div>

      {isEditingThread ? (
        <div className="mt-4 space-y-3 rounded-[1.3rem] border border-border p-4">
          <input
            value={editingThreadTitle}
            onChange={(event) => setEditingThreadTitle(event.target.value)}
            className="w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm outline-none dark:bg-white/5"
          />
          <textarea
            value={editingThreadContent}
            onChange={(event) => setEditingThreadContent(event.target.value)}
            className="min-h-28 w-full rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm leading-7 outline-none dark:bg-white/5"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted">
              {editingThreadContent.trim().length} / 6000 characters
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingThread(false);
                  setEditingThreadTitle(thread.title);
                  setEditingThreadContent(thread.content);
                }}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateThread}
                disabled={
                  pendingThreadSave ||
                  !editingThreadTitle.trim() ||
                  !editingThreadContent.trim()
                }
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              >
                {pendingThreadSave ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{thread.content}</p>
      )}

      {success ? <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}

      <div className="mt-6 space-y-4 border-t border-border pt-5">
        {rootComments.map((comment) => (
          <div key={comment.id} className="space-y-3 rounded-[1.4rem] border border-border p-4">
            <CommentBody
              comment={comment}
              currentUserId={currentUserId}
              translated={translationMap[comment.id]}
              onTranslate={() => translate(comment.id, comment.content)}
              onVote={() => vote(comment.id, "comment")}
              onDelete={() => deleteComment(comment.id)}
              onCommentUpdated={(updatedComment) =>
                onThreadUpdated({
                  ...thread,
                  comments: thread.comments.map((commentItem) =>
                    commentItem.id === updatedComment.id ? updatedComment : commentItem,
                  ),
                })
              }
              deleting={pendingDelete === comment.id}
            />
            {(commentsByParent.get(comment.id) ?? []).map((child) => (
              <div
                key={child.id}
                className="ml-3 rounded-[1.2rem] border border-border bg-slate-50/80 p-4 dark:bg-slate-900/40"
              >
                <CommentBody
                  comment={child}
                  currentUserId={currentUserId}
                  translated={translationMap[child.id]}
                  onTranslate={() => translate(child.id, child.content)}
                  onVote={() => vote(child.id, "comment")}
                  onDelete={() => deleteComment(child.id)}
                  onCommentUpdated={(updatedComment) =>
                    onThreadUpdated({
                      ...thread,
                      comments: thread.comments.map((commentItem) =>
                        commentItem.id === updatedComment.id ? updatedComment : commentItem,
                      ),
                    })
                  }
                  deleting={pendingDelete === child.id}
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
              Replies are stored in Supabase comments with one-level threading. {replyText.trim().length} / 3000
            </span>
            <div className="flex items-center gap-2">
              {replyText.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => setReplyText("")}
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:text-foreground"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                disabled={pendingReply || !currentUserId || !replyText.trim()}
                onClick={() => createReply(null)}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              >
                {pendingReply ? "Posting..." : "Post reply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function CommentBody({
  comment,
  currentUserId,
  translated,
  onTranslate,
  onVote,
  onDelete,
  onCommentUpdated,
  deleting,
}: {
  comment: CommunityComment;
  currentUserId: string | null;
  translated?: string;
  onTranslate: () => void;
  onVote: () => void;
  onDelete: () => void;
  onCommentUpdated: (comment: CommunityComment) => void;
  deleting: boolean;
}) {
  const isOwner = currentUserId === comment.user_id;
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(comment.content);
  const [pendingSave, setPendingSave] = useState(false);

  async function saveComment() {
    setPendingSave(true);

    const response = await fetch("/api/community/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commentId: comment.id,
        content: editingContent,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setPendingSave(false);
      return;
    }

    const updatedComment = {
      ...comment,
      ...(payload.comment as Partial<CommunityComment>),
      content: (payload.comment?.content as string) ?? editingContent,
    };
    onCommentUpdated(updatedComment);
    setEditingContent(updatedComment.content);
    setIsEditing(false);
    setPendingSave(false);
  }

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
        <div className="flex items-center gap-2">
          {isOwner ? (
            <button
              type="button"
              onClick={() => {
                setIsEditing((current) => !current);
                setEditingContent(comment.content);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
            >
              <Pencil className="size-4" />
              Edit
            </button>
          ) : null}
          {isOwner ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:border-rose-400 hover:text-rose-500 disabled:opacity-60"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          ) : null}
          <VoteButton
            count={comment.upvotes}
            active={Boolean(comment.viewer_has_voted)}
            onClick={onVote}
          />
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-3 rounded-[1rem] border border-border p-3">
          <textarea
            value={editingContent}
            onChange={(event) => setEditingContent(event.target.value)}
            className="min-h-24 w-full rounded-[1rem] border border-border bg-white/70 px-4 py-3 text-sm leading-7 outline-none dark:bg-white/5"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted">{editingContent.trim().length} / 3000</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingContent(comment.content);
                }}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveComment}
                disabled={pendingSave || !editingContent.trim()}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-accent disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              >
                {pendingSave ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-7">{comment.content}</p>
      )}
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

function VoteButton({
  count,
  active,
  onClick,
}: {
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-muted hover:border-accent hover:text-accent",
      )}
    >
      <ChevronUp className="size-4" />
      {count}
    </button>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 transition",
        active
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-2 text-sm transition",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-white/70 text-muted hover:border-accent hover:text-accent dark:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}
