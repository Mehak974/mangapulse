import { MangaItem, MangaTitle, ReleaseSchedule } from "@/types/manga";
import { getOfficialLinksForManga } from "./officialLinks";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

// In-flight coalescing to avoid duplicate requests
const inFlightRequests = new Map<string, Promise<any>>();

export function slugify(str: string): string {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDisplayTitle(title?: MangaTitle | null): string {
  if (!title) return "Unknown Title";
  return (
    title.english ||
    title.romaji ||
    title.userPreferred ||
    title.native ||
    "Unknown Title"
  );
}

// Format AniList media item into our clean MangaItem schema
import { getVerifiedSchedule, getVerifiedScheduleItem, VerifiedSchedule } from "./mangaScheduleDb";

/**
 * Calculates accurate, distinct chapter release schedules based on verified publication data.
 * Finished or cancelled series return null (no countdown).
 * Releasing series drop on their specific magazine day (Sun, Mon, Tue, Wed, Thu, Fri, Sat, or Monthly).
 */
export function calculateMangaReleaseSchedule(media: any): ReleaseSchedule | null {
  const displayTitle = getDisplayTitle(media.title);
  const verified = getVerifiedSchedule(media.id, displayTitle, media.status, media.chapters);

  if (verified.isFinished || verified.isHiatus || !verified.targetTimestamp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, verified.targetTimestamp - now);

  return {
    episodeOrChapter: verified.nextChapter,
    airingAt: verified.targetTimestamp,
    timeUntilAiring: diff,
  };
}

export function formatMangaItem(media: any): MangaItem {
  const displayTitle = getDisplayTitle(media.title);
  const slug = `${slugify(displayTitle)}-${media.id}`;

  const verified = getVerifiedSchedule(media.id, displayTitle, media.status, media.chapters);
  const nextAiringChapter = calculateMangaReleaseSchedule(media);

  // Set real verified chapter numbers instead of generic null / 100
  const chapters = media.chapters || verified.latestChapter;

  const item: MangaItem = {
    id: media.id,
    slug,
    title: media.title,
    displayTitle,
    coverImage: media.coverImage || {},
    bannerImage: media.bannerImage || null,
    description: media.description
      ? media.description.replace(/<[^>]*>/g, "")
      : "",
    genres: media.genres || [],
    status: verified.isFinished ? "FINISHED" : media.status || "RELEASING",
    averageScore: media.averageScore || null,
    popularity: media.popularity || null,
    chapters,
    volumes: media.volumes || null,
    countryOfOrigin: media.countryOfOrigin || "JP",
    startDate: media.startDate,
    nextAiringChapter,
    synonyms: media.synonyms || [],
  };

  item.officialLinks = getOfficialLinksForManga(item);
  return item;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const anilistCache = new Map<string, CacheEntry<any>>();
const CACHE_MAX_SIZE = 300;
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function fetchAnilistGraphQL<T>(
  query: string,
  variables: Record<string, any> = {},
  revalidate: number = 3600
): Promise<T | null> {
  const cacheKey = `${query}::${JSON.stringify(variables)}`;
  const now = Date.now();

  // 1. Check in-memory cache to save 90 req/min rate limit
  const cached = anilistCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    anilistCache.delete(cacheKey);
    anilistCache.set(cacheKey, cached);
    return cached.data as T;
  }

  // 2. Coalesce in-flight duplicate requests
  const existing = inFlightRequests.get(cacheKey);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(ANILIST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query, variables }),
        next: { revalidate },
      });

      if (!res.ok) {
        console.warn(`AniList API returned ${res.status}`);
        // If 429 or transient error and we have stale cached data, serve stale!
        if (cached?.data) {
          console.warn(`Serving stale cached data for ${cacheKey.slice(0, 45)} due to HTTP ${res.status}`);
          return cached.data as T;
        }
        return null;
      }

      const json = await res.json();
      const resultData = json.data || null;

      if (resultData) {
        // Enforce LRU cap
        while (anilistCache.size >= CACHE_MAX_SIZE) {
          const oldest = anilistCache.keys().next().value;
          if (oldest) anilistCache.delete(oldest);
          else break;
        }

        anilistCache.set(cacheKey, {
          data: resultData,
          expiresAt: now + DEFAULT_TTL_MS,
        });
      }

      return resultData as T;
    } catch (err: any) {
      console.error("AniList fetch error:", err.message);
      if (cached?.data) return cached.data as T;
      return null;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

const MANGA_FIELDS = `
  id
  countryOfOrigin
  title {
    english
    romaji
    native
    userPreferred
  }
  synonyms
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  description
  genres
  status
  averageScore
  popularity
  chapters
  volumes
  startDate {
    year
    month
    day
  }
  nextAiringEpisode {
    episode
    airingAt
    timeUntilAiring
  }
`;

export const POPULAR_MANGA_QUERY = `
  query ($page: Int, $perPage: Int, $genre: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        hasNextPage
      }
      media(type: MANGA, sort: POPULARITY_DESC, genre: $genre, isAdult: false) {
        ${MANGA_FIELDS}
      }
    }
  }
`;

export const TRENDING_MANGA_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        currentPage
        hasNextPage
      }
      media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
        ${MANGA_FIELDS}
      }
    }
  }
