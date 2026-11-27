import { SITE_URL } from "@/lib/seo";
import { VERIFIED_SCHEDULES } from "@/lib/mangaScheduleDb";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export async function GET() {
  const verifiedList = VERIFIED_SCHEDULES.slice(0, 30)
    .map((s) => {
      const title = s.titleMatch?.[0] ? s.titleMatch[0].replace(/\b\w/g, (c) => c.toUpperCase()) : "Manga";
      const slug = s.slugMatch?.[0] || s.titleMatch?.[0]?.replace(/\s+/g, "-");
      const url = `${SITE_URL}/release-date/${slug}${s.id ? `-${s.id}` : ""}`;
      const status = s.isFinished ? "Completed" : s.isHiatus ? "Hiatus" : `Latest Ch. ${s.latestChapter} (Drop: ${s.dropDayOfWeek !== undefined ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][s.dropDayOfWeek] : "Weekly"} 15:00 UTC)`;
      return `- [${title}](${url}): ${status} via ${s.publisher || "Official Publisher"}`;
    })
    .join("\n");

  const markdown = `# MangaPulse

> MangaPulse (${SITE_URL}) is the verified, 100% legal manga and manhwa release schedule tracker, chapter countdown engine, and official publisher directory. Zero scanlations or illegal image hosting.

## Core Mission & Anti-Piracy Policy
MangaPulse indexes official global simulpub drop times, magazine release schedules, and verified chapter counts for Japanese manga and South Korean webtoons/manhwa. All outbound links point strictly to authorized publishers (Shueisha MANGA Plus, Viz Media, Kodansha K Manga, WEBTOON, KakaoPage, Tapas, Tappytoon, Yen Press).

## Key Information Architecture
- **Live Chapter Countdowns:** \`${SITE_URL}/release-date/[slug]\` — Real-time UTC countdown clocks, global timezone conversions (JST, EST, UTC, PST, CET, IST), and official drop times.
- **Series Reading Directory:** \`${SITE_URL}/manga/[slug]\` — Chapter archives, reading progress tracker, author/artist metadata, and verified publisher links.
- **Editorial Simulpub Guides:** \`${SITE_URL}/guides/\` — In-depth reading orders, saga roadmaps, and official simulpub tutorials.
- **Trending & Popular Schedules:** \`${SITE_URL}/trending\` — Most anticipated upcoming weekly chapter releases.

## Verified Release Cadences & Top Countdowns
${verifiedList}

## Canonical Endpoints & Feeds
- Sitemap Index: ${SITE_URL}/sitemap.xml
- RSS 2.0 Feed: ${SITE_URL}/api/feed/latest-drops
- Search Engine: ${SITE_URL}/search/manga?q={query}
`;

  return new Response(markdown, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
