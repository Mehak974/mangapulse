import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { fetchMangaDetails, slugify } from "@/lib/anilist";
import { isMangaDelisted } from "@/lib/mangaOverrides";
import { buildMetadata, generateBookSchema, generateCountdownSchema, SITE_URL } from "@/lib/seo";
import { indexDiscoveredPages } from "@/lib/indexnow";
import { recordVisitedPage } from "@/lib/visitedPages";
import MangaDetailActions from "@/components/MangaDetailActions";
import MangaDetailTabs from "@/components/MangaDetailTabs";
import { getOfficialLinksForManga } from "@/lib/officialLinks";
import { getVerifiedSchedule } from "@/lib/mangaScheduleDb";
import { Star, ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (await isMangaDelisted(slug)) {
    return buildMetadata({
      title: "Manga Delisted / Not Found",
      path: `/manga/${slug}`,
      noIndex: true,
    });
  }

  const { manga } = await fetchMangaDetails(slug);

  if (!manga) {
    return buildMetadata({
      title: "Manga Not Found",
      path: `/manga/${slug}`,
      noIndex: true,
    });
  }

  const verified = getVerifiedSchedule(manga.id, manga.displayTitle, manga.status, manga.chapters);
  const isFinished = verified.isFinished || manga.status === "FINISHED";
  const nextChapter = verified.nextChapter || manga.nextAiringChapter?.episodeOrChapter;
  const total = (verified.isVerifiedInDb && (verified.totalChapters || verified.latestChapter)) ? (verified.totalChapters || verified.latestChapter) : manga.chapters;

  let title = "";
  let description = "";

  if (isFinished) {
    title = `${manga.displayTitle} — All ${total ? `${total} ` : ""}Chapters & Official Reading Directory`;
    description = `Complete reading directory for ${manga.displayTitle}. Official serialization concluded across ${total ? `${total} ` : ""}chapters. Find licensed publishers, volumes, and legal reading links.`;
  } else {
    title = nextChapter
      ? `${manga.displayTitle} Chapter ${nextChapter} Countdown & Release Schedule`
      : `${manga.displayTitle} — Official Release Schedule & Chapter Directory`;
    description = nextChapter
      ? `Track ${manga.displayTitle} Chapter ${nextChapter} release countdown, schedule, and official where to read directory for ${verified.publisher || "licensed publishers"}.`
      : `Track ${manga.displayTitle} official release schedule, chapter countdowns, volume release dates, and official where to read directory. Zero scanlations or image hosting.`;
  }

  return buildMetadata({
    title,
    description,
    path: `/manga/${slug}`,
    image: manga.coverImage.extraLarge || manga.coverImage.large || undefined,
  });
}