`;

export const SINGLE_MANGA_QUERY = `
  query ($id: Int, $search: String) {
    Media(id: $id, search: $search, type: MANGA, isAdult: false) {
      ${MANGA_FIELDS}
      recommendations(sort: RATING_DESC, perPage: 8) {
        nodes {
          rating
          mediaRecommendation {
            ${MANGA_FIELDS}
          }
        }
      }
    }
  }
`;

export const SEARCH_MANGA_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
        ${MANGA_FIELDS}
      }
    }
  }
`;

export const BROWSE_MANGA_QUERY = `
  query ($page: Int, $perPage: Int, $search: String, $genre: String, $sort: [MediaSort], $format: MediaFormat, $status: MediaStatus, $country: CountryCode) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      media(
        search: $search,
        genre: $genre,
        sort: $sort,
        format: $format,
        status: $status,
        countryOfOrigin: $country,
        type: MANGA,
        isAdult: false
      ) {
        ${MANGA_FIELDS}
      }
    }
  }
`;

export interface BrowseFilters {
  page?: number;
  perPage?: number;
  search?: string;
  genre?: string;
  sort?: string;
  format?: string;
  status?: string;
  country?: string;
}

export async function fetchBrowseManga(filters: BrowseFilters = {}): Promise<{
  items: MangaItem[];
  pageInfo: { currentPage: number; hasNextPage: boolean; total: number };
}> {
  const page = filters.page || 1;
  const perPage = filters.perPage || 24;

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: filters.sort ? [filters.sort] : ["POPULARITY_DESC"],
  };

  if (filters.search && filters.search.trim()) variables.search = filters.search.trim();
  if (filters.genre && filters.genre !== "All") variables.genre = filters.genre;
  if (filters.format && filters.format !== "All") variables.format = filters.format;
  if (filters.status && filters.status !== "All") variables.status = filters.status;
  if (filters.country && filters.country !== "All") variables.country = filters.country;

  try {
    const data = await fetchAnilistGraphQL<any>(BROWSE_MANGA_QUERY, variables);
    const mediaList = data?.Page?.media || [];
    const pageInfo = data?.Page?.pageInfo || { currentPage: page, hasNextPage: false, total: mediaList.length };

    return {
      items: mediaList.map(formatMangaItem),
      pageInfo,
    };
  } catch (err) {
    console.error("Browse query failed, falling back to local list:", err);
    let fallback = getFallbackMangaList();

    if (filters.genre && filters.genre !== "All") {
      fallback = fallback.filter((m) => m.genres.includes(filters.genre!));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      fallback = fallback.filter((m) => m.displayTitle.toLowerCase().includes(q));
    }

    return {
      items: fallback,
      pageInfo: { currentPage: 1, hasNextPage: false, total: fallback.length },
    };
  }
}

// Fetch popular manga
export async function fetchPopular(page = 1, perPage = 18, genre?: string): Promise<MangaItem[]> {
  const data = await fetchAnilistGraphQL<any>(POPULAR_MANGA_QUERY, {
    page,
    perPage,
    genre: genre === "All" ? undefined : genre,
  });

  if (!data?.Page?.media) return getFallbackMangaList();
  return data.Page.media.map(formatMangaItem);
}

// Fetch trending manga
export async function fetchTrending(page = 1, perPage = 10): Promise<MangaItem[]> {
  const data = await fetchAnilistGraphQL<any>(TRENDING_MANGA_QUERY, {
    page,
    perPage,
  });

  if (!data?.Page?.media) return getFallbackMangaList().slice(0, perPage);
  return data.Page.media.map(formatMangaItem);
}

