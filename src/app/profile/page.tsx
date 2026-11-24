"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Settings,
  Bookmark,
  Calendar,
  Share2,
  CheckCircle2,
  Star,
  BookOpen,
  Award,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  Upload,
  X,
  Check,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Trophy,
  Target,
  Flame,
  Palette,
  Search,
  Filter,
  SlidersHorizontal,
  Crown,
  Zap,
  BarChart2,
  PieChart,
  Grid,
  Heart,
  ChevronRight,
  TrendingUp,
  Eye,
  EyeOff,
  Globe,
  Compass,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserLibraryEntry, ActivityItem } from "@/types/manga";
import SupporterAvatar from "@/components/SupporterAvatar";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import PerkLockModal, { SupporterTierLevel } from "@/components/PerkLockModal";
import { getUserActivities, DEFAULT_PREFERENCES } from "@/lib/userStore";

type ProfileTab = "overview" | "library" | "statistics" | "achievements";
type ProfileTheme = "sunset" | "cyberpunk" | "platinum" | "sakura" | "midnight";

const THEMES: Record<
  ProfileTheme,
  {
    name: string;
    bannerStyle: string;
    accentClass: string;
    description: string;
  }
> = {
  sunset: {
    name: "Kenmei Sunset Sky",
    bannerStyle:
      "bg-gradient-to-r from-indigo-950 via-purple-900 via-rose-900 to-amber-700/80 border-b border-rose-500/30",
    accentClass: "text-amber-400 border-amber-500/30",
    description: "Dreamy anime pastel sunset clouds with golden highlights",
  },
  cyberpunk: {
    name: "Cyberpunk Neon",
    bannerStyle:
      "bg-gradient-to-r from-cyan-950 via-blue-950 via-purple-950 to-fuchsia-950 border-b border-cyan-500/30",
    accentClass: "text-cyan-400 border-cyan-500/30",
    description: "Electric cyan and neon magenta grid matrix",
  },
  platinum: {
    name: "Platinum Patron",
    bannerStyle:
      "bg-gradient-to-r from-slate-900 via-neutral-900 to-slate-800 border-b border-slate-300/40",
    accentClass: "text-slate-100 border-slate-300/40",
    description: "Liquid metallic silver luxury with diamond reflections",
  },
  sakura: {
    name: "Sakura Twilight",
    bannerStyle:
      "bg-gradient-to-r from-pink-950 via-rose-900 to-slate-950 border-b border-pink-500/30",
    accentClass: "text-pink-400 border-pink-500/30",
    description: "Japanese cherry blossom twilight petals",
  },
  midnight: {
    name: "Midnight OLED",
    bannerStyle: "bg-[#07090e] border-b border-slate-800",
    accentClass: "text-blue-400 border-blue-500/30",
    description: "Pure deep space black with crisp starry accents",
  },
};

