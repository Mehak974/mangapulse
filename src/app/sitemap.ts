import { MetadataRoute } from "next";
import { fetchPopular, getFallbackMangaList } from "@/lib/anilist";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mangapulse.co";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Fetch popular titles to index dynamic detail and release-date countdown pages
  let mangaList = [];
  try {
    mangaList = await fetchPopular(1, 50);
  } catch {
    mangaList = getFallbackMangaList();
  }

  const mangaRoutes: MetadataRoute.Sitemap = (mangaList || []).flatMap((manga) => [
    {
      url: `${baseUrl}/manga/${manga.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/release-date/${manga.slug}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ]);

  return [...staticRoutes, ...mangaRoutes];
}
