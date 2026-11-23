"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, User, Globe, Bookmark, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface ScheduleDay {
  day: string;
  utcTime: string;
  magazine: string;
  platform: string;
  titles: Array<{ name: string; ch: string; slug: string }>;
}

interface WeeklyScheduleSectionProps {
  schedule: ScheduleDay[];
}

export default function WeeklyScheduleSection({ schedule }: WeeklyScheduleSectionProps) {
  const { library, isLoggedIn } = useAuth();
  const [filterMode, setFilterMode] = useState<"all" | "tracked">("all");

  // Set of tracked manga titles / slugs (lowercased for robust matching)
  const trackedSet = useMemo(() => {
    const set = new Set<string>();
    for (const item of library) {
      if (item.manga_title) set.add(item.manga_title.toLowerCase().trim());
      if (item.manga_slug) {
        set.add(item.manga_slug.toLowerCase().trim());
        // Also strip trailing id e.g. "one-piece-30013" -> "one-piece"
        const baseSlug = item.manga_slug.replace(/-\d+$/, "");
        set.add(baseSlug);
      }
    }
    return set;
  }, [library]);

  // Compute total tracked titles that appear in the schedule
  const totalTrackedInSchedule = useMemo(() => {
    let count = 0;
    for (const day of schedule) {
      for (const t of day.titles) {
        const titleLower = t.name.toLowerCase().trim();
        const slugBase = t.slug.replace(/-\d+$/, "");
        if (trackedSet.has(titleLower) || trackedSet.has(slugBase)) {
          count++;
        }
      }
    }
    return count;
  }, [schedule, trackedSet]);

  return (
    <section id="schedule" className="max-w-7xl mx-auto px-4 lg:px-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1e2430] gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Weekly Worldwide Simulpub Release Schedule
          </h2>
        </div>

        {/* Filter Toggle: All vs Tracked */}
        <div className="flex items-center rounded-lg bg-[#13171f] p-1 border border-[#2a3344] text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              filterMode === "all"
                ? "bg-[#1a1f2a] text-white shadow-sm border border-[#2a3344]"
                : "text-[#94a1b5] hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>All Worldwide Drops</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("tracked")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              filterMode === "tracked"
                ? "bg-[#1a1f2a] text-white shadow-sm border border-[#2a3344]"
                : "text-[#94a1b5] hover:text-white"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>My Tracked Titles ({totalTrackedInSchedule})</span>
          </button>
        </div>
      </div>

      <div className="surface-card rounded-xl border border-[#2a3344] overflow-hidden divide-y divide-[#1e2430]">
        {schedule.map((item) => {
          const visibleTitles =
            filterMode === "all"
              ? item.titles
              : item.titles.filter((t) => {
                  const titleLower = t.name.toLowerCase().trim();
                  const slugBase = t.slug.replace(/-\d+$/, "");
                  return trackedSet.has(titleLower) || trackedSet.has(slugBase);
                });

          return (
            <div
              key={item.day}
              className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="lg:w-72 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{item.day}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0c0e12] border border-[#2a3344] text-[#94a1b5]">
                    {item.utcTime}
                  </span>
                </div>
                <div className="text-xs text-[#94a1b5] mt-0.5">{item.magazine}</div>
                <div className="text-[11px] text-[#5e6b82] font-mono mt-0.5">
                  Via {item.platform}
                </div>
              </div>

              <div className="flex-1 flex flex-wrap gap-2 items-center">
                {visibleTitles.length > 0 ? (
                  visibleTitles.map((title) => (
                    <Link
                      key={title.name}
                      href={`/manga/${title.slug}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#1e2430] hover:border-[#3d4960] text-xs transition-colors"
                    >
                      <span className="font-semibold text-white">{title.name}</span>
                      <span className="font-mono text-[10px] text-blue-400">Ch. {title.ch}</span>
                    </Link>
                  ))
                ) : (
                  <div className="text-[11px] text-[#5e6b82] italic py-1">
                    No tracked releases for {item.day}.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

