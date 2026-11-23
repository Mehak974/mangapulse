"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Grid,
  List,
  Flame,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import MangaCard from "@/components/MangaCard";
import { MangaItem } from "@/types/manga";
import { fetchBrowseManga, BrowseFilters } from "@/lib/anilist";

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

const FORMATS = [
  { label: "All Formats", value: "All" },
  { label: "Manga (JP)", value: "MANGA" },
  { label: "One-shot", value: "ONE_SHOT" },
  { label: "Light Novel", value: "NOVEL" },
];

const STATUSES = [
  { label: "All Statuses", value: "All" },
  { label: "Releasing (Ongoing)", value: "RELEASING" },
  { label: "Finished (Complete)", value: "FINISHED" },
  { label: "Hiatus", value: "HIATUS" },
  { label: "Not Yet Released", value: "NOT_YET_RELEASED" },
];

const COUNTRIES = [
  { label: "All Countries", value: "All" },
  { label: "Japan (Manga)", value: "JP" },
  { label: "South Korea (Manhwa)", value: "KR" },
  { label: "China (Manhua)", value: "CN" },
];

const SORTS = [
  { label: "Trending Now", value: "TRENDING_DESC" },
  { label: "Most Popular", value: "POPULARITY_DESC" },
  { label: "Highest Rated", value: "SCORE_DESC" },
  { label: "Recently Added", value: "START_DATE_DESC" },
  { label: "Title (A-Z)", value: "TITLE_ROMAJI" },
];

export default function TrendingPage() {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedFormat, setSelectedFormat] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedSort, setSelectedSort] = useState("TRENDING_DESC");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [items, setItems] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<{
    currentPage: number;
    hasNextPage: boolean;
    total: number;
  }>({
    currentPage: 1,
    hasNextPage: false,
    total: 0,
  });

  const loadManga = useCallback(async () => {
    setLoading(true);
    try {
      const filters: BrowseFilters = {
        page,
        perPage: 24,
        search: search.trim() || undefined,
        genre: selectedGenre,
        format: selectedFormat,
        status: selectedStatus,
        country: selectedCountry,
        sort: selectedSort,
      };

      const res = await fetchBrowseManga(filters);
      setItems(res.items);
      setPageInfo(res.pageInfo);
    } catch (err) {
      console.error("Trending loading error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedGenre, selectedFormat, selectedStatus, selectedCountry, selectedSort]);

  useEffect(() => {
    loadManga();
  }, [loadManga]);

  const resetFilters = () => {
    setSearch("");
    setSelectedGenre("All");
    setSelectedFormat("All");
    setSelectedStatus("All");
    setSelectedCountry("All");
    setSelectedSort("TRENDING_DESC");
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedGenre !== "All" ||
    selectedFormat !== "All" ||
    selectedStatus !== "All" ||
    selectedCountry !== "All" ||
    selectedSort !== "TRENDING_DESC";

  return (
    <div className="pb-20 space-y-8">
      {/* Top Banner / Hero */}
      <section className="bg-[#0c0e12] border-b border-[#1e2430] py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Trending Manga This Week
              </h1>
            </div>
            <p className="text-xs text-[#94a1b5] mt-1">
              The most read and anticipated manga chapters releasing worldwide right now.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center bg-[#13171f] p-1 rounded-lg border border-[#1e2430]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${
                  viewMode === "grid" ? "bg-[#1e2430] text-blue-400" : "text-[#94a1b5] hover:text-white"
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${
                  viewMode === "list" ? "bg-[#1e2430] text-blue-400" : "text-[#94a1b5] hover:text-white"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Clean Filter Controls Bar */}
        <div className="max-w-7xl mx-auto mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#94a1b5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search titles..."
                className="w-full bg-[#13171f] border border-[#2a3344] focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#94a1b5] focus:outline-none transition-all"
              />
            </div>

            {/* Genre Select */}
            <div>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#13171f] border border-[#2a3344] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-[#0c0e12]">
                    {g === "All" ? "All Genres" : g}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Select */}
            <div>
              <select
                value={selectedFormat}
                onChange={(e) => {
                  setSelectedFormat(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#13171f] border border-[#2a3344] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value} className="bg-[#0c0e12]">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#13171f] border border-[#2a3344] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#0c0e12]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Country Select */}
            <div>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#13171f] border border-[#2a3344] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#0c0e12]">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#13171f] border border-[#2a3344] focus:border-blue-500 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#0c0e12]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters Pill */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1e2430]">
              <span className="text-[11px] text-[#94a1b5]">Active filters applied.</span>
              <button
                onClick={resetFilters}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Results Grid / List */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-6">
          <div className="text-xs text-[#94a1b5] font-mono">
            Showing <span className="text-white font-bold">{items.length}</span> titles
            {pageInfo.total > 0 && ` of ~${pageInfo.total.toLocaleString()}`}
          </div>
          <div className="text-xs text-[#94a1b5] font-mono">Page {page}</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-[#13171f] rounded-xl aspect-[3/4.4] border border-[#1e2430]"
              />
            ))}
          </div>
        ) : items.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {items.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((manga) => (
                <div
                  key={manga.id}
                  className="p-3 rounded-xl bg-[#13171f] border border-[#1e2430] hover:border-[#2a3344] transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Link
                      href={`/manga/${manga.slug}`}
                      className="w-12 h-16 rounded bg-[#0c0e12] overflow-hidden flex-shrink-0 border border-[#2a3344]"
                    >
                      <img
                        src={manga.coverImage.medium || manga.coverImage.large || "/placeholder-cover.png"}
                        alt={manga.displayTitle}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        href={`/manga/${manga.slug}`}
                        className="font-bold text-sm text-white hover:text-blue-400 truncate block transition-colors"
                      >
                        {manga.displayTitle}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e2430] text-[#94a1b5]">
                          {manga.countryOfOrigin === "KR" ? "Manhwa" : "Manga"}
                        </span>
                        {manga.averageScore && (
                          <span className="text-[10px] font-mono text-amber-400">
                            ★ {(manga.averageScore / 20).toFixed(1)}
                          </span>
                        )}
                        <span className="text-[11px] text-[#94a1b5] truncate max-w-xs">
                          {manga.genres.slice(0, 3).join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/manga/${manga.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold border border-[#2a3344] flex-shrink-0 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#13171f] border border-[#1e2430]">
            <BookOpen className="w-10 h-10 text-[#94a1b5] mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Manga Found</h3>
            <p className="text-xs text-[#94a1b5] max-w-sm mx-auto mt-1 mb-4">
              We couldn&apos;t find any manga matching your current search or filter combination.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-center gap-3 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 rounded-lg bg-[#13171f] hover:bg-[#1a1f2a] disabled:opacity-40 text-white text-xs font-semibold border border-[#1e2430] flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="text-xs font-mono text-[#94a1b5] px-3 py-2 bg-[#0c0e12] rounded-lg border border-[#1e2430]">
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pageInfo.hasNextPage || loading}
            className="px-4 py-2 rounded-lg bg-[#13171f] hover:bg-[#1a1f2a] disabled:opacity-40 text-white text-xs font-semibold border border-[#1e2430] flex items-center gap-1.5 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
