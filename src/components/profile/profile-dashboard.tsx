"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, CheckCheck, LoaderCircle, UserCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { CommunityNotification, CommunityThreadBundle, UserProfile } from "@/lib/types";

type MyThread = CommunityThreadBundle & {
  conference_name?: string;
  conference_slug?: string;
};

const STORAGE_PREFIX = "accepted-notification-last-read";

export function ProfileDashboard({
  profile,
  fallbackName,
  threads,
  notifications,
}: {
  profile: UserProfile | null;
  fallbackName: string;
  threads: MyThread[];
  notifications: CommunityNotification[];
}) {
  const currentPublicName = profile?.full_name ?? profile?.username ?? fallbackName;
  const [displayName, setDisplayName] = useState(currentPublicName);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);

  const storageKey = `${STORAGE_PREFIX}:${profile?.id ?? fallbackName}`;

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    setLastReadAt(stored);
  }, [storageKey]);

  const unreadNotifications = useMemo(() => {
    if (!lastReadAt) {
      return notifications;
    }

    const lastReadTime = new Date(lastReadAt).getTime();
    return notifications.filter(
      (notification) => new Date(notification.created_at).getTime() > lastReadTime,
    );
  }, [lastReadAt, notifications]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          avatar_url: avatarUrl,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update profile");
      }

      setDisplayName(payload.profile.full_name ?? payload.profile.username ?? displayName);
      setAvatarUrl(payload.profile.avatar_url ?? avatarUrl);
      setSuccess("Profile updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    setSuccess(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to upload avatar");
      }

      setAvatarUrl(payload.avatarUrl as string);
      setSuccess("Avatar uploaded. Save profile to persist it.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload avatar");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  function markAllRead() {
    const timestamp = new Date().toISOString();
    window.localStorage.setItem(storageKey, timestamp);
    setLastReadAt(timestamp);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-6">
        <div className="panel rounded-[2rem] p-8">
          <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">Profile</p>
          <div className="mt-6 flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-white/70 text-accent dark:bg-white/5">
                <UserCircle2 className="size-10" />
              </div>
            )}
            <div>
              <h1 className="section-title text-4xl font-semibold">{displayName}</h1>
              <p className="mt-2 text-sm text-muted">Public name shown on your posts and replies.</p>
            </div>
          </div>

          <form className="mt-6 space-y-3" onSubmit={saveProfile}>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Public name"
              className="w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm outline-none dark:bg-white/5"
            />
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent">
                {uploadingAvatar ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Upload avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-muted">Recommended: square image, under 2 MB</span>
            </div>
            <button
              type="submit"
              disabled={saving || uploadingAvatar || !displayName.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-accent disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Save profile
            </button>
            {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
            {error ? <p className="text-sm text-rose-500">{error}</p> : null}
          </form>
        </div>

        <div className="panel rounded-[2rem] p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">
                Notifications
              </p>
              <h2 className="section-title mt-3 text-3xl font-semibold">Community replies</h2>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
            >
              <CheckCheck className="size-4" />
              Mark all read
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
              <Bell className="size-4" />
              {unreadNotifications.length} unread
            </span>
            <span>{notifications.length} total reply notifications</span>
          </div>

          <div className="mt-6 space-y-4">
            {notifications.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-10 text-sm text-muted">
                No one has replied to your threads yet.
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = unreadNotifications.some((item) => item.id === notification.id);
                return (
                  <article
                    key={notification.id}
                    className={`rounded-[1.5rem] border p-4 ${
                      isUnread
                        ? "border-accent/35 bg-accent/6"
                        : "border-border bg-white/70 dark:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {notification.comment_author_name ?? "Accepted user"} replied to your thread
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {notification.thread_title} ·{" "}
                          {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(notification.created_at))}
                        </p>
                      </div>
                      {isUnread ? (
                        <span className="rounded-full bg-accent px-2 py-1 text-xs text-white">
                          Unread
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted">{notification.comment_content}</p>
                    {notification.conference_slug ? (
                      <Link
                        href={`/conference/${notification.conference_slug}`}
                        className="mt-3 inline-flex rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
                      >
                        Open discussion
                      </Link>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="panel rounded-[2rem] p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-condensed text-sm uppercase tracking-[0.24em] text-accent">
              My Posts
            </p>
            <h2 className="section-title mt-3 text-3xl font-semibold">Threads you started</h2>
          </div>
          <Link
            href="/"
            className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
          >
            Back home
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {threads.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border px-5 py-10 text-sm text-muted">
              You have not posted any threads yet.
            </div>
          ) : (
            threads.map((thread) => (
              <article
                key={thread.id}
                className="rounded-[1.5rem] border border-border bg-white/70 p-5 dark:bg-white/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold">{thread.title}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {thread.conference_name ?? "Conference"} ·{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(thread.created_at))}
                    </p>
                  </div>
                  {thread.conference_slug ? (
                    <Link
                      href={`/conference/${thread.conference_slug}`}
                      className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
                    >
                      Open thread venue
                    </Link>
                  ) : null}
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{thread.content}</p>
                <div className="mt-4 text-sm text-muted">
                  {thread.upvotes} upvotes · {thread.comments.length} comments
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
