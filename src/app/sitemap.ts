import type { MetadataRoute } from "next";

import { getConferenceCatalog } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const conferences = await getConferenceCatalog();

  const conferenceRoutes = conferences.map((conference) => ({
    url: `${siteUrl}/conference/${conference.slug}`,
    lastModified: conference.source_last_modified ?? new Date().toISOString(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/profile`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...conferenceRoutes,
  ];
}
