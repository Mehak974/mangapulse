"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Bookmark,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Flame,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Plus,
  ExternalLink,
  ChevronRight,
  Settings,
  Activity,
  Layers,
  Download,
} from "lucide-react";
import ImportModal from "@/components/ImportModal";
import { useAuth } from "@/context/AuthContext";
import CountdownTimer from "@/components/CountdownTimer";
import MangaCard from "@/components/MangaCard";
import { MangaItem, UserLibraryEntry, ActivityItem } from "@/types/manga";
import SupporterAvatar from "@/components/SupporterAvatar";
import { fetchPopular, fetchRecommendationsByGenres } from "@/lib/anilist";
import { getOfficialLinksForManga } from "@/lib/officialLinks";
import { getUserActivities, logActivity } from "@/lib/userStore";
import { getVerifiedSchedule } from "@/lib/mangaScheduleDb";

// Known genre mappings for common series to calculate user interest
const GENRE_MAP: Record<string, string[]> = {
  "one piece": ["Action", "Adventure", "Fantasy"],
  "chainsaw man": ["Action", "Horror", "Supernatural"],
  "solo leveling": ["Action", "Adventure", "Fantasy"],
  "jujutsu kaisen": ["Action", "Supernatural"],
  "sakamoto days": ["Action", "Comedy"],
  "dandadan": ["Action", "Comedy", "Sci-Fi", "Supernatural"],
  "spy x family": ["Action", "Comedy"],
  "blue lock": ["Sports", "Drama"],
  "oshi no ko": ["Drama", "Mystery"],
  "berserk": ["Action", "Adventure", "Drama", "Fantasy"],
  "bleach": ["Action", "Adventure", "Supernatural"],
  "naruto": ["Action", "Adventure", "Fantasy"],
  "demon slayer": ["Action", "Supernatural"],
  "hunter x hunter": ["Action", "Adventure", "Fantasy"],
  "haikyuu": ["Sports", "Comedy", "Drama"],
  "tokyo ghoul": ["Action", "Drama", "Horror"],
  "kaiju no. 8": ["Action", "Sci-Fi"],
  "wind breaker": ["Action", "Drama"],
  "frieren": ["Adventure", "Drama", "Fantasy"],
  "tower of god": ["Action", "Adventure", "Fantasy", "Mystery"],
};

