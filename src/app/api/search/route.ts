import { NextResponse } from "next/server";
import { searchManga } from "@/lib/anilist";
import { MangaItem } from "@/types/manga";

// 60-second in-memory query cache to shield AniList GraphQL rate limits (90 req/min)
interface CacheEntry {
  data: MangaItem[];
  expiresAt: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

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
    const results = await searchManga(cleanQuery, limit);

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

