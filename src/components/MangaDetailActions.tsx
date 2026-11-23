"use client";

import React, { useState } from "react";
import { MangaItem } from "@/types/manga";
import { Bookmark, Layers, Bell, Check } from "lucide-react";
import LibraryTrackerModal from "./LibraryTrackerModal";
import { useAuth } from "@/context/AuthContext";

export default function MangaDetailActions({ manga }: { manga: MangaItem }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { openCollectionPicker, library, requestNotificationPermission } = useAuth();

  const isTracked = library.some((it) => it.manga_id === manga.id);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          onClick={() => setModalOpen(true)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            isTracked
              ? "bg-[#1a1f2a] border border-[#2a3344] text-white"
              : "bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
          }`}
        >
          {isTracked ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
          <span>{isTracked ? "Tracked in Library" : "Track Reading"}</span>
        </button>

        <button
          onClick={() => openCollectionPicker(manga)}
          className="px-3.5 py-2 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] border border-[#2a3344] text-xs font-semibold text-[#94a1b5] hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Add to Collection</span>
        </button>

        <button
          onClick={requestNotificationPermission}
          className="px-3.5 py-2 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] border border-[#2a3344] text-xs font-semibold text-[#94a1b5] hover:text-white flex items-center gap-1.5 transition-colors"
          title="Notify me when this manga releases next chapter"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Get Release Alert</span>
        </button>
      </div>

      {modalOpen && (
        <LibraryTrackerModal manga={manga} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