// Extract AniList ID from composite slug (e.g. "one-piece-30013" -> 30013)
export function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/);
  if (match) return parseInt(match[1], 10);
  if (/^\d+$/.test(slug)) return parseInt(slug, 10);
  return null;
}

function synthesizeMangaFromVerified(
  verified: VerifiedSchedule,
  requestedId?: number | null,
  requestedSlug?: string | null
): MangaItem {
  const displayTitle = verified.titleMatch?.[0]
    ? verified.titleMatch[0]
        .split(" ")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Verified Series";
  const finalId = verified.id || requestedId || 100000;
  const slug = requestedSlug || `${slugify(displayTitle)}-${finalId}`;

  const schedule = calculateMangaReleaseSchedule({
    id: finalId,
    title: { english: displayTitle, romaji: displayTitle },
    status: verified.isFinished ? "FINISHED" : verified.isHiatus ? "HIATUS" : "RELEASING",
    chapters: verified.latestChapter,
  });

  const item: MangaItem = {
    id: finalId,
    slug,
    title: { english: displayTitle, romaji: displayTitle },
    displayTitle,
    coverImage: {
      extraLarge: `https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx${finalId}.jpg`,
      large: `https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx${finalId}.jpg`,
      medium: `https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx${finalId}.jpg`,
    },
    bannerImage: null,
    description: `Official serialization in ${verified.magazine}. Published legally by ${verified.publisher}. Track verified chapter release countdowns and official simulpub reading links on MangaPulse.`,
    genres: ["Manga", "Action", "Supernatural"],
    status: verified.isFinished ? "FINISHED" : verified.isHiatus ? "HIATUS" : "RELEASING",
    averageScore: 85,
    popularity: 45000,
    chapters: verified.latestChapter,
    volumes: null,
    countryOfOrigin: "JP",
    nextAiringChapter: schedule,
    synonyms: verified.titleMatch || [],
  };

  item.officialLinks = getOfficialLinksForManga(item);
  return item;
}

// Fetch single manga details by slug or ID
export async function fetchMangaDetails(slugOrId: string | number): Promise<{
  manga: MangaItem | null;
  recommendations: MangaItem[];
}> {
  let id: number | null = null;
  let search: string | null = null;

  if (typeof slugOrId === "number") {
    id = slugOrId;
  } else {
    id = extractIdFromSlug(slugOrId);
    if (!id) {
      search = slugOrId.replace(/-/g, " ");
    }
  }

  const variables: Record<string, any> = {};
  if (id) variables.id = id;
  else if (search) variables.search = search;

  const data = await fetchAnilistGraphQL<any>(SINGLE_MANGA_QUERY, variables);
  const media = data?.Media;

  if (!media) {
    // 1. Check fallback list
    const fallback = getFallbackMangaList().find(
      (m) => m.id === id || slugify(m.displayTitle) === slugOrId
    );
    if (fallback) {
      return {
        manga: fallback,
        recommendations: getFallbackMangaList().filter((m) => m.id !== fallback.id).slice(0, 8),
      };
    }

    // 2. Check verified database to protect against 429 rate limit errors
    const verifiedItem = getVerifiedScheduleItem(
      id,
      search,
      typeof slugOrId === "string" ? slugOrId : null
    );
    if (verifiedItem) {
      const synthesized = synthesizeMangaFromVerified(
        verifiedItem,
        id,
        typeof slugOrId === "string" ? slugOrId : null
      );
      return {
        manga: synthesized,
        recommendations: getFallbackMangaList().filter((m) => m.id !== synthesized.id).slice(0, 8),
      };
    }

    return { manga: null, recommendations: [] };
  }

  const manga = formatMangaItem(media);
  const recommendations: MangaItem[] = (media.recommendations?.nodes || [])
    .map((node: any) => node.mediaRecommendation)
    .filter(Boolean)
    .map(formatMangaItem);

  // Ensure at least 8 recommendations by backfilling from fallback series if needed
  if (recommendations.length < 8) {
    const existingIds = new Set([manga.id, ...recommendations.map((r) => r.id)]);
    const fillers = getFallbackMangaList().filter((f) => !existingIds.has(f.id));
    recommendations.push(...fillers.slice(0, 8 - recommendations.length));
  }

  return { manga, recommendations };
}

