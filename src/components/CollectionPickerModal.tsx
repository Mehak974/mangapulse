"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { MangaItem } from "@/types/manga";
import { X, FolderPlus, Check, Plus, Layers } from "lucide-react";

export default function CollectionPickerModal() {
  const {
    collectionPickerOpen,
    setCollectionPickerOpen,
    selectedMangaForCollection,
    collections,
    createCollection,
    toggleInCollection,
  } = useAuth();

  const [newCollectionName, setNewCollectionName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  if (!collectionPickerOpen || !selectedMangaForCollection) return null;

  const manga = selectedMangaForCollection;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    setCreating(true);
    try {
      await createCollection(newCollectionName.trim());
      setNewCollectionName("");
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  const coverUrl =
    manga.coverImage.extraLarge ||
    manga.coverImage.large ||
    manga.coverImage.medium ||
    "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-sm bg-[#13171f] border border-[#2a3344] rounded-xl p-4 sm:p-5 shadow-2xl text-white max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-sm">Add to Collections</h2>
          </div>
          <button
            onClick={() => setCollectionPickerOpen(false)}
            className="p-1 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Manga Info */}
        <div className="flex items-center gap-3 my-3 p-2.5 bg-[#0c0e12] rounded-lg border border-[#1e2430]">
          <div className="w-9 h-12 relative rounded bg-black overflow-hidden flex-shrink-0">
            <img src={coverUrl} alt={manga.displayTitle} className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-xs text-white truncate">{manga.displayTitle}</div>
            <div className="text-[11px] text-[#94a1b5]">
              {manga.chapters ? `${manga.chapters} Chapters` : "Ongoing"}
            </div>
          </div>
        </div>

        {/* Collections List */}
        <div className="space-y-1.5 my-3 max-h-56 overflow-y-auto pr-1">
          {collections.map((col) => {
            const isContained = col.items?.some((it) => it.manga_id === manga.id);

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => toggleInCollection(col.id, manga)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors text-left ${
                  isContained
                    ? "bg-blue-600/15 border-blue-500/40 text-white"
                    : "bg-[#0c0e12] border-[#1e2430] text-[#94a1b5] hover:bg-[#1a1f2a] hover:text-white"
                }`}
              >
                <div>
                  <div className="font-semibold text-xs">{col.name}</div>
                  {col.description && (
                    <div className="text-[10px] text-[#5e6b82] truncate max-w-[200px]">
                      {col.description}
                    </div>
                  )}
                </div>

                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border ${
                    isContained
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-[#2a3344] bg-[#13171f]"
                  }`}
                >
                  {isContained && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Inline Create Collection */}
        {showCreate ? (
          <form onSubmit={handleCreate} className="mt-3 space-y-2">
            <input
              type="text"
              autoFocus
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="e.g. Must Read, Dark Fantasy..."
              className="w-full bg-[#0c0e12] border border-[#2a3344] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-1.5 rounded text-xs bg-[#1a1f2a] hover:bg-[#222938] text-[#94a1b5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-1.5 rounded text-xs font-semibold bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
              >
                {creating ? "Creating..." : "Save List"}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="w-full mt-2 py-2 rounded-lg border border-dashed border-[#2a3344] hover:border-[#3d4960] text-[#94a1b5] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Create New Collection</span>
          </button>
        )}

        <div className="pt-3 mt-3 border-t border-[#1e2430] flex justify-end">
          <button
            onClick={() => setCollectionPickerOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

