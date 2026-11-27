import type { Metadata } from "next";
import { MangaItem } from "@/types/manga";

export const SITE_NAME = "MangaPulse";
export const SITE_TAGLINE = "Manga Release Schedule, Chapter Countdown & Official Directory";

function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mangapulse.co";
  if (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
    return envUrl;
  }
  return envUrl.replace(/^https?:\/\/mangapulse\.co/, "https://www.mangapulse.co");
}

export const SITE_URL = resolveSiteUrl();

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
  return [
    {
      "@context": "https://schema.org",
      "@type": "Book",
      name: manga.displayTitle,
      alternateName: manga.title.romaji || manga.title.native || undefined,
      description: manga.description || `Official release tracker and publisher directory for ${manga.displayTitle}.`,
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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Browse Directory",
          item: `${SITE_URL}/browse`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: manga.displayTitle,
          item: `${SITE_URL}/manga/${manga.slug}`,
        },
      ],
    },
  ];
}

export interface CountdownSchemaOptions {
  targetTimestamp?: number | null;
  nextChapter?: number | string;
  publisher?: string;
  cadenceText?: string;
  isFinished?: boolean;
  isHiatus?: boolean;
  totalChapters?: number | null;
}

/**
 * Generates Schema.org FAQPage structured data for AEO / Answer Engine Optimization.
 * Specifically parsed by Google AI Overviews, Perplexity, and SearchGPT for verbatim answers.
 */
export function generateFaqSchema(manga: MangaItem, options?: CountdownSchemaOptions) {
  const isFinished = options?.isFinished || manga.status === "FINISHED";
  const isHiatus = options?.isHiatus || manga.status === "HIATUS";
  const ch = options?.nextChapter || "Upcoming";
  const pub = options?.publisher || "official licensed publishers";
  const total = options?.totalChapters || manga.chapters;

  const releaseDateText = options?.targetTimestamp
    ? new Date(options.targetTimestamp * 1000).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "its upcoming scheduled drop date";

  const faqs = isFinished
    ? [
        {
          question: `Is ${manga.displayTitle} officially completed?`,
          answer: `Yes, official serialization for ${manga.displayTitle} has concluded with all ${total ? `${total} ` : ""}chapters released. Complete volumes and authorized chapters are accessible via official licensed publishers.`,
        },
        {
          question: `Where can I read all chapters of ${manga.displayTitle} legally?`,
          answer: `You can read ${manga.displayTitle} legally across authorized publishing partners including ${pub}, book retailers, and verified digital manga storefronts with zero scans or piracy.`,
        },
        {
          question: `Will there be any sequel or side stories for ${manga.displayTitle}?`,
          answer: `The primary story serialization has completed in full. Any officially licensed spin-offs, side epilogues, or special editions are tracked and cataloged on the MangaPulse directory.`,
        },
      ]
    : isHiatus
    ? [
        {
          question: `Is ${manga.displayTitle} on hiatus or delayed?`,
          answer: `Yes, official serialization for ${manga.displayTitle} is currently on a scheduled publication hiatus. Verified chapters up to Chapter ${manga.chapters || "latest"} remain available on licensed platforms.`,
        },
        {
          question: `When will ${manga.displayTitle} resume publication?`,
          answer: `The publisher has not yet announced a definitive resumption date. MangaPulse tracks official editorial announcements and updates the countdown clock immediately upon publisher confirmation.`,
        },
        {
          question: `Where can I read verified chapters of ${manga.displayTitle}?`,
          answer: `Verified canon chapters are officially distributed through authorized platforms including ${pub}.`,
        },
      ]
    : [
        {
          question: `When does ${manga.displayTitle} Chapter ${ch} release?`,
          answer: `${manga.displayTitle} Chapter ${ch} is scheduled for simultaneous worldwide release on ${releaseDateText} at 15:00 UTC (10:00 AM EST / 00:00 JST next day) via ${pub}.`,
        },
        {
          question: `Where can I read ${manga.displayTitle} Chapter ${ch} legally for free?`,
          answer: `Official simulpub platforms such as Shueisha's MANGA Plus, Viz Media, and authorized digital partners make the latest new chapters available for free reading with zero subscription required.`,
        },
        {
          question: `What is the release schedule cadence for ${manga.displayTitle}?`,
          answer: `${manga.displayTitle} follows a verified ${options?.cadenceText || "weekly"} release cadence on ${pub}. Any announced creative breaks or holiday delays update automatically on the MangaPulse live countdown.`,
        },
        {
          question: `Why should readers choose official simulpubs over fan scanlations?`,
          answer: `Official simulpubs on licensed platforms guarantee high-resolution original digital raster artwork, verified professional translations, zero malware/popunder advertisements, and direct royalties to the original creators.`,
        },
      ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/**
 * Generates Google-compliant JSON-LD Event, Breadcrumb & FAQ structured data for upcoming chapters.
 * Optimized for SearchGPT, Perplexity AI, Google AI Overviews, and Rich Results.
 */
export function generateCountdownSchema(
  manga: MangaItem,
  options?: CountdownSchemaOptions
) {
  const isFinished = options?.isFinished || manga.status === "FINISHED";
  const isHiatus = options?.isHiatus || manga.status === "HIATUS";
  const chapterNumber = options?.nextChapter || manga.nextAiringChapter?.episodeOrChapter || "Next";

  const schemas: any[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: manga.displayTitle,
          item: `${SITE_URL}/manga/${manga.slug}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: isFinished ? "Completed Reading Directory" : `Chapter ${chapterNumber} Countdown`,
          item: `${SITE_URL}/release-date/${manga.slug}`,
        },
      ],
    },
    generateFaqSchema(manga, options),
  ];

  if (!isFinished && !isHiatus) {
    const timestamp = options?.targetTimestamp || manga.nextAiringChapter?.airingAt;
    if (timestamp) {
      const startDate = new Date(timestamp * 1000).toISOString();
      const endDate = new Date((timestamp + 3600) * 1000).toISOString();

      schemas.unshift({
        "@context": "https://schema.org",
        "@type": "Event",
        name: `${manga.displayTitle} Chapter ${chapterNumber} Official Release`,
        startDate: startDate,
        endDate: endDate,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: {
          "@type": "VirtualLocation",
          url: `${SITE_URL}/release-date/${manga.slug}`,
        },
        description: `Official countdown timer and simultaneous release schedule for ${manga.displayTitle} Chapter ${chapterNumber}.`,
        image: manga.coverImage.extraLarge || manga.coverImage.large,
        organizer: {
          "@type": "Organization",
          name: options?.publisher || SITE_NAME,
          url: SITE_URL,
        },
      });
    }
  }

  return schemas;
}

