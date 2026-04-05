import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/ui/site-header";
import {
  getCurrentProfile,
  getCurrentUser,
  getNotificationsForCurrentUser,
} from "@/lib/data";

import "./globals.css";

export const metadata: Metadata = {
  title: "Accepted",
  description: "CCF conference deadline tracker, community, and AI-assisted submission planning.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, profile, notifications] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getNotificationsForCurrentUser(),
  ]);

  return (
    <html
      lang="zh"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <Providers>
          <div className="relative flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(32,108,195,0.16),_transparent_36%),linear-gradient(180deg,_#f7f6f2_0%,_#ffffff_38%,_#edf4f7_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.14),_transparent_30%),linear-gradient(180deg,_#08111f_0%,_#07111a_50%,_#050910_100%)] dark:text-slate-100">
            <SiteHeader user={user} profile={profile} notificationCount={notifications.length} />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
