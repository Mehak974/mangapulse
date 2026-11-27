"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Sliders,
  Bell,
  Target,
  Database,
  Shield,
  Save,
  Check,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  AlertCircle,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserPreferences, UserProfile } from "@/types/manga";
import {
  DEFAULT_PREFERENCES,
  AVATAR_PRESETS,
  COVER_PRESETS,
  getRandomAvatarPreset,
  getRandomCoverPreset,
} from "@/lib/userStore";
import SupporterAvatar from "@/components/SupporterAvatar";

type TabId = "profile" | "preferences" | "goals" | "notifications" | "data" | "account";

export default function SettingsPage() {
  const {
    user,
    isLoggedIn,
    isSupabaseConfigured,
    updateProfile,
    logout,
    deleteAccount,
    library,
    collections,
    requestNotificationPermission,
    setAuthModalOpen,
    setAuthModalMode,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Preferences
  const [defaultView, setDefaultView] = useState<"grid" | "list" | "compact">("grid");
  const [preferredPublisher, setPreferredPublisher] = useState<"all" | "mangaplus" | "viz" | "amazon">("all");
  const [spoilerFilter, setSpoilerFilter] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyGoal, setWeeklyGoal] = useState(15);
  const [cadenceAlerts, setCadenceAlerts] = useState(true);

  // Delete Account State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== "DELETE" || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteAccount();
      if (res.success) {
        setDeleteSuccess(true);
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setDeleteError(res.error || "Failed to delete account. Please try again.");
      }
    } catch (err: any) {
      setDeleteError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Initialize from current user profile
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setAvatarUrl(user.avatar_url || "");
      setBannerUrl(user.banner_url || "");

      const prefs = user.preferences || DEFAULT_PREFERENCES;
      setDefaultView(prefs.defaultView || "grid");
      setPreferredPublisher(prefs.preferredPublisher || "all");
      setSpoilerFilter(prefs.spoilerFilter !== false);
      setPushNotifications(prefs.pushNotifications !== false);
      setWeeklyGoal(prefs.weeklyGoalChapters || user.reading_goal || 15);
      setCadenceAlerts(prefs.cadenceAlerts !== false);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const prefs: UserPreferences = {
        defaultView,
        preferredPublisher,
        spoilerFilter,
        pushNotifications,
        weeklyGoalChapters: Number(weeklyGoal),
        cadenceAlerts,
      };

      // If no avatar or cover is selected, assign random preset
      const finalAvatar = avatarUrl.trim() || getRandomAvatarPreset();
      const finalBanner = bannerUrl.trim() || getRandomCoverPreset();
      setAvatarUrl(finalAvatar);
      setBannerUrl(finalBanner);

      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim() || user?.username,
        bio: bio.trim(),
        location: location.trim(),
        avatar_url: finalAvatar,
        banner_url: finalBanner,
        preferences: prefs,
        reading_goal: Number(weeklyGoal),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Export JSON backup
  const handleExportData = () => {
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      user: {
        username: user?.username,
        email: user?.email,
      },
      library,
      collections,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mangapulse_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.library && Array.isArray(parsed.library)) {
          localStorage.setItem("mangapulse_library", JSON.stringify(parsed.library));
          if (parsed.collections) {
            localStorage.setItem("mangapulse_collections", JSON.stringify(parsed.collections));
          }
          alert(`Successfully imported ${parsed.library.length} manga entries! Page will now reload.`);
          window.location.reload();
        } else {
          alert("Invalid backup file: 'library' array missing.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const navItems = [
    { id: "profile" as TabId, label: "Profile Details", icon: User },
    { id: "preferences" as TabId, label: "Reader Preferences", icon: Sliders },
    { id: "goals" as TabId, label: "Reading Goals", icon: Target },
    { id: "notifications" as TabId, label: "Notifications", icon: Bell },
    { id: "data" as TabId, label: "Data & Export", icon: Database },
    { id: "account" as TabId, label: "Account & Auth", icon: Shield },
  ];

  return (
    <div className="min-w-0 pb-20">
      {/* Header */}
      <div className="bg-[#0c0e12] border-b border-[#1e2430] py-6 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-[#94a1b5] mt-1">
              Configure your profile identity, reading targets, default legal reader priority, and data exports.
            </p>
          </div>

          <Link
            href="/profile"
            className="px-3.5 py-2 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] text-white text-xs font-semibold border border-[#2a3344] self-start sm:self-auto flex items-center gap-2 transition-colors"
          >
            <span>View Public Profile &rarr;</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Navigation Sidebar Tabs */}
          <aside className="w-full md:w-60 flex-shrink-0">
            <div className="space-y-1 bg-[#13171f] p-2 rounded-xl border border-[#1e2430]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#1a1f2a] text-white shadow-sm border border-[#2a3344]"
                        : "text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a]/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-[#5e6b82]"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Status Box */}
            <div className="mt-4 p-4 rounded-xl bg-[#13171f] border border-[#1e2430] text-xs">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Sync Status</span>
              </div>
              <p className="text-[#94a1b5] mt-1.5 leading-relaxed text-[11px]">
                {isLoggedIn
                  ? "Connected to live Supabase PostgreSQL backend."
                  : "Running in local storage mode. Sign in to sync across devices."}
              </p>
            </div>
          </aside>

          {/* Form Content */}
          <div className="flex-1">
            <form onSubmit={handleSave} className="space-y-6">
              {/* TAB 1: PROFILE */}
              {activeTab === "profile" && (
                <div className="p-6 rounded-xl bg-[#13171f] border border-[#1e2430] space-y-5">
                  <div className="pb-3 border-b border-[#1e2430]">
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Public Profile Identity
                    </h2>
                    <p className="text-xs text-[#94a1b5] mt-0.5">
                      Information displayed on your public tracker profile.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#94a1b5] mb-1.5">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Alex Tracker"
                        className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94a1b5] mb-1.5">
                        Username (@handle)
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. reader99"
                        className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Profile Picture Uploader & Presets */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94a1b5] mb-2">
                      Profile Picture (Avatar)
                    </label>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-[#0c0e12] border border-[#2a3344]">
                      {/* Live Avatar Preview */}
                      <SupporterAvatar
                        avatarUrl={avatarUrl}
                        username={username}
                        isSupporter={user?.is_supporter}
                        tier={user?.supporter_tier}
                        size="lg"
                        rounded="xl"
                      />

                      {/* Upload from Disk & URL */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold border border-[#2a3344] transition-colors cursor-pointer flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            <span>Upload Photo from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setAvatarUrl(ev.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl("")}
                              className="text-xs text-red-400 hover:underline px-1"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="Or paste direct image URL (e.g. https://...)"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#13171f] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Avatar Presets Grid */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-[#94a1b5]">
                          Or select a manga avatar preset:
                        </span>
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(getRandomAvatarPreset())}
                          className="text-[11px] font-mono text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Randomize Avatar</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {AVATAR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setAvatarUrl(preset.url)}
                            className={`w-11 h-11 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                              avatarUrl === preset.url
                                ? "border-blue-500 scale-105 shadow-md shadow-blue-500/20"
                                : "border-[#2a3344] opacity-70 hover:opacity-100 hover:border-slate-400"
                            }`}
                            title={preset.name}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Profile Cover Image (Banner) & Presets */}
                  <div>
                    <label className="block text-xs font-semibold text-[#94a1b5] mb-2">
                      Profile Cover Image (Banner)
                    </label>

                    <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#2a3344] space-y-3">
                      {/* Banner Preview */}
                      <div className="relative h-28 sm:h-36 w-full rounded-lg overflow-hidden bg-gradient-to-r from-[#141b26] to-[#1e2430] border border-[#1e2430] flex items-center justify-center">
                        {bannerUrl ? (
                          <>
                            <img src={bannerUrl} alt="Cover preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            <span className="absolute bottom-2 left-3 text-[11px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                              Active Profile Banner
                            </span>
                          </>
                        ) : (
                          <div className="text-center text-[#5e6b82] text-xs font-mono px-4">
                            <span>No cover image selected</span>
                            <span className="block text-[10px] text-[#94a1b5] mt-0.5">
                              (A random scenic anime preset will be assigned automatically on save)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Upload from Disk & URL */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="px-3 py-1.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold border border-[#2a3344] transition-colors cursor-pointer flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            <span>Upload Cover from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    setBannerUrl(ev.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setBannerUrl(getRandomCoverPreset())}
                            className="px-3 py-1.5 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold border border-[#2a3344] transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Randomize Cover</span>
                          </button>

                          {bannerUrl && (
                            <button
                              type="button"
                              onClick={() => setBannerUrl("")}
                              className="text-xs text-red-400 hover:underline px-1 cursor-pointer"
                            >
                              Remove Cover
                            </button>
                          )}
                        </div>

                        <input
                          type="url"
                          value={bannerUrl}
                          onChange={(e) => setBannerUrl(e.target.value)}
                          placeholder="Or paste direct banner image URL (e.g. https://...)"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#13171f] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      {/* Cover Presets Grid */}
                      <div className="pt-2 border-t border-[#1e2430]">
                        <span className="text-[11px] font-mono text-[#94a1b5] block mb-2">
                          Scenic anime cover presets:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {COVER_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setBannerUrl(preset.url)}
                              className={`relative h-14 rounded-lg overflow-hidden border-2 text-left transition-all cursor-pointer group ${
                                bannerUrl === preset.url
                                  ? "border-blue-500 shadow-md shadow-blue-500/20"
                                  : "border-[#2a3344] opacity-70 hover:opacity-100 hover:border-slate-400"
                              }`}
                              title={preset.name}
                            >
                              <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                              <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-mono font-bold text-white truncate drop-shadow">
                                {preset.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94a1b5] mb-1.5">
                      Location / Region
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Tokyo, Japan / Los Angeles, CA"
                      className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94a1b5] mb-1.5">
                      About / Bio
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share your favorite genres, ongoing reads, or recommendations..."
                      className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PREFERENCES */}
              {activeTab === "preferences" && (
                <div className="p-6 rounded-xl bg-[#13171f] border border-[#1e2430] space-y-5">
                  <div className="pb-3 border-b border-[#1e2430]">
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Reader & Store Preferences
                    </h2>
                    <p className="text-xs text-[#94a1b5] mt-0.5">
                      Tune how official reading buttons and library layouts are prioritized.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94a1b5] mb-1.5">
                      Preferred Legal Reader Platform
                    </label>
                    <select
                      value={preferredPublisher}
                      onChange={(e: any) => setPreferredPublisher(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0c0e12] border border-[#2a3344] text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">Show All Legal Options (MANGA Plus, Viz, Amazon)</option>
                      <option value="mangaplus">Prioritize MANGA Plus by Shueisha (Free Simulpub)</option>
                      <option value="viz">Prioritize Viz Media / Shonen Jump</option>
                      <option value="amazon">Prioritize Amazon / Kindle (Physical &amp; E-Book)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94a1b5] mb-1.5">
                      Default Library Display Layout
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["grid", "list", "compact"] as const).map((view) => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setDefaultView(view)}
                          className={`p-3 rounded-lg border text-center font-semibold text-xs capitalize transition-all ${
                            defaultView === view
                              ? "bg-blue-600/10 border-blue-500 text-white"
                              : "bg-[#0c0e12] border-[#2a3344] text-[#94a1b5] hover:text-white"
                          }`}
                        >
                          {view} View
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1e2430] space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-xs font-semibold text-white">Spoiler Protection</div>
                        <div className="text-[11px] text-[#94a1b5]">
                          Obscure chapter synopses and personal notes until hovered.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={spoilerFilter}
                        onChange={(e) => setSpoilerFilter(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#0c0e12] border-[#2a3344] text-blue-600 focus:ring-0"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: READING GOALS */}
              {activeTab === "goals" && (
                <div className="p-6 rounded-xl bg-[#13171f] border border-[#1e2430] space-y-5">
                  <div className="pb-3 border-b border-[#1e2430]">
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Weekly Reading Cadence & Goals
                    </h2>
                    <p className="text-xs text-[#94a1b5] mt-0.5">
                      Track your chapter velocity and maintain a weekly reading streak.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94a1b5] mb-1.5">
                      Weekly Chapter Target
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[10, 15, 25, 50].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setWeeklyGoal(num)}
                          className={`py-3 px-2 rounded-lg border text-center font-mono font-bold text-xs transition-all ${
                            weeklyGoal === num
                              ? "bg-amber-400/10 border-amber-400 text-amber-300"
                              : "bg-[#0c0e12] border-[#2a3344] text-[#94a1b5] hover:text-white"
                          }`}
                        >
                          {num} Ch / Wk
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#0c0e12] border border-[#1e2430] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Simulpub Cadence Alerts</div>
                      <div className="text-[11px] text-[#94a1b5]">
                        Alert me when a weekly Shonen Jump or Sunday drop is about to release.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={cadenceAlerts}
                      onChange={(e) => setCadenceAlerts(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#13171f] border-[#2a3344] text-amber-500 focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="p-6 rounded-xl bg-[#13171f] border border-[#1e2430] space-y-5">
                  <div className="pb-3 border-b border-[#1e2430]">
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Chapter Drop Alerts
                    </h2>
                    <p className="text-xs text-[#94a1b5] mt-0.5">
                      Get real-time alerts when new chapters drop on official platforms.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-[#0c0e12] border border-[#1e2430] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">Browser Push Notifications</div>
                      <div className="text-[11px] text-[#94a1b5]">
                        Receive desktop alerts when countdown timers expire.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => requestNotificationPermission()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                    >
                      Enable in Browser
                    </button>
                  </div>

                  <div className="p-4 rounded-lg bg-[#0c0e12] border border-[#1e2430] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">In-App Notification Bell</div>
                      <div className="text-[11px] text-[#94a1b5]">
                        Show unread badges on the top navigation bar.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#13171f] border-[#2a3344] text-blue-600 focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: DATA MANAGEMENT & EXPORT */}
              {activeTab === "data" && (
                <div className="p-6 rounded-xl bg-[#13171f] border border-[#1e2430] space-y-5">
                  <div className="pb-3 border-b border-[#1e2430]">
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Data Portability & Backup
                    </h2>
                    <p className="text-xs text-[#94a1b5] mt-0.5">
                      Zero vendor lock-in. Export your full library list, ratings, notes, and collections anytime.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430] flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <Download className="w-4 h-4 text-emerald-400" />
                          <span>Export Library JSON</span>
                        </div>
                        <p className="text-[11px] text-[#94a1b5] mt-1.5 leading-relaxed">
                          Download a complete, offline JSON backup containing all your tracked series ({library.length} titles), chapter progress, ratings, and custom collections.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download JSON Backup</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430] flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <Upload className="w-4 h-4 text-blue-400" />
                          <span>Restore From Backup</span>
                        </div>
                        <p className="text-[11px] text-[#94a1b5] mt-1.5 leading-relaxed">
                          Restore your reading list from a previously exported MangaPulse JSON file.
                        </p>
                      </div>
                      <label className="mt-4 w-full py-2 px-3 rounded-lg bg-[#1a1f2a] hover:bg-[#252f40] text-white text-xs font-semibold border border-[#2a3344] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>Select JSON File</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ACCOUNT & AUTH */}
              {activeTab === "account" && (
                <div className="p-6 rounded-xl bg-[#13171f] border border-[#1e2430] space-y-5">
                  <div className="pb-3 border-b border-[#1e2430]">
                    <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Account & Authentication
                    </h2>
                    <p className="text-xs text-[#94a1b5] mt-0.5">
                      Manage your session and linked credentials.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-[#0c0e12] border border-[#1e2430] flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[#94a1b5]">Account Status</div>
                        <div className="font-bold text-white mt-0.5">
                          {isLoggedIn ? user?.email || "Google Authenticated" : "Guest / Local Session"}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {isLoggedIn ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>

                    {!isLoggedIn && (
                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
                        <span>Sign in with Google to enable cloud database sync.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthModalMode("login");
                            setAuthModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
                        >
                          Sign In
                        </button>
                      </div>
                    )}

                    {isLoggedIn && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => logout()}
                          className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out from MangaPulse</span>
                        </button>
                      </div>
                    )}

                    {/* DANGER ZONE: ACCOUNT DELETION */}
                    {isLoggedIn && (
                      <div className="mt-8 pt-6 border-t border-red-500/20 space-y-4">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                            Danger Zone — Account Deletion
                          </h3>
                        </div>

                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white">Permanently Delete Account</div>
                            <p className="text-[11px] text-[#94a1b5] max-w-lg leading-relaxed">
                              Once deleted, your account cannot be recovered. All your saved manga library items, custom collections, reading chapter progress, and notes will be permanently erased.
                            </p>
                          </div>

                          {user?.role === "ADMIN" ||
                          user?.email?.toLowerCase() === "mehakiqbal974@gmail.com" ||
                          user?.email?.toLowerCase() === "mehakiqbal978@gmail.com" ? (
                            <span className="px-3 py-1.5 rounded-lg bg-neutral-800 text-[#717d93] text-[11px] font-semibold border border-neutral-700 whitespace-nowrap">
                              Root Admin Protected
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmText("");
                                setDeleteError(null);
                                setDeleteSuccess(false);
                                setDeleteModalOpen(true);
                              }}
                              className="px-4 py-2 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Account</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sticky / Bottom Save Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-[#1e2430]">
                {savedSuccess ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Settings saved successfully!</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#5e6b82]">
                    Updates take effect immediately on your profile.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0e121a] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Account</h3>
                  <p className="text-xs text-[#94a1b5]">Irreversible permanent deletion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="text-[#94a1b5] hover:text-white p-1 rounded-lg hover:bg-[#1a202c] cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#94a1b5] leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{user?.email || user?.username}</strong>?
              All your tracked manga chapters, custom folders, reading activity, and account data will be permanently wiped from our database.
            </p>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {deleteError}
              </div>
            )}

            {deleteSuccess ? (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold text-center">
                Account deleted successfully. Redirecting to home...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-[#94a1b5] uppercase tracking-wider block">
                    Type <span className="text-red-400 font-bold">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080a0f] border border-[#2a3344] focus:border-red-500 text-white font-mono text-xs outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg bg-[#1a202c] hover:bg-[#252e3e] text-[#94a1b5] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText.trim() !== "DELETE" || isDeleting}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

