import { UserLibraryEntry } from "@/types/manga";

export const KNOWN_MANGA_GENRES: Record<string, string[]> = {
  // Action & Shonen
  "one piece": ["Action", "Adventure", "Fantasy"],
  "berserk": ["Action", "Dark Fantasy", "Psychological"],
  "jojos bizarre adventure": ["Action", "Adventure", "Supernatural"],
  "steel ball run": ["Action", "Adventure", "Historical"],
  "vagabond": ["Action", "Historical", "Drama"],
  "jujutsu kaisen": ["Action", "Supernatural", "Dark Fantasy"],
  "chainsaw man": ["Action", "Dark Fantasy", "Comedy"],
  "my hero academia": ["Action", "Sci-Fi", "Comedy"],
  "demon slayer": ["Action", "Supernatural", "Historical"],
  "kimetsu no yaiba": ["Action", "Supernatural", "Historical"],
  "naruto": ["Action", "Adventure", "Martial Arts"],
  "bleach": ["Action", "Supernatural", "Adventure"],
  "attack on titan": ["Action", "Mystery", "Drama"],
  "shingeki no kyojin": ["Action", "Mystery", "Drama"],
  "dragon ball": ["Action", "Adventure", "Martial Arts"],
  "hunter x hunter": ["Action", "Adventure", "Fantasy"],
  "fullmetal alchemist": ["Action", "Adventure", "Fantasy"],
  "gachiakuta": ["Action", "Fantasy", "Sci-Fi"],
  "blue lock": ["Sports", "Drama", "Psychological"],
  "haikyuu": ["Sports", "Comedy", "Drama"],
  "slam dunk": ["Sports", "Comedy", "Drama"],
  "hajime no ippo": ["Sports", "Action", "Comedy"],
  "sakamoto days": ["Action", "Comedy"],
  "dandadan": ["Action", "Supernatural", "Comedy", "Sci-Fi"],
  "kaiju no 8": ["Action", "Sci-Fi"],
  "kagurabachi": ["Action", "Dark Fantasy"],

  // Romance & RomCom & Drama
  "rent a girlfriend": ["Romance", "Comedy", "Drama"],
  "kanojo okarishimasu": ["Romance", "Comedy", "Drama"],
  "kaguya sama": ["Romance", "Comedy", "Psychological"],
  "kaguya-sama": ["Romance", "Comedy", "Psychological"],
  "spy x family": ["Comedy", "Action", "Slice of Life"],
  "kaoru hana": ["Romance", "Drama", "Slice of Life"],
  "the fragrant flower blooms with dignity": ["Romance", "Drama", "Slice of Life"],
  "blue box": ["Romance", "Sports", "Drama"],
  "horimiya": ["Romance", "Comedy", "Slice of Life"],
  "my dress up darling": ["Romance", "Comedy", "Slice of Life"],
  "sono bisque doll": ["Romance", "Comedy", "Slice of Life"],
  "komi cant communicate": ["Comedy", "Romance", "Slice of Life"],
  "the quintessential quintuplets": ["Romance", "Comedy", "Harem"],
  "gotoubun": ["Romance", "Comedy", "Harem"],
  "nisekoi": ["Romance", "Comedy", "Harem"],
  "bokuben": ["Romance", "Comedy", "Harem"],
  "we never learn": ["Romance", "Comedy", "Harem"],
  "domestic girlfriend": ["Drama", "Romance"],

  // Fantasy, Isekai & Supernatural
  "frieren": ["Fantasy", "Adventure", "Drama"],
  "sousou no frieren": ["Fantasy", "Adventure", "Drama"],
  "solo leveling": ["Action", "Fantasy", "Adventure"],
  "mushoku tensei": ["Fantasy", "Adventure", "Drama"],
  "re zero": ["Fantasy", "Psychological", "Drama"],
  "that time i got reincarnated as a slime": ["Fantasy", "Comedy", "Adventure"],
  "tensei shitara slime": ["Fantasy", "Comedy", "Adventure"],
  "overlord": ["Fantasy", "Dark Fantasy", "Action"],
  "dungeon meshi": ["Fantasy", "Comedy", "Adventure"],
  "delicious in dungeon": ["Fantasy", "Comedy", "Adventure"],
  "tower of god": ["Action", "Fantasy", "Mystery"],
  "omniscient reader": ["Action", "Fantasy", "Sci-Fi"],
  "the beginning after the end": ["Fantasy", "Action", "Adventure"],
  "lookism": ["Action", "Drama", "Supernatural"],
  "eleceed": ["Action", "Comedy", "Supernatural"],
  "nano machine": ["Action", "Sci-Fi", "Martial Arts"],
  "legend of the northern blade": ["Action", "Martial Arts", "Adventure"],

  // Psychological, Mystery & Seinen
  "monster": ["Mystery", "Psychological", "Thriller"],
  "20th century boys": ["Mystery", "Sci-Fi", "Drama"],
  "tokyo ghoul": ["Dark Fantasy", "Horror", "Action"],
  "vinland saga": ["Action", "Historical", "Drama"],
  "oyasumi punpun": ["Drama", "Psychological", "Slice of Life"],
  "goodnight punpun": ["Drama", "Psychological", "Slice of Life"],
  "death note": ["Mystery", "Psychological", "Supernatural"],
};

