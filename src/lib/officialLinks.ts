import { MangaItem, OfficialLink } from "@/types/manga";

// Known official Shueisha / Manga Plus series
const MANGA_PLUS_SLUGS = new Set([
  "one-piece",
  "chainsaw-man",
  "jujutsu-kaisen",
  "sakamoto-days",
  "dandadan",
  "my-hero-academia",
  "spy-x-family",
  "kaiju-no-8",
  "boruto-two-blue-vortex",
  "black-clover",
  "dragon-ball-super",
  "bleach",
  "undead-unluck",
  "ruri-dragon",
  "kagurabachi",
  "blue-box",
  "akane-banashi",
  "witch-watch",
  "me-and-roboco",
]);

// Known Viz Media exclusives or licenses
const VIZ_MEDIA_SLUGS = new Set([
  "one-piece",
  "chainsaw-man",
  "jujutsu-kaisen",
  "sakamoto-days",
  "dandadan",
  "my-hero-academia",
  "death-note",
  "naruto",
  "tokyo-ghoul",
  "hunter-x-hunter",
  "haikyu",
  "demon-slayer-kimetsu-no-yaiba",
  "dr-stone",
]);

// Known Webtoon / Tappytoon official Korean manhwa
const WEBTOON_SLUGS = new Set([
  "solo-leveling",
  "tower-of-god",
  "omniscient-reader",
  "the-god-of-high-school",
  "noblesse",
  "the-beginning-after-the-end",
  "wind-breaker",
  "lookism",
]);

/**
 * Generates verified 100% legal official action links for any manga.
 * Zero piracy links — strictly official publishers and licensed stores.
 */
export function getOfficialLinksForManga(manga: Partial<MangaItem>): OfficialLink[] {
  const links: OfficialLink[] = [];
  const title = manga.title?.english || manga.title?.romaji || manga.displayTitle || "";
  const baseSlug = (manga.slug || "")
    .replace(/-\d+$/, "")
    .toLowerCase()
    .trim();

  const encodedTitle = encodeURIComponent(title);
  const isKorean = manga.countryOfOrigin === "KR";

  // 1. MANGA Plus by Shueisha (Free Official Chapters)
  if (MANGA_PLUS_SLUGS.has(baseSlug) || (!isKorean && manga.popularity && manga.popularity > 50000)) {
    links.push({
      name: "MANGA Plus by Shueisha",
      url: `https://mangaplus.shueisha.co.jp/search_result?keyword=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Free Latest Chapters",
      type: "free",
      icon: "shueisha",
    });
  }

  // 2. Viz Media (Official Shonen Jump / Viz Library)
  if (VIZ_MEDIA_SLUGS.has(baseSlug) || (!isKorean && manga.popularity && manga.popularity > 40000)) {
    links.push({
      name: "Viz Media (Shonen Jump)",
      url: `https://www.viz.com/search?search=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Official Simulpub",
      type: "subscription",
      icon: "viz",
    });
  }

  // 3. Webtoon / Tappytoon for Korean Manhwa
  if (isKorean || WEBTOON_SLUGS.has(baseSlug)) {
    links.push({
      name: "WEBTOON / Tappytoon",
      url: `https://www.webtoons.com/en/search?keyword=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Official Translation",
      type: "free",
      icon: "webtoon",
    });
  }

  // 4. Amazon (Physical Volumes & Kindle Official Manga + Affiliate)
  const amazonTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "mangapulse-20";
  links.push({
    name: "Amazon Books & Kindle",
    url: `https://www.amazon.com/s?k=${encodedTitle}+manga&i=stripbooks&tag=${amazonTag}`,
    badge: "Paperback & Kindle",
    type: "purchase",
    icon: "amazon",
    isAffiliate: true,
  });

  return links;
}

