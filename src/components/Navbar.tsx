"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Calendar,
  Flame,
  Trophy,
  Bookmark,
  X,
  Star,
  User,
  LogOut,
  LogIn,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Compass,
  MessageSquare,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import { searchManga } from "@/lib/anilist";
import { MangaItem } from "@/types/manga";
import { useAuth } from "@/context/AuthContext";
import NotificationDropdown from "@/components/NotificationDropdown";
import SupporterAvatar from "@/components/SupporterAvatar";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, logout, setAuthModalOpen, setAuthModalMode, library } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MangaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tabletSearchOpen, setTabletSearchOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabletDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabletInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLight =
        document.documentElement.classList.contains("light") ||
        localStorage.getItem("mangapulse_theme") === "light";
      setIsLightMode(isLight);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    if (next) {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("mangapulse_theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      localStorage.setItem("mangapulse_theme", "dark");
    }
  };

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.results || []);
        } else {
          const fallback = await searchManga(query, 6);
          setResults(fallback);
        }
        setIsOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (tabletDropdownRef.current && !tabletDropdownRef.current.contains(e.target as Node)) {
        setTabletSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0c0e12]/95 backdrop-blur-md border-b border-[#1e2430] px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-black text-sm flex items-center justify-center tracking-tighter">
            MP
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white group-hover:text-neutral-300 transition-colors">
              MANGAPULSE
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#1e2430] text-[#94a1b5] border border-[#2a3344] hidden sm:inline-block">
              INDEX
            </span>
          </div>
        </Link>

        {/* Navigation Links: Visible on tablet (md:) and desktop with pure text, NO icons */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-xs">
          {[
            { href: "/", label: "Home" },
            { href: "/dashboard", label: "My Dashboard" },
            { href: "/trending", label: "Trending" },
            { href: "/forum", label: "Forum" },
            { href: "/library", label: "Library" },
            { href: "/donate", label: "Donate", isDonate: true },
          ].map((link) => {
            const isDonate = link.isDonate;
            const isActive =
              !isDonate &&
              (pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href)));

            let colorClass = "text-white hover:text-blue-300 font-medium";
            if (isDonate) {
              colorClass = "text-red-500 hover:text-red-400 font-bold";
            } else if (isActive) {
              colorClass = "text-blue-400 font-bold";
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 lg:px-3 py-2 min-h-[36px] rounded-md transition-colors ${colorClass}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Inline Search Bar (hidden on tablet/mobile) */}
        <div ref={dropdownRef} className="hidden xl:block relative flex-1 max-w-xs xl:max-w-sm ml-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              placeholder="Search manga, authors, magazines..."
              className="w-full bg-[#13171f] hover:bg-[#1a1f2a] focus:bg-[#1a1f2a] border border-[#2a3344] focus:border-white/40 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-[#94a3b8] focus:outline-none transition-all font-sans"
            />
            {query ? (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                className="absolute right-2.5 text-[#94a3b8] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 text-[10px] text-[#94a3b8] font-mono border border-[#2a3344] px-1 rounded">
                /
              </span>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#13171f] border border-[#2a3344] rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-[#1e2430]">
              {results.length > 0 ? (
                results.map((item) => (
                  <Link
                    key={item.id}
                    href={`/manga/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2.5 hover:bg-[#1a1f2a] transition-colors"
                  >
                    <div className="w-9 h-12 rounded bg-[#0c0e12] overflow-hidden flex-shrink-0 border border-[#2a3344]">
                      <img
                        src={item.coverImage.medium || item.coverImage.large || ""}
                        alt={item.displayTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-white truncate">
                        {item.displayTitle}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#cbd5e1]">
                        <span>{item.genres[0] || "Manga"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {item.averageScore ? (item.averageScore / 20).toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>

                    {item.nextAiringChapter && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Ch {item.nextAiringChapter.episodeOrChapter}
                      </span>
                    )}
                  </Link>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#94a3b8]">
                  {isSearching ? "Searching index..." : "No manga found."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions: Tablet Search Icon + Notifications + User Menu */}
        <div className="flex items-center gap-2 ml-auto xl:ml-0">
          {/* Tablet & Mobile Search Icon Button */}
          <button
            type="button"
            onClick={() => {
              setTabletSearchOpen((prev) => !prev);
              if (!tabletSearchOpen) {
                setTimeout(() => tabletInputRef.current?.focus(), 100);
              }
            }}
            aria-label="Search catalog"
            className={`p-2 min-h-[36px] min-w-[36px] rounded-lg border transition-colors flex items-center justify-center xl:hidden ${
              tabletSearchOpen
                ? "bg-[#1e2430] border-white/40 text-white"
                : "bg-[#13171f] hover:bg-[#1a1f2a] border-[#2a3344] text-[#cbd5e1] hover:text-white"
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isLightMode ? "dark" : "light"} mode`}
            title={`Switch to ${isLightMode ? "dark" : "light"} mode`}
            className="p-2 min-h-[36px] min-w-[36px] rounded-lg border bg-[#13171f] hover:bg-[#1a1f2a] border-[#2a3344] text-[#cbd5e1] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
          >
            {isLightMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-300" />
            )}
          </button>

          {/* Notification Bell */}
          <NotificationDropdown />

        {/* User Auth / Profile Actions */}
        {isLoggedIn ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] border border-[#2a3344] text-xs text-white transition-colors"
            >
              <SupporterAvatar
                avatarUrl={user?.avatar_url}
                username={user?.username}
                isSupporter={user?.is_supporter}
                tier={user?.supporter_tier}
                size="xs"
                rounded="lg"
                showBadge={false}
              />
              <span className="font-semibold hidden sm:inline">{user?.displayName || user?.username}</span>
              <ChevronDown className="w-3 h-3 text-[#94a1b5]" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#13171f] border border-[#2a3344] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#1e2430] mb-1">
                  <div className="font-bold text-white truncate">{user?.displayName || user?.username}</div>
                  <div className="text-[10px] text-[#94a1b5] font-mono truncate">@{user?.username}</div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:bg-[#1a1f2a] transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                  <span>My Dashboard</span>
                </Link>

                <Link
                  href="/library"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:bg-[#1a1f2a] transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>My Library ({library.length})</span>
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:bg-[#1a1f2a] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:bg-[#1a1f2a] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-purple-400" />
                  <span>Settings</span>
                </Link>

                <Link
                  href="/forum"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:bg-[#1a1f2a] transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Forum Discussions</span>
                </Link>

                <Link
                  href="/donate"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white hover:bg-[#1a1f2a] transition-colors text-rose-300"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Support MangaPulse</span>
                </Link>

                <div className="my-1 border-t border-[#1e2430]" />

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-2.5 py-1.5 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] text-white text-xs font-semibold hidden sm:flex items-center border border-[#2a3344] transition-colors"
            >
              <span>My Dashboard</span>
            </Link>
            <button
              onClick={() => {
                setAuthModalMode("login");
                setAuthModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </div>

      {/* Tablet & Mobile Search Bar Drawer */}
      {tabletSearchOpen && (
        <div
          ref={tabletDropdownRef}
          className="max-w-7xl mx-auto xl:hidden w-full pt-2.5 pb-1 border-t border-[#1e2430] mt-2 relative animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
            <input
              ref={tabletInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search manga, authors, magazines..."
              className="w-full bg-[#13171f] hover:bg-[#1a1f2a] focus:bg-[#1a1f2a] border border-[#2a3344] focus:border-white/40 rounded-lg pl-9 pr-9 py-2 text-xs text-white placeholder-[#94a3b8] focus:outline-none transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => {
                setTabletSearchOpen(false);
                setQuery("");
                setIsOpen(false);
              }}
              className="absolute right-2.5 p-1 text-[#94a3b8] hover:text-white"
              aria-label="Close search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Autocomplete Dropdown for Tablet */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#13171f] border border-[#2a3344] rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-[#1e2430]">
              {results.length > 0 ? (
                results.map((item) => (
                  <Link
                    key={item.id}
                    href={`/manga/${item.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      setTabletSearchOpen(false);
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-[#1a1f2a] transition-colors"
                  >
                    <div className="w-9 h-12 rounded bg-[#0c0e12] overflow-hidden flex-shrink-0 border border-[#2a3344]">
                      <img
                        src={item.coverImage.medium || item.coverImage.large || ""}
                        alt={item.displayTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-white truncate">
                        {item.displayTitle}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#cbd5e1]">
                        <span>{item.genres[0] || "Manga"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {item.averageScore ? (item.averageScore / 20).toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>

                    {item.nextAiringChapter && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Ch {item.nextAiringChapter.episodeOrChapter}
                      </span>
                    )}
                  </Link>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-[#94a3b8]">
                  {isSearching ? "Searching index..." : "No manga found."}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
