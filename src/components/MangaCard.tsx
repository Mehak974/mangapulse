"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MangaItem } from "@/types/manga";
import { Star, Bookmark, Clock, Layers } from "lucide-react";
import CountdownTimer from "./CountdownTimer";
import LibraryTrackerModal from "./LibraryTrackerModal";
import { useAuth } from "@/context/AuthContext";

interface MangaCardProps {
  manga: MangaItem;
  showCountdown?: boolean;
}

export default function MangaCard({ manga, showCountdown = true }: MangaCardProps) {
  const { openCollectionPicker, library, isLoggedIn } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const coverUrl =
    manga.coverImage.extraLarge ||
    manga.coverImage.large ||
    manga.coverImage.medium ||
    "/placeholder-cover.png";

  const ratingFormatted = manga.averageScore
    ? (manga.averageScore / 20).toFixed(1)
    : null;

  const libraryEntry = isLoggedIn && library ? library.find((e) => e.manga_id === manga.id) : null;
  const chaptersRead = libraryEntry ? libraryEntry.progress_chapter || 0 : 0;
  const totalChapters = manga.chapters || 0;
  const progressPercent = totalChapters > 0
    ? Math.min(100, Math.round((chaptersRead / totalChapters) * 100))
    : chaptersRead > 0
    ? 100
    : 0;

  return (
    <>
      <div className="group relative flex flex-col bg-[#13171f] hover:bg-[#1a1f2a] border border-[#1e2430] hover:border-[#3d4960] rounded-xl overflow-hidden transition-all">
        {/* Cover thumbnail container */}
        <div className="relative aspect-[3/4.3] w-full overflow-hidden bg-[#0c0e12]">
          <Link href={`/manga/${manga.slug}`} className="block w-full h-full">
            <Image
              src={coverUrl}
              alt={manga.displayTitle}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Top meta tags */}
          <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
            {ratingFormatted ? (
              <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] font-mono font-bold text-amber-400 border border-white/10">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {ratingFormatted}
              </span>
            ) : <span />}

            <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-black/80 text-[#94a1b5] border border-white/10">
              {manga.countryOfOrigin === "KR" ? "Manhwa" : "Manga"}
            </span>
          </div>

          {/* Bottom Countdown pill */}
          {showCountdown && manga.status !== "FINISHED" && manga.nextAiringChapter && (
            <div className="absolute bottom-2 inset-x-2 flex justify-center pointer-events-auto">
              <Link href={`/release-date/${manga.slug}`}>
                <CountdownTimer
                  targetTimestamp={manga.nextAiringChapter.airingAt}
                  compact={true}
                />
              </Link>
            </div>
          )}

          {/* Quick Track & Collection Buttons */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
            <button
              onClick={() => openCollectionPicker(manga)}
              className="p-1.5 rounded bg-black/80 hover:bg-[#1a1f2a] text-white border border-white/10"
              title="Add to Collection"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="p-1.5 rounded bg-black/80 hover:bg-[#2563eb] text-white border border-white/10"
              title="Track in Library"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Small reading progress bar below cover for tracked library entries */}
        {isLoggedIn && libraryEntry && (
          <div
            className="w-full bg-[#1e2430] h-1.5 relative overflow-hidden"
            title={`Reading Progress: Chapter ${chaptersRead}${totalChapters ? ` of ${totalChapters}` : ""} (${libraryEntry.status.replace(/_/g, " ")})`}
          >
            <div
              className={`h-full transition-all duration-300 ${
                libraryEntry.status === "completed"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-blue-600 to-cyan-400"
              }`}
              style={{
                width: `${libraryEntry.status === "completed" ? 100 : Math.max(6, progressPercent)}%`,
              }}
            />
          </div>
        )}

        {/* Content details */}
        <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
          <div>
            <Link
              href={`/manga/${manga.slug}`}
              className="font-semibold text-xs text-white line-clamp-1 hover:text-blue-400 transition-colors"
              title={manga.displayTitle}
            >
              {manga.displayTitle}
            </Link>

            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#94a1b5]">
              <span>{manga.genres[0] || "General"}</span>
              <span>•</span>
              <span>
                {manga.chapters ? `${manga.chapters} Ch` : manga.status === "RELEASING" ? "Ongoing" : "Complete"}
              </span>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e2430] text-[11px]">
            <Link
              href={`/release-date/${manga.slug}`}
              className="text-[#94a1b5] hover:text-white flex items-center gap-1 font-mono transition-colors"
            >
              <Clock className="w-3 h-3" />
              Schedule
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openCollectionPicker(manga)}
                className="text-[#94a1b5] hover:text-white transition-colors"
              >
                + List
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="text-[#94a1b5] hover:text-blue-400 font-semibold transition-colors"
              >
                Track
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <LibraryTrackerModal manga={manga} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
