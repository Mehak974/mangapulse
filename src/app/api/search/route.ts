import { NextResponse } from "next/server";
import { searchManga, slugify } from "@/lib/anilist";
import { getAllDelistedSlugs } from "@/lib/mangaOverrides";
import { MangaItem } from "@/types/manga";
import { SITE_URL } from "@/lib/seo";
import { indexDiscoveredPages } from "@/lib/indexnow";
import { getExpandedSearchTerms, rankMangaSearchResults } from "@/lib/searchResolver";

// 60-second in-memory query cache to shield AniList GraphQL rate limits (90 req/min)
interface CacheEntry {
  data: MangaItem[];
  expiresAt: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function triggerSearchDiscoveryIndexing(items: MangaItem[]) {
  if (!items || items.length === 0) return;
  const discoveredUrls = items.flatMap((m) => {
    const titleSlug = slugify(m.displayTitle);
    return [
      `${SITE_URL}/manga/${m.slug}`,
      titleSlug ? `${SITE_URL}/manga/${titleSlug}` : null,
      `${SITE_URL}/release-date/${m.slug}`,
      titleSlug ? `${SITE_URL}/release-date/${titleSlug}` : null,
    ];
  });
  indexDiscoveredPages(discoveredUrls);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("query") || "";
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "6", 10)));

  const cleanQuery = q.trim().toLowerCase();
  if (!cleanQuery) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `${cleanQuery}:${limit}`;
  const now = Date.now();
  const cached = searchCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    // Refresh LRU order on hit
    searchCache.delete(cacheKey);
    searchCache.set(cacheKey, cached);

    // Auto-index discovered manga
    triggerSearchDiscoveryIndexing(cached.data);

    return NextResponse.json(
      { results: cached.data, cached: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  }

  try {
    let rawResults = await searchManga(cleanQuery, Math.max(limit, 10));

    // If zero or very few results, check prefix expansions (e.g. "duk" -> "duke")
    if (rawResults.length < 3) {
      const expansions = getExpandedSearchTerms(cleanQuery);
      if (expansions.length > 0) {
        const expansionFetches = await Promise.all(
          expansions.slice(0, 2).map((exp) => searchManga(exp, Math.max(limit, 12)))
        );
        const mergedExpansions = expansionFetches.flat();
        rawResults = [...rawResults, ...mergedExpansions];
      }
    }

    const delisted = await getAllDelistedSlugs();
    const filtered = delisted.length > 0
      ? rawResults.filter(
          (m) =>
            !delisted.includes(m.slug.toLowerCase()) &&
            !delisted.includes(slugify(m.displayTitle))
        )
      : rawResults;

    // Rank results so entries starting with the query come first
    const rankedResults = rankMangaSearchResults(filtered, cleanQuery);
    const results = rankedResults.slice(0, limit);

    // Enforce strict LRU cap of 200 items before insertion to prevent memory bloat
    while (searchCache.size >= 200) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) {
        searchCache.delete(oldestKey);
      } else {
        break;
      }
    }

    searchCache.set(cacheKey, {
      data: results,
      expiresAt: now + CACHE_TTL_MS,
    });

    // Auto-index discovered manga returned from user search
    triggerSearchDiscoveryIndexing(results);

    return NextResponse.json(
      { results, cached: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    console.error("API /api/search error:", err);
    return NextResponse.json(
      { error: "Failed to search manga index", results: [] },
      { status: 500 }
    );
  }
}