export default async function MangaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (await isMangaDelisted(slug)) notFound();

  const { manga, recommendations } = await fetchMangaDetails(slug);

  if (!manga) notFound();
  if (await isMangaDelisted(manga.slug) || await isMangaDelisted(manga.displayTitle)) notFound();

  // Auto-index newly discovered manga and pure-title paths to IndexNow & Sitemap
  const titleSlug = slugify(manga.displayTitle);
  recordVisitedPage(`/manga/${slug}`, { title: manga.displayTitle });
  if (titleSlug && titleSlug !== slug) {
    recordVisitedPage(`/manga/${titleSlug}`, { title: manga.displayTitle });
  }

  const coverUrl =
    manga.coverImage.extraLarge ||
    manga.coverImage.large ||
    manga.coverImage.medium ||
    "/placeholder-cover.png";

  const ratingFormatted = manga.averageScore
    ? (manga.averageScore / 20).toFixed(1)
    : null;

  const verified = getVerifiedSchedule(manga.id, manga.displayTitle, manga.status, manga.chapters);
  const bookSchema = generateBookSchema(manga);
  const countdownSchema = generateCountdownSchema(manga, {
    targetTimestamp: verified.targetTimestamp,
    nextChapter: verified.nextChapter,
    publisher: verified.publisher,
    isFinished: verified.isFinished,
    isHiatus: verified.isHiatus,
  });
  const officialLinks = getOfficialLinksForManga(manga);

  return (
    <div className="pb-20 space-y-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
      />
      {countdownSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(countdownSchema) }}
        />
      )}

      {/* Main Header / Overview Area */}
      <section className="border-b border-[#1e2430] bg-[#0f1217] py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cover & Quick Facts */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4">
            <div className="relative aspect-[3/4.4] w-full max-w-xs mx-auto md:mx-0 rounded-xl overflow-hidden border border-[#2a3344] bg-[#0c0e12] shadow-xl">
              <Image
                src={coverUrl}
                alt={manga.displayTitle}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
            </div>

            {/* Structured Specifications Sidebar */}
            <div className="surface-card rounded-xl p-4 border border-[#2a3344] space-y-3 text-xs">
              <div className="font-mono text-[11px] uppercase text-white font-bold pb-2 border-b border-[#1e2430]">
                Series Specifications
              </div>

              <div className="flex justify-between">
                <span className="text-[#94a1b5]">Format</span>
                <span className="font-semibold text-white">
                  {manga.countryOfOrigin === "KR" ? "Manhwa (Webtoon)" : "Manga (Print & Digital)"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#94a1b5]">Country</span>
                <span className="font-semibold text-white">
                  {manga.countryOfOrigin === "KR" ? "South Korea" : "Japan"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#94a1b5]">Status</span>
                <span className={`font-semibold ${manga.status === "RELEASING" ? "text-emerald-400" : manga.status === "HIATUS" ? "text-amber-400" : "text-white"}`}>
                  {manga.status === "RELEASING" ? "Publishing (Ongoing)" : manga.status === "HIATUS" ? "On Hiatus" : manga.status === "FINISHED" ? "Completed" : manga.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#94a1b5]">Total Chapters</span>
                <span className="font-mono font-semibold text-white">
                  {manga.chapters ? `${manga.chapters} Chapters` : manga.status === "FINISHED" ? "Completed" : "Publishing (Ongoing)"}
                </span>
              </div>

              {manga.volumes && (
                <div className="flex justify-between">
                  <span className="text-[#94a1b5]">Tankobon Volumes</span>
                  <span className="font-mono font-semibold text-white">{manga.volumes} Volumes</span>
                </div>
              )}

              {manga.startDate?.year && (
                <div className="flex justify-between">
                  <span className="text-[#94a1b5]">Serialized Since</span>
                  <span className="font-mono font-semibold text-white">
                    {manga.startDate.year}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-[#94a1b5]">Rating</span>
                <span className="font-mono font-bold text-amber-400">
                  {ratingFormatted ? `${ratingFormatted} / 5.0` : "—"}
                </span>
              </div>
            </div>

            {/* Alternative Names & Synonyms below Series Specifications */}
            <div className="surface-card rounded-xl p-4 border border-[#2a3344] space-y-3 text-xs">
              <div className="font-mono text-[11px] uppercase text-white font-bold pb-2 border-b border-[#1e2430]">
                Alternative Names
              </div>

              {manga.title.english && (
                <div>
                  <span className="text-[#94a1b5] block text-[10px] uppercase font-mono">English</span>
                  <span className="text-white font-medium">{manga.title.english}</span>
                </div>
              )}

              {manga.title.romaji && (
                <div>
                  <span className="text-[#94a1b5] block text-[10px] uppercase font-mono">Romaji</span>
                  <span className="text-white font-medium">{manga.title.romaji}</span>
                </div>
              )}

              {manga.title.native && (
                <div>
                  <span className="text-[#94a1b5] block text-[10px] uppercase font-mono">Native</span>
                  <span className="text-white font-medium">{manga.title.native}</span>
                </div>
              )}

              {manga.synonyms && manga.synonyms.length > 0 && (
                <div>
                  <span className="text-[#94a1b5] block text-[10px] uppercase font-mono">Synonyms & Aliases</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {manga.synonyms.map((syn, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-[#13171f] border border-[#1e2430] text-[11px] text-[#94a1b5]"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Title, Countdown, Official Read/Buy, Synopsis */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#1e2430] text-[#94a1b5] border border-[#2a3344]">
                  {manga.countryOfOrigin === "KR" ? "Korean Webtoon" : "Japanese Manga"}
                </span>
                {manga.status === "RELEASING" && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Simulpub
                  </span>
                )}
                {manga.status === "HIATUS" && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    On Hiatus
                  </span>
                )}
                {manga.status === "FINISHED" && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Completed Series
                  </span>
                )}
                {ratingFormatted && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {ratingFormatted} Rating
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {manga.displayTitle}
              </h1>

              {/* Bot & User Verified Legal Notice */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Verified Legal Directory • Zero Image Hosting • Direct Publisher Links</span>
              </div>

              {manga.title.romaji && manga.title.romaji !== manga.displayTitle && (
                <div className="text-xs font-mono text-[#5e6b82]">
                  Romaji: {manga.title.romaji}
                  {manga.title.native ? ` • Native: ${manga.title.native}` : ""}
                </div>
              )}

              {/* Genre Chips */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {manga.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 rounded bg-[#13171f] border border-[#2a3344] text-[11px] text-[#94a1b5]"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* User Reading & Collection Actions */}
              <MangaDetailActions manga={manga} />
            </div>

            {/* Interactive Section Tabs: Overview | Stats | Reviews */}
            <MangaDetailTabs
              manga={manga}
              coverUrl={coverUrl}
              recommendations={recommendations}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