export default function DashboardPage() {
  const { user, isLoggedIn, library, collections, incrementChapter, refreshLibrary } = useAuth();
  const [recommendations, setRecommendations] = useState<MangaItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Combine unique manga entries from both library and user collections
  const userMangaMap = useMemo(() => {
    const map = new Map<
      number,
      {
        manga_id: number;
        manga_title: string;
        manga_slug: string;
        manga_cover: string;
        progress_chapter?: number;
        total_chapters?: number | null;
        status?: string;
      }
    >();

    // Add from library
    library.forEach((entry) => {
      map.set(entry.manga_id, {
        manga_id: entry.manga_id,
        manga_title: entry.manga_title,
        manga_slug: entry.manga_slug,
        manga_cover: entry.manga_cover,
        progress_chapter: entry.progress_chapter,
        total_chapters: entry.total_chapters,
        status: entry.status,
      });
    });

    // Add from collections
    collections.forEach((col) => {
      col.items?.forEach((it) => {
        if (!map.has(it.manga_id)) {
          map.set(it.manga_id, {
            manga_id: it.manga_id,
            manga_title: it.manga_title,
            manga_slug: it.manga_slug,
            manga_cover: it.manga_cover,
            progress_chapter: 0,
            total_chapters: null,
            status: "in_collection",
          });
        }
      });
    });

    return map;
  }, [library, collections]);

  const allUserManga = useMemo(() => Array.from(userMangaMap.values()), [userMangaMap]);
  const hasUserManga = allUserManga.length > 0;

  // Active reading items
  const readingList = useMemo(() => {
    return library.filter((it) => it.status === "reading");
  }, [library]);

  // Plan to read items
  const planList = useMemo(() => {
    return library.filter((it) => it.status === "plan_to_read");
  }, [library]);

  // Total chapters read across library
  const totalChaptersRead = useMemo(() => {
    return library.reduce((sum, it) => sum + (it.progress_chapter || 0), 0);
  }, [library]);

  // Weekly Goal from user preferences or fallback 15
  const weeklyGoal = user?.preferences?.weeklyGoalChapters || user?.reading_goal || 15;

  // Calculate chapters read this week from activity logs
  const chaptersReadThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 86400000;
    const weeklyActs = activities.filter(
      (a) => a.action_type === "read_chapter" && new Date(a.timestamp).getTime() > oneWeekAgo
    );
    return weeklyActs.reduce((acc, a) => acc + (a.chapters_count || 1), 0);
  }, [activities]);

  // Determine user interests based on genres of titles in user's library and collections
  const userInterests = useMemo(() => {
    if (allUserManga.length === 0) return [];

    const genreCounts: Record<string, number> = {};
    allUserManga.forEach((m) => {
      const lower = m.manga_title.toLowerCase();
      let matched = false;
      for (const [key, genres] of Object.entries(GENRE_MAP)) {
        if (lower.includes(key)) {
          matched = true;
          genres.forEach((g) => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
          });
        }
      }
      if (!matched) {
        ["Action", "Adventure"].forEach((g) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
    return sorted.map((item) => item[0]);
  }, [allUserManga]);

  // Load recommendations:
  // - If user has no data: fetch overall default popular manga
  // - If user has data: fetch recommendations according to user interest genres
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoadingRecs(true);
      try {
        if (!hasUserManga) {
          const popular = await fetchPopular(1, 8);
          if (!isCancelled) {
            setRecommendations(popular);
          }
        } else {
          const topGenres = userInterests.length > 0 ? userInterests.slice(0, 2) : ["Action", "Fantasy"];
          const recs = await fetchRecommendationsByGenres(topGenres, 12);
          if (!isCancelled) {
            // Exclude titles the user already tracks
            const filtered = recs.filter((m) => !userMangaMap.has(m.id));
            setRecommendations(filtered.length >= 4 ? filtered : recs);
          }
        }
      } catch (err) {
        console.error("Dashboard recommendations error:", err);
      } finally {
        if (!isCancelled) {
          setLoadingRecs(false);
        }
      }
    }

    loadData();
    setActivities(getUserActivities(1000));

    const handleActUpdate = () => setActivities(getUserActivities(1000));
    window.addEventListener("mangapulse-activity-logged", handleActUpdate);
    return () => {
      isCancelled = true;
      window.removeEventListener("mangapulse-activity-logged", handleActUpdate);
    };
  }, [hasUserManga, userInterests, userMangaMap]);

  const handleQuickIncrement = async (entry: UserLibraryEntry) => {
    await incrementChapter(entry.manga_id);
    logActivity({
      manga_id: entry.manga_id,
      manga_title: entry.manga_title,
      manga_slug: entry.manga_slug,
      manga_cover: entry.manga_cover,
      action_type: "read_chapter",
      chapter_number: (entry.progress_chapter || 0) + 1,
      chapters_count: 1,
    });
  };

  // Up Next items: Reading items
  const upNextList = readingList.slice(0, 4);

  // Upcoming countdowns: ONLY from the user's actively tracked ongoing series
  const upcomingCountdowns = useMemo(() => {
    if (allUserManga.length === 0) return [];
    const now = Math.floor(Date.now() / 1000);

    const list: {
      id: number;
      title: string;
      slug: string;
      cover: string;
      targetTimestamp: number;
      chapter: number;
      platform: string;
    }[] = [];

    for (const item of allUserManga) {
      // Skip completed or dropped series
      if (item.status === "completed" || item.status === "dropped") continue;

      const verified = getVerifiedSchedule(
        item.manga_id,
        item.manga_title,
        undefined,
        item.total_chapters
      );

      // If finished, hiatus, or no target: skip
      if (verified.isFinished || verified.isHiatus || !verified.targetTimestamp) {
        continue;
      }

      if (verified.targetTimestamp > now && verified.targetTimestamp <= now + 7 * 86400) {
        const official = getOfficialLinksForManga({
          id: item.manga_id,
          slug: item.manga_slug,
          displayTitle: item.manga_title,
        });
        const platform = verified.publisher || (official.length > 0 ? official[0].name : "Official Publisher");

        list.push({
          id: item.manga_id,
          title: item.manga_title,
          slug: item.manga_slug,
          cover: item.manga_cover,
          targetTimestamp: verified.targetTimestamp,
          chapter: verified.nextChapter,
          platform,
        });
      }
    }

    list.sort((a, b) => a.targetTimestamp - b.targetTimestamp);
    return list.slice(0, 3);
  }, [allUserManga]);

  // Weekly Drop Schedule: ONLY for titles the user tracks
  const userWeeklySchedule = useMemo(() => {
    const getDropDay = (mangaId: number, title: string): string => {
      const t = title.toLowerCase();
      if (
        t.includes("one piece") ||
        t.includes("sakamoto") ||
        t.includes("spy x") ||
        t.includes("kagurabachi") ||
        t.includes("jujutsu")
      ) {
        return "Sun";
      }
      if (t.includes("tower of god") || t.includes("dandadan") || t.includes("lookism")) {
        return "Mon";
      }
      if (t.includes("chainsaw man")) {
        return "Tue";
      }
      if (t.includes("oshi no ko") || t.includes("blue lock") || t.includes("mashle")) {
        return "Wed";
      }
      if (t.includes("solo leveling") || t.includes("nano machine")) {
        return "Thu";
      }
      if (t.includes("kaiju") || t.includes("wind breaker")) {
        return "Fri";
      }
      if (t.includes("apothecary") || t.includes("frieren")) {
        return "Sat";
      }
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[mangaId % 7];
    };

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((day) => {
      const drops = allUserManga.filter((m) => {
        if (m.status === "completed" || m.status === "dropped") return false;
        const verified = getVerifiedSchedule(m.manga_id, m.manga_title, undefined, m.total_chapters);
        if (verified.isFinished || verified.isHiatus) return false;
        return getDropDay(m.manga_id, m.manga_title) === day;
      });
      return { day, drops };
    });
  }, [allUserManga]);

  return (
    <div className="min-w-0 pb-20">
      {/* Top Banner / User Header */}
      <section className="bg-[#0c0e12] border-b border-[#1e2430] py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <SupporterAvatar
              avatarUrl={user?.avatar_url}
              username={user?.username}
              isSupporter={user?.is_supporter}
              tier={user?.supporter_tier}
              size="lg"
              rounded="xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {user ? `${user.displayName || user.username}'s Dashboard` : "My Dashboard"}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {isLoggedIn ? "SYNCHRONIZED" : "LOCAL MODE"}
                </span>
              </div>
              <p className="text-xs text-[#94a1b5] mt-1">
                {hasUserManga
                  ? "Personalized release countdowns, queue, and interest-based recommendations."
                  : "Track manga and build custom collections to monitor official chapter drops."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Import</span>
            </button>
            <Link
              href="/library"
              className="px-3.5 py-2 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-2 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-400" />
              <span>Full Library</span>
            </Link>
            <Link
              href="/settings"
              className="px-3.5 py-2 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-2 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-[#94a1b5]" />
              <span>Settings</span>
            </Link>
          </div>
        </div>

        {/* 4 Quick Stat Metric Tiles */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          <div className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430]">
            <div className="text-[11px] font-medium text-[#94a1b5] uppercase tracking-wider flex items-center justify-between">
              <span>Currently Reading</span>
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2 font-mono">
              {readingList.length}
            </div>
            <div className="text-[11px] text-[#94a1b5] mt-1">
              {planList.length} planned in queue
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430]">
            <div className="text-[11px] font-medium text-[#94a1b5] uppercase tracking-wider flex items-center justify-between">
              <span>Chapters Logged</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2 font-mono">
              {totalChaptersRead}
            </div>
            <div className="text-[11px] text-[#94a1b5] mt-1">across all series</div>
          </div>

          <div className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430]">
            <div className="text-[11px] font-medium text-[#94a1b5] uppercase tracking-wider flex items-center justify-between">
              <span>Weekly Goal</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-2 font-mono">
              <span className="text-2xl font-extrabold text-white">{chaptersReadThisWeek}</span>
              <span className="text-xs text-[#94a1b5]">/ {weeklyGoal} ch</span>
            </div>
            <div className="w-full bg-[#1a1f2a] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((chaptersReadThisWeek / weeklyGoal) * 100))}%`,
                }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430]">
            <div className="text-[11px] font-medium text-[#94a1b5] uppercase tracking-wider flex items-center justify-between">
              <span>Tracked Drops</span>
              <Clock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2 font-mono">
              {upcomingCountdowns.length}
            </div>
            <div className="text-[11px] text-[#94a1b5] mt-1">
              {upcomingCountdowns.length > 0
                ? "scheduled next 7 days"
                : hasUserManga
                ? "no drops next 7 days"
                : "no titles tracked"}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-8 space-y-12">
        {/* Case 1: User has NO data in library or collections */}
        {!hasUserManga ? (
          <div className="space-y-12">
            {/* Empty State Banner */}
            <div className="rounded-2xl bg-[#13171f] border border-[#1e2430] p-8 md:p-12 text-center max-w-2xl mx-auto shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-7 h-7" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Your Dashboard is Empty
              </h2>
              <p className="text-xs md:text-sm text-[#94a1b5] mt-2 max-w-md mx-auto leading-relaxed">
                You haven&apos;t added any manga to your library or collections yet. Create a collection or add titles to track upcoming chapters, countdowns, and your weekly release schedule.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Import AniList / MAL</span>
                </button>
                <Link
                  href="/library"
                  className="px-4 py-2.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create a Collection</span>
                </Link>
                <Link
                  href="/trending"
                  className="px-4 py-2.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-2 transition-colors"
                >
                  <Compass className="w-4 h-4 text-[#94a1b5]" />
                  <span>Explore Trending</span>
                </Link>
              </div>
            </div>

            {/* Overall Default Popular Manga as Recommended Section */}
            <section>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                      Popular Manga (Recommended to Get Started)
                    </h2>
                  </div>
                  <p className="text-xs text-[#94a1b5] mt-0.5">
                    Explore top-rated series and add them to your library to personalize your dashboard.
                  </p>
                </div>
                <Link
                  href="/trending"
                  className="text-xs text-[#94a1b5] hover:text-white flex items-center gap-1 transition-colors font-medium"
                >
                  <span>View All Trending</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingRecs ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-[#13171f] rounded-xl aspect-[3/4.4] border border-[#1e2430]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {recommendations.slice(0, 6).map((manga) => (
                    <MangaCard key={manga.id} manga={manga} showCountdown={false} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Case 2: User HAS data — Only show data about the entries in user's collection & library */
          <>
            {/* Section 1: Continue Reading & Up Next */}
            <section>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                    Continue Reading & Up Next
                  </h2>
                </div>
                <Link
                  href="/library"
                  className="text-xs text-[#94a1b5] hover:text-white flex items-center gap-1 transition-colors font-medium"
                >
                  <span>View All ({readingList.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upNextList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {upNextList.map((entry) => {
                    const verified = getVerifiedSchedule(entry.manga_id, entry.manga_title, undefined, entry.total_chapters || undefined);
                    const total = verified.isVerifiedInDb && (verified.totalChapters || verified.latestChapter)
                      ? (verified.totalChapters || verified.latestChapter)
                      : entry.total_chapters;
                    const progress = entry.progress_chapter || 0;
                    const percent = total && total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;

                    return (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-xl bg-[#13171f] border border-[#1e2430] hover:border-[#2a3344] transition-all flex flex-col justify-between"
                      >
                        <div className="flex gap-3">
                          <Link
                            href={`/manga/${entry.manga_slug}`}
                            className="w-14 h-20 rounded-lg overflow-hidden bg-[#0c0e12] border border-[#2a3344] flex-shrink-0"
                          >
                            <img
                              src={entry.manga_cover}
                              alt={entry.manga_title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/manga/${entry.manga_slug}`}
                              className="font-bold text-xs text-white hover:text-blue-400 truncate block transition-colors"
                            >
                              {entry.manga_title}
                            </Link>
                            <div className="text-[11px] font-mono text-[#94a1b5] mt-1">
                              Chapter {progress}{" "}
                              <span className="text-[#94a1b5]/70">/ {total || "?"}</span>
                            </div>
                            <div className="w-full bg-[#1a1f2a] h-1.5 rounded-full overflow-hidden mt-2">
                              <div
                                className="bg-blue-500 h-full rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1e2430]">
                          <button
                            onClick={() => handleQuickIncrement(entry)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#2a3344]"
                          >
                            <Plus className="w-3.5 h-3.5 text-blue-400" />
                            <span>+1 Ch</span>
                          </button>
                          <Link
                            href={`/manga/${entry.manga_slug}`}
                            className="p-1.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-[#94a1b5] hover:text-white transition-colors border border-[#2a3344]"
                            title="Read Details & Official Links"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-[#13171f] border border-[#1e2430] text-center">
                  <BookOpen className="w-8 h-8 text-[#94a1b5] mx-auto mb-2" />
                  <h3 className="font-bold text-sm text-white">No Active Reading Entries</h3>
                  <p className="text-xs text-[#94a1b5] max-w-sm mx-auto mt-1 mb-4">
                    You have {allUserManga.length} series in your library & collections. Move one to &quot;Reading&quot; to track active chapter progress.
                  </p>
                  <Link
                    href="/library"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Open Library</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </section>

            {/* Section 2: Dedicated Countdown Clocks for Tracked Series */}
            {upcomingCountdowns.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                      Your Next Chapter Countdowns
                    </h2>
                  </div>
                  <span className="text-xs text-[#94a1b5] font-mono">Live UTC Clocks</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {upcomingCountdowns.map((cd) => (
                    <div
                      key={cd.id}
                      className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430] flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={cd.cover}
                          alt={cd.title}
                          className="w-12 h-16 rounded object-cover bg-[#0c0e12] border border-[#2a3344]"
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/release-date/${cd.slug}`}
                            className="font-bold text-xs text-white hover:text-purple-400 truncate block transition-colors"
                          >
                            {cd.title}
                          </Link>
                          <div className="text-[10px] font-mono text-purple-400 mt-0.5">
                            Chapter {cd.chapter}
                          </div>
                          <div className="text-[10px] text-[#94a1b5] mt-1">{cd.platform}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1e2430]">
                        <CountdownTimer targetTimestamp={cd.targetTimestamp} chapterNumber={cd.chapter} compact />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 3: Recommended Based on User Interests */}
            <section>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                      Recommended For You (Based on Your Reading)
                    </h2>
                  </div>
                  <p className="text-xs text-[#94a1b5] mt-0.5">
                    Curated based on genres in your library:{" "}
                    <span className="text-amber-300 font-medium">
                      {userInterests.slice(0, 3).join(", ") || "Action, Adventure"}
                    </span>
                  </p>
                </div>
                <Link
                  href="/trending"
                  className="text-xs text-[#94a1b5] hover:text-white flex items-center gap-1 transition-colors font-medium"
                >
                  <span>Explore More</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingRecs ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-[#13171f] rounded-xl aspect-[3/4.4] border border-[#1e2430]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {recommendations.slice(0, 6).map((manga) => (
                    <MangaCard key={manga.id} manga={manga} showCountdown={false} />
                  ))}
                </div>
              )}
            </section>

            {/* Section 4: Weekly Drop Schedule (ONLY for titles in user's collection/library) */}
            <section>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                    Your Weekly Drop Schedule
                  </h2>
                </div>
                <span className="text-xs text-[#94a1b5] font-mono">Your Tracked Series</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {userWeeklySchedule.map((col) => (
                  <div
                    key={col.day}
                    className="p-3 rounded-lg bg-[#13171f] border border-[#1e2430] flex flex-col min-h-[120px]"
                  >
                    <div className="text-[11px] font-bold font-mono text-emerald-400 uppercase tracking-wider mb-2">
                      {col.day}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      {col.drops.length > 0 ? (
                        col.drops.map((item) => (
                          <Link
                            key={item.manga_id}
                            href={`/manga/${item.manga_slug}`}
                            className="block text-[11px] p-1.5 rounded bg-[#1a1f2a] hover:bg-[#252f40] text-[#94a1b5] hover:text-white truncate font-medium border border-[#2a3344]/50 transition-colors"
                            title={item.manga_title}
                          >
                            {item.manga_title}
                          </Link>
                        ))
                      ) : (
                        <div className="text-[11px] text-[#94a1b5]/50 italic pt-1">—</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: User Collections Showcase */}
            {collections.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                      Your Collections
                    </h2>
                  </div>
                  <Link
                    href="/library"
                    className="text-xs text-[#94a1b5] hover:text-white flex items-center gap-1 transition-colors font-medium"
                  >
                    <span>Manage Collections</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {collections.map((col) => (
                    <Link
                      key={col.id}
                      href="/library"
                      className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430] hover:border-[#2a3344] transition-all block group"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                          {col.name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1a1f2a] text-[#94a1b5] border border-[#2a3344]">
                          {col.items?.length || 0} titles
                        </span>
                      </div>
                      {col.description && (
                        <p className="text-xs text-[#94a1b5] mt-1.5 line-clamp-1">{col.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Section 6: Recent Reading Activity Log */}
            <section className="p-6 rounded-xl bg-[#13171f] border border-[#1e2430]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                    Recent Reading Activity
                  </h2>
                </div>
                <span className="text-xs text-[#94a1b5]">Logged Events</span>
              </div>

              <div className="space-y-3">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c0e12] border border-[#1e2430] text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={act.manga_cover || "/placeholder-cover.png"}
                          alt={act.manga_title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-cover.png";
                          }}
                          className="w-7 h-9 rounded object-cover border border-[#2a3344] bg-[#0c0e12]"
                        />
                        <div>
                          <Link
                            href={`/manga/${act.manga_slug}`}
                            className="font-bold text-white hover:text-blue-400 transition-colors"
                          >
                            {act.manga_title}
                          </Link>
                          <div className="text-[11px] text-[#94a1b5] mt-0.5">
                            {act.action_type === "read_chapter" && `Marked Chapter ${act.chapter_number} as read`}
                            {act.action_type === "status_change" && `Moved to ${act.new_status}`}
                            {act.action_type === "rated" && `Rated ${act.rating} / 10`}
                            {act.action_type === "note_added" && "Updated personal note"}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[#94a1b5]">
                        {new Date(act.timestamp).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-[#94a1b5]">
                    No reading activity logged yet. Start tracking chapters to populate your timeline!
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => refreshLibrary()}
      />
    </div>
  );
}
