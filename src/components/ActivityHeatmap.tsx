"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Lock, Crown, Sparkles, Flame, Calendar } from "lucide-react";
import { ActivityItem } from "@/types/manga";

interface ActivityHeatmapProps {
  activities?: ActivityItem[];
  isLocked?: boolean;
  onUnlockClick?: () => void;
}

export default function ActivityHeatmap({
  activities = [],
  isLocked = false,
  onUnlockClick,
}: ActivityHeatmapProps) {
  // Generate past 24 weeks of data (7 days per week = 168 days)
  const { weeks, activeDaysCount, currentStreak } = useMemo(() => {
    // Map dates to read count
    const activityMap: Record<string, number> = {};
    activities.forEach((act) => {
      const d = act.timestamp ? act.timestamp.split("T")[0] : null;
      if (d) {
        activityMap[d] = (activityMap[d] || 0) + 1;
      }
    });

    const now = new Date();
    const days: { dateStr: string; count: number; level: number; dayOfWeek: number }[] = [];

    // Pre-populate 168 days up to today
    for (let i = 167; i >= 0; i--) {
      const target = new Date(now.getTime() - i * 86400000);
      const dateStr = target.toISOString().split("T")[0];
      const count = activityMap[dateStr] || 0;

      const finalCount = count;
      const level = finalCount === 0 ? 0 : finalCount <= 1 ? 1 : finalCount <= 3 ? 2 : 3;

      days.push({
        dateStr,
        count: finalCount,
        level,
        dayOfWeek: target.getDay(),
      });
    }

    // Slice into columns of 7 days (weeks)
    const resultWeeks: (typeof days)[] = [];
    for (let w = 0; w < 24; w++) {
      resultWeeks.push(days.slice(w * 7, (w + 1) * 7));
    }

    const activeDays = days.filter((d) => d.count > 0).length;
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) streak++;
      else break;
    }

    return { weeks: resultWeeks, activeDaysCount: activeDays, currentStreak: streak };
  }, [activities]);

  const levelColors = [
    "bg-[#161c28] border-[#1d2536]", // level 0 (empty)
    "bg-[#334766] border-[#3e567a]", // level 1 (light activity)
    "bg-[#3b82f6] border-[#60a5fa] shadow-[0_0_6px_rgba(59,130,246,0.5)]", // level 2 (medium)
    "bg-[#93c5fd] border-[#bfdbfe] shadow-[0_0_10px_rgba(147,197,253,0.8)]", // level 3 (high activity)
  ];

  return (
    <div className="relative rounded-2xl bg-[#0e1219] border border-[#1e2430] p-5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm text-white tracking-tight">Activity History</h3>
          <span className="text-[11px] font-mono text-[#5e6b82] hidden sm:inline">
            (Past 6 Months)
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span className="font-bold">{currentStreak} Day Streak</span>
          </div>
          <div className="text-[#94a1b5] hidden md:inline">
            <span>{activeDaysCount} active days</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative overflow-x-auto pb-1 no-scrollbar">
        <div className="inline-flex gap-1.5 min-w-[560px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  title={`${day.dateStr}: ${day.count} chapters read`}
                  className={`w-3.5 h-3.5 rounded-sm border transition-all ${
                    levelColors[day.level]
                  } hover:scale-125 cursor-pointer`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] font-mono text-[#5e6b82]">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#161c28] border border-[#1d2536]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#334766] border border-[#3e567a]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6] border border-[#60a5fa]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#93c5fd] border border-[#bfdbfe]" />
          <span>More</span>
        </div>
      </div>

      {/* Locked Overlay for Free & Pro Users */}
      {isLocked && (
        <div className="absolute inset-0 z-20 backdrop-blur-md bg-[#0c0e12]/80 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-slate-300 shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center text-slate-100 mb-3 animate-patron-crown">
            <Lock className="w-5 h-5 text-slate-100" />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-1">
            <Crown className="w-3.5 h-3.5 text-slate-100" />
            <span>Manga Patron Exclusive</span>
          </div>

          <h4 className="text-sm font-bold text-white max-w-sm">
            Activity History &amp; Reading Velocity Analytics
          </h4>
          <p className="text-xs text-[#94a1b5] max-w-md mt-1 leading-relaxed">
            Manga Patrons unlock 365-day historical reading contribution heatmaps, weekly reading
            speed benchmarks, and day-by-day drop streak analysis.
          </p>

          <div className="mt-4 flex items-center gap-2">
            {onUnlockClick ? (
              <button
                type="button"
                onClick={onUnlockClick}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200 to-white text-black font-extrabold text-xs shadow-[0_0_15px_rgba(255,255,255,0.6)] hover:scale-105 transition-transform flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
                <span>Unlock with Manga Patron ($15)</span>
              </button>
            ) : (
              <Link
                href="/donate"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200 to-white text-black font-extrabold text-xs shadow-[0_0_15px_rgba(255,255,255,0.6)] hover:scale-105 transition-transform flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
                <span>Unlock with Manga Patron ($15)</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