// Fetch recommendations by genre / user interests
export async function fetchRecommendationsByGenres(
  genres: string[],
  perPage = 8
): Promise<MangaItem[]> {
  const primaryGenre = genres.length > 0 ? genres[0] : undefined;
  try {
    const list = await fetchPopular(1, perPage, primaryGenre);
    return list;
  } catch (err) {
    console.error("Failed to fetch genre recommendations:", err);
    return getFallbackMangaList().slice(0, perPage);
  }
}

// Search manga titles
export async function searchManga(query: string, perPage = 6): Promise<MangaItem[]> {
  if (!query || query.trim().length === 0) return [];
  const data = await fetchAnilistGraphQL<any>(SEARCH_MANGA_QUERY, {
    search: query.trim(),
    perPage,
  });

  if (!data?.Page?.media) return [];
  return data.Page.media.map(formatMangaItem);
}

// Curated fallback series so development and cold-starts are instantaneous
export function getFallbackMangaList(): MangaItem[] {
  const items: Partial<MangaItem>[] = [
    {
      id: 30013,
      title: { english: "One Piece", romaji: "One Piece" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-ul4bxJukznrh.png",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx30013-ul4bxJukznrh.png",
        color: "#f15a24",
      },
      description: "Gol D. Roger was known as the 'Pirate King', the strongest and most infamous being to have sailed the Grand Line. Monkey D. Luffy sets out to find Roger's treasure and become the next Pirate King.",
      genres: ["Action", "Adventure", "Comedy", "Fantasy"],
      status: "RELEASING",
      averageScore: 92,
      chapters: 1130,
      countryOfOrigin: "JP",
    },
    {
      id: 105778,
      title: { english: "Chainsaw Man", romaji: "Chainsaw Man" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-4D4S8M6o9i4z.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx105778-4D4S8M6o9i4z.jpg",
        color: "#e84118",
      },
      description: "Denji has a simple dream—to live a happy and peaceful life. But the devil-hunting teen's debt catches up to him until he merges with his devil pet Pochita to become Chainsaw Man.",
      genres: ["Action", "Horror", "Supernatural"],
      status: "RELEASING",
      averageScore: 88,
      chapters: 190,
      countryOfOrigin: "JP",
    },
    {
      id: 105398,
      title: { english: "Solo Leveling", romaji: "Na Honjaman Level Up" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673OcFD2bNu.png",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx105398-b673OcFD2bNu.png",
        color: "#3498db",
      },
      description: "10 years ago, after 'the Gate' that connected the real world with the monster world opened, some ordinary people received the power to hunt monsters. Sung Jin-woo discovers a secret quest only he can see.",
      genres: ["Action", "Adventure", "Fantasy"],
      status: "FINISHED",
      averageScore: 86,
      chapters: 179,
      countryOfOrigin: "KR",
    },
    {
      id: 101517,
      title: { english: "Jujutsu Kaisen", romaji: "Jujutsu Kaisen" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-7eFmKjVvBvvd.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx101517-7eFmKjVvBvvd.jpg",
        color: "#2c3e50",
      },
      description: "Yuji Itadori is a boy with tremendous physical strength, though he lives an ordinary high school life. To save a friend, he swallows the finger of Ryomen Sukuna and enters the world of curses.",
      genres: ["Action", "Supernatural"],
      status: "FINISHED",
      averageScore: 85,
      chapters: 271,
      countryOfOrigin: "JP",
    },
    {
      id: 125828,
      title: { english: "Sakamoto Days", romaji: "Sakamoto Days" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx125828-2E5M1yB7j2GZ.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx125828-2E5M1yB7j2GZ.jpg",
        color: "#f39c12",
      },
      description: "Taro Sakamoto was the ultimate assassin, feared by villains and admired by hitmen. But one day, he fell in love, retired, got married, had a child, and got fat! Now he runs a neighborhood store.",
      genres: ["Action", "Comedy"],
      status: "RELEASING",
      averageScore: 83,
      chapters: 198,
      countryOfOrigin: "JP",
    },
    {
      id: 132029,
      title: { english: "Dandadan", romaji: "Dandadan" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx132029-z3y5rA6C7wE1.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx132029-z3y5rA6C7wE1.jpg",
        color: "#9b59b6",
      },
      description: "Momo Ayase strikes up an unusual friendship with the school's UFO fanatic, whom she nicknames 'Okarun' because he has a name that is not to be said aloud. Ghosts meet aliens!",
      genres: ["Action", "Comedy", "Sci-Fi", "Supernatural"],
      status: "RELEASING",
      averageScore: 86,
      chapters: 180,
      countryOfOrigin: "JP",
    },
    {
      id: 169355,
      title: { english: "Kagurabachi", romaji: "Kagurabachi" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx169355-p61wM3u4W3jZ.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx169355-p61wM3u4W3jZ.jpg",
        color: "#c0392b",
      },
      description: "Young Chihiro spends his days training under his renowned swordsmith father. One day he hopes to become a great sword maker himself. The goofy father and serious son thought these days would go on forever.",
      genres: ["Action", "Supernatural", "Drama"],
      status: "RELEASING",
      averageScore: 84,
      chapters: 68,
      countryOfOrigin: "JP",
    },
    {
      id: 128896,
      title: { english: "Witch Watch", romaji: "Witch Watch" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx128896-jR4QxN3q2M7s.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx128896-jR4QxN3q2M7s.jpg",
        color: "#8e44ad",
      },
      description: "Morihito, a boy with the strength of an ogre, is about to start living with his childhood friend Nico, who is training to be a witch. Nico's magic leads to all sorts of unpredictable troubles!",
      genres: ["Comedy", "Romance", "Supernatural"],
      status: "RELEASING",
      averageScore: 80,
      chapters: 189,
      countryOfOrigin: "JP",
    },
    {
      id: 87395,
      title: { english: "Grand Blue Dreaming", romaji: "Grand Blue" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx87395-5G2vB5o4R7sE.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx87395-5G2vB5o4R7sE.jpg",
        color: "#2980b9",
      },
      description: "A new life begins for Iori Kitahara as he begins his college career near the ocean in Izu city. A fresh ocean breeze and diving fun await, mixed with hilarious college party antics.",
      genres: ["Comedy", "Slice of Life"],
      status: "RELEASING",
      averageScore: 89,
      chapters: 95,
      countryOfOrigin: "JP",
    },
    {
      id: 126693,
      title: { english: "Choujin X", romaji: "Choujin X" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx126693-wX7yU5t4V3rQ.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx126693-wX7yU5t4V3rQ.jpg",
        color: "#34495e",
      },
      description: "Two high school friends get tangled with superhuman beings called Choujin in Yamato Prefecture. To survive, they must make an unimaginable choice.",
      genres: ["Action", "Psychological", "Supernatural"],
      status: "RELEASING",
      averageScore: 82,
      chapters: 62,
      countryOfOrigin: "JP",
    },
    {
      id: 117195,
      title: { english: "[Oshi no Ko]", romaji: "[Oshi no Ko]" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx117195-2E5M1yB7j2GZ.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx117195-2E5M1yB7j2GZ.jpg",
        color: "#e84393",
      },
      description: "In the entertainment world, lies are weapons. Gorou is an ob-gyn who happens to be a fan of the idol Ai Hoshino. When Ai appears at his hospital, a shocking twist of fate changes everything.",
      genres: ["Drama", "Mystery", "Supernatural"],
      status: "FINISHED",
      averageScore: 86,
      chapters: 166,
      countryOfOrigin: "JP",
    },
    {
      id: 108556,
      title: { english: "Spy x Family", romaji: "SPY×FAMILY" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108556-9dfjN2LzYg0T.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx108556-9dfjN2LzYg0T.jpg",
        color: "#e67e22",
      },
      description: "Master spy Twilight must disguise himself as a family man in order to infiltrate an elite private school. Unbeknownst to him, his wife is an assassin and his daughter is a telepath!",
      genres: ["Action", "Comedy", "Slice of Life"],
      status: "RELEASING",
      averageScore: 86,
      chapters: 105,
      countryOfOrigin: "JP",
      synonyms: ["SPY_FAMILY", "Spy Family"],
    },
    {
      id: 106130,
      title: { english: "Blue Lock", romaji: "Blue Lock" },
      coverImage: {
        extraLarge: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106130-Vn0c6JdfCq2N.jpg",
        large: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/medium/bx106130-Vn0c6JdfCq2N.jpg",
        color: "#2980b9",
      },
      description: "After a disastrous defeat at the 2018 World Cup, Japan's team struggles to regroup. The Union creates an unorthodox training facility called Blue Lock to create the world's greatest striker.",
      genres: ["Sports", "Drama", "Action"],
      status: "RELEASING",
      averageScore: 84,
      chapters: 285,
      countryOfOrigin: "JP",
      synonyms: ["BLUELOCK"],
    },
  ];

  return items.map((item) => formatMangaItem(item));
}

