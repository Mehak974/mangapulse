import type { Metadata } from "next";
import { MangaItem } from "@/types/manga";

export const SITE_NAME = "MangaPulse";
export const SITE_TAGLINE = "100% Legal Manga Tracker, Release Countdown & Official Hub";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mangapulse.co";

interface MetadataOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description = "Track manga reading progress, watch live chapter release countdowns, and discover where to read and buy official volumes legally.",
  path = "/",
  image = "/og-pulse.png",
  noIndex = false,
}: MetadataOptions): Metadata {
  const canonicalUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const fullTitle = path === "/" ? `${SITE_NAME} — ${SITE_TAGLINE}` : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: image.startsWith("http") ? image : `${SITE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.startsWith("http") ? image : `${SITE_URL}${image}`],
    },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

/**
 * Generates Google-compliant JSON-LD Book structured data.
 */
export function generateBookSchema(manga: MangaItem) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: manga.displayTitle,
    alternateName: manga.title.romaji || manga.title.native || undefined,
    description: manga.description || `Read and track ${manga.displayTitle} official releases.`,
    image: manga.coverImage.extraLarge || manga.coverImage.large,
    inLanguage: manga.countryOfOrigin === "JP" ? "ja" : manga.countryOfOrigin === "KR" ? "ko" : "en",
    numberOfPages: manga.chapters ? `${manga.chapters} chapters` : undefined,
    genre: manga.genres,
    aggregateRating: manga.averageScore
      ? {
          "@type": "AggregateRating",
          ratingValue: (manga.averageScore / 20).toFixed(1), // 5-star scale
          bestRating: "5",
          worstRating: "1",
          ratingCount: manga.popularity || 100,
        }
      : undefined,
  };
}

/**
 * Generates Google-compliant JSON-LD Event / Countdown structured data for upcoming chapters.
 */
export function generateCountdownSchema(manga: MangaItem) {
  if (!manga.nextAiringChapter) return null;

  const releaseDate = new Date(manga.nextAiringChapter.airingAt * 1000).toISOString();
  const chapterNumber = manga.nextAiringChapter.episodeOrChapter;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${manga.displayTitle} Chapter ${chapterNumber} Release`,
    startDate: releaseDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: `${SITE_URL}/release-date/${manga.slug}`,
    },
    description: `Official countdown timer and release schedule for ${manga.displayTitle} Chapter ${chapterNumber}.`,
    image: manga.coverImage.extraLarge || manga.coverImage.large,
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

