/**
 * Custom Amazon & Publisher affiliate overrides per series.
 *
 * How it works:
 * 1. If a series has an entry here (by slug, AniList ID, or title), MangaPulse links directly
 *    to that exact curated Amazon product / volume / box set with your associate tag (mangapulse-20).
 * 2. If a series is NOT in this list, MangaPulse automatically falls back to an automated
 *    Amazon search query with tag=mangapulse-20, so 100% of your catalog is monetized from day one.
 */

export interface SeriesAffiliateOverride {
  amazonUrl: string;
  badge?: string;
  note?: string;
}

export const SERIES_AFFILIATE_OVERRIDES: Record<string, SeriesAffiliateOverride> = {
  // ── 1. Gachiakuta ──
  "gachiakuta": {
    amazonUrl:
      "https://www.amazon.com/Gachiakuta-1-Kei-Urana/dp/B0C4XW16QN?tag=mangapulse-20&linkCode=ll2&linkId=e7fc84074534887416d8e75286db1646&language=en_US&ref_=as_li_ss_tl",
    badge: "Vol. 1 Paperback & Kindle",
    note: "Official English physical volume by Kodansha USA",
  },
  "143890": {
    amazonUrl:
      "https://www.amazon.com/Gachiakuta-1-Kei-Urana/dp/B0C4XW16QN?tag=mangapulse-20&linkCode=ll2&linkId=e7fc84074534887416d8e75286db1646&language=en_US&ref_=as_li_ss_tl",
    badge: "Vol. 1 Paperback & Kindle",
  },

  // ── 2. Solo Leveling ──
  "solo-leveling": {
    amazonUrl:
      "https://www.amazon.com/Leveling-12-Book-Ultimate-Collection-Vol-12/dp/B0FD7XLP5G?tag=mangapulse-20&linkCode=ll2&linkId=ce9e43a511b68116dbe76d7d37d65e6e&language=en_US&ref_=as_li_ss_tl",
    badge: "Complete 12-Book Collection Box Set",
    note: "Official English Manhwa Collection by Yen Press",
  },
  "105398": {
    amazonUrl:
      "https://www.amazon.com/Leveling-12-Book-Ultimate-Collection-Vol-12/dp/B0FD7XLP5G?tag=mangapulse-20&linkCode=ll2&linkId=ce9e43a511b68116dbe76d7d37d65e6e&language=en_US&ref_=as_li_ss_tl",
    badge: "Complete 12-Book Collection Box Set",
  },

  // ── 3. One Piece ──
  "one-piece": {
    amazonUrl:
      "https://www.amazon.com/s?k=One+Piece+manga+box+set&i=stripbooks&tag=mangapulse-20",
    badge: "Official Box Sets & Volumes",
  },
  "30013": {
    amazonUrl:
      "https://www.amazon.com/s?k=One+Piece+manga+box+set&i=stripbooks&tag=mangapulse-20",
    badge: "Official Box Sets & Volumes",
  },

  // ── 4. Chainsaw Man ──
  "chainsaw-man": {
    amazonUrl:
      "https://www.amazon.com/s?k=Chainsaw+Man+manga+box+set&i=stripbooks&tag=mangapulse-20",
    badge: "Box Set & Volumes 1-11",
  },
  "105778": {
    amazonUrl:
      "https://www.amazon.com/s?k=Chainsaw+Man+manga+box+set&i=stripbooks&tag=mangapulse-20",
    badge: "Box Set & Volumes 1-11",
  },

  // ── 5. Dandadan ──
  "dandadan": {
    amazonUrl:
      "https://www.amazon.com/s?k=Dandadan+manga+volume+1&i=stripbooks&tag=mangapulse-20",
    badge: "Paperback & Kindle Volumes",
  },
  "132029": {
    amazonUrl:
      "https://www.amazon.com/s?k=Dandadan+manga+volume+1&i=stripbooks&tag=mangapulse-20",
    badge: "Paperback & Kindle Volumes",
  },
};

/**
 * Resolves custom affiliate link for a series by checking slug, AniList ID, or title.
 */
export function getSeriesAffiliateOverride(
  slug?: string | null,
  id?: number | string | null,
  title?: string | null
): SeriesAffiliateOverride | null {
  if (slug) {
    const cleanSlug = slug.toLowerCase().replace(/-\d+$/, "").trim();
    if (SERIES_AFFILIATE_OVERRIDES[cleanSlug]) return SERIES_AFFILIATE_OVERRIDES[cleanSlug];
    if (SERIES_AFFILIATE_OVERRIDES[slug.toLowerCase().trim()]) return SERIES_AFFILIATE_OVERRIDES[slug.toLowerCase().trim()];
  }

  if (id !== undefined && id !== null) {
    const idKey = String(id).trim();
    if (SERIES_AFFILIATE_OVERRIDES[idKey]) return SERIES_AFFILIATE_OVERRIDES[idKey];
  }

  if (title) {
    const cleanTitle = title.toLowerCase().trim();
    if (SERIES_AFFILIATE_OVERRIDES[cleanTitle]) return SERIES_AFFILIATE_OVERRIDES[cleanTitle];
    const slugified = cleanTitle.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (SERIES_AFFILIATE_OVERRIDES[slugified]) return SERIES_AFFILIATE_OVERRIDES[slugified];
  }

  return null;
}
