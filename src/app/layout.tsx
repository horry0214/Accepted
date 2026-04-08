import type { Metadata } from "next";
import { IBM_Plex_Sans_Condensed, Manrope, Newsreader } from "next/font/google";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/ui/site-header";
import {
  getCurrentProfile,
  getCurrentUser,
  getNotificationsForCurrentUser,
} from "@/lib/data";
import { getSiteUrl, homeKeywords } from "@/lib/site";

import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const condensed = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Accepted | CCF DDL Tracker and Conference Deadlines",
    template: "%s | Accepted",
  },
  description:
    "Accepted is a CCF DDL tracker for computer science researchers, covering conference deadlines, CCF rankings, CORE rankings, and venue context.",
  keywords: homeKeywords,
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
      className={`h-full antialiased ${sans.variable} ${serif.variable} ${condensed.variable}`}
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
