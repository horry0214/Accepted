import Image from "next/image";
import Link from "next/link";
import { Bell, UserCircle2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { AuthButton } from "@/components/auth/auth-button";
import type { UserProfile } from "@/lib/types";
import { LanguageToggleV2 } from "@/components/ui/language-toggle-v2";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function SiteHeader({
  user,
  profile,
  notificationCount,
}: {
  user: User | null;
  profile: UserProfile | null;
  notificationCount: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-condensed text-2xl font-semibold tracking-[0.18em] text-accent">
              ACCEPTED
            </span>
            <span className="hidden text-sm text-muted md:inline">
              CCF deadlines, community, and planning
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/profile"
                className="relative inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-2 text-sm text-muted transition hover:border-accent hover:text-accent dark:bg-white/5"
              >
                <Bell className="size-4" />
                Alerts
                {notificationCount > 0 ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                    {notificationCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-2 text-sm text-muted transition hover:border-accent hover:text-accent dark:bg-white/5"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Profile"}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle2 className="size-4" />
                )}
                My Posts
              </Link>
            </>
          ) : null}
          <LanguageToggleV2 />
          <ThemeToggle />
          <AuthButton
            isAuthenticated={Boolean(user)}
            userName={profile?.full_name ?? profile?.username ?? user?.user_metadata?.full_name ?? null}
          />
        </div>
      </div>
    </header>
  );
}