export default function ProfilePage() {
  const {
    user,
    isLoggedIn,
    library,
    collections,
    updateProfile,
    setAuthModalOpen,
    setAuthModalMode,
  } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  // Privacy State (Functional Public/Private Profile)
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [previewAsGuest, setPreviewAsGuest] = useState<boolean>(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [localSupporter, setLocalSupporter] = useState<{ is_supporter: boolean; tier?: string } | null>(null);

  // Theme & Favorites State
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [profileTheme, setProfileTheme] = useState<ProfileTheme>("sunset");
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Supporter Perk Lock Modal & Toast State
  const [perkModalOpen, setPerkModalOpen] = useState(false);
  const [perkModalConfig, setPerkModalConfig] = useState<{
    tier?: SupporterTierLevel;
    featureName?: string;
    message?: string;
    highlights?: string[];
    ctaUrl?: string;
    ctaText?: string;
  }>({
    tier: "legend",
    featureName: "Custom Theme Selection",
    message: "Custom Theme selection is a Manga Patron ($15) exclusive perk!",
  });

  const triggerPerkModal = (config?: {
    tier?: SupporterTierLevel;
    featureName?: string;
    message?: string;
    highlights?: string[];
    ctaUrl?: string;
    ctaText?: string;
  }) => {
    setPerkModalConfig({
      tier: config?.tier || "legend",
      featureName: config?.featureName || "Custom Theme Selection",
      message: config?.message || "Custom Theme selection is a Manga Patron ($15) exclusive perk!",
      highlights: config?.highlights,
      ctaUrl: config?.ctaUrl,
      ctaText: config?.ctaText,
    });
    setPerkModalOpen(true);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Library Tab Filter State
  const [librarySearch, setLibrarySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"last_read" | "title" | "rating" | "progress">("last_read");

  // Localhost test tier state
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [activeTestTier, setActiveTestTier] = useState<string>("legend");

  useEffect(() => {
    const syncLocal = () => {
      if (
        process.env.NODE_ENV !== "production" &&
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.endsWith(".localhost"))
      ) {
        setIsLocalhost(true);
        const stored = localStorage.getItem("mangapulse_test_tier") || "legend";
        setActiveTestTier(stored);
      }
      try {
        const raw = localStorage.getItem("mangapulse_supporter");
        if (raw) setLocalSupporter(JSON.parse(raw));
        const storedTheme = localStorage.getItem("mangapulse_profile_theme") as ProfileTheme;
        if (storedTheme && THEMES[storedTheme]) setProfileTheme(storedTheme);
        const storedFaves = localStorage.getItem("mangapulse_favorite_manga");
        if (storedFaves) setFavoriteIds(JSON.parse(storedFaves));
        const storedPriv = localStorage.getItem("mangapulse_profile_private");
        if (storedPriv !== null) setIsPrivate(storedPriv === "true");
      } catch {}
    };
    syncLocal();
    setActivities(getUserActivities(20));

    window.addEventListener("mangapulse-supporter-updated", syncLocal);
    const handleAct = () => setActivities(getUserActivities(20));
    window.addEventListener("mangapulse-activity-logged", handleAct);

    return () => {
      window.removeEventListener("mangapulse-supporter-updated", syncLocal);
      window.removeEventListener("mangapulse-activity-logged", handleAct);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || user.username || "");
      setEditUsername(user.username || "");
      setEditBio(user.bio || "");
      setEditLocation(user.location || "");
      setEditAvatarUrl(user.avatar_url || "");
      if (user.preferences?.is_private !== undefined) {
        setIsPrivate(Boolean(user.preferences.is_private));
      }
    }
  }, [user]);

  const handleSwitchLocalTier = (newTier: string) => {
    localStorage.setItem("mangapulse_test_tier", newTier);
    setActiveTestTier(newTier);
    window.dispatchEvent(new Event("mangapulse-supporter-updated"));
  };

  const handleTogglePrivacy = async () => {
    const next = !isPrivate;
    setIsPrivate(next);
    localStorage.setItem("mangapulse_profile_private", next ? "true" : "false");
    await updateProfile({
      is_private: next,
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...(user?.preferences || {}),
        is_private: next,
      },
    });
  };

  const handleSelectTheme = (t: ProfileTheme) => {
    setProfileTheme(t);
    localStorage.setItem("mangapulse_profile_theme", t);
    setThemeModalOpen(false);
  };

  const handleToggleFavorite = (mangaId: number) => {
    let next: number[];
    if (favoriteIds.includes(mangaId)) {
      next = favoriteIds.filter((id) => id !== mangaId);
    } else {
      if (favoriteIds.length >= 6) {
        showToast("You can spotlight up to 6 favorite manga on your profile.");
        return;
      }
      next = [...favoriteIds, mangaId];
    }
    setFavoriteIds(next);
    localStorage.setItem("mangapulse_favorite_manga", JSON.stringify(next));
  };

  // Status counts
  const readingCount = useMemo(() => library.filter((e) => e.status === "reading").length, [library]);
  const planCount = useMemo(() => library.filter((e) => e.status === "plan_to_read").length, [library]);
  const completedCount = useMemo(() => library.filter((e) => e.status === "completed").length, [library]);
  const droppedCount = useMemo(() => library.filter((e) => e.status === "dropped").length, [library]);

  const totalChapters = useMemo(() => {
    const librarySum = library.reduce((sum, item) => sum + (item.progress_chapter || 0), 0);
    if (typeof window !== "undefined") {
      let storeSum = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("mangapulse_read_chapters_")) {
          try {
            const arr = JSON.parse(localStorage.getItem(key) || "[]");
            storeSum += Array.isArray(arr) ? arr.length : 0;
          } catch {}
        }
      }
      return Math.max(librarySum, storeSum);
    }
    return librarySum;
  }, [library]);

  const ratedItems = useMemo(() => library.filter((e) => e.rating !== null && e.rating !== undefined), [library]);
  const averageRating = useMemo(() => {
    if (ratedItems.length === 0) return "—";
    const sum = ratedItems.reduce((acc, it) => acc + (it.rating || 0), 0);
    return (sum / ratedItems.length).toFixed(1);
  }, [ratedItems]);

  const completionRate = useMemo(() => {
    if (library.length === 0) return "0.0%";
    return `${((completedCount / library.length) * 100).toFixed(1)}%`;
  }, [library.length, completedCount]);

  // Tier calculation logic
  const isVerified = Boolean((isLoggedIn || isLocalhost) && (user?.is_verified || user?.email || isLocalhost));
  const effectiveTier = isLocalhost ? activeTestTier : user?.supporter_tier || localSupporter?.tier || "free";
  const isSupporter = Boolean(
    (isLocalhost && activeTestTier !== "free") ||
    user?.is_supporter ||
    localSupporter?.is_supporter
  );
  const supporterTier = isSupporter ? effectiveTier : "free";

  const isCoffeeDonator = Boolean(
    isSupporter && supporterTier.toLowerCase().includes("coffee")
  );
  const isMangaPatron = Boolean(
    isSupporter &&
      (supporterTier.toLowerCase().includes("legend") || supporterTier.toLowerCase().includes("patron"))
  );
  const isProSupporter = Boolean(isSupporter && !isMangaPatron && !isCoffeeDonator);
  const isProOrPatron = Boolean(isProSupporter || isMangaPatron);

  // Favorite manga items
  const favoriteManga = useMemo(() => {
    if (favoriteIds.length > 0) {
      return library.filter((m) => favoriteIds.includes(m.manga_id));
    }
    return library.filter((m) => (m.rating || 0) >= 8).slice(0, 4);
  }, [library, favoriteIds]);

  // Filtered library
  const filteredLibrary = useMemo(() => {
    return library
      .filter((m) => {
        const matchSearch =
          !librarySearch.trim() ||
          m.manga_title.toLowerCase().includes(librarySearch.toLowerCase());
        const matchStatus = statusFilter === "all" || m.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        if (sortOrder === "title") return a.manga_title.localeCompare(b.manga_title);
        if (sortOrder === "rating") return (b.rating || 0) - (a.rating || 0);
        if (sortOrder === "progress") return (b.progress_chapter || 0) - (a.progress_chapter || 0);
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [library, librarySearch, statusFilter, sortOrder]);

  // Functional Badges
  const badges = useMemo(() => {
    return [
      {
        id: "verified",
        title: "Verified Reader",
        description: "Official verified community member of MangaPulse index.",
        icon: CheckCircle2,
        unlocked: isVerified,
        progress: isVerified ? "Verified Member" : "Requires sign-in",
        color: "emerald",
      },
      {
        id: "collector_5",
        title: "Library Initiate",
        description: "Tracked at least 5 series in personal reading library.",
        icon: BookOpen,
        unlocked: library.length >= 5,
        progress: `${Math.min(library.length, 5)} / 5 Titles`,
        color: "blue",
      },
      {
        id: "collector_20",
        title: "Master Collector",
        description: "Curated a massive collection of 20+ tracked titles.",
        icon: Layers,
        unlocked: library.length >= 20,
        progress: `${Math.min(library.length, 20)} / 20 Titles`,
        color: "purple",
      },
      {
        id: "century_100",
        title: "Century Club (100+)",
        description: "Completed or read through 100+ total manga chapters.",
        icon: Flame,
        unlocked: totalChapters >= 100,
        progress: `${Math.min(totalChapters, 100)} / 100 Chapters`,
        color: "amber",
      },
      {
        id: "genre_explorer",
        title: "Genre Explorer",
        description: "Tracking stories across 3 or more distinct titles & genres.",
        icon: Compass,
        unlocked: library.length >= 3,
        progress: `${Math.min(library.length, 3)} / 3 Genres`,
        color: "cyan",
      },
      {
        id: "active_tracker",
        title: "Consistent Reader",
        description: "Actively logs chapter progression and reading status.",
        icon: Clock,
        unlocked: library.some((e) => (e.progress_chapter || 0) > 0) || activities.length > 0,
        progress: library.some((e) => (e.progress_chapter || 0) > 0) ? "Active Streak" : "0 / 1 Update",
        color: "indigo",
      },
      {
        id: "supporter",
        title: isMangaPatron
          ? "Manga Patron"
          : isProSupporter
          ? "Pro Supporter"
          : isCoffeeDonator
          ? "Coffee Donator"
          : "Supporter Tier",
        description: isSupporter
          ? `Official ${supporterTier} tier patron supporting legal manga indexing.`
          : "Support MangaPulse on Ko-fi to unlock supporter perks & badges.",
        icon: isMangaPatron ? Crown : isProSupporter ? Zap : Heart,
        unlocked: isSupporter,
        progress: isSupporter ? "Active Tier" : "Ko-fi Tier",
        color: isMangaPatron ? "slate" : isProSupporter ? "amber" : "rose",
      },
    ];
  }, [isVerified, library, totalChapters, activities.length, isMangaPatron, isProSupporter, isCoffeeDonator, isSupporter, supporterTier]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://mangapulse.co/profile";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy profile link:", url);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        displayName: editDisplayName.trim() || null,
        username: editUsername.trim() || user?.username,
        bio: editBio.trim() || null,
        location: editLocation.trim() || null,
        avatar_url: editAvatarUrl.trim() || null,
      });
      setEditModalOpen(false);
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const displayName = user?.displayName || user?.username || "Manga Enthusiast";
  const username = user?.username || "reader";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString([], { month: "short", year: "numeric" })
    : "March 2025";

  // Guest view when profile is set to Private
  if (isPrivate && previewAsGuest) {
    return (
      <div className="min-w-0 pb-24">
        {/* Banner */}
        <div className={`h-40 w-full relative overflow-hidden ${THEMES[profileTheme].bannerStyle}`}>
          <div className="max-w-7xl mx-auto h-full px-4 lg:px-8 flex items-center justify-end">
            <button
              onClick={() => setPreviewAsGuest(false)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg"
            >
              Exit Guest Preview (Back to Owner View)
            </button>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 -mt-16 text-center space-y-5">
          <div className="inline-block relative">
            <SupporterAvatar
              avatarUrl={user?.avatar_url}
              username={username}
              isSupporter={isSupporter}
              tier={supporterTier}
              size="xl"
              rounded="2xl"
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-md">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{displayName}</h1>
            <p className="text-xs font-mono text-blue-400 mt-1">@{username}</p>
          </div>

          <div className="p-8 rounded-2xl bg-[#13171f] border border-[#2a3344] text-center space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">This Profile is Set to Private</h2>
            <p className="text-xs text-[#94a1b5] leading-relaxed max-w-sm mx-auto">
              {displayName} has chosen to keep their reading library, statistics, and badges private.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-24">
      {/* ── Top Header Banner with Dynamic Theme ── */}
      <div
        className={`h-48 sm:h-64 w-full relative overflow-hidden transition-all duration-500 ${THEMES[profileTheme].bannerStyle}`}
      >
        {user?.banner_url && (
          <img
            src={user.banner_url}
            alt="Profile Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e121a] via-black/20 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Top actions toolbar */}
        <div className="max-w-7xl mx-auto h-full px-4 lg:px-8 flex items-start justify-between pt-4 relative z-30 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#0c0e12]/80 backdrop-blur-md border border-[#2a3344] text-xs font-mono font-semibold text-white/90 shadow-sm flex items-center gap-1.5">
              <span>MANGA TRACKER</span>
              <span className="text-[#5e6b82]">•</span>
              <span className="text-blue-400 uppercase">{profileTheme}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#0c0e12]/80 backdrop-blur-md hover:bg-[#1a1f2a] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Change Profile Theme"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Theme</span>
              {isMangaPatron && (
                <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-black font-bold">
                  VIP
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Private Warning Banner for Profile Owner */}
        {isPrivate && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>Private Profile Mode:</strong> Your reading activity and library are hidden from other visitors.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewAsGuest(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/40 cursor-pointer"
              >
                Preview as Guest
              </button>
              <button
                type="button"
                onClick={handleTogglePrivacy}
                className="px-2.5 py-1 rounded-lg bg-[#0c0e12] hover:bg-[#1a1f2a] text-white text-xs font-semibold border border-[#2a3344] cursor-pointer"
              >
                Make Public
              </button>
            </div>
          </div>
        )}

        {/* User Identity Details & Action Buttons */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-16 sm:-mt-20 relative z-30 pb-6 border-b border-[#1e2430]">
          <div className="flex items-end gap-4">
            <div className="relative group flex-shrink-0">
              <SupporterAvatar
                avatarUrl={user?.avatar_url}
                username={username}
                isSupporter={isSupporter}
                tier={supporterTier}
                size="xl"
                rounded="2xl"
              />
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-xs font-bold z-30 cursor-pointer"
              >
                Change Photo
              </button>
            </div>

            <div className="mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {displayName}
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  @{username}
                </span>
                {isPrivate && (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Private</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-[#94a1b5]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5e6b82]" />
                  <span>Joined {memberSince}</span>
                </span>
                {user?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#5e6b82]" />
                    <span>{user.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar right in the Identity Row (100% Clickable, Guaranteed Accessibility) */}
          <div className="flex items-center gap-2 flex-wrap relative z-30 pointer-events-auto">
            {/* Theme Customizer Button */}
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-[#13171f] hover:bg-[#1a1f2a] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Change Profile Theme"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Theme</span>
            </button>

            {/* Public / Private Profile Toggle Button */}
            <button
              type="button"
              onClick={handleTogglePrivacy}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer ${
                isPrivate
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-[#13171f] hover:bg-[#1a1f2a] text-[#94a1b5] hover:text-white border-[#2a3344]"
              }`}
              title={isPrivate ? "Profile is currently Private (Click to make Public)" : "Profile is Public (Click to make Private)"}
            >
              {isPrivate ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Private</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Public</span>
                </>
              )}
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2 rounded-lg bg-[#13171f] hover:bg-[#1a1f2a] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Copy public profile URL"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#94a1b5]" />
                  <span>Share</span>
                </>
              )}
            </button>

            {/* Edit Profile Button */}
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

          {/* Profile Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {isVerified ? (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Reader</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setAuthModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-md bg-[#161a22] text-[#94a1b5] border border-[#2a3344] text-[11px] font-mono font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Unverified</span>
              </button>
            )}

            {isSupporter ? (
              <span
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium flex items-center gap-1.5 ${
                  isMangaPatron
                    ? "bg-slate-200/15 text-slate-100 border border-slate-200/60 shadow-[0_0_14px_rgba(255,255,255,0.45)] animate-patron-border"
                    : isProSupporter
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    isMangaPatron
                      ? "text-white fill-white drop-shadow-[0_0_8px_#ffffff] animate-patron-sparkle-1"
                      : isProSupporter
                      ? "text-amber-400 fill-amber-400"
                      : "text-blue-400"
                  }`}
                />
                <span>Official Supporter ({supporterTier})</span>
              </span>
            ) : (
              <Link
                href="/donate"
                className="px-2.5 py-1 rounded-md bg-[#161a22] text-[#94a1b5] hover:text-white border border-[#2a3344] text-[11px] font-mono font-medium flex items-center gap-1.5"
              >
                <Lock className="w-3 h-3 text-[#5e6b82]" />
                <span>Official Supporter (Unlock)</span>
              </Link>
            )}

            {isMangaPatron && (
              <Link
                href="/donate#patrons"
                className="px-2.5 py-1 rounded-md bg-gradient-to-r from-slate-200/20 to-white/20 text-white border border-slate-200/40 text-[11px] font-mono font-semibold flex items-center gap-1 hover:border-white transition-colors"
              >
                <Crown className="w-3 h-3 text-slate-200" />
                <span>Wall of Fame</span>
              </Link>
            )}
          </div>

        {/* Localhost Tier & Privacy Switcher Toolbar */}
        {isLocalhost && (
          <div className="mt-4 p-3 rounded-xl bg-[#13171f] border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[#94a1b5] font-semibold text-[11px] uppercase tracking-wider">
                Testing Toolbar:
              </span>
              <span className="font-bold text-amber-400 uppercase font-mono text-[11px]">
                {activeTestTier === "legend"
                  ? "Manga Patron ($15 • All Unlocked)"
                  : activeTestTier === "supporter"
                  ? "Pro Supporter ($5 • Kenmei Tabs, Stats Locked)"
                  : activeTestTier === "coffee"
                  ? "Coffee ($3 • Previous Layout + Reading Status)"
                  : "Free Reader (Previous Layout)"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSwitchLocalTier("free")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                  activeTestTier === "free"
                    ? "bg-neutral-700 border-neutral-400 text-white"
                    : "bg-[#0c0e12] border-[#2a3344] text-[#94a1b5] hover:text-white"
                }`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLocalTier("coffee")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                  activeTestTier === "coffee"
                    ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    : "bg-[#0c0e12] border-[#2a3344] text-[#94a1b5] hover:text-white"
                }`}
              >
                Coffee ($3)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLocalTier("supporter")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                  activeTestTier === "supporter"
                    ? "bg-amber-400 border-amber-300 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                    : "bg-[#0c0e12] border-[#2a3344] text-[#94a1b5] hover:text-white"
                }`}
              >
                Pro ($5)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLocalTier("legend")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border cursor-pointer ${
                  activeTestTier === "legend"
                    ? "bg-slate-200 border-white text-black shadow-[0_0_12px_rgba(241,245,249,0.7)]"
                    : "bg-[#0c0e12] border-[#2a3344] text-[#94a1b5] hover:text-white"
                }`}
              >
                Patron ($15)
              </button>
            </div>
          </div>
        )}

        {/* User Bio */}
        {user?.bio && (
          <div className="py-3 text-xs text-[#94a1b5] max-w-2xl leading-relaxed">
            {user.bio}
          </div>
        )}

        {/* ── TIER-AWARE PROFILE CONTENT ── */}
        {isProOrPatron ? (
          /* ==============================================================
             PRO SUPPORTER & MANGA PATRON: KENMEI 3-TAB DASHBOARD LAYOUT
             ============================================================== */
          <>
            {/* Kenmei-Style Pill Tabs Navigation */}
            <div className="flex items-center gap-2 mt-6 mb-8 border-b border-[#1e2430] pb-4">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-[#13171f] text-[#94a1b5] hover:text-white border border-[#2a3344]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("library")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "library"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-[#13171f] text-[#94a1b5] hover:text-white border border-[#2a3344]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Library</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40">
                  {library.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("statistics")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "statistics"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-[#13171f] text-[#94a1b5] hover:text-white border border-[#2a3344]"
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Statistics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("achievements")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "achievements"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-[#13171f] text-[#94a1b5] hover:text-white border border-[#2a3344]"
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Achievements</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-emerald-400">
                  {badges.filter((b) => b.unlocked).length}/{badges.length}
                </span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Activity Feed & Favourites */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Activity Feed */}
                    <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <h3 className="font-bold text-sm text-white">Activity Feed</h3>
                        </div>
                        <span className="text-[11px] font-mono text-[#5e6b82]">Recent Updates</span>
                      </div>

                      <div className="space-y-3">
                        {activities.length > 0 ? (
                          activities.slice(0, 6).map((act) => (
                            <div
                              key={act.id}
                              className="p-3 rounded-xl bg-[#0c0e12] border border-[#1e2430] flex items-center justify-between gap-3 hover:border-[#2a3344] transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-14 rounded-lg overflow-hidden bg-neutral-900 border border-[#2a3344] flex-shrink-0">
                                  <img
                                    src={act.manga_cover || "/placeholder-cover.png"}
                                    alt={act.manga_title}
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (!target.src.endsWith("/placeholder-cover.png")) {
                                        target.src = "/placeholder-cover.png";
                                      }
                                    }}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs text-[#94a1b5]">
                                    Reading{" "}
                                    <Link
                                      href={`/manga/${act.manga_slug}`}
                                      className="font-bold text-white hover:text-blue-400 transition-colors"
                                    >
                                      {act.manga_title}
                                    </Link>
                                  </div>
                                  <div className="text-[11px] font-mono text-blue-400 mt-0.5">
                                    {act.chapter_number ? `Chapter ${act.chapter_number}` : "Latest Release"}
                                  </div>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono text-[#5e6b82] whitespace-nowrap">
                                {new Date(act.timestamp).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-[#5e6b82]">
                            No activity recorded yet. Start tracking manga to see your feed here!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Favourites Section */}
                    <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                      <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-4">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-rose-400" />
                          <h3 className="font-bold text-sm text-white">Favourites Spotlight</h3>
                        </div>

                        <button
                          onClick={() => setFavoritesModalOpen(true)}
                          className="px-3 py-1 rounded-lg bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#2a3344] text-[11px] font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-[#94a1b5]" />
                          <span>Edit Favourites</span>
                        </button>
                      </div>

                      {favoriteManga.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {favoriteManga.map((m) => (
                            <Link
                              key={m.manga_id}
                              href={`/manga/${m.manga_slug}`}
                              className="group flex flex-col rounded-xl overflow-hidden bg-[#0c0e12] border border-[#1e2430] hover:border-blue-500/50 transition-all"
                            >
                              <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-900 relative">
                                <img
                                  src={m.manga_cover || "/placeholder-cover.png"}
                                  alt={m.manga_title}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (!target.src.endsWith("/placeholder-cover.png")) {
                                      target.src = "/placeholder-cover.png";
                                    }
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{m.rating?.toFixed(1) || "—"}</span>
                                </div>
                              </div>
                              <div className="p-2">
                                <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                                  {m.manga_title}
                                </h4>
                                <span className="text-[10px] font-mono text-[#5e6b82]">
                                  Ch {m.progress_chapter || 0}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 flex flex-col items-center justify-center">
                          <Bookmark className="w-8 h-8 text-[#5e6b82] mb-2" />
                          <div className="text-xs font-bold text-white">No Favourites Spotlighted</div>
                          <p className="text-[11px] text-[#5e6b82] mt-1 max-w-xs">
                            Spotlight your favorite manga series here for everyone to see.
                          </p>
                          <button
                            onClick={() => setFavoritesModalOpen(true)}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Choose Favourites
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right 1 Col: Donut Charts & Top Genres */}
                  <div className="space-y-6">
                    {/* Reading Status Circle Breakdown */}
                    <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                      <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-[#94a1b5] mb-4">
                        Reading Status
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                          <div className="text-center">
                            <div className="text-base font-black text-white font-mono">
                              {library.length > 0 ? `${Math.round((readingCount / library.length) * 100)}%` : "0%"}
                            </div>
                            <div className="text-[9px] font-mono text-[#94a1b5]">Reading</div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs flex-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>Reading</span>
                            </span>
                            <span className="font-mono font-bold text-white">{readingCount}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-blue-400">
                              <span className="w-2 h-2 rounded-full bg-blue-400" />
                              <span>Completed</span>
                            </span>
                            <span className="font-mono font-bold text-white">{completedCount}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>Plan to Read</span>
                            </span>
                            <span className="font-mono font-bold text-white">{planCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Type Breakdown */}
                    <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                      <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-[#94a1b5] mb-4">
                        Content Type
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 rounded-full border-4 border-cyan-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                          <div className="text-center">
                            <div className="text-base font-black text-white font-mono">100%</div>
                            <div className="text-[9px] font-mono text-[#94a1b5]">Official Index</div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs flex-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-cyan-400">
                              <span className="w-2 h-2 rounded-full bg-cyan-400" />
                              <span>Manga &amp; Manhwa</span>
                            </span>
                            <span className="font-mono font-bold text-white">{library.length}</span>
                          </div>
                          <div className="text-[11px] text-[#5e6b82]">Simulpub official releases</div>
                        </div>
                      </div>
                    </div>

                    {/* Top Genres Bars */}
                    <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                      <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-[#94a1b5] mb-3">
                        Top Genres
                      </h3>
                      <div className="space-y-2.5 text-xs">
                        {[
                          { name: "Action & Adventure", percent: 45, color: "bg-blue-500" },
                          { name: "Fantasy & Magic", percent: 30, color: "bg-purple-500" },
                          { name: "Drama & Mystery", percent: 15, color: "bg-amber-500" },
                          { name: "Comedy & Slice", percent: 10, color: "bg-emerald-500" },
                        ].map((g) => (
                          <div key={g.name}>
                            <div className="flex justify-between text-[11px] font-mono text-[#94a1b5] mb-1">
                              <span>{g.name}</span>
                              <span>{g.percent}%</span>
                            </div>
                            <div className="w-full bg-[#0c0e12] h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full ${g.color}`} style={{ width: `${g.percent}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Functional Badges Section on Overview ── */}
                <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-5">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-sm text-white">Badges &amp; Achievements</h3>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {badges.map((b) => {
                      const IconComp = b.icon;
                      return (
                        <div
                          key={b.id}
                          className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                            b.unlocked
                              ? "bg-[#0c0e12] border-[#2a3344] hover:border-blue-500/40 shadow-sm"
                              : "bg-[#0c0e12]/50 border-[#1e2430] opacity-60"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              b.unlocked
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                : "bg-[#161a22] text-[#5e6b82] border border-[#222938]"
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-xs text-white truncate">{b.title}</h4>
                              {b.unlocked && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                            </div>
                            <p className="text-[11px] text-[#94a1b5] mt-0.5 line-clamp-2 leading-tight">
                              {b.description}
                            </p>
                            <div className="text-[10px] font-mono font-semibold text-blue-400 mt-2">
                              {b.progress}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIBRARY */}
            {activeTab === "library" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
                {/* Main Manga Cards Grid (3 Cols) */}
                <div className="lg:col-span-3">
                  {filteredLibrary.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {filteredLibrary.map((item) => (
                        <div
                          key={item.id}
                          className="group flex flex-col rounded-xl overflow-hidden bg-[#13171f] border border-[#1e2430] hover:border-blue-500/50 transition-all shadow-sm"
                        >
                          <Link href={`/manga/${item.manga_slug}`} className="block">
                            <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-900 relative">
                              <img
                                src={item.manga_cover || "/placeholder-cover.png"}
                                alt={item.manga_title}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.src.endsWith("/placeholder-cover.png")) {
                                    target.src = "/placeholder-cover.png";
                                  }
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 left-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                    item.status === "reading"
                                      ? "bg-emerald-500/90 text-white"
                                      : item.status === "completed"
                                      ? "bg-blue-600/90 text-white"
                                      : "bg-[#0c0e12]/80 text-[#94a1b5]"
                                  }`}
                                >
                                  {item.status.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          </Link>

                          {/* Reading Progress Bar directly below cover */}
                          <div
                            className="w-full bg-[#1e2430] h-1.5 relative overflow-hidden"
                            title={`Progress: Chapter ${item.progress_chapter || 0}${item.total_chapters ? ` of ${item.total_chapters}` : ""}`}
                          >
                            <div
                              className={`h-full transition-all duration-300 ${
                                item.status === "completed"
                                  ? "bg-emerald-500"
                                  : "bg-gradient-to-r from-blue-600 to-cyan-400"
                              }`}
                              style={{
                                width: `${
                                  item.status === "completed"
                                    ? 100
                                    : item.total_chapters
                                    ? Math.min(100, Math.round(((item.progress_chapter || 0) / item.total_chapters) * 100))
                                    : (item.progress_chapter || 0) > 0
                                    ? 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>

                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <Link
                              href={`/manga/${item.manga_slug}`}
                              className="font-bold text-xs text-white truncate hover:text-blue-400 transition-colors"
                            >
                              {item.manga_title}
                            </Link>
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#94a1b5] mt-2 pt-2 border-t border-[#1e2430]">
                              <span>Ch {item.progress_chapter || 0}</span>
                              {item.rating && (
                                <span className="flex items-center gap-1 text-amber-400 font-bold">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {item.rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center rounded-2xl bg-[#13171f] border border-[#1e2430]">
                      <BookOpen className="w-10 h-10 text-[#5e6b82] mx-auto mb-2" />
                      <div className="text-sm font-bold text-white">No Manga Match Filters</div>
                      <p className="text-xs text-[#94a1b5] mt-1">
                        Try clearing your search query or switching your status filter.
                      </p>
                    </div>
                  )}
                </div>

                {/* Filter Sidebar (1 Col) */}
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430] space-y-4 text-xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#1e2430]">
                      <Filter className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-bold text-white">Filter Library</span>
                    </div>

                    <div>
                      <label className="block text-[#94a1b5] font-semibold mb-1">Search Title</label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5e6b82]" />
                        <input
                          type="text"
                          value={librarySearch}
                          onChange={(e) => setLibrarySearch(e.target.value)}
                          placeholder="Filter by title..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#94a1b5] font-semibold mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="all">All Statuses ({library.length})</option>
                        <option value="reading">Currently Reading ({readingCount})</option>
                        <option value="completed">Completed ({completedCount})</option>
                        <option value="plan_to_read">Plan to Read ({planCount})</option>
                        <option value="dropped">Dropped ({droppedCount})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#94a1b5] font-semibold mb-1">Sort By</label>
                      <select
                        value={sortOrder}
                        onChange={(e: any) => setSortOrder(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="last_read">Last Updated</option>
                        <option value="title">Title (A-Z)</option>
                        <option value="rating">Highest Rating</option>
                        <option value="progress">Most Chapters Read</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: STATISTICS */}
            {activeTab === "statistics" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Top 4 Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                    <div className="text-[11px] font-mono text-[#94a1b5] uppercase">Total Series</div>
                    <div className="text-3xl font-black text-white font-mono mt-1">{library.length}</div>
                    <div className="text-[10px] text-[#5e6b82] mt-1">tracked in catalog</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                    <div className="text-[11px] font-mono text-[#94a1b5] uppercase">Total Chapters</div>
                    <div className="text-3xl font-black text-blue-400 font-mono mt-1">{totalChapters}</div>
                    <div className="text-[10px] text-[#5e6b82] mt-1">read across library</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                    <div className="text-[11px] font-mono text-[#94a1b5] uppercase">Average Score</div>
                    <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                      {averageRating}{" "}
                      <span className="text-xs text-[#5e6b82] font-normal">/ 10</span>
                    </div>
                    <div className="text-[10px] text-[#5e6b82] mt-1">{ratedItems.length} rated</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                    <div className="text-[11px] font-mono text-[#94a1b5] uppercase">Completion Rate</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                      {completionRate}
                    </div>
                    <div className="text-[10px] text-[#5e6b82] mt-1">{completedCount} finished</div>
                  </div>
                </div>

                {/* Activity History Heatmap (Locked for Free & Pro, Unlocked for Manga Patron) */}
                <ActivityHeatmap
                  activities={activities}
                  isLocked={!isMangaPatron}
                  onUnlockClick={() => {
                    triggerPerkModal({
                      tier: "legend",
                      featureName: "Activity History Heatmap",
                      message: "Activity history heatmaps and reading streak analytics are a Manga Patron ($15) exclusive perk!",
                    });
                  }}
                />

                {/* Kenmei Score Breakdown & Tone Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Standout Tags & Affinity */}
                  <div className="relative p-6 rounded-2xl bg-[#13171f] border border-[#1e2430] overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1e2430]">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="font-bold text-sm text-white">Standout Tags &amp; Tone</h3>
                    </div>

                    <div className="space-y-3">
                      {[
                        { tag: "Action & Adventure", val: "100% of library", score: 100 },
                        { tag: "Reincarnation & Isekai", val: "75% affinity", score: 75 },
                        { tag: "Game System & Leveling", val: "50% affinity", score: 50 },
                        { tag: "Solo Protagonist", val: "50% affinity", score: 50 },
                      ].map((t) => (
                        <div key={t.tag}>
                          <div className="flex justify-between text-[11px] font-mono text-[#94a1b5] mb-1">
                            <span>{t.tag}</span>
                            <span className="text-white font-bold">{t.val}</span>
                          </div>
                          <div className="w-full bg-[#0c0e12] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${t.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {!isMangaPatron && (
                      <div className="absolute inset-0 backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                        <Crown className="w-6 h-6 text-slate-100 mb-2" />
                        <div className="font-bold text-xs text-white">Standout Taste Analytics</div>
                        <p className="text-[11px] text-[#94a1b5] mt-1 max-w-xs">
                          Unlock full cross-community manga affinity comparisons with Manga Patron.
                        </p>
                        <button
                          onClick={() => {
                            triggerPerkModal({
                              tier: "legend",
                              featureName: "Standout Taste Analytics",
                              message: "Standout taste analytics and cross-community genre affinities are a Manga Patron ($15) exclusive perk!",
                            });
                          }}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-white text-black font-extrabold text-[11px] shadow-sm hover:scale-105 transition-transform cursor-pointer"
                        >
                          Unlock with Patron
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reading Patterns Card */}
                  <div className="relative p-6 rounded-2xl bg-[#13171f] border border-[#1e2430] overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1e2430]">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-sm text-white">Reading Velocity &amp; Patterns</h3>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#0c0e12] border border-[#1e2430] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">Peak Reading Window</div>
                          <div className="text-[11px] text-[#94a1b5]">10:00 PM – 1:30 AM (Night Owl)</div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">72%</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0c0e12] border border-[#1e2430] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">Primary Drop Day</div>
                          <div className="text-[11px] text-[#94a1b5]">Sunday Official Drops (MANGA Plus)</div>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-400">8.4 Ch/day</span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0c0e12] border border-[#1e2430] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">Weekly Reading Pace</div>
                          <div className="text-[11px] text-[#94a1b5]">16.2 Chapters/Week average</div>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400">Top 5%</span>
                      </div>
                    </div>

                    {!isMangaPatron && (
                      <div className="absolute inset-0 backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                        <Crown className="w-6 h-6 text-slate-100 mb-2" />
                        <div className="font-bold text-xs text-white">Reading Velocity Insights</div>
                        <p className="text-[11px] text-[#94a1b5] mt-1 max-w-xs">
                          See your exact chapter reading velocity and night owl trends with Manga Patron.
                        </p>
                        <button
                          onClick={() => {
                            triggerPerkModal({
                              tier: "legend",
                              featureName: "Reading Velocity Insights",
                              message: "Reading velocity intelligence and drop day habits are a Manga Patron ($15) exclusive perk!",
                            });
                          }}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-white text-black font-extrabold text-[11px] shadow-sm hover:scale-105 transition-transform cursor-pointer"
                        >
                          Unlock with Patron
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ACHIEVEMENTS */}
            {activeTab === "achievements" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-5">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="font-bold text-base text-white">Badges &amp; Achievements</h3>
                        <p className="text-xs text-[#94a1b5]">
                          Milestones and verified honors earned through your reading journey and community support.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {badges.map((b) => {
                      const IconComp = b.icon;
                      return (
                        <div
                          key={b.id}
                          className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                            b.unlocked
                              ? "bg-[#0c0e12] border-[#2a3344] hover:border-blue-500/50 shadow-md"
                              : "bg-[#0c0e12]/50 border-[#1e2430] opacity-60"
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              b.unlocked
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                : "bg-[#161a22] text-[#5e6b82] border border-[#222938]"
                            }`}
                          >
                            <IconComp className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-sm text-white truncate">{b.title}</h4>
                              {b.unlocked && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-[#94a1b5] mt-1 leading-snug">
                              {b.description}
                            </p>
                            <div className="text-xs font-mono font-semibold text-blue-400 mt-2">
                              {b.progress}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ==============================================================
             FREE USER & COFFEE DONATOR: PREVIOUS CLEAN SINGLE-PAGE LAYOUT
             (Coffee users get Reading Status, Content Type & Top Genres)
             ============================================================== */
          <div className="mt-8 space-y-8 animate-in fade-in duration-200">
            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                <div className="text-[11px] font-mono text-[#94a1b5] uppercase">Total Series</div>
                <div className="text-3xl font-black text-white font-mono mt-1">{library.length}</div>
                <div className="text-[10px] text-[#5e6b82] mt-1">in library</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                <div className="text-[11px] font-mono text-[#94a1b5] uppercase">Chapters Read</div>
                <div className="text-3xl font-black text-blue-400 font-mono mt-1">{totalChapters}</div>
                <div className="text-[10px] text-[#5e6b82] mt-1">across library</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                <div className="text-[11px] font-mono text-[#94a1b5] uppercase">Mean Score</div>
                <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                  {averageRating}{" "}
                  <span className="text-xs text-[#5e6b82] font-normal">/ 10</span>
                </div>
                <div className="text-[10px] text-[#5e6b82] mt-1">{ratedItems.length} rated</div>
              </div>

              <div className="p-5 rounded-2xl bg-[#13171f] border border-[#1e2430]">
                <div className="text-[11px] font-mono text-[#94a1b5] uppercase">Completion %</div>
                <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                  {completionRate}
                </div>
                <div className="text-[10px] text-[#5e6b82] mt-1">{completedCount} completed</div>
              </div>
            </div>

            {/* Coffee Donator Exclusive Widgets: Reading Status, Content Type, Top Genres */}
            {isCoffeeDonator && (
              <div className="p-6 rounded-2xl bg-[#13171f] border border-blue-500/30 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Coffee Supporter Insights</h3>
                  </div>
                  <span className="text-[11px] font-mono text-blue-400 font-bold">
                    Unlocked via Coffee Donation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Reading Status Circle */}
                  <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430]">
                    <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-[#94a1b5] mb-3">
                      Reading Status
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                        <div className="text-center">
                          <div className="text-sm font-black text-white font-mono">
                            {library.length > 0 ? `${Math.round((readingCount / library.length) * 100)}%` : "0%"}
                          </div>
                          <div className="text-[8px] font-mono text-[#94a1b5]">Reading</div>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs flex-1">
                        <div className="flex justify-between">
                          <span className="text-emerald-400">Reading</span>
                          <span className="font-mono font-bold text-white">{readingCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-400">Completed</span>
                          <span className="font-mono font-bold text-white">{completedCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-400">Plan to Read</span>
                          <span className="font-mono font-bold text-white">{planCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Type Breakdown */}
                  <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430]">
                    <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-[#94a1b5] mb-3">
                      Content Type
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-20 rounded-full border-4 border-cyan-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                        <div className="text-center">
                          <div className="text-sm font-black text-white font-mono">100%</div>
                          <div className="text-[8px] font-mono text-[#94a1b5]">Official</div>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs flex-1">
                        <div className="flex justify-between">
                          <span className="text-cyan-400">Tracked Titles</span>
                          <span className="font-mono font-bold text-white">{library.length}</span>
                        </div>
                        <div className="text-[10px] text-[#5e6b82]">Manga &amp; Manhwa index</div>
                      </div>
                    </div>
                  </div>

                  {/* Top Genres Breakdown */}
                  <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430]">
                    <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-[#94a1b5] mb-3">
                      Top Genres
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        { name: "Action & Adventure", percent: 45, color: "bg-blue-500" },
                        { name: "Fantasy & Magic", percent: 30, color: "bg-purple-500" },
                        { name: "Drama & Mystery", percent: 15, color: "bg-amber-500" },
                      ].map((g) => (
                        <div key={g.name}>
                          <div className="flex justify-between text-[10px] font-mono text-[#94a1b5] mb-0.5">
                            <span>{g.name}</span>
                            <span>{g.percent}%</span>
                          </div>
                          <div className="w-full bg-[#161a22] h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${g.color}`} style={{ width: `${g.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Functional Badges Section (Free & Coffee Users) */}
            <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Badges &amp; Achievements</h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {badges.map((b) => {
                  const IconComp = b.icon;
                  return (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        b.unlocked
                          ? "bg-[#0c0e12] border-[#2a3344] hover:border-blue-500/40 shadow-sm"
                          : "bg-[#0c0e12]/50 border-[#1e2430] opacity-60"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          b.unlocked
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                            : "bg-[#161a22] text-[#5e6b82] border border-[#222938]"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-white truncate">{b.title}</h4>
                          {b.unlocked && <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-[#94a1b5] mt-0.5 line-clamp-2 leading-tight">
                          {b.description}
                        </p>
                        <div className="text-[10px] font-mono font-semibold text-blue-400 mt-2">
                          {b.progress}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Library Summary with Cover Progress Bars */}
            <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2430] mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-sm text-white">My Reading Library</h3>
                  <span className="text-xs font-mono text-[#5e6b82]">({library.length} series)</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-[#5e6b82]" />
                    <input
                      type="text"
                      value={librarySearch}
                      onChange={(e) => setLibrarySearch(e.target.value)}
                      placeholder="Search series..."
                      className="w-full pl-8 pr-3 py-1 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] outline-none focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                    <option value="plan_to_read">Plan to Read</option>
                  </select>
                </div>
              </div>

              {filteredLibrary.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredLibrary.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col rounded-xl overflow-hidden bg-[#0c0e12] border border-[#1e2430] hover:border-blue-500/50 transition-all shadow-sm"
                    >
                      <Link href={`/manga/${item.manga_slug}`} className="block">
                        <div className="aspect-[3/4] w-full overflow-hidden bg-neutral-900 relative">
                          <img
                            src={item.manga_cover || "/placeholder-cover.png"}
                            alt={item.manga_title}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.endsWith("/placeholder-cover.png")) {
                                target.src = "/placeholder-cover.png";
                              }
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-1.5 left-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                item.status === "reading"
                                  ? "bg-emerald-500/90 text-white"
                                  : item.status === "completed"
                                  ? "bg-blue-600/90 text-white"
                                  : "bg-[#0c0e12]/80 text-[#94a1b5]"
                              }`}
                            >
                              {item.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Reading Progress Bar below cover */}
                      <div
                        className="w-full bg-[#1e2430] h-1.5 relative overflow-hidden"
                        title={`Progress: Chapter ${item.progress_chapter || 0}${item.total_chapters ? ` of ${item.total_chapters}` : ""}`}
                      >
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.status === "completed"
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-blue-600 to-cyan-400"
                          }`}
                          style={{
                            width: `${
                              item.status === "completed"
                                ? 100
                                : item.total_chapters
                                ? Math.min(100, Math.round(((item.progress_chapter || 0) / item.total_chapters) * 100))
                                : (item.progress_chapter || 0) > 0
                                ? 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <Link
                          href={`/manga/${item.manga_slug}`}
                          className="font-bold text-xs text-white truncate hover:text-blue-400 transition-colors"
                        >
                          {item.manga_title}
                        </Link>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#94a1b5] mt-1.5 pt-1.5 border-t border-[#1e2430]">
                          <span>Ch {item.progress_chapter || 0}</span>
                          {item.rating && (
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              {item.rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-[#5e6b82]">
                  No manga match your filters in this reading library.
                </div>
              )}
            </div>

            {/* Custom Collections Section */}
            <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2430] mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-sm text-white">Custom Collections</h3>
                </div>
                <Link
                  href="/library?tab=collections"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Manage Collections →
                </Link>
              </div>

              {collections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430] hover:border-[#2a3344] transition-colors"
                    >
                      <h4 className="font-bold text-xs text-white truncate">{col.name}</h4>
                      <p className="text-[11px] text-[#94a1b5] mt-0.5 line-clamp-1">{col.description}</p>
                      <div className="text-[10px] font-mono text-purple-400 mt-2">
                        {col.items?.length || 0} items
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-[#5e6b82]">
                  No collections created yet. Group your manga into custom reading lists!
                </div>
              )}
            </div>

            {/* Upgrade Teaser Card for Free Users */}
            {!isSupporter && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Unlock Kenmei Analytics &amp; Activity Heatmaps</span>
                  </h4>
                  <p className="text-xs text-[#94a1b5] max-w-md">
                    Support MangaPulse with a Coffee ($3), Pro ($5), or Manga Patron ($15) tier to unlock reading velocity, custom anime sky themes, and 365-day heatmaps.
                  </p>
                </div>
                <Link
                  href="/donate"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md whitespace-nowrap transition-colors"
                >
                  View Membership Tiers
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Custom Theme Selection Modal (Manga Patron Exclusive) ── */}
      {themeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#13171f] border border-[#2a3344] rounded-2xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm">Select Profile Banner Theme</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-100 border border-white/20">
                  Manga Patron VIP
                </span>
              </div>
              <button
                onClick={() => setThemeModalOpen(false)}
                className="p-1 rounded text-[#94a1b5] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#94a1b5] mt-2 mb-4">
              Manga Patrons can customize their profile banner aesthetic with luxury anime illustrated skies and neon matrices.
            </p>

            <div className="space-y-3">
              {(Object.keys(THEMES) as ProfileTheme[]).map((tKey) => {
                const t = THEMES[tKey];
                const isSelected = profileTheme === tKey;
                return (
                  <div
                    key={tKey}
                    onClick={() => {
                      if (isMangaPatron) {
                        handleSelectTheme(tKey);
                      } else {
                        triggerPerkModal({
                          tier: "legend",
                          featureName: "Custom Theme Selection",
                          message: "Custom Theme selection is a Manga Patron ($15) exclusive perk!",
                          highlights: [
                            "Full access to luxury anime illustrated profile skies & themes",
                            "Shiny metallic animated silver crown avatar border",
                            "Permanent inscription on the Manga Patron Wall of Fame",
                            "Unlock Reading Status, Content Types & Standout Analytics",
                          ],
                        });
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#1a1f2a] border-white shadow-md"
                        : "bg-[#0c0e12] border-[#2a3344] hover:border-[#3d4960]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-10 rounded-lg ${t.bannerStyle} flex-shrink-0 shadow-inner`} />
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div className="text-[11px] text-[#94a1b5]">{t.description}</div>
                      </div>
                    </div>

                    {!isMangaPatron && <Lock className="w-3.5 h-3.5 text-[#5e6b82]" />}
                  </div>
                );
              })}
            </div>

            {!isMangaPatron && (
              <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-300">Upgrade to unlock all custom themes</span>
                <button
                  onClick={() => {
                    triggerPerkModal({
                      tier: "legend",
                      featureName: "Custom Theme Selection",
                      message: "Custom Theme selection is a Manga Patron ($15) exclusive perk!",
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white text-black font-extrabold text-xs cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Join Patron
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Favourites Picker Modal ── */}
      {favoritesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#13171f] border border-[#2a3344] rounded-2xl p-6 shadow-2xl text-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-sm">Select Profile Favourites Spotlight</h3>
              </div>
              <button
                onClick={() => setFavoritesModalOpen(false)}
                className="p-1 rounded text-[#94a1b5] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#94a1b5] mt-2 mb-3">
              Choose up to 6 manga from your library to showcase prominently on your profile. ({favoriteIds.length}/6 selected)
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {library.map((m) => {
                const isFave = favoriteIds.includes(m.manga_id);
                return (
                  <div
                    key={m.manga_id}
                    onClick={() => handleToggleFavorite(m.manga_id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isFave
                        ? "bg-rose-500/10 border-rose-500/40"
                        : "bg-[#0c0e12] border-[#1e2430] hover:border-[#2a3344]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={m.manga_cover || "/placeholder-cover.png"}
                        alt={m.manga_title}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.endsWith("/placeholder-cover.png")) {
                            target.src = "/placeholder-cover.png";
                          }
                        }}
                        className="w-8 h-11 rounded object-cover flex-shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs text-white truncate">{m.manga_title}</div>
                        <div className="text-[10px] font-mono text-[#94a1b5]">
                          Ch {m.progress_chapter || 0} • {m.status}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`p-1.5 rounded-lg border ${
                        isFave
                          ? "bg-rose-500 text-white border-rose-400"
                          : "bg-[#161a22] text-[#5e6b82] border-[#222938]"
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#1e2430] flex justify-end">
              <button
                type="button"
                onClick={() => setFavoritesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#13171f] border border-[#2a3344] rounded-2xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Edit Profile Information</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-[#94a1b5] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-[#94a1b5] font-semibold mb-2">Profile Avatar</label>
                <div className="flex items-center gap-3 p-3 bg-[#0c0e12] rounded-xl border border-[#2a3344]">
                  <div className="w-14 h-14 rounded-xl bg-[#13171f] border border-[#2a3344] overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0">
                    {editAvatarUrl ? (
                      <img
                        src={editAvatarUrl}
                        alt="Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-cover.png";
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{editUsername.substring(0, 2).toUpperCase() || "MP"}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="px-3 py-1.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold border border-[#2a3344] transition-colors cursor-pointer inline-flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setEditAvatarUrl(ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="Or paste direct image URL..."
                      className="w-full px-2.5 py-1.5 rounded bg-[#13171f] border border-[#2a3344] text-[11px] text-white font-mono placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94a1b5] font-semibold mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="e.g. Alex Tracker"
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[#94a1b5] font-semibold mb-1">Username (@handle)</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="e.g. reader99"
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94a1b5] font-semibold mb-1">Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Tokyo, Japan / Los Angeles, CA"
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[#94a1b5] font-semibold mb-1">About / Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Share your favorite genres or ongoing reads..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2430]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#1a1f2a] text-[#94a1b5] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Supporter Perk Lock Modal ── */}
      <PerkLockModal
        isOpen={perkModalOpen}
        onClose={() => setPerkModalOpen(false)}
        tier={perkModalConfig.tier}
        featureName={perkModalConfig.featureName}
        message={perkModalConfig.message}
        highlights={perkModalConfig.highlights}
        ctaUrl={perkModalConfig.ctaUrl}
        ctaText={perkModalConfig.ctaText}
        onDevSimulate={
          process.env.NODE_ENV !== "production"
            ? () => handleSwitchLocalTier(perkModalConfig.tier || "legend")
            : undefined
        }
      />

      {/* ── Toast Notification Pill ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#13171f] border border-[#2a3344] shadow-2xl text-white text-xs animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-[#94a1b5] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
