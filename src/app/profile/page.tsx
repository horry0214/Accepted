import { redirect } from "next/navigation";

import { ProfileDashboard } from "@/components/profile/profile-dashboard";
import {
  getCurrentProfile,
  getCurrentUser,
  getNotificationsForCurrentUser,
  getThreadsForCurrentUser,
} from "@/lib/data";

export default async function ProfilePage() {
  const [user, profile, threads, notifications] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getThreadsForCurrentUser(),
    getNotificationsForCurrentUser(),
  ]);

  if (!user) {
    redirect("/");
  }

  const displayName =
    profile?.full_name ??
    profile?.username ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    "Accepted user";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <ProfileDashboard
        profile={profile}
        fallbackName={displayName ?? "Accepted user"}
        threads={threads}
        notifications={notifications}
      />
    </main>
  );
}
