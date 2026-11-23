"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShieldCheck, Globe, Calendar } from "lucide-react";

interface CountdownProps {
  targetTimestamp: number; // Unix seconds
  chapterNumber?: number;
  compact?: boolean;
  cadenceLabel?: string;
  sourcePublisher?: string;
}

export default function CountdownTimer({
  targetTimestamp,
  chapterNumber,
  compact = false,
  cadenceLabel = "Weekly Simulpub",
  sourcePublisher = "Official Publisher",
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  const [localTimeString, setLocalTimeString] = useState<string>("");
  const [timezoneName, setTimezoneName] = useState<string>("");

  useEffect(() => {
    function calculate() {
      const now = Math.floor(Date.now() / 1000);
      const diff = targetTimestamp - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);

    // Format local drop time in user's browser timezone
    try {
      const releaseDate = new Date(targetTimestamp * 1000);
      const formatted = releaseDate.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
      setLocalTimeString(formatted);

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezoneName(tz);
    } catch {
      // Fallback
    }

    return () => clearInterval(interval);
  }, [targetTimestamp]);

  if (compact) {
    if (timeLeft.isPast) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Available Now
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1e2430] text-[#f0f3f8] border border-[#2a3344]">
        <Clock className="w-3 h-3 text-[#94a1b5]" />
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1e2430] gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-xs uppercase tracking-wider font-bold text-white font-mono">
            {chapterNumber ? `Chapter ${chapterNumber} Official Simulpub` : "Next Chapter Release"}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {cadenceLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Publisher Schedule</span>
        </div>
      </div>

      {/* Countdown Timer Display */}
      {timeLeft.isPast ? (
        <div className="py-4 text-center">
          <div className="inline-block px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm mb-1">
            Simulpub Officially Released
          </div>
          <p className="text-xs text-[#94a1b5]">
            Chapter {chapterNumber || ""} is now available to read on verified official platforms below.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#0c0e12] border border-[#1e2430] rounded-lg py-3 px-2">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                {String(timeLeft.days).padStart(2, "0")}
              </div>
              <div className="text-[10px] font-mono uppercase text-[#94a1b5] mt-1">Days</div>
            </div>

            <div className="bg-[#0c0e12] border border-[#1e2430] rounded-lg py-3 px-2">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <div className="text-[10px] font-mono uppercase text-[#94a1b5] mt-1">Hours</div>
            </div>

            <div className="bg-[#0c0e12] border border-[#1e2430] rounded-lg py-3 px-2">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="text-[10px] font-mono uppercase text-[#94a1b5] mt-1">Mins</div>
            </div>

            <div className="bg-[#0c0e12] border border-[#1e2430] rounded-lg py-3 px-2">
              <div className="text-2xl sm:text-3xl font-mono font-bold text-blue-400 tracking-tight">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <div className="text-[10px] font-mono uppercase text-[#94a1b5] mt-1">Secs</div>
            </div>
          </div>

          {/* Localized Drop Time Confirmation */}
          {localTimeString && (
            <div className="p-2.5 rounded-lg bg-[#0c0e12] border border-[#1e2430] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
              <div className="flex items-center gap-2 text-[#94a1b5]">
                <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>
                  Exact drop time: <strong className="text-white font-medium">{localTimeString}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#94a1b5]">
                15:00 UTC Standard Drop
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
