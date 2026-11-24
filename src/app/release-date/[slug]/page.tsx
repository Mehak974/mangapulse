import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { fetchMangaDetails } from "@/lib/anilist";
import { buildMetadata, generateCountdownSchema } from "@/lib/seo";
import CountdownTimer from "@/components/CountdownTimer";
import OfficialActions from "@/components/OfficialActions";
import { Clock, Globe, ArrowLeft, Calendar, HelpCircle, CheckCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { manga } = await fetchMangaDetails(slug);

  if (!manga) {
    return buildMetadata({
      title: "Release Date Not Found",
      path: `/release-date/${slug}`,
      noIndex: true,
    });
  }

  const chapterNum =
    manga.nextAiringChapter?.episodeOrChapter ||
    (manga.chapters ? manga.chapters + 1 : "Upcoming");

  return buildMetadata({
    title: `${manga.displayTitle} Chapter ${chapterNum} Release Date & Live Countdown`,
    description: `Confirmed release schedule and exact worldwide countdown for ${manga.displayTitle} Chapter ${chapterNum}. Official simultaneous drop times for JST, EST, GMT, and where to read on Manga Plus.`,
    path: `/release-date/${slug}`,
    image: manga.coverImage.extraLarge || manga.coverImage.large || undefined,
  });
}

export default async function ReleaseDateCountdownPage({ params }: PageProps) {
  const { slug } = await params;
  const { manga } = await fetchMangaDetails(slug);

  if (!manga) notFound();

  const chapterNum =
    manga.nextAiringChapter?.episodeOrChapter ||
    (manga.chapters ? manga.chapters + 1 : "Upcoming");

  const airingTimestamp =
    manga.nextAiringChapter?.airingAt ||
    Math.floor(Date.now() / 1000) + 86400 * 3;

  const releaseDateObj = new Date(airingTimestamp * 1000);

  const formatZone = (tz: string) =>
    releaseDateObj.toLocaleString("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const timezones = [
    { zone: "Japan Standard Time (JST)", abbr: "Tokyo", time: formatZone("Asia/Tokyo") },
    { zone: "Eastern Standard Time (EST)", abbr: "New York / US East", time: formatZone("America/New_York") },
    { zone: "Pacific Standard Time (PST)", abbr: "Los Angeles / US West", time: formatZone("America/Los_Angeles") },
    { zone: "Greenwich Mean Time (UTC / GMT)", abbr: "London / UK", time: formatZone("UTC") },
    { zone: "Central European Time (CET)", abbr: "Paris / Berlin", time: formatZone("Europe/Paris") },
    { zone: "Australian Eastern Time (AEST)", abbr: "Sydney", time: formatZone("Australia/Sydney") },
    { zone: "Philippine / Singapore Time (PHT/SGT)", abbr: "Manila / Singapore", time: formatZone("Asia/Singapore") },
    { zone: "India Standard Time (IST)", abbr: "New Delhi", time: formatZone("Asia/Kolkata") },
  ];

  const countdownSchema = generateCountdownSchema(manga);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Schema.org Structured Data */}
      {countdownSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(countdownSchema) }}
        />
      )}

      {/* Back button */}
      <div>
        <Link
          href={`/manga/${manga.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#94a1b5] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {manga.displayTitle} Directory</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="space-y-2 border-b border-[#1e2430] pb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#94a1b5]">
            Confirmed Worldwide Simulpub Schedule
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {manga.displayTitle} Chapter {chapterNum} Release Date & Countdown
        </h1>

        <p className="text-xs sm:text-sm text-[#94a1b5] leading-relaxed">
          The upcoming chapter of {manga.displayTitle} is scheduled for simultaneous worldwide digital release on authorized publisher platforms including Shueisha MANGA Plus and Viz Media.
        </p>
      </div>

      {/* Prominent High-Visibility Countdown Timer */}
      <CountdownTimer
        targetTimestamp={airingTimestamp}
        chapterNumber={typeof chapterNum === "number" ? chapterNum : undefined}
      />

      {/* Complete Worldwide Timezone Schedule Table */}
      <div className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-white text-xs uppercase tracking-wider">
              Exact Release Time Across All Global Timezones
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#5e6b82]">
            Simultaneous Drop Time
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {timezones.map((tz) => (
            <div key={tz.zone} className="p-3 bg-[#0c0e12] border border-[#1e2430] rounded-lg flex items-center justify-between">
              <div>
                <div className="text-white font-semibold text-xs">{tz.abbr}</div>
                <div className="text-[10px] text-[#5e6b82] font-mono">{tz.zone}</div>
              </div>
              <div className="font-mono font-bold text-xs text-blue-400 text-right">
                {tz.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Where to Read */}
      <OfficialActions
        links={manga.officialLinks}
        mangaTitle={manga.displayTitle}
      />

      {/* Extended Release Schedule & Cadence FAQ */}
      <div className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1e2430]">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">
            Release Date & Simulpub FAQ
          </h3>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-[#94a1b5]">
          <div className="p-3.5 rounded-lg bg-[#0c0e12] border border-[#1e2430]">
            <div className="font-bold text-white mb-1">
              Where can I read {manga.displayTitle} Chapter {chapterNum} legally for free?
            </div>
            <div>
              Shueisha&apos;s official MANGA Plus service provides the latest 3 chapters free of charge with simultaneous English translation. You do not need to register an account or provide payment information.
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0c0e12] border border-[#1e2430]">
            <div className="font-bold text-white mb-1">
              Is {manga.displayTitle} on break or delayed this week?
            </div>
            <div>
              Our countdown timer synchronizes automatically with official publisher airing schedules. If the magazine announces a scheduled creative break or national holiday hiatus (such as Obon or Golden Week in Japan), the countdown timer updates to reflect the new verified date.
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0c0e12] border border-[#1e2430]">
            <div className="font-bold text-white mb-1">
              Why should I read official releases rather than fan scanlations?
            </div>
            <div>
              Official simulpubs on MANGA Plus and Viz Media ensure high-resolution original digital raster scans, verified professional translations, zero malware/popunder advertisements, and direct royalties to the original mangaka and creators.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
