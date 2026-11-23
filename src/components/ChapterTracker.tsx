"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  getReadChapters,
  toggleChapterRead,
  markChaptersRead,
  markChaptersUnread,
  markAllBelowRead,
  markAllBelowUnread,
  markAllChaptersRead,
  clearAllChaptersRead,
} from "@/lib/chapterStore";
import { getVerifiedSchedule } from "@/lib/mangaScheduleDb";
import {
  Check,
  CheckSquare,
  Square,
  Clock,
  ArrowDownUp,
  Search,
  BookOpen,
  ChevronDown,
  RotateCcw,
  Plus,
  Layers,
} from "lucide-react";

interface ChapterTrackerProps {
  mangaId: number;
  mangaTitle: string;
  totalChapters?: number | null;
  latestChapter?: number | null;
}

export default function ChapterTracker({
  mangaId,
  mangaTitle,
  totalChapters,
  latestChapter,
}: ChapterTrackerProps) {
  // Determine effective total chapters from verified publication data
  const verified = getVerifiedSchedule(mangaId, mangaTitle, undefined, totalChapters);
  const initialMax = Math.max(
    1,
    totalChapters || latestChapter || verified.latestChapter || 100
  );
  const [maxChapters, setMaxChapters] = useState(initialMax);

  const [readSet, setReadSet] = useState<Set<number>>(new Set());
  const [selectedSet, setSelectedSet] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [orderDesc, setOrderDesc] = useState(false);
  const [activeMenuChapter, setActiveMenuChapter] = useState<number | null>(null);
  const [menuAlign, setMenuAlign] = useState<"left" | "right">("left");
  const [selectedRange, setSelectedRange] = useState<string>("latest"); // "all" | "latest" | "0-100" etc.

  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpenChapterMenu = (num: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMenuChapter === num) {
      setActiveMenuChapter(null);
      return;
    }
    const btn = e.currentTarget as HTMLElement;
    const scrollContainer = btn.closest(".overflow-y-auto");
    const btnRect = btn.getBoundingClientRect();
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const relativeX = btnRect.left - containerRect.left;
      if (relativeX < containerRect.width / 2) {
        setMenuAlign("left");
      } else {
        setMenuAlign("right");
      }
    } else {
      setMenuAlign(btnRect.left < window.innerWidth / 2 ? "left" : "right");
    }
    setActiveMenuChapter(num);
  };

  // Close chapter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuChapter(null);
      }
    }
    if (activeMenuChapter !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeMenuChapter]);

  // Load read chapters
  useEffect(() => {
    const stored = getReadChapters(mangaId);
    setReadSet(stored);

    // If user has read chapters higher than initialMax, expand maxChapters
    if (stored.size > 0) {
      const highestRead = Math.max(...Array.from(stored));
      if (highestRead > initialMax) {
        setMaxChapters(highestRead);
      }
    }

    const handler = (e: any) => {
      if (e.detail?.mangaId === mangaId) {
        setReadSet(getReadChapters(mangaId));
      }
    };
    window.addEventListener("mangapulse-chapters-updated", handler);
    return () => window.removeEventListener("mangapulse-chapters-updated", handler);
  }, [mangaId, initialMax]);

  // Generate range chunk segments if large (e.g. 1-100, 101-200, etc.)
  const rangeChunks = useMemo(() => {
    if (maxChapters <= 100) return [];
    const chunks: { label: string; start: number; end: number }[] = [];
    const chunkSize = 100;
    for (let i = 1; i <= maxChapters; i += chunkSize) {
      const end = Math.min(maxChapters, i + chunkSize - 1);
      chunks.push({ label: `${i}–${end}`, start: i, end });
    }
    return chunks;
  }, [maxChapters]);

  // Generate active chapter list
  const chapters = useMemo(() => {
    let start = 1;
    let end = maxChapters;

    if (rangeChunks.length > 0) {
      if (selectedRange === "latest") {
        const lastChunk = rangeChunks[rangeChunks.length - 1];
        start = lastChunk.start;
        end = lastChunk.end;
      } else if (selectedRange !== "all") {
        const found = rangeChunks.find((c) => c.label === selectedRange);
        if (found) {
          start = found.start;
          end = found.end;
        }
      }
    }

    const list: number[] = [];
    for (let i = start; i <= end; i++) {
      list.push(i);
    }
    if (orderDesc) list.reverse();
    return list;
  }, [maxChapters, rangeChunks, selectedRange, orderDesc]);

  // Filtered chapters based on search query
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase().trim();
    // When searching, search across all chapters 1..maxChapters
    const allList: number[] = [];
    for (let i = 1; i <= maxChapters; i++) {
      if (String(i).includes(q) || `chapter ${i}`.includes(q)) {
        allList.push(i);
      }
    }
    if (orderDesc) allList.reverse();
    return allList;
  }, [chapters, maxChapters, searchQuery, orderDesc]);

  const readCount = readSet.size;
  const progressPercent = Math.min(100, Math.round((readCount / maxChapters) * 100));

  // Toggle single chapter
  const handleToggleChapter = (num: number) => {
    toggleChapterRead(mangaId, num);
  };

  // Toggle checkbox selection
  const handleToggleSelect = (num: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  // Batch actions
  const handleMarkSelectedRead = () => {
    markChaptersRead(mangaId, Array.from(selectedSet));
    setSelectedSet(new Set());
  };

  const handleMarkSelectedUnread = () => {
    markChaptersUnread(mangaId, Array.from(selectedSet));
    setSelectedSet(new Set());
  };

  const handleMarkAllBelowRead = (num: number) => {
    markAllBelowRead(mangaId, num);
    setActiveMenuChapter(null);
  };

  const handleMarkAllBelowUnread = (num: number) => {
    markAllBelowUnread(mangaId, num);
    setActiveMenuChapter(null);
  };

  const handleMarkAllRead = () => {
    markAllChaptersRead(mangaId, maxChapters);
  };

  const handleClearAll = () => {
    if (window.confirm("Reset all read chapter progress for this series?")) {
      clearAllChaptersRead(mangaId);
    }
  };

  return (
    <div className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1e2430] gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
            Chapter Reading Progress ({readCount} / {maxChapters})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMaxChapters((prev) => prev + 10)}
            className="px-2 py-1 rounded bg-[#1a1f2a] hover:bg-[#252f40] text-[11px] font-mono text-[#94a1b5] hover:text-white border border-[#2a3344] flex items-center gap-1 transition-colors"
            title="Extend chapter index by 10 chapters"
          >
            <Plus className="w-3 h-3 text-blue-400" />
            <span>+10 Chapters</span>
          </button>
          <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            {progressPercent}% Complete
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="w-full bg-[#0c0e12] h-2 rounded-full overflow-hidden border border-[#1e2430]">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-[#5e6b82] mt-1">
          <span>Chapter 1</span>
          <span>{readCount} read • {Math.max(0, maxChapters - readCount)} unread</span>
          <span>Chapter {maxChapters}</span>
        </div>
      </div>

      {/* Range Chunk Tabs for large titles (e.g. One Piece, Hajime no Ippo) */}
      {rangeChunks.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-[11px] font-mono text-[#5e6b82] flex-shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>Range:</span>
          </span>
          <button
            onClick={() => setSelectedRange("latest")}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all flex-shrink-0 ${
              selectedRange === "latest"
                ? "bg-blue-600 text-white"
                : "bg-[#0c0e12] text-[#94a1b5] hover:text-white border border-[#1e2430]"
            }`}
          >
            Latest ({rangeChunks[rangeChunks.length - 1].label})
          </button>
          {rangeChunks.map((chunk) => (
            <button
              key={chunk.label}
              onClick={() => setSelectedRange(chunk.label)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] transition-all flex-shrink-0 ${
                selectedRange === chunk.label
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-[#0c0e12] text-[#94a1b5] hover:text-white border border-[#1e2430]"
              }`}
            >
              {chunk.label}
            </button>
          ))}
          <button
            onClick={() => setSelectedRange("all")}
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all flex-shrink-0 ${
              selectedRange === "all"
                ? "bg-blue-600 text-white"
                : "bg-[#0c0e12] text-[#94a1b5] hover:text-white border border-[#1e2430]"
            }`}
          >
            Show All ({maxChapters})
          </button>
        </div>
      )}

      {/* Control Bar: Search, Order, Global Mark */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#5e6b82]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ch # (e.g. 1130)..."
              className="bg-[#0c0e12] border border-[#2a3344] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 w-44 font-mono"
            />
          </div>

          {/* Ascending / Descending toggle */}
          <button
            onClick={() => setOrderDesc(!orderDesc)}
            className="px-2.5 py-1.5 rounded-lg bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#2a3344] text-[#94a1b5] hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span>{orderDesc ? "Ch N → 1" : "Ch 1 → N"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleMarkAllRead}
            className="px-2.5 py-1.5 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] text-white border border-[#2a3344] font-semibold text-[11px] transition-colors"
          >
            Mark All Read
          </button>
          <button
            onClick={handleClearAll}
            className="px-2.5 py-1.5 rounded-lg bg-[#1a1f2a] hover:bg-red-500/20 text-[#94a1b5] hover:text-red-400 border border-[#2a3344] text-[11px] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Floating Batch Action Bar when checkboxes are checked */}
      {selectedSet.size > 0 && (
        <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
          <span className="font-mono text-white">
            <span className="font-bold text-blue-400">{selectedSet.size}</span> chapters selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkSelectedRead}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px]"
            >
              Mark Read
            </button>
            <button
              onClick={handleMarkSelectedUnread}
              className="px-2.5 py-1 rounded bg-[#1a1f2a] hover:bg-[#222938] text-white border border-[#2a3344] text-[11px]"
            >
              Mark Unread
            </button>
            <button
              onClick={() => setSelectedSet(new Set())}
              className="text-[#94a1b5] hover:text-white text-[11px] px-1"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Chapter Grid Container with fixed z-index stacking context */}
      <div className="max-h-[420px] overflow-y-auto px-1 py-1 relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredChapters.map((num, idx) => {
            const isRead = readSet.has(num);
            const isSelected = selectedSet.has(num);
            const isMenuOpen = activeMenuChapter === num;
            const isNearBottom = idx > filteredChapters.length - 10;

            return (
              <div
                key={num}
                className={`relative rounded-lg border text-xs p-2.5 transition-colors flex items-center justify-between gap-2 ${
                  isMenuOpen ? "z-50 ring-1 ring-blue-500" : "z-0"
                } ${
                  isRead
                    ? "bg-[#0c0e12] border-emerald-500/30 text-white"
                    : "bg-[#13171f] border-[#1e2430] hover:border-[#3d4960] text-[#94a1b5]"
                }`}
              >
                {/* Select Checkbox */}
                <button
                  type="button"
                  onClick={(e) => handleToggleSelect(num, e)}
                  className="text-[#94a1b5] hover:text-white"
                  title="Select for batch action"
                >
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                  )}
                </button>

                {/* Chapter Label (Click to toggle read) */}
                <button
                  type="button"
                  onClick={() => handleToggleChapter(num)}
                  className="flex-1 text-left font-mono font-semibold flex items-center gap-1.5"
                >
                  <span className={isRead ? "text-emerald-400" : "text-white"}>
                    Ch. {num}
                  </span>
                  {isRead && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                </button>

                {/* Chevron Button for Chapter Menu */}
                <button
                  type="button"
                  onClick={(e) => handleOpenChapterMenu(num, e)}
                  className="p-1 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a]"
                  title="Chapter actions"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Dropdown Menu anchored to card */}
                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className={`absolute ${menuAlign === "left" ? "left-0" : "right-0"} ${
                      isNearBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                    } w-48 bg-[#0c0e12] border border-[#2a3344] rounded-lg shadow-2xl z-50 p-1 divide-y divide-[#1e2430] text-[11px] font-sans`}
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleToggleChapter(num);
                          setActiveMenuChapter(null);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#1a1f2a] text-white flex items-center justify-between"
                      >
                        <span>{isRead ? "Mark Unread" : "Mark Read"}</span>
                        <span className="font-mono text-[#94a1b5]">Ch. {num}</span>
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => handleMarkAllBelowRead(num)}
                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#1a1f2a] text-emerald-400 font-semibold"
                      >
                        Mark all below as read
                        <div className="text-[10px] font-mono text-[#94a1b5] font-normal">
                          Ch. 1 through {num}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkAllBelowUnread(num)}
                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#1a1f2a] text-amber-400 mt-1"
                      >
                        Mark all below as unread
                        <div className="text-[10px] font-mono text-[#94a1b5]">
                          Ch. 1 through {num}
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
