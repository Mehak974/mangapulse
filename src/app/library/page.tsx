"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Bookmark,
  Layers,
  Plus,
  Trash2,
  Check,
  Star,
  BookOpen,
  FolderPlus,
  ExternalLink,
  ChevronRight,
  LogIn,
  Eye,
  Download,
  ArrowUpDown,
  Search,
  Filter,
  X,
  Edit2,
} from "lucide-react";
import { LibraryStatus, MangaDisplaySettings, MangaItem } from "@/types/manga";
import DisplaySettingsBar from "@/components/DisplaySettingsBar";
import ImportModal from "@/components/ImportModal";
import LibraryTrackerModal from "@/components/LibraryTrackerModal";
import { getDisplaySettings, DEFAULT_DISPLAY_SETTINGS } from "@/lib/chapterStore";
import { getGenresForManga } from "@/lib/profileStats";
import { getVerifiedSchedule } from "@/lib/mangaScheduleDb";

export default function LibraryPage() {
  const {
    user,
    isLoggedIn,
    library,
    updateLibrary,
    removeFromLibrary,
    incrementChapter,
    collections,
    createCollection,
    deleteCollection,
    setAuthModalOpen,
    setAuthModalMode,
    openCollectionPicker,
    refreshLibrary,
  } = useAuth();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingManga, setEditingManga] = useState<MangaItem | null>(null);

  const [activeTab, setActiveTab] = useState<LibraryStatus | "all" | "collections">("all");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [showCreateCol, setShowCreateCol] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<MangaDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [collectionsSearchQuery, setCollectionsSearchQuery] = useState("");

  // Per-collection and per-tab sorting
  type LibrarySortOption = "alphabetical" | "added" | "last_read" | "unread";
  const [sortPreferences, setSortPreferences] = useState<Record<string, LibrarySortOption>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mangapulse_col_sorts");
      if (raw) setSortPreferences(JSON.parse(raw));
    } catch {}
  }, []);

  const updateSortPreference = (key: string, sort: LibrarySortOption) => {
    setSortPreferences((prev) => {
      const next = { ...prev, [key]: sort };
      try {
        localStorage.setItem("mangapulse_col_sorts", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Load and listen to display settings
  useEffect(() => {
    setDisplaySettings(getDisplaySettings());

    const handler = () => {
      setDisplaySettings(getDisplaySettings());
    };
    window.addEventListener("mangapulse-display-settings-changed", handler);
    return () => window.removeEventListener("mangapulse-display-settings-changed", handler);
  }, []);

  // Filter library items
  const filteredItems = library.filter((item) => {
    if (activeTab === "all" || activeTab === "collections") return true;
    return item.status === activeTab;
  });

  const totalChaptersRead = library.reduce((acc, curr) => acc + curr.progress_chapter, 0);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await createCollection(newColName.trim(), newColDesc.trim() || undefined);
    setNewColName("");
    setNewColDesc("");
    setShowCreateCol(false);
  };

  const selectedCol = collections.find((c) => c.id === selectedCollectionId);

  const currentSort: LibrarySortOption =
    (selectedCol ? sortPreferences[selectedCol.id] : sortPreferences[activeTab]) || "added";

  // Sort custom collection items
  const sortedCollectionItems = [...(selectedCol?.items || [])].sort((a, b) => {
    const titleA = a?.manga_title || "";
    const titleB = b?.manga_title || "";
    if (currentSort === "alphabetical") {
      return titleA.localeCompare(titleB);
    }
    if (currentSort === "added") {
      return new Date(b?.added_at || 0).getTime() - new Date(a?.added_at || 0).getTime();
    }
    if (currentSort === "last_read") {
      const libA = library.find((l) => String(l.manga_id) === String(a?.manga_id));
      const libB = library.find((l) => String(l.manga_id) === String(b?.manga_id));
      const timeA = new Date(libA?.updated_at || libA?.created_at || 0).getTime();
      const timeB = new Date(libB?.updated_at || libB?.created_at || 0).getTime();
      return timeB - timeA;
    }
    if (currentSort === "unread") {
      const libA = library.find((l) => String(l.manga_id) === String(a?.manga_id));
      const libB = library.find((l) => String(l.manga_id) === String(b?.manga_id));
      const verA = libA ? getVerifiedSchedule(libA.manga_id, libA.manga_title, undefined, libA.total_chapters || undefined) : null;
      const verB = libB ? getVerifiedSchedule(libB.manga_id, libB.manga_title, undefined, libB.total_chapters || undefined) : null;
      const totalA = (verA?.isVerifiedInDb && (verA.totalChapters || verA.latestChapter)) ? (verA.totalChapters || verA.latestChapter) : (libA?.total_chapters || 0);
      const totalB = (verB?.isVerifiedInDb && (verB.totalChapters || verB.latestChapter)) ? (verB.totalChapters || verB.latestChapter) : (libB?.total_chapters || 0);
      const unreadA = Math.max(0, (totalA || 0) - (libA?.progress_chapter || 0));
      const unreadB = Math.max(0, (totalB || 0) - (libB?.progress_chapter || 0));
      return unreadB - unreadA;
    }
    return 0;
  });

  // Extract all unique genres from items in selected collection
  const collectionGenres = React.useMemo(() => {
    if (!selectedCol?.items || selectedCol.items.length === 0) return [];
    const genreSet = new Set<string>();
    selectedCol.items.forEach((item) => {
      const libEntry = library.find((l) => String(l.manga_id) === String(item?.manga_id));
      const genres = libEntry?.genres?.length
        ? libEntry.genres
        : getGenresForManga({ manga_title: item?.manga_title || "" } as any);
      genres.forEach((g) => {
        if (g && typeof g === "string") genreSet.add(g);
      });
    });
    return Array.from(genreSet).sort();
  }, [selectedCol?.items, library]);

  // Filter custom collection items by search query and genre
  const filteredCollectionItems = React.useMemo(() => {
    return sortedCollectionItems.filter((item) => {
      const title = (item?.manga_title || "").toLowerCase();
      // 1. Title search filter
      if (collectionSearchQuery.trim()) {
        const q = collectionSearchQuery.toLowerCase().trim();
        if (!title.includes(q)) {
          return false;
        }
      }
      // 2. Genre filter
      if (selectedGenre !== "all") {
        const libEntry = library.find((l) => String(l.manga_id) === String(item?.manga_id));
        const genres = libEntry?.genres?.length
          ? libEntry.genres
          : getGenresForManga({ manga_title: item?.manga_title || "" } as any);
        if (!genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [sortedCollectionItems, collectionSearchQuery, selectedGenre, library]);

  // Filter all collections cards
  const filteredCollections = React.useMemo(() => {
    if (!collectionsSearchQuery.trim()) return collections;
    const q = collectionsSearchQuery.toLowerCase().trim();
    return collections.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [collections, collectionsSearchQuery]);

  // Sort general library items
  const sortedLibraryItems = [...filteredItems].sort((a, b) => {
    if (currentSort === "alphabetical") {
      return a.manga_title.localeCompare(b.manga_title);
    }
    if (currentSort === "added") {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
    if (currentSort === "last_read") {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    }
    if (currentSort === "unread") {
      const verA = getVerifiedSchedule(a.manga_id, a.manga_title, undefined, a.total_chapters || undefined);
      const verB = getVerifiedSchedule(b.manga_id, b.manga_title, undefined, b.total_chapters || undefined);
      const totalA = (verA.isVerifiedInDb && (verA.totalChapters || verA.latestChapter)) ? (verA.totalChapters || verA.latestChapter) : (a.total_chapters || 0);
      const totalB = (verB.isVerifiedInDb && (verB.totalChapters || verB.latestChapter)) ? (verB.totalChapters || verB.latestChapter) : (b.total_chapters || 0);
      const unreadA = Math.max(0, (totalA || 0) - a.progress_chapter);
      const unreadB = Math.max(0, (totalB || 0) - b.progress_chapter);
      return unreadB - unreadA;
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Header Profile / Stats Banner */}
      <div className="surface-card rounded-xl p-6 border border-[#2a3344] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#0c0e12] border border-[#2a3344] flex items-center justify-center font-bold text-white text-xl">
            {user?.username ? user.username.substring(0, 2).toUpperCase() : "MP"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {user?.username ? `${user.username}'s Library` : "Personal Manga Library"}
              </h1>
              <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#2a3344]"
            title="Import from AniList or MyAnimeList XML"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Import</span>
          </button>

          {!isLoggedIn && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Guest Mode (Saved Locally)
                </span>
              )}
            </div>
            <p className="text-xs text-[#94a1b5] mt-1">
              {isLoggedIn
                ? `Signed in as ${user?.email}`
                : "Sign in with Google to sync your library across desktop and mobile devices."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0c0e12] border border-[#1e2430] rounded-lg text-center min-w-24">
            <div className="text-base font-mono font-bold text-white">{library.length}</div>
            <div className="text-[10px] text-[#5e6b82] uppercase font-mono">Tracked</div>
          </div>
          <div className="p-3 bg-[#0c0e12] border border-[#1e2430] rounded-lg text-center min-w-24">
            <div className="text-base font-mono font-bold text-blue-400">{totalChaptersRead}</div>
            <div className="text-[10px] text-[#5e6b82] uppercase font-mono">Chapters Read</div>
          </div>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#2a3344]"
            title="Import from AniList or MyAnimeList XML"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Import</span>
          </button>

          {!isLoggedIn && (
            <button
              onClick={() => {
                setAuthModalMode("login");
                setAuthModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2430] pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {(
            [
              { id: "all", label: `All (${library.length})` },
              { id: "reading", label: `Reading (${library.filter((i) => i.status === "reading").length})` },
              { id: "plan_to_read", label: `Plan to Read (${library.filter((i) => i.status === "plan_to_read").length})` },
              { id: "completed", label: `Completed (${library.filter((i) => i.status === "completed").length})` },
              { id: "dropped", label: `Dropped (${library.filter((i) => i.status === "dropped").length})` },
              { id: "collections", label: `Custom Collections (${collections.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedCollectionId(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-[#1a1f2a] text-white border border-[#2a3344]"
                  : "text-[#94a1b5] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "collections" && (
          <button
            onClick={() => setShowCreateCol(true)}
            className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Collection</span>
          </button>
        )}
      </div>

      {/* Customizable Display Settings Toolbar */}
      <DisplaySettingsBar />

      {/* View: Collections Tab */}
      {activeTab === "collections" ? (
        <div className="space-y-6">
          {/* Create collection inline modal */}
          {showCreateCol && (
            <div className="surface-card rounded-xl p-5 border border-[#2a3344] max-w-md">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2430]">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  Create Custom Collection
                </h3>
                <button
                  onClick={() => setShowCreateCol(false)}
                  className="text-[#94a1b5] hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleCreateCollection} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-mono text-[#94a1b5] mb-1">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="e.g. Masterpiece Arcs, Dark Fantasy, 2026 Must Reads"
                    className="w-full bg-[#0c0e12] border border-[#2a3344] rounded-lg px-3 py-2 text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#94a1b5] mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    placeholder="Short description of this list..."
                    className="w-full bg-[#0c0e12] border border-[#2a3344] rounded-lg px-3 py-2 text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs transition-colors"
                >
                  Create Collection
                </button>
              </form>
            </div>
          )}

          {/* If a single collection is selected to view */}
          {selectedCol ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1e2430] gap-3">
                <div>
                  <button
                    onClick={() => {
                      setSelectedCollectionId(null);
                      setCollectionSearchQuery("");
                      setSelectedGenre("all");
                    }}
                    className="text-xs font-mono text-blue-400 hover:underline mb-1 inline-block cursor-pointer"
                  >
                    ← Back to All Collections
                  </button>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-white">{selectedCol.name}</h2>
                    <span className="font-mono text-[10px] text-[#94a1b5] px-2 py-0.5 rounded bg-[#0c0e12] border border-[#1e2430]">
                      {selectedCol.items?.length || 0} Titles
                    </span>
                  </div>
                  {selectedCol.description && (
                    <p className="text-xs text-[#94a1b5] mt-0.5">{selectedCol.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Per-Collection Sort Control */}
                  <div className="flex items-center gap-1.5 bg-[#0c0e12] border border-[#2a3344] px-2.5 py-1 rounded-lg">
                    <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-[11px] font-mono text-[#94a1b5]">Sort:</span>
                    <select
                      value={currentSort}
                      onChange={(e) => updateSortPreference(selectedCol.id, e.target.value as any)}
                      className="bg-transparent text-xs text-white outline-none cursor-pointer font-semibold"
                    >
                      <option value="alphabetical" className="bg-[#141b26] text-white">Alphabetical (A - Z)</option>
                      <option value="added" className="bg-[#141b26] text-white">Recently Added</option>
                      <option value="last_read" className="bg-[#141b26] text-white">Last Read</option>
                      <option value="unread" className="bg-[#141b26] text-white">Unread Chapters</option>
                    </select>
                  </div>

                  <button
                    onClick={() => deleteCollection(selectedCol.id)}
                    className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete List</span>
                  </button>
                </div>
              </div>

              {/* Collection Toolbar: Search & Genre Filter */}
              <div className="space-y-3 p-3.5 rounded-xl bg-[#0c0e12] border border-[#1e2430]">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#5e6b82] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search within "${selectedCol.name}" by title...`}
                      value={collectionSearchQuery}
                      onChange={(e) => setCollectionSearchQuery(e.target.value)}
                      className="w-full bg-[#13171f] border border-[#2a3344] rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    {collectionSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCollectionSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5e6b82] hover:text-white cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Genre Filter Dropdown */}
                  {collectionGenres.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#13171f] border border-[#2a3344] px-2.5 py-1.5 rounded-lg flex-shrink-0">
                      <Filter className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="text-[11px] font-mono text-[#94a1b5]">Genre:</span>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="bg-transparent text-xs text-white outline-none cursor-pointer font-semibold"
                      >
                        <option value="all" className="bg-[#141b26] text-white">
                          All Genres ({selectedCol.items?.length || 0})
                        </option>
                        {collectionGenres.map((g) => (
                          <option key={g} value={g} className="bg-[#141b26] text-white">
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Quick Genre Filter Pills */}
                {collectionGenres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="text-[#5e6b82] font-mono mr-1">Filter:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedGenre("all")}
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition-colors cursor-pointer ${
                        selectedGenre === "all"
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-[#13171f] text-[#94a1b5] hover:text-white border border-[#1e2430]"
                      }`}
                    >
                      All
                    </button>
                    {collectionGenres.slice(0, 10).map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => setSelectedGenre(selectedGenre === genre ? "all" : genre)}
                        className={`px-2 py-0.5 rounded-md text-[10px] transition-colors cursor-pointer ${
                          selectedGenre === genre
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-[#13171f] text-[#94a1b5] hover:text-white border border-[#1e2430]"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Filter Indicator */}
                {(collectionSearchQuery || selectedGenre !== "all") && (
                  <div className="flex items-center justify-between text-[11px] text-[#94a1b5] pt-1.5 border-t border-[#1e2430]">
                    <span>
                      Showing <strong>{filteredCollectionItems.length}</strong> of {sortedCollectionItems.length} titles
                      {selectedGenre !== "all" && <span> in <em>{selectedGenre}</em></span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCollectionSearchQuery("");
                        setSelectedGenre("all");
                      }}
                      className="text-blue-400 hover:text-blue-300 font-mono text-[10px] underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {filteredCollectionItems && filteredCollectionItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredCollectionItems.map((m) => (
                    <div
                      key={m.manga_id}
                      className="surface-card rounded-xl overflow-hidden border border-[#1e2430] p-2.5 flex flex-col justify-between gap-2"
                    >
                      <Link href={`/manga/${m.manga_slug}`}>
                        {displaySettings.showCover && (
                          <div className="relative aspect-[3/4.2] w-full rounded bg-black overflow-hidden mb-2">
                            <img
                              src={m.manga_cover || "/placeholder-cover.png"}
                              alt={m.manga_title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/placeholder-cover.png";
                              }}
                            />
                          </div>
                        )}
                        {displaySettings.showTitle && (
                          <div className="font-semibold text-xs text-white line-clamp-1 hover:text-blue-400">
                            {m.manga_title}
                          </div>
                        )}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : selectedCol.items?.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5e6b82]">
                  This collection is empty. Click &quot;Collection&quot; on any manga card to add titles.
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#5e6b82] space-y-2">
                  <p>No manga in this collection match your current filters.</p>
                  <button
                    onClick={() => {
                      setCollectionSearchQuery("");
                      setSelectedGenre("all");
                    }}
                    className="px-3 py-1 rounded bg-[#1a1f2a] hover:bg-[#252f40] text-blue-400 text-xs font-semibold border border-[#2a3344] transition-colors cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* All Collections Cards Grid with Collection Search */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#5e6b82] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search collections by name..."
                    value={collectionsSearchQuery}
                    onChange={(e) => setCollectionsSearchQuery(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#2a3344] rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                  />
                  {collectionsSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCollectionsSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5e6b82] hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-[#94a1b5] font-mono">
                  {filteredCollections.length} {filteredCollections.length === 1 ? "collection" : "collections"}
                </div>
              </div>

              {filteredCollections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredCollections.map((col) => (
                    <div
                      key={col.id}
                      onClick={() => {
                        setSelectedCollectionId(col.id);
                        setCollectionSearchQuery("");
                        setSelectedGenre("all");
                      }}
                      className="surface-card rounded-xl p-5 border border-[#2a3344] hover:border-[#3d4960] transition-colors cursor-pointer flex flex-col justify-between gap-4 group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                            {col.name}
                          </h3>
                          <span className="font-mono text-[10px] text-[#94a1b5] px-1.5 py-0.5 rounded bg-[#0c0e12] border border-[#1e2430]">
                            {col.items?.length || 0} Titles
                          </span>
                        </div>
                        {col.description && (
                          <p className="text-xs text-[#94a1b5] line-clamp-2 leading-relaxed">
                            {col.description}
                          </p>
                        )}
                      </div>

                      {/* Thumbnail Previews */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#1e2430]">
                        {col.items && col.items.length > 0 ? (
                          col.items.slice(0, 4).map((it) => (
                            <div
                              key={it.manga_id}
                              className="w-9 h-12 rounded bg-black overflow-hidden border border-[#2a3344]"
                            >
                              <img
                                src={it.manga_cover || "/placeholder-cover.png"}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "/placeholder-cover.png";
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#5e6b82] font-mono">
                            No titles added yet
                          </span>
                        )}
                        <span className="ml-auto text-xs font-mono text-[#94a1b5] group-hover:text-white flex items-center">
                          Open →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : collections.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#5e6b82] space-y-2">
                  <p>You haven&apos;t created any custom collections yet.</p>
                  <button
                    onClick={() => setShowCreateCol(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                  >
                    + Create First Collection
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#5e6b82] space-y-2">
                  <p>No collections found matching &quot;{collectionsSearchQuery}&quot;.</p>
                  <button
                    onClick={() => setCollectionsSearchQuery("")}
                    className="px-3 py-1 rounded bg-[#1a1f2a] hover:bg-[#252f40] text-blue-400 text-xs font-semibold border border-[#2a3344] transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* View: Manga Tracking Grid / Table with customizable fields */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#13171f] p-3 rounded-xl border border-[#1e2430]">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-[#94a1b5] font-mono">Sort tab by:</span>
              <select
                value={currentSort}
                onChange={(e) => updateSortPreference(activeTab, e.target.value as any)}
                className="bg-[#0c0e12] border border-[#2a3344] focus:border-blue-500 rounded-lg px-2.5 py-1 text-xs text-white outline-none cursor-pointer font-semibold"
              >
                <option value="alphabetical" className="bg-[#141b26] text-white">Alphabetical (A - Z)</option>
                <option value="added" className="bg-[#141b26] text-white">Recently Added</option>
                <option value="last_read" className="bg-[#141b26] text-white">Last Read</option>
                <option value="unread" className="bg-[#141b26] text-white">Unread Chapters</option>
              </select>
            </div>
            <div className="text-xs text-[#94a1b5] font-mono">
              Showing <span className="font-bold text-white">{sortedLibraryItems.length}</span> titles
            </div>
          </div>

          {sortedLibraryItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedLibraryItems.map((entry) => {
                const verified = getVerifiedSchedule(entry.manga_id, entry.manga_title, undefined, entry.total_chapters || undefined);
                const total = verified.isVerifiedInDb && (verified.totalChapters || verified.latestChapter)
                  ? (verified.totalChapters || verified.latestChapter)
                  : entry.total_chapters;
                const unread = total ? Math.max(0, total - entry.progress_chapter) : null;

                return (
                  <div
                    key={entry.manga_id}
                    className="surface-card rounded-xl p-4 border border-[#2a3344] flex gap-4"
                  >
                    {/* Poster Cover (if enabled) */}
                    {displaySettings.showCover && (
                      <Link href={`/manga/${entry.manga_slug}`} className="flex-shrink-0">
                        <div className="w-16 h-24 relative rounded-lg overflow-hidden bg-black border border-[#1e2430]">
                          <img
                            src={entry.manga_cover || "/placeholder-cover.png"}
                            alt={entry.manga_title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholder-cover.png";
                            }}
                          />
                        </div>
                      </Link>
                    )}

                    {/* Details & Interactive Incrementer */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Title (if enabled) */}
                        <div className="flex items-start justify-between gap-1">
                          {displaySettings.showTitle ? (
                            <Link
                              href={`/manga/${entry.manga_slug}`}
                              className="font-bold text-xs text-white hover:text-blue-400 line-clamp-1 transition-colors"
                            >
                              {entry.manga_title}
                            </Link>
                          ) : (
                            <span className="font-mono text-xs text-[#5e6b82]">
                              Manga #{entry.manga_id}
                            </span>
                          )}
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0c0e12] border border-[#1e2430] text-[#94a1b5]">
                            {entry.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        {/* Chapter progress with Instant +1 Button */}
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="text-xs font-mono text-[#94a1b5]">
                            Ch. <span className="font-bold text-white">{entry.progress_chapter}</span>
                            {displaySettings.showLatestChapter && total ? ` / ${total}` : ""}
                          </div>

                          <button
                            onClick={() => incrementChapter(entry.manga_id)}
                            className="px-2 py-0.5 rounded bg-[#1a1f2a] hover:bg-[#2563eb] text-[#94a1b5] hover:text-white border border-[#2a3344] text-[11px] font-mono font-semibold transition-colors flex items-center gap-1"
                            title="Read next chapter (+1)"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+1 Ch</span>
                          </button>
                        </div>

                        {/* Unread count & Score display (if enabled) */}
                        <div className="flex items-center gap-2 mt-1.5">
                          {displaySettings.showUnreadCount && unread !== null && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {unread} unread
                            </span>
                          )}

                          {displaySettings.showRating && entry.rating && (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{entry.rating} / 10</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#1e2430] text-[11px]">
                        <button
                          onClick={() =>
                            setEditingManga({
                              id: entry.manga_id,
                              slug: entry.manga_slug,
                              title: { userPreferred: entry.manga_title },
                              displayTitle: entry.manga_title,
                              coverImage: { large: entry.manga_cover },
                              genres: entry.genres || [],
                              status: entry.status === "completed" ? "FINISHED" : "RELEASING",
                              chapters: entry.total_chapters ?? null,
                            } as any)
                          }
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors font-medium"
                          title="Edit reading progress or set accurate total chapters"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Tracker</span>
                        </button>

                        <button
                          onClick={() =>
                            openCollectionPicker({
                              id: entry.manga_id,
                              slug: entry.manga_slug,
                              displayTitle: entry.manga_title,
                              coverImage: { large: entry.manga_cover },
                              title: { userPreferred: entry.manga_title },
                              genres: [],
                              status: "RELEASING",
                            })
                          }
                          className="text-[#94a1b5] hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Collection</span>
                        </button>

                        <button
                          onClick={() => removeFromLibrary(entry.manga_id)}
                          className="text-red-400/80 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="surface-card rounded-xl p-12 text-center border border-[#2a3344] space-y-3">
              <BookOpen className="w-8 h-8 text-[#5e6b82] mx-auto" />
              <h3 className="font-bold text-white text-sm">No series in this reading list</h3>
              <p className="text-xs text-[#94a1b5] max-w-sm mx-auto">
                Explore trending manga and click &quot;Track&quot; on any title to follow your progress and receive chapter countdown alerts.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Browse Trending Manga</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => refreshLibrary()}
      />

      {/* Library Tracker Modal */}
      {editingManga && (
        <LibraryTrackerModal
          manga={editingManga}
          onClose={() => setEditingManga(null)}
        />
      )}
    </div>
  );
}
