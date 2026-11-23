import { UserLibraryEntry, LibraryStatus } from "@/types/manga";
import { slugify } from "./anilist";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const ANILIST_USER_LIBRARY_QUERY = `
  query ($userName: String) {
    MediaListCollection(userName: $userName, type: MANGA) {
      lists {
        name
        status
        entries {
          id
          status
          progress
          score(format: POINT_10)
          media {
            id
            title {
              romaji
              english
              userPreferred
            }
            coverImage {
              large
              medium
            }
            chapters
          }
        }
      }
    }
  }
`;

function mapAniListStatus(status?: string): LibraryStatus {
  switch (status?.toUpperCase()) {
    case "CURRENT":
      return "reading";
    case "PLANNING":
      return "plan_to_read";
    case "COMPLETED":
      return "completed";
    case "DROPPED":
      return "dropped";
    case "PAUSED":
      return "reading";
    default:
      return "reading";
  }
}

function mapMALStatus(statusStr?: string): LibraryStatus {
  const s = statusStr?.trim().toLowerCase();
  if (s === "reading" || s === "1") return "reading";
  if (s === "completed" || s === "2") return "completed";
  if (s === "on-hold" || s === "3") return "reading";
  if (s === "dropped" || s === "4") return "dropped";
  if (s === "plan to read" || s === "6") return "plan_to_read";
  return "reading";
}

export async function fetchAniListUserLibrary(username: string): Promise<UserLibraryEntry[]> {
  const cleanUsername = username.trim();
  if (!cleanUsername) throw new Error("Please enter a valid AniList username.");

  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: ANILIST_USER_LIBRARY_QUERY,
      variables: { userName: cleanUsername },
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList user '${cleanUsername}' was not found or has private lists.`);
  }

  const json = await response.json();
  const lists = json?.data?.MediaListCollection?.lists;
  if (!lists || !Array.isArray(lists)) {
    throw new Error(`No public manga entries found on '${cleanUsername}' AniList profile.`);
  }

  const now = new Date().toISOString();
  const entries: UserLibraryEntry[] = [];
  const seenIds = new Set<number>();

  for (const list of lists) {
    for (const item of list.entries || []) {
      const media = item.media;
      if (!media || seenIds.has(media.id)) continue;
      seenIds.add(media.id);

      const title =
        media.title.english ||
        media.title.romaji ||
        media.title.userPreferred ||
        "Unknown Manga";
      const slug = `${slugify(title)}-${media.id}`;
      const cover =
        media.coverImage?.large ||
        media.coverImage?.medium ||
        "/placeholder-cover.png";

      entries.push({
        id: `imported-${media.id}`,
        user_id: "local",
        manga_id: media.id,
        manga_slug: slug,
        manga_title: title,
        manga_cover: cover,
        status: mapAniListStatus(item.status || list.status),
        progress_chapter: item.progress || 0,
        total_chapters: media.chapters || null,
        rating: item.score ? Math.min(10, Math.max(1, Number(item.score))) : null,
        notes: null,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return entries;
}

export function parseMALXml(xmlText: string): UserLibraryEntry[] {
  const entries: UserLibraryEntry[] = [];
  const now = new Date().toISOString();

  // Simple, robust regex parser for standard MyAnimeList export XML
  const mangaBlocks = xmlText.match(/<manga>([\s\S]*?)<\/manga>/gi);
  if (!mangaBlocks) {
    throw new Error("No <manga> records found in the provided XML file.");
  }

  for (const block of mangaBlocks) {
    const idMatch = block.match(/<manga_mangadb_id>(\d+)<\/manga_mangadb_id>/i);
    const titleMatch = block.match(/<manga_title><!\[CDATA\[([\s\S]*?)\]\]><\/manga_title>/i) ||
                       block.match(/<manga_title>([\s\S]*?)<\/manga_title>/i);
    const chaptersReadMatch = block.match(/<my_read_chapters>(\d+)<\/my_read_chapters>/i);
    const statusMatch = block.match(/<my_status>([\s\S]*?)<\/my_status>/i);
    const scoreMatch = block.match(/<my_score>(\d+)<\/my_score>/i);

    const mangaId = idMatch ? parseInt(idMatch[1], 10) : Math.floor(Math.random() * 100000);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled Manga";
    const slug = `${slugify(title)}-${mangaId}`;
    const progress = chaptersReadMatch ? parseInt(chaptersReadMatch[1], 10) : 0;
    const score = scoreMatch && parseInt(scoreMatch[1], 10) > 0 ? parseInt(scoreMatch[1], 10) : null;
    const status = mapMALStatus(statusMatch ? statusMatch[1] : undefined);

    entries.push({
      id: `imported-mal-${mangaId}`,
      user_id: "local",
      manga_id: mangaId,
      manga_slug: slug,
      manga_title: title,
      manga_cover: "/placeholder-cover.png",
      status,
      progress_chapter: progress,
      total_chapters: null,
      rating: score,
      notes: null,
      created_at: now,
      updated_at: now,
    });
  }

  return entries;
}