export function getGenresForManga(item: UserLibraryEntry): string[] {
  // If entry already carries genres
  const direct = (item as any).genres;
  if (Array.isArray(direct) && direct.length > 0) {
    return direct;
  }

  const rawTitle = (item.manga_title || "").toLowerCase();
  const cleanTitle = rawTitle.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  // 1. Direct dictionary match
  for (const [key, genres] of Object.entries(KNOWN_MANGA_GENRES)) {
    if (cleanTitle.includes(key) || key.includes(cleanTitle)) {
      return genres;
    }
  }

  // 2. Keyword-based intelligent detection
  if (/love|girlfriend|boyfriend|heart|marriage|crush|kiss|confession|romance/i.test(cleanTitle)) {
    return ["Romance", "Comedy", "Drama"];
  }
  if (/dungeon|reincarnat|leveling|sword|magic|witch|mage|isekai|hero|villain/i.test(cleanTitle)) {
    return ["Fantasy", "Action", "Adventure"];
  }
  if (/game|detective|murder|death|dead|psychic|ghost|ghoul|curse/i.test(cleanTitle)) {
    return ["Mystery", "Supernatural", "Psychological"];
  }
  if (/sport|soccer|football|basket|volley|box|baseball/i.test(cleanTitle)) {
    return ["Sports", "Drama", "Comedy"];
  }
  if (/demon|slayer|titan|blade|fighter|punch|war|battle|punch/i.test(cleanTitle)) {
    return ["Action", "Adventure", "Fantasy"];
  }

  // Default clean genre profile for general manga
  return ["Action", "Drama"];
}

export interface ReadingStatusStats {
  readingCount: number;
  completedCount: number;
  planCount: number;
  droppedCount: number;
  totalCount: number;
  readingPct: number;
  completedPct: number;
  planPct: number;
  droppedPct: number;
}

export function computeReadingStatus(library: UserLibraryEntry[]): ReadingStatusStats {
  const readingCount = library.filter((m) => m.status === "reading").length;
  const completedCount = library.filter((m) => m.status === "completed").length;
  const planCount = library.filter((m) => m.status === "plan_to_read").length;
  const droppedCount = library.filter((m) => m.status === "dropped").length;
  const totalCount = library.length;

  return {
    readingCount,
    completedCount,
    planCount,
    droppedCount,
    totalCount,
    readingPct: totalCount > 0 ? Math.round((readingCount / totalCount) * 100) : 0,
    completedPct: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    planPct: totalCount > 0 ? Math.round((planCount / totalCount) * 100) : 0,
    droppedPct: totalCount > 0 ? Math.round((droppedCount / totalCount) * 100) : 0,
  };
}

export interface ContentTypeStats {
  mangaCount: number;
  manhwaCount: number;
  manhuaCount: number;
  totalCount: number;
  mangaPct: number;
  manhwaPct: number;
  manhuaPct: number;
  dominantType: string;
  dominantPct: number;
}

export function computeContentType(library: UserLibraryEntry[]): ContentTypeStats {
  let manga = 0;
  let manhwa = 0;
  let manhua = 0;

  library.forEach((item) => {
    const origin = ((item as any).country_of_origin || "").toUpperCase();
    const format = ((item as any).format || "").toUpperCase();
    const title = (item.manga_title || "").toLowerCase();

    const isManhwa =
      origin === "KR" ||
      format === "MANHWA" ||
      /solo leveling|tower of god|omniscient reader|beginning after|lookism|noblesse|wind breaker|hardcore leveling|bastard|sweet home|eleceed|nano machine|return of the mount hua|mercenary enrollment|legend of the northern blade|villain to kill|villainess/i.test(title);

    const isManhua =
      origin === "CN" ||
      format === "MANHUA" ||
      /tales of demons|martial peak|apotheosis|soul land|versatile mage|magic emperor/i.test(title);

    if (isManhwa) manhwa++;
    else if (isManhua) manhua++;
    else manga++;
  });

  const totalCount = library.length;
  const mangaPct = totalCount > 0 ? Math.round((manga / totalCount) * 100) : 0;
  const manhwaPct = totalCount > 0 ? Math.round((manhwa / totalCount) * 100) : 0;
  const manhuaPct = totalCount > 0 ? Math.round((manhua / totalCount) * 100) : 0;

  let dominantType = "Japanese Manga";
  let dominantPct = mangaPct;
  if (manhwa > manga && manhwa >= manhua) {
    dominantType = "Korean Manhwa";
    dominantPct = manhwaPct;
  } else if (manhua > manga && manhua > manhwa) {
    dominantType = "Chinese Manhua";
    dominantPct = manhuaPct;
  }

  return {
    mangaCount: manga,
    manhwaCount: manhwa,
    manhuaCount: manhua,
    totalCount,
    mangaPct,
    manhwaPct,
    manhuaPct,
    dominantType,
    dominantPct,
  };
}

export interface GenreItem {
  name: string;
  count: number;
  percent: number;
  color: string;
  text: string;
}

export function computeTopGenres(library: UserLibraryEntry[]): GenreItem[] {
  if (!library || library.length === 0) return [];

  const freq: Record<string, number> = {};
  library.forEach((item) => {
    const genres = getGenresForManga(item);
    genres.forEach((g) => {
      freq[g] = (freq[g] || 0) + 1;
    });
  });

  const totalHits = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const colors = [
    { color: "bg-blue-500", text: "text-blue-400" },
    { color: "bg-purple-500", text: "text-purple-400" },
    { color: "bg-amber-500", text: "text-amber-400" },
    { color: "bg-emerald-500", text: "text-emerald-400" },
  ];

  return sorted.map(([name, count], idx) => ({
    name,
    count,
    percent: Math.round((count / totalHits) * 100),
    color: colors[idx % colors.length].color,
    text: colors[idx % colors.length].text,
  }));
}
