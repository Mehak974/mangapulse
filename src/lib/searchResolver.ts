import { MangaItem } from "@/types/manga";

/**
 * Common prefixes and vocabulary index across Manga, Manhwa, and Manhua.
 * Automatically resolves incomplete user keystrokes (e.g. "duk" -> "duke")
 * because AniList's GraphQL full-text search fails on non-tokenized substrings.
 */
const COMMON_SEARCH_EXPANSIONS: Record<string, string[]> = {
  // Duke & Royalty manhwa
  duk: ["duke", "duchess", "dukedom"],
  du: ["duke", "dungeon", "dunk"],
  duch: ["duchess"],
  king: ["kingdom", "king"],
  emp: ["emperor", "empress", "empire"],
  prin: ["princess", "prince"],
  villi: ["villainess", "villain"],
  vill: ["villainess", "villain"],
  reborn: ["reborn", "reincarnated"],
  reinc: ["reincarnated", "reincarnation"],
  assas: ["assassin", "assassination"],
  magic: ["magician", "magic", "magical"],
  necrom: ["necromancer", "necromancy"],
  level: ["leveling", "level"],
  solo: ["solo leveling"],
  tower: ["tower of god", "tower"],
  omni: ["omniscient reader", "omniscient"],
  mount: ["return of the mount hua sect", "mount hua"],
  nano: ["nano machine"],
  look: ["lookism"],
  wind: ["wind breaker"],
  elec: ["eleceed"],
  box: ["the boxer", "boxer"],
  great: ["greatest estate developer", "great teacher onizuka"],

  // Shonen & Popular Classics
  one: ["one piece", "one punch man"],
  "one p": ["one piece", "one punch man"],
  chain: ["chainsaw man", "chainsaw"],
  chains: ["chainsaw man"],
  juju: ["jujutsu kaisen", "jujutsu"],
  jujut: ["jujutsu kaisen"],
  saka: ["sakamoto days", "sakamoto"],
  danda: ["dandadan"],
  dand: ["dandadan"],
  kagu: ["kagurabachi", "kaguya-sama"],
  kagura: ["kagurabachi"],
  ber: ["berserk", "berserker"],
  bers: ["berserk"],
  dem: ["demon slayer", "demon"],
  demon: ["demon slayer"],
  kimetsu: ["kimetsu no yaiba"],
  boku: ["boku no hero academia"],
  my: ["my hero academia"],
  hero: ["my hero academia"],
  att: ["attack on titan"],
  attac: ["attack on titan"],
  shing: ["shingeki no kyojin"],
  blea: ["bleach"],
  naru: ["naruto"],
  hunt: ["hunter x hunter"],
  hunter: ["hunter x hunter"],
  tokyo: ["tokyo ghoul", "tokyo revengers"],
  blue: ["blue lock", "blue box"],
  jojo: ["jojo's bizarre adventure", "jojo"],
  haik: ["haikyuu!!", "haikyuu"],
  spy: ["spy x family", "spy"],
  death: ["death note"],
  full: ["fullmetal alchemist"],
  vin: ["vinland saga"],
  vaga: ["vagabond"],
  monst: ["monster"],
  mash: ["mashle"],
  kaiju: ["kaiju no. 8"],
  hori: ["horimiya"],
  frie: ["frieren"],
  frier: ["frieren"],
  oshi: ["oshi no ko"],
  dr: ["dr. stone", "dr stone"],
  black: ["black clover"],
};

/**
 * Returns expanded search terms for AniList GraphQL querying if the input
 * is a partial prefix stem.
 */
export function getExpandedSearchTerms(cleanQuery: string): string[] {
  if (!cleanQuery) return [];
  const q = cleanQuery.toLowerCase().trim();

  // 1. Direct dictionary match
  if (COMMON_SEARCH_EXPANSIONS[q]) {
    return COMMON_SEARCH_EXPANSIONS[q];
  }

  // 2. Prefix matching against known keys (e.g. "du" matches "duk")
  const matches = new Set<string>();
  for (const [key, expansions] of Object.entries(COMMON_SEARCH_EXPANSIONS)) {
    if (key.startsWith(q) || q.startsWith(key)) {
      expansions.forEach((exp) => matches.add(exp));
    }
  }

  return Array.from(matches);
}

/**
 * Scores and sorts manga items so titles STARTING with the query come first,
 * followed by titles where a word starts with the query, followed by substring matches.
 * 
 * Spec: "if i search duk it must return all entries that have duk in any where in title....
 * with sorting that starting from duk comes first"
 */
export function rankMangaSearchResults(items: MangaItem[], query: string): MangaItem[] {
  if (!query || !query.trim() || items.length === 0) return items;

  const q = query.toLowerCase().trim();
  const wordBoundaryRegex = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");

  const scored = items.map((item) => {
    const display = (item.displayTitle || "").toLowerCase();
    const english = (item.title?.english || "").toLowerCase();
    const romaji = (item.title?.romaji || "").toLowerCase();
    const synonyms = (item.synonyms || []).map((s) => s.toLowerCase());

    let score = 0;

    // TIER 1: Exact match on title (highest priority)
    if (display === q || english === q || romaji === q) {
      score += 10000;
    }
    // TIER 2: Title STARTS with query (e.g. "Duke Pendragon", "Duke Richard's Haven")
    else if (display.startsWith(q) || english.startsWith(q) || romaji.startsWith(q)) {
      score += 5000;
    }
    // TIER 3: Word in title starts with query (e.g. "The Duke of Death", "What's Wrong with You, Duke?")
    else if (
      wordBoundaryRegex.test(display) ||
      wordBoundaryRegex.test(english) ||
      wordBoundaryRegex.test(romaji)
    ) {
      score += 3000;
    }
    // TIER 4: Substring anywhere in display / english / romaji
    else if (display.includes(q) || english.includes(q) || romaji.includes(q)) {
      score += 1000;
    }
    // TIER 5: In synonyms
    else if (synonyms.some((s) => s.startsWith(q))) {
      score += 800;
    } else if (synonyms.some((s) => s.includes(q))) {
      score += 400;
    } else {
      // Related result returned by expanded search terms
      score += 100;
    }

    // Popularity as tie breaker (normalized to 0-100)
    const popularityBonus = item.popularity ? Math.min(100, Math.round(item.popularity / 1000)) : 0;
    score += popularityBonus;

    return { item, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Deduplicate by id
  const seen = new Set<number>();
  const uniqueResults: MangaItem[] = [];

  for (const entry of scored) {
    if (!seen.has(entry.item.id)) {
      seen.add(entry.item.id);
      uniqueResults.push(entry.item);
    }
  }

  return uniqueResults;
}
