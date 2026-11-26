import { MangaItem, OfficialLink } from "@/types/manga";

/**
 * Generates verified 100% legal official action links for any manga or manhwa series.
 * Zero piracy links — strictly official publishers, simulpub services, and licensed stores.
 */
export function getOfficialLinksForManga(manga: Partial<MangaItem>): OfficialLink[] {
  const links: OfficialLink[] = [];
  const title = manga.title?.english || manga.title?.romaji || manga.displayTitle || "";
  const encodedTitle = encodeURIComponent(title);
  const isKorean = manga.countryOfOrigin === "KR";

  if (isKorean) {
    // ── KOREAN MANHWA / WEBTOON PUBLISHERS ──
    // 1. WEBTOON (Naver Webtoon Official Global)
    links.push({
      name: "WEBTOON Official",
      url: `https://www.webtoons.com/en/search?keyword=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Official English Webtoon",
      type: "free",
      icon: "webtoon",
    });

    // 2. Tapas Official
    links.push({
      name: "Tapas Community & Comics",
      url: `https://tapas.io/search?q=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Licensed Digital Simulpub",
      type: "subscription",
      icon: "tapas",
    });

    // 3. Tappytoon
    links.push({
      name: "Tappytoon",
      url: `https://www.tappytoon.com/en/search?q=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Official Translation",
      type: "free",
      icon: "tappytoon",
    });

    // 4. Amazon Books & Kindle (Paperback / eBook)
    const amazonTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG;
    const amazonUrl = amazonTag
      ? `https://www.amazon.com/s?k=${encodedTitle}+manhwa&i=stripbooks&tag=${amazonTag}`
      : `https://www.amazon.com/s?k=${encodedTitle}+manhwa&i=stripbooks`;

    links.push({
      name: "Amazon Books & Kindle",
      url: amazonUrl,
      badge: "Paperback & Kindle",
      type: "purchase",
      icon: "amazon",
      isAffiliate: Boolean(amazonTag),
    });
  } else {
    // ── JAPANESE MANGA PUBLISHERS ──
    // 1. MANGA Plus by Shueisha (Free Official Weekly Shonen Jump chapters)
    links.push({
      name: "MANGA Plus by Shueisha",
      url: `https://mangaplus.shueisha.co.jp/search_result?keyword=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Free Official Latest Chapters",
      type: "free",
      icon: "shueisha",
    });

    // 2. Viz Media (Official Shonen Jump & Viz Digital Vault)
    links.push({
      name: "Viz Media (Shonen Jump)",
      url: `https://www.viz.com/search?search=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Official Digital Library",
      type: "subscription",
      icon: "viz",
    });

    // 3. Kodansha K Manga (Official Kodansha Simulpubs)
    links.push({
      name: "Kodansha K Manga",
      url: `https://kmanga.kodansha.com/search?keyword=${encodedTitle}&utm_source=mangapulse&utm_medium=referral&utm_campaign=tracker`,
      badge: "Official Kodansha Simulpub",
      type: "free",
      icon: "kodansha",
    });

    // 4. BookWalker Global (Official Kadokawa Digital eBook Store)
    links.push({
      name: "BookWalker Global (Kadokawa)",
      url: `https://global.bookwalker.jp/search/?word=${encodedTitle}&utm_source=mangapulse&utm_medium=referral`,
      badge: "Official Digital eBook",
      type: "purchase",
      icon: "bookwalker",
    });

    // 5. Amazon (Physical Manga & Kindle Editions)
    const amazonTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG;
    const amazonUrl = amazonTag
      ? `https://www.amazon.com/s?k=${encodedTitle}+manga&i=stripbooks&tag=${amazonTag}`
      : `https://www.amazon.com/s?k=${encodedTitle}+manga&i=stripbooks`;

    links.push({
      name: "Amazon Books & Kindle",
      url: amazonUrl,
      badge: "Paperback & Kindle",
      type: "purchase",
      icon: "amazon",
      isAffiliate: Boolean(amazonTag),
    });
  }

  return links;
}
