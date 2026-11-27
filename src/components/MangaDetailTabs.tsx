"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, BarChart2, MessageSquare, Star, Clock, Compass, Sparkles, Layers } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import OfficialActions from "@/components/OfficialActions";
import MangaNote from "@/components/MangaNote";
import ChapterTracker from "@/components/ChapterTracker";
import MangaStats from "@/components/MangaStats";
import MangaReviews from "@/components/MangaReviews";
import MangaCard from "@/components/MangaCard";
import { MangaItem } from "@/types/manga";
import { generateEditorialSeriesDescription } from "@/lib/seriesDescriptionGenerator";

interface MangaDetailTabsProps {
  manga: MangaItem;
  coverUrl: string;
  recommendations: MangaItem[];
}

export default function MangaDetailTabs({
  manga,
  coverUrl,
  recommendations,
}: MangaDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "reviews">("overview");
  const editorial = generateEditorialSeriesDescription(manga);

  return (
    <div className="space-y-6">
      {/* Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#1e2430] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "overview"
              ? "bg-[#1a1f2a] text-blue-400 border border-[#2a3344] shadow-sm"
              : "text-[#94a1b5] hover:text-white hover:bg-[#13171f]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "stats"
              ? "bg-[#1a1f2a] text-blue-400 border border-[#2a3344] shadow-sm"
              : "text-[#94a1b5] hover:text-white hover:bg-[#13171f]"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Stats</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === "reviews"
              ? "bg-[#1a1f2a] text-blue-400 border border-[#2a3344] shadow-sm"
              : "text-[#94a1b5] hover:text-white hover:bg-[#13171f]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reviews</span>
        </button>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Countdown Box / Series Status */}
          {manga.status !== "FINISHED" && manga.nextAiringChapter ? (
            <div className="space-y-2">
              <CountdownTimer
                targetTimestamp={manga.nextAiringChapter.airingAt}
                chapterNumber={manga.nextAiringChapter.episodeOrChapter}
              />
              <div className="flex justify-end">
                <Link
                  href={`/release-date/${manga.slug}`}
                  className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Dedicated Worldwide Release Schedule & Timezone Converter →</span>
                </Link>
              </div>
            </div>
          ) : manga.status === "FINISHED" ? (
            <div className="surface-card rounded-xl p-4 border border-[#2a3344] bg-[#0c0e12] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold flex-shrink-0">
                ✓
              </div>
              <div>
                <div className="font-bold text-xs text-white uppercase font-mono">
                  Series Completed • All Chapters Released
                </div>
                <div className="text-xs text-[#94a1b5] mt-0.5">
                  This series has concluded its official serialization. All {manga.chapters ? `${manga.chapters} ` : ""}chapters are available on verified licensed platforms below.
                </div>
              </div>
            </div>
          ) : manga.status === "HIATUS" ? (
            <div className="surface-card rounded-xl p-4 border border-[#2a3344] bg-[#0c0e12] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold flex-shrink-0">
                ⏸
              </div>
              <div>
                <div className="font-bold text-xs text-white uppercase font-mono">
                  Official Publication Hiatus
                </div>
                <div className="text-xs text-[#94a1b5] mt-0.5">
                  This series is currently on an official publication hiatus. Verified chapters up to Chapter {manga.chapters || "latest"} are available on official platforms below.
                </div>
              </div>
            </div>
          ) : null}

          {/* Official Actions */}
          <OfficialActions links={manga.officialLinks} mangaTitle={manga.displayTitle} />

          {/* Editorial Series Overview or Verified Story Premise */}
          <div className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <h2 className="font-bold text-white text-sm">
                  {editorial.isBespoke ? "Staff Editorial Review & Overview" : "Story Synopsis & Series Overview"}
                </h2>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                editorial.isBespoke
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : "text-blue-400 bg-blue-500/10 border-blue-500/20"
              }`}>
                {editorial.isBespoke ? "Editorial Review" : "Verified Synopsis"}
              </span>
            </div>

            {/* If human-curated bespoke editorial exists, show editorial review */}
            {editorial.isBespoke && editorial.editorialAnalysis && (
              <div className="space-y-2.5 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                <p className="font-semibold text-white text-sm sm:text-base leading-snug">
                  {editorial.hook}
                </p>
                <p className="text-[#94a1b5] leading-relaxed">
                  {editorial.editorialAnalysis}
                </p>
              </div>
            )}

            {/* Clean Story Premise */}
            {editorial.synopsis && (
              <div className={`space-y-1.5 ${editorial.isBespoke ? "pt-3 border-t border-[#1e2430]" : ""}`}>
                <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-[#94a1b5]">
                  Story Premise & Setting
                </h3>
                <p className="text-xs sm:text-sm text-[#94a1b5] leading-relaxed whitespace-pre-line">
                  {editorial.synopsis}
                </p>
              </div>
            )}

            {/* Publication & Reading Advice Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#1e2430] text-xs">
              <div className="p-3 rounded-lg bg-[#0c0e12] border border-[#1e2430]">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  <span>Official Simulpub & Licensing</span>
                </div>
                <div className="text-[#94a1b5] leading-relaxed text-[11px]">
                  {editorial.simulpubGuide}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0c0e12] border border-[#1e2430]">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reader Recommendation</span>
                </div>
                <div className="text-[#94a1b5] leading-relaxed text-[11px]">
                  {editorial.readingRecommendation}
                </div>
              </div>
            </div>

            {/* Key Series Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-[#1e2430]">
              {editorial.highlights.map((h, i) => (
                <div key={i} className="p-2.5 rounded bg-[#0c0e12] border border-[#1e2430] text-[11px]">
                  <div className="text-[#5e6b82] font-mono text-[10px] uppercase">{h.label}</div>
                  <div className="text-white font-semibold mt-0.5 truncate">{h.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Note Feature */}
          <MangaNote mangaId={manga.id} mangaTitle={manga.displayTitle} />

          {/* Interactive Chapter Tracker with Mark All Below */}
          <ChapterTracker
            mangaId={manga.id}
            mangaTitle={manga.displayTitle}
            totalChapters={manga.chapters}
            latestChapter={manga.nextAiringChapter?.episodeOrChapter}
          />

          {/* Cadence & Simulpub Policies breakdown (Dynamic per publisher/country) */}
          {(() => {
            const isKorean = manga.countryOfOrigin === "KR";
            const isShueisha =
              (manga.officialLinks || []).some(
                (l) => l.name.toLowerCase().includes("manga plus") || l.name.toLowerCase().includes("shueisha")
              ) ||
              (editorial.highlights.find((h) => h.label === "Legal Access")?.value || "").includes("MANGA Plus");

            return (
              <div className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-3">
                <h3 className="font-bold text-white text-sm">
                  {isKorean
                    ? "Official Webtoon Digital Release & Cadence"
                    : isShueisha
                    ? "Official Shueisha Simulpub & Cadence"
                    : "Official Publishing & Release Cadence"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#0c0e12] border border-[#1e2430] rounded-lg">
                    <div className="font-bold text-white mb-0.5">
                      {isKorean ? "Digital Episode Drop Timing" : "Simultaneous Release Time"}
                    </div>
                    <div className="text-[#94a1b5]">
                      {isKorean
                        ? "New episodes are published digitally in accordance with South Korean studio schedules (e.g., Naver Webtoon / KakaoPage) with simultaneous or fast-track authorized English releases."
                        : isShueisha
                        ? "Chapters are translated and released simultaneously worldwide with the Japanese magazine drop at 00:00 JST / 15:00 UTC."
                        : "Official digital chapters and tankōbon volumes are released in coordination with Japanese serializations via licensed publishing storefronts."}
                    </div>
                  </div>
                  <div className="p-3 bg-[#0c0e12] border border-[#1e2430] rounded-lg">
                    <div className="font-bold text-white mb-0.5">
                      {isKorean ? "Where to Read Legally" : "Where to Read & Purchase"}
                    </div>
                    <div className="text-[#94a1b5]">
                      {isKorean
                        ? "Official English digital releases are licensed on authorized platforms including LINE Webtoon, Tapas, and Tappytoon. Authorized mobile apps often support daily free reading passes."
                        : isShueisha
                        ? "MANGA Plus by Shueisha and Viz Media provide the 3 latest chapters 100% free with no subscription required on both web and mobile."
                        : "Available through authorized publisher portals including Kodansha K Manga, BookWalker, and digital volume storefronts like Amazon Kindle."}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Readers Also Track (6 recommendations) inside Overview */}
          {recommendations.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#1e2430]">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2430]">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Readers Also Track ({Math.min(6, recommendations.length)} Recommendations)
                  </h3>
                  <p className="text-[11px] text-[#94a1b5] mt-0.5">
                    Licensed series with overlapping demographic and themes
                  </p>
                </div>
                <span className="text-[11px] font-mono text-[#94a1b5]">
                  Verified Recommendation Index
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                {recommendations.slice(0, 6).map((rec) => (
                  <MangaCard key={rec.id} manga={rec} showCountdown={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Stats */}
      {activeTab === "stats" && (
        <div className="animate-in fade-in duration-150">
          <MangaStats manga={manga} />
        </div>
      )}

      {/* Tab Content 3: Reviews */}
      {activeTab === "reviews" && (
        <div className="animate-in fade-in duration-150">
          <MangaReviews
            mangaId={manga.id}
            mangaTitle={manga.displayTitle}
            mangaSlug={manga.slug}
            mangaCover={coverUrl}
            averageScore={manga.averageScore}
          />
        </div>
      )}
    </div>
  );
}
