"use client";

import React, { useState, useEffect } from "react";
import { MangaItem, LibraryStatus, UserLibraryEntry } from "@/types/manga";
import { useAuth } from "@/context/AuthContext";
import { markAllBelowRead, clearAllChaptersRead } from "@/lib/chapterStore";
import { X, Check, Trash2, Bookmark } from "lucide-react";

interface ModalProps {
  manga: MangaItem;
  onClose: () => void;
}

export default function LibraryTrackerModal({ manga, onClose }: ModalProps) {
  const { user, library, updateLibrary, removeFromLibrary } = useAuth();
  const [status, setStatus] = useState<LibraryStatus>("reading");
  const [progress, setProgress] = useState<number>(0);
  const [totalChapters, setTotalChapters] = useState<number | null>(manga.chapters ?? null);
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    let custom: number | null = null;
    try {
      const saved = localStorage.getItem(`mangapulse_total_ch_${manga.id}`);
      if (saved) {
        const p = parseInt(saved, 10);
        if (p > 0) custom = p;
      }
    } catch {}

    const match = library.find((it) => it.manga_id === manga.id);
    if (match) {
      setExistingId(match.id);
      setStatus(match.status);
      setProgress(match.progress_chapter);
      setRating(match.rating || 0);
      setNotes(match.notes || "");
      setTotalChapters(match.total_chapters || custom || manga.chapters || null);
    } else if (custom) {
      setTotalChapters(custom);
    }
  }, [manga.id, library, manga.chapters]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLibrary({
        id: existingId || undefined,
        user_id: user?.id || "guest",
        manga_id: manga.id,
        manga_slug: manga.slug,
        manga_title: manga.displayTitle,
        manga_cover:
          manga.coverImage.extraLarge ||
          manga.coverImage.large ||
          manga.coverImage.medium ||
          "",
        status,
        progress_chapter: progress,
        total_chapters: totalChapters,
        rating: rating > 0 ? rating : null,
        notes: notes.trim() || null,
        genres: manga.genres,
        country_of_origin: manga.countryOfOrigin || undefined,
        format: (manga as any).format || undefined,
      });

      if (totalChapters) {
        try {
          localStorage.setItem(`mangapulse_total_ch_${manga.id}`, String(totalChapters));
        } catch {}
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("mangapulse-total-chapters-updated", {
              detail: { mangaId: manga.id, totalChapters },
            })
          );
        }
      }

      // Synchronize reading progress with chapterStore so ChapterTracker updates immediately
      if (progress > 0) {
        markAllBelowRead(manga.id, progress);
      } else {
        clearAllChaptersRead(manga.id);
      }

      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await removeFromLibrary(manga.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-[#13171f] border border-[#2a3344] rounded-xl p-4 sm:p-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-sm">Library Tracker</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Manga mini info */}
        <div className="flex items-center gap-3 my-4 p-2.5 bg-[#0c0e12] rounded-lg border border-[#1e2430]">
          <div className="w-10 h-14 relative rounded overflow-hidden bg-black flex-shrink-0">
            <img
              src={manga.coverImage.large || manga.coverImage.medium || ""}
              alt={manga.displayTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-xs line-clamp-1 text-white">{manga.displayTitle}</h4>
            <p className="text-[11px] text-[#94a1b5] mt-0.5">
              {manga.chapters ? `${manga.chapters} total chapters` : "Ongoing publication"}
            </p>
          </div>
        </div>

        {/* Status selector */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-mono text-[11px] text-[#94a1b5] uppercase block mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: "reading", label: "Reading" },
                  { id: "plan_to_read", label: "Plan to Read" },
                  { id: "completed", label: "Completed" },
                  { id: "dropped", label: "Dropped" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatus(tab.id)}
                  className={`py-1.5 px-3 rounded border font-medium transition-all ${
                    status === tab.id
                      ? "bg-[#2563eb] border-[#2563eb] text-white"
                      : "bg-[#0c0e12] border-[#1e2430] text-[#94a1b5] hover:bg-[#1a1f2a] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter Progress */}
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#94a1b5] uppercase mb-1.5">
              <span>Chapter Progress</span>
              <span className="text-white font-bold">
                Ch. {progress} {totalChapters ? `/ ${totalChapters}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={totalChapters || Math.max(progress + 50, 100)}
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                className="w-full accent-blue-500 h-1.5 bg-[#0c0e12] rounded cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max={totalChapters || 2500}
                value={progress}
                onChange={(e) => setProgress(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 bg-[#0c0e12] border border-[#2a3344] rounded px-2 py-1 text-center font-mono text-xs font-bold text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Accurate Total Chapters */}
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#94a1b5] uppercase mb-1.5">
              <span>Total Chapters</span>
              <span className="text-[10px] text-[#5a6578] font-normal lowercase">(set or correct total count)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="9999"
                placeholder={manga.chapters ? String(manga.chapters) : "e.g. 158"}
                value={totalChapters ?? ""}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTotalChapters(isNaN(val) || val <= 0 ? null : val);
                }}
                className="w-full bg-[#0c0e12] border border-[#2a3344] rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 placeholder:text-[#5e6b82]"
              />
              {totalChapters && (
                <button
                  type="button"
                  onClick={() => setTotalChapters(null)}
                  className="px-2.5 py-1.5 text-[10px] font-mono text-[#94a1b5] hover:text-white border border-[#2a3344] rounded hover:bg-[#1a1f2a] transition-colors"
                  title="Reset to default"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Rating (1-10) */}
          <div>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#94a1b5] uppercase mb-1.5">
              <span>Score</span>
              <span className="text-amber-400 font-bold">
                {rating > 0 ? `${rating} / 10` : "Unrated"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className={`flex-1 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                    star <= rating
                      ? "bg-amber-400 text-black"
                      : "bg-[#0c0e12] text-[#5e6b82] hover:bg-[#1a1f2a]"
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>

          {/* Private Notes */}
          <div>
            <label className="font-mono text-[11px] text-[#94a1b5] uppercase block mb-1.5">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private reading notes, volume owned, thoughts..."
              className="w-full bg-[#0c0e12] border border-[#2a3344] rounded p-2 text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 resize-none font-sans"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#1e2430]">
          {existingId ? (
            <button
              onClick={handleDelete}
              className="px-2.5 py-1.5 rounded text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-[#1a1f2a] hover:bg-[#222938] text-[#94a1b5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded text-xs font-semibold bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
