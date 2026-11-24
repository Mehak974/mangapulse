import { NextRequest, NextResponse } from "next/server";
import { getScheduledDropsForDate, VERIFIED_SCHEDULES, calculateProgressedChapters } from "@/lib/mangaScheduleDb";

export const dynamic = "force-dynamic";

/**
 * Public Drop Syndication Feed (JSON)
 * Connects directly to Make.com, Zapier, Buffer, or custom Twitter/Bluesky bots
 * to automatically post official chapter drops without manual intervention.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mangapulse.co";
  const dayFilter = url.searchParams.get("day") || "today";

  const now = new Date();
  let items = [];

  if (dayFilter === "all") {
    // Return all active series in DB with latest calculated chapters
    items = VERIFIED_SCHEDULES
      .filter((s) => s.id && !s.isFinished && !s.isHiatus && s.cadence !== "finished" && s.cadence !== "hiatus")
      .map((item) => {
        const { latestChapter, nextChapter } = calculateProgressedChapters(item, now);
        const rawTitle = item.titleMatch?.[0] || `Manga #${item.id}`;
        const title = rawTitle
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        const baseSlug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const slug = `${baseSlug}-${item.id}`;
        const mangaUrl = `${siteUrl}/manga/${slug}`;

        return formatFeedItem(title, latestChapter, nextChapter, item.magazine, item.publisher, mangaUrl, item.cadence);
      });
  } else {
    // Today's scheduled drops
    const drops = getScheduledDropsForDate(now);
    items = drops.map((drop) => {
      const mangaUrl = `${siteUrl}/manga/${drop.slug}`;
      return formatFeedItem(drop.title, drop.latestChapter, drop.nextChapter, drop.magazine, drop.publisher, mangaUrl, drop.cadence);
    });
  }

  return NextResponse.json(
    {
      feed_title: "MangaPulse Official Manga Drops Feed",
      feed_description: "Real-time syndication feed for automated social media broadcasting of verified manga releases.",
      home_page_url: siteUrl,
      updated_at: now.toISOString(),
      item_count: items.length,
      items,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}

function formatFeedItem(
  title: string,
  chapter: number,
  nextChapter: number,
  magazine: string,
  publisher: string,
  mangaUrl: string,
  cadence: string
) {
  const hashtag = title.replace(/[^a-zA-Z0-9]/g, "");
  
  return {
    id: `${hashtag.toLowerCase()}-ch${chapter}`,
    series: title,
    latest_chapter: chapter,
    next_chapter: nextChapter,
    magazine,
    publisher,
    cadence,
    url: mangaUrl,
    published_at: new Date().toISOString(),
    social_snippets: {
      twitter: `🔥 CHAPTER OUT NOW: ${title} Chapter ${chapter} is officially available via ${publisher}!\n\nRead legally & track upcoming countdowns:\n${mangaUrl}\n\n#${hashtag} #MangaPulse #Manga`,
      bluesky: `🔥 ${title} Chapter ${chapter} is officially out!\n\nRead legally on ${publisher} and track live chapter countdowns:\n${mangaUrl}`,
      discord: `**${title}** Chapter **${chapter}** is out now on **${publisher}**! Read legally: <${mangaUrl}>`,
    },
  };
}
