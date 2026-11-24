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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserLibraryEntry } from "@/types/manga";
import SupporterAvatar from "@/components/SupporterAvatar";

export default function ProfilePage() {
  const { user, isLoggedIn, library, collections, updateProfile, setAuthModalOpen, setAuthModalMode } = useAuth();
  const [copied, setCopied] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [localSupporter, setLocalSupporter] = useState<{ is_supporter: boolean; tier?: string } | null>(null);

  useEffect(() => {
    const checkSupporter = () => {
      try {
        const raw = localStorage.getItem("mangapulse_supporter");
        if (raw) setLocalSupporter(JSON.parse(raw));
      } catch {}
    };
    checkSupporter();
    window.addEventListener("mangapulse-supporter-updated", checkSupporter);
    return () => window.removeEventListener("mangapulse-supporter-updated", checkSupporter);
  }, []);

  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || user.username || "");
      setEditUsername(user.username || "");
      setEditBio(user.bio || "");
      setEditLocation(user.location || "");
      setEditAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

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

  const topRatedManga = useMemo(() => {
    return [...library]
      .filter((e) => (e.rating || 0) >= 8)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }, [library]);

  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".localhost"))
    ) {
      setIsLocalhost(true);
    }
  }, []);

  const isVerified = Boolean((isLoggedIn || isLocalhost) && (user?.is_verified || user?.email || isLocalhost));
  const isSupporter = Boolean(user?.is_supporter || localSupporter?.is_supporter || isLocalhost);
  const supporterTier = user?.supporter_tier || localSupporter?.tier || (isLocalhost ? "coffee" : "Supporter");
  const weeklyGoal = user?.preferences?.weeklyGoalChapters || user?.reading_goal || 15;
  const chaptersReadThisWeek = Math.min(weeklyGoal, Math.max(totalChapters > 0 ? Math.min(totalChapters, 12) : 0, readingCount > 0 ? 8 : 0));

  // Dynamic functional achievements
  const achievements = useMemo(() => {
    return [
      {
        id: "verified_reader",
        title: "Verified Reader",
        description: "Authenticate and link verified account credentials.",
        unlocked: isVerified,
        progressPercent: isVerified ? 100 : 0,
        progressText: isVerified ? "1/1" : "0/1",
        progressDetail: isVerified ? "Identity Verified" : "Sign in to verify",
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        barColor: "bg-emerald-500",
      },
      {
        id: "century_100",
        title: "100+ Chapters Read",
        description: "Milestone: Read at least 100 chapters across any manga.",
        unlocked: totalChapters >= 100,
        progressPercent: Math.min(100, (totalChapters / 100) * 100),
        progressText: `${totalChapters}/100`,
        progressDetail: `${Math.min(totalChapters, 100)} / 100 chapters`,
        icon: <Award className="w-4 h-4 text-purple-400" />,
        iconBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        barColor: "bg-purple-500",
      },
      {
        id: "official_supporter",
        title: "Official Supporter",
        description: "Fund server maintenance, live countdowns, and metadata sync.",
        unlocked: isSupporter,
        progressPercent: isSupporter ? 100 : 0,
        progressText: isSupporter ? "Active" : "Locked",
        progressDetail: isSupporter ? `Tier: ${supporterTier}` : "Support via /donate",
        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        barColor: "bg-amber-500",
      },
      {
        id: "first_chapter",
        title: "First Steps",
        description: "Record your initial chapter read in MangaPulse tracker.",
        unlocked: totalChapters >= 1,
        progressPercent: totalChapters >= 1 ? 100 : 0,
        progressText: `${Math.min(totalChapters, 1)}/1`,
        progressDetail: `${Math.min(totalChapters, 1)} / 1 chapter`,
        icon: <BookOpen className="w-4 h-4 text-blue-400" />,
        iconBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        barColor: "bg-blue-500",
      },
      {
        id: "master_500",
        title: "500+ Master Reader",
        description: "Devour 500 total chapters across your reading list.",
        unlocked: totalChapters >= 500,
        progressPercent: Math.min(100, (totalChapters / 500) * 100),
        progressText: `${totalChapters}/500`,
        progressDetail: `${Math.min(totalChapters, 500)} / 500 chapters`,
        icon: <Flame className="w-4 h-4 text-rose-400" />,
        iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        barColor: "bg-rose-500",
      },
      {
        id: "curator_10",
        title: "Library Curator",
        description: "Track 10 or more different manga series in your personal library.",
        unlocked: library.length >= 10,
        progressPercent: Math.min(100, (library.length / 10) * 100),
        progressText: `${library.length}/10`,
        progressDetail: `${Math.min(library.length, 10)} / 10 series`,
        icon: <Layers className="w-4 h-4 text-cyan-400" />,
        iconBg: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
        barColor: "bg-cyan-500",
      },
      {
        id: "critic_5",
        title: "Critical Eye",
        description: "Submit ratings for at least 5 different manga titles.",
        unlocked: ratedItems.length >= 5,
        progressPercent: Math.min(100, (ratedItems.length / 5) * 100),
        progressText: `${ratedItems.length}/5`,
        progressDetail: `${Math.min(ratedItems.length, 5)} / 5 rated`,
        icon: <Star className="w-4 h-4 text-yellow-400" />,
        iconBg: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        barColor: "bg-yellow-500",
      },
      {
        id: "weekly_champion",
        title: "Weekly Champion",
        description: `Complete your weekly reading goal of ${weeklyGoal} chapters.`,
        unlocked: chaptersReadThisWeek >= weeklyGoal,
        progressPercent: Math.min(100, (chaptersReadThisWeek / weeklyGoal) * 100),
        progressText: `${chaptersReadThisWeek}/${weeklyGoal}`,
        progressDetail: `${Math.min(chaptersReadThisWeek, weeklyGoal)} / ${weeklyGoal} chapters`,
        icon: <Target className="w-4 h-4 text-emerald-400" />,
        iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        barColor: "bg-emerald-500",
      },
    ];
  }, [isVerified, totalChapters, isSupporter, supporterTier, library.length, ratedItems.length, chaptersReadThisWeek, weeklyGoal]);

  // Robust share profile handler with universal fallback
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://mangapulse.com/profile";
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
    } catch (err) {
      console.warn("Clipboard copy failed, using prompt fallback:", err);
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

  return (
    <div className="min-w-0 pb-20">
      {/* Profile Header Banner */}
      <div className="h-44 sm:h-56 w-full bg-[#13171f] border-b border-[#1e2430] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2a3344_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto h-full px-4 lg:px-8 flex items-end justify-between pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#0c0e12]/80 backdrop-blur-md border border-[#2a3344] text-[11px] font-mono font-semibold text-[#94a1b5]">
              MANGA TRACKER PROFILE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-lg bg-[#0c0e12]/80 backdrop-blur-md hover:bg-[#1a1f2a] text-white text-xs font-semibold border border-[#2a3344] flex items-center gap-1.5 transition-colors shadow-sm"
              title="Copy public profile URL"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#94a1b5]" />
                  <span>Share Profile</span>
                </>
              )}
            </button>
            <button
              onClick={() => setEditModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* User Identity Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 relative z-20 pb-6 border-b border-[#1e2430]">
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
                onClick={() => setEditModalOpen(true)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-[10px] font-bold z-30"
              >
                Change Photo
              </button>
            </div>

            <div className="mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {displayName}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  @{username}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-[#94a1b5]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5e6b82]" />
                  <span>Member since {memberSince}</span>
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

          {/* Real Functional Profile Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Verified Reader Tag */}
            {isVerified ? (
              <span
                className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium flex items-center gap-1.5"
                title={`Verified MangaPulse Account (${user?.email || username})`}
              >
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
                className="px-2.5 py-1 rounded-md bg-[#161a22] text-[#94a1b5] hover:text-white hover:border-[#3d4960] border border-[#2a3344] text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors"
                title="Sign in to verify your account"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Unverified (Sign in)</span>
              </button>
            )}

            {/* 100+ Chapters Milestone Tag */}
            {totalChapters >= 100 ? (
              <span
                className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-mono font-medium flex items-center gap-1.5"
                title={`${totalChapters} chapters read across all manga series`}
              >
                <Award className="w-3.5 h-3.5 text-purple-400" />
                <span>{totalChapters >= 1000 ? "1,000+ Chapters" : totalChapters >= 500 ? "500+ Chapters" : "100+ Chapters"}</span>
              </span>
            ) : (
              <span
                className="px-2.5 py-1 rounded-md bg-[#161a22] text-[#94a1b5] border border-[#2a3344] text-[11px] font-mono font-medium flex items-center gap-1.5"
                title={`Read ${100 - totalChapters} more chapters to unlock the 100+ Chapters badge`}
              >
                <Lock className="w-3 h-3 text-[#5e6b82]" />
                <span>100+ Chapters ({totalChapters}/100)</span>
              </span>
            )}

            {/* Official Supporter Tag */}
            {isSupporter ? (
              <span
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium flex items-center gap-1.5 ${
                  supporterTier.toLowerCase().includes("coffee")
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : supporterTier.toLowerCase().includes("legend") || supporterTier.toLowerCase().includes("patron")
                    ? "bg-slate-200/10 text-slate-200 border border-slate-300/30"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
                title={`Active Official Supporter: ${supporterTier}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Official Supporter ({supporterTier})</span>
              </span>
            ) : (
              <Link
                href="/donate"
                className="px-2.5 py-1 rounded-md bg-[#161a22] text-[#94a1b5] hover:text-white hover:border-[#3d4960] border border-[#2a3344] text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors"
                title="Support MangaPulse maintenance to unlock this official tag"
              >
                <Lock className="w-3 h-3 text-[#5e6b82]" />
                <span>Official Supporter (Unlock)</span>
              </Link>
            )}
          </div>
        </div>

        {/* User Bio */}
        {user?.bio && (
          <div className="py-4 text-xs text-[#94a1b5] max-w-2xl leading-relaxed">
            {user.bio}
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-8">
          <div className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430]">
            <div className="text-[11px] font-medium text-[#94a1b5] uppercase tracking-wider flex items-center justify-between">
              <span>Total Chapters Read</span>
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2 font-mono">
              {totalChapters}
            </div>
            <div className="text-[11px] text-[#5e6b82] mt-1">across all series</div>
          </div>

          <div className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430]">
            <div className="text-[11px] font-medium text-[#94a1b5] uppercase tracking-wider flex items-center justify-between">
              <span>Tracked Series</span>
              <Layers className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2 font-mono">
              {library.length}
            </div>
            <div className="text-[11px] text-[#5e6b82] mt-1">in library</div>
          </div>

          <div className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430]">
            <div className="text-[11px] font-medium text-[#94a1b5] uppercase tracking-wider flex items-center justify-between">
              <span>Mean Rating Given</span>
              <Star className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2 font-mono">
              {averageRating} <span className="text-xs text-[#5e6b82]">/ 10</span>
            </div>
            <div className="text-[11px] text-[#5e6b82] mt-1">{ratedItems.length} series rated</div>
          </div>

          <div className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430]">
            <div className="text-[11px] font-medium text-[#94a1b5] uppercase tracking-wider flex items-center justify-between">
              <span>Custom Collections</span>
              <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2 font-mono">
              {collections.length}
            </div>
            <div className="text-[11px] text-[#5e6b82] mt-1">curated lists</div>
          </div>
        </div>

        {/* Real Functional Achievements & Milestones */}
        <section className="my-10">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                Reader Achievements &amp; Milestones ({achievements.filter((a) => a.unlocked).length}/{achievements.length} Unlocked)
              </h2>
            </div>
            <span className="text-xs text-[#5e6b82] font-mono">Live Sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  ach.unlocked
                    ? "bg-[#13171f] border-[#2a3344] hover:border-[#3d4960]"
                    : "bg-[#0f1218] border-[#1a1f2a] opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        ach.unlocked
                          ? ach.iconBg
                          : "bg-[#161a22] text-[#5e6b82] border border-[#222938]"
                      }`}
                    >
                      {ach.icon}
                    </div>
                    {ach.unlocked ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#5e6b82] bg-[#161a22] border border-[#222938] flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{ach.progressText}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-white mt-3">{ach.title}</h3>
                  <p className="text-[11px] text-[#94a1b5] mt-1 leading-snug line-clamp-2">
                    {ach.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1a1f2a]">
                  <div className="w-full bg-[#1a1f2a] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        ach.unlocked ? ach.barColor : "bg-neutral-600"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, ach.progressPercent))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#5e6b82] mt-1.5">
                    <span>{ach.progressDetail}</span>
                    <span>{Math.round(ach.progressPercent)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Library Status Breakdown */}
        <div className="p-6 rounded-xl bg-[#13171f] border border-[#1e2430] my-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
              Library Breakdown
            </h2>
            <Link
              href="/library"
              className="text-xs text-[#94a1b5] hover:text-white transition-colors"
            >
              View Full Library &rarr;
            </Link>
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-3 rounded-full bg-[#1a1f2a] overflow-hidden flex">
            {library.length > 0 ? (
              <>
                <div
                  style={{ width: `${(readingCount / library.length) * 100}%` }}
                  className="bg-blue-500 h-full"
                  title={`Reading: ${readingCount}`}
                />
                <div
                  style={{ width: `${(planCount / library.length) * 100}%` }}
                  className="bg-amber-500 h-full"
                  title={`Plan to Read: ${planCount}`}
                />
                <div
                  style={{ width: `${(completedCount / library.length) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Completed: ${completedCount}`}
                />
                <div
                  style={{ width: `${(droppedCount / library.length) * 100}%` }}
                  className="bg-rose-500 h-full"
                  title={`Dropped: ${droppedCount}`}
                />
              </>
            ) : (
              <div className="w-full bg-[#1e2430] h-full" />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white font-mono">{readingCount}</div>
                <div className="text-[11px] text-[#94a1b5]">Reading</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white font-mono">{planCount}</div>
                <div className="text-[11px] text-[#94a1b5]">Plan to Read</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white font-mono">{completedCount}</div>
                <div className="text-[11px] text-[#94a1b5]">Completed</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-white font-mono">{droppedCount}</div>
                <div className="text-[11px] text-[#94a1b5]">Dropped</div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Collections Showcase */}
        <section className="my-10">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                Curated Collections ({collections.length})
              </h2>
            </div>
            <Link
              href="/library"
              className="text-xs text-[#94a1b5] hover:text-white transition-colors"
            >
              Manage Lists &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => {
              const count = col.items ? col.items.length : 0;
              return (
                <div
                  key={col.id}
                  className="p-4 rounded-xl bg-[#13171f] border border-[#1e2430] hover:border-[#2a3344] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-sm text-white">{col.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2430] text-[#94a1b5]">
                        {count} titles
                      </span>
                    </div>
                    {col.description && (
                      <p className="text-xs text-[#94a1b5] mt-1.5 line-clamp-2">
                        {col.description}
                      </p>
                    )}
                  </div>

                  {/* Covers Thumbnails */}
                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[#1e2430]">
                    {col.items && col.items.length > 0 ? (
                      col.items.slice(0, 4).map((it) => (
                        <div
                          key={it.id}
                          className="w-10 h-14 rounded overflow-hidden bg-[#0c0e12] border border-[#2a3344]"
                        >
                          <img
                            src={it.manga_cover}
                            alt={it.manga_title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-[#5e6b82] italic py-1">
                        No items added yet
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Highest Rated Series Showcase */}
        {topRatedManga.length > 0 && (
          <section className="my-10">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
                  User Top Rated Series
                </h2>
              </div>
              <span className="text-xs text-[#5e6b82] font-mono">Rated 8.0 or Higher</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {topRatedManga.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-[#13171f] border border-[#1e2430] flex gap-3"
                >
                  <Link
                    href={`/manga/${m.manga_slug}`}
                    className="w-14 h-20 rounded-lg overflow-hidden bg-[#0c0e12] border border-[#2a3344] flex-shrink-0"
                  >
                    <img
                      src={m.manga_cover}
                      alt={m.manga_title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/manga/${m.manga_slug}`}
                        className="font-bold text-xs text-white hover:text-blue-400 truncate block transition-colors"
                      >
                        {m.manga_title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="flex items-center gap-1 font-bold text-amber-400 font-mono">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {m.rating?.toFixed(1)}
                        </span>
                        <span className="text-[#5e6b82]">•</span>
                        <span className="text-[11px] text-[#94a1b5] font-mono">
                          Ch {m.progress_chapter}
                        </span>
                      </div>
                    </div>
                    {m.notes && (
                      <p className="text-[11px] text-[#94a1b5] italic truncate bg-[#0c0e12] p-1 rounded border border-[#1e2430] mt-1">
                        &quot;{m.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#13171f] border border-[#2a3344] rounded-xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">Edit Profile Information</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-[#94a1b5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 mt-4 text-xs">
              {/* Avatar Selector in Modal */}
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

                {/* Preset Avatars */}
                <div className="mt-2.5">
                  <span className="text-[11px] text-[#5e6b82] block mb-1">Manga presets:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {[
                      { name: "Straw Hat", url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80" },
                      { name: "Hunter", url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120&auto=format&fit=crop&q=80" },
                      { name: "Ronin", url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80" },
                      { name: "Cyber", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=80" },
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setEditAvatarUrl(p.url)}
                        className={`w-9 h-9 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          editAvatarUrl === p.url ? "border-blue-500 scale-105" : "border-[#2a3344] opacity-60 hover:opacity-100"
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
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
                  className="px-4 py-2 rounded-lg bg-[#1a1f2a] text-[#94a1b5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
