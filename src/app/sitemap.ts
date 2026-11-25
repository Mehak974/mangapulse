import { MetadataRoute } from "next";
import { fetchPopular, fetchTrending, getFallbackMangaList, slugify } from "@/lib/anilist";
import { MangaItem } from "@/types/manga";
import { SITE_URL } from "@/lib/seo";
import { getAllDelistedSlugs } from "@/lib/mangaOverrides";
import { getVisitedPages } from "@/lib/visitedPages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const now = new Date();

  const urlMap = new Map<string, MetadataRoute.Sitemap[number]>();

  const addRoute = (route: MetadataRoute.Sitemap[number]) => {
    if (!urlMap.has(route.url)) {
      urlMap.set(route.url, route);
    }
  };

  // 1. Static Core Pages
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
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
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

  staticRoutes.forEach(addRoute);

  // 2. Fetch popular and trending titles to index dynamic detail and countdown pages
  const mangaPool: MangaItem[] = [];
  try {
    const [page1Res, page2Res, trendingRes] = await Promise.allSettled([
      fetchPopular(1, 50),
      fetchPopular(2, 50),
      fetchTrending(1, 50),
    ]);
    if (page1Res.status === "fulfilled" && Array.isArray(page1Res.value)) {
      mangaPool.push(...page1Res.value);
    }
    if (page2Res.status === "fulfilled" && Array.isArray(page2Res.value)) {
      mangaPool.push(...page2Res.value);
    }
    if (trendingRes.status === "fulfilled" && Array.isArray(trendingRes.value)) {
      mangaPool.push(...trendingRes.value);
    }
  } catch {
    // Network or rate limit fallback
  }

  // Always append verified fallback titles to guarantee indexing top series
  const fallbackList = getFallbackMangaList();
  mangaPool.push(...fallbackList);

  // Deduplicate by ID
  const seenIds = new Set<number>();
  const uniqueManga: MangaItem[] = [];
  for (const m of mangaPool) {
    if (m && m.id && !seenIds.has(m.id)) {
      seenIds.add(m.id);
      uniqueManga.push(m);
    }
  }

  // 3. Generate both pure title URLs (/manga/[title]) and ID-based URLs (/manga/[title]-[id])
  const delistedList = await getAllDelistedSlugs();
  const delistedSet = new Set(delistedList.map((s) => s.toLowerCase()));

  for (const manga of uniqueManga) {
    const titleSlug = slugify(manga.displayTitle);
    const fullSlug = manga.slug;

    // Exclude delisted DMCA titles from sitemap
    if (delistedSet.has(titleSlug) || delistedSet.has(fullSlug.toLowerCase())) {
      continue;
    }

    // Pure title manga page (e.g. https://www.mangapulse.co/manga/one-piece)
    if (titleSlug) {
      addRoute({
        url: `${baseUrl}/manga/${titleSlug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.85,
      });

      // Pure title release countdown page (e.g. https://www.mangapulse.co/release-date/one-piece)
      addRoute({
        url: `${baseUrl}/release-date/${titleSlug}`,
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.85,
      });
    }

    // ID-based manga page (e.g. https://www.mangapulse.co/manga/one-piece-30013)
    if (fullSlug && fullSlug !== titleSlug) {
      addRoute({
        url: `${baseUrl}/manga/${fullSlug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });

      // ID-based countdown page (e.g. https://www.mangapulse.co/release-date/one-piece-30013)
      addRoute({
        url: `${baseUrl}/release-date/${fullSlug}`,
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.8,
      });
    }
  }

  // 4. Incorporate all user-visited and dynamically discovered pages
  try {
    const visitedPages = await getVisitedPages();
    for (const vp of visitedPages) {
      const pathLower = vp.path.toLowerCase();
      const isDelisted = Array.from(delistedSet).some((slug) =>
        pathLower.includes(`/manga/${slug}`) || pathLower.includes(`/release-date/${slug}`)
      );
      if (!isDelisted) {
        addRoute({
          url: vp.url,
          lastModified: vp.last_visited_at ? new Date(vp.last_visited_at) : now,
          changeFrequency: vp.changeFrequency || "daily",
          priority: vp.priority || 0.8,
        });
      }
    }
  } catch (err) {
    console.warn("Could not enrich sitemap with visited pages:", err);
  }

  return Array.from(urlMap.values());
}
