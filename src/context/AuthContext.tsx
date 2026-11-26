"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  UserLibraryEntry,
  UserCollection,
  NotificationItem,
  MangaItem,
  LibraryStatus,
} from "@/types/manga";
import {
  getStoredUser,
  setStoredUser,
  updateUserProfile as storeUpdateUserProfile,
  getUserLibrary,
  saveLibraryEntry,
  saveLibraryBatch,
  deleteLibraryEntry,
  getUserCollections,
  createCollection as storeCreateCollection,
  deleteCollection as storeDeleteCollection,
  toggleMangaInCollection as storeToggleManga,
  getUserNotifications,
  markNotificationRead as storeMarkRead,
  markAllNotificationsRead as storeMarkAllRead,
  addNotification as storeAddNotification,
  getUserActivities,
  logActivity,
  getRandomAvatarPreset,
  getRandomCoverPreset,
} from "@/lib/userStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { slugify } from "@/lib/anilist";
import { getVerifiedSchedule } from "@/lib/mangaScheduleDb";

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  refreshProfile: () => Promise<void>;

  // Library
  library: UserLibraryEntry[];
  refreshLibrary: (userId?: string) => Promise<void>;
  updateLibrary: (
    entry: Omit<UserLibraryEntry, "id" | "user_id" | "created_at" | "updated_at"> & {
      id?: string;
      user_id?: string;
      notes?: string | null;
    }
  ) => Promise<void>;
  importLibraryBatch: (entries: (Omit<UserLibraryEntry, "id" | "created_at" | "updated_at"> & { id?: string })[]) => Promise<UserLibraryEntry[]>;
  removeFromLibrary: (mangaId: number) => Promise<void>;
  incrementChapter: (mangaId: number) => Promise<void>;

  // Collections
  collections: UserCollection[];
  createCollection: (name: string, description?: string) => Promise<UserCollection>;
  deleteCollection: (id: string) => Promise<void>;
  toggleInCollection: (collectionId: string, manga: MangaItem) => Promise<boolean>;

  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  requestNotificationPermission: () => Promise<boolean>;

  // Modals state
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: "login" | "signup";
  setAuthModalMode: (mode: "login" | "signup") => void;

  collectionPickerOpen: boolean;
  setCollectionPickerOpen: (open: boolean) => void;
  selectedMangaForCollection: MangaItem | null;
  openCollectionPicker: (manga: MangaItem) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [library, setLibrary] = useState<UserLibraryEntry[]>([]);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [selectedMangaForCollection, setSelectedMangaForCollection] = useState<MangaItem | null>(null);

  const refreshLibrary = useCallback(async (userId?: string) => {
    const targetId = userId ?? user?.id;
    const data = await getUserLibrary(targetId);

    // Auto-reconcile stale total_chapters in library entries using authoritative verified database
    let hasReconciled = false;
    const reconciled = (data || []).map((entry) => {
      const verified = getVerifiedSchedule(entry.manga_id, entry.manga_title, undefined, entry.total_chapters || undefined);
      const verifiedTotal = verified.isVerifiedInDb ? (verified.totalChapters || verified.latestChapter) : null;
      if (verifiedTotal && (!entry.total_chapters || entry.total_chapters < verifiedTotal)) {
        hasReconciled = true;
        return {
          ...entry,
          total_chapters: verifiedTotal,
        };
      }
      return entry;
    });

    if (hasReconciled && typeof window !== "undefined") {
      saveLibraryBatch(reconciled, targetId).catch(() => {});
    }

    setLibrary(reconciled);

    // If there is library progress, ensure activity log has entries so Heatmap, Streak & Weekly Goal register
    if (typeof window !== "undefined" && reconciled && reconciled.length > 0) {
      try {
        const existingActs = getUserActivities(500);
        const hasAnyReadActivity = existingActs.some((a) => a.action_type === "read_chapter");
        if (!hasAnyReadActivity) {
          reconciled.forEach((entry) => {
            if ((entry.progress_chapter || 0) > 0) {
              logActivity({
                manga_id: entry.manga_id,
                manga_title: entry.manga_title,
                manga_slug: entry.manga_slug,
                manga_cover: entry.manga_cover || "",
                action_type: "read_chapter",
                chapter_number: entry.progress_chapter,
                chapters_count: entry.progress_chapter,
              });
            }
          });
        }
      } catch { }
    }
  }, [user?.id]);

  const refreshCollections = useCallback(async (userId?: string) => {
    const data = await getUserCollections(userId);
    setCollections(data);
  }, []);

  const refreshNotifications = useCallback(async (userId?: string) => {
    const data = await getUserNotifications(userId);
    setNotifications(data);
  }, []);

  // Initial load from storage and Supabase session
  useEffect(() => {
    let existingUser = getStoredUser();

    // Dev-only testing override for supporter badge on local environment
    if (
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".localhost"))
    ) {
      const testTier = localStorage.getItem("mangapulse_test_tier") || "legend";
      if (!existingUser) {
        existingUser = {
          id: "local_tester",
          email: "tester@localhost",
          username: "LocalTester",
          displayName: "Local Tester",
          created_at: new Date().toISOString(),
          is_supporter: true,
          supporter_tier: testTier,
          avatar_url: getRandomAvatarPreset(),
          banner_url: getRandomCoverPreset(),
        };
      } else {
        existingUser.is_supporter = true;
        existingUser.supporter_tier = testTier;
        if (!existingUser.avatar_url) existingUser.avatar_url = getRandomAvatarPreset();
        if (!existingUser.banner_url) existingUser.banner_url = getRandomCoverPreset();
      }
      setStoredUser(existingUser);
    } else if (existingUser) {
      let changed = false;
      if (!existingUser.avatar_url) {
        existingUser.avatar_url = getRandomAvatarPreset();
        changed = true;
      }
      if (!existingUser.banner_url) {
        existingUser.banner_url = getRandomCoverPreset();
        changed = true;
      }
      if (changed) setStoredUser(existingUser);
    }

    if (existingUser) setUser(existingUser);

    // Listen to local testing tier switches
    const handleSupporterSync = () => {
      if (
        process.env.NODE_ENV !== "production" &&
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.endsWith(".localhost"))
      ) {
        const testTier = localStorage.getItem("mangapulse_test_tier") || "legend";
        setUser((prev) => (prev ? { ...prev, is_supporter: true, supporter_tier: testTier } : prev));
      }
    };
    window.addEventListener("mangapulse-supporter-updated", handleSupporterSync);

    async function loadAll() {
      const [libData, colData, notifData] = await Promise.all([
        getUserLibrary(existingUser?.id),
        getUserCollections(existingUser?.id),
        getUserNotifications(existingUser?.id),
      ]);
      setLibrary(libData);
      setCollections(colData);
      setNotifications(notifData);
    }

    loadAll();

    // Listen to real Supabase auth state change (e.g. returning from Google OAuth redirect)
    if (supabase) {
      const client = supabase;
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            // Fetch verified server-side profile to enforce real supporter status & private settings
            let isSupporter = false;
            let supporterTier = "none";
            let bioText: string | null = null;
            let dbUsername: string | null = null;
            let dbAvatar: string | null = null;
            let isPrivateProfile = false;
            let linkedKofiEmail: string | null = null;
            let userRole: any = "USER";
            let isBanned = false;
            let isShadowBanned = false;
            let banReason: string | null = null;

            try {
              const [{ data: profile }, { data: privSettings }] = await Promise.all([
                client
                  .from("profiles")
                  .select("username, display_name, avatar_url, bio, is_supporter, supporter_tier, is_private, role, is_banned, is_shadow_banned, ban_reason")
                  .eq("id", session.user.id)
                  .single(),
                client
                  .from("user_private_settings")
                  .select("kofi_email")
                  .eq("user_id", session.user.id)
                  .maybeSingle(),
              ]);

              if (profile) {
                isSupporter = Boolean(profile.is_supporter);
                supporterTier = profile.supporter_tier || "none";
                bioText = profile.bio || null;
                dbUsername = profile.username || null;
                dbAvatar = profile.avatar_url || null;
                isPrivateProfile = Boolean(profile.is_private);
                userRole = profile.role || "USER";
                isBanned = Boolean(profile.is_banned);
                isShadowBanned = Boolean(profile.is_shadow_banned);
                banReason = profile.ban_reason || null;
              }

              if (
                session.user.email?.toLowerCase() === "mehakiqbal974@gmail.com" ||
                session.user.email?.toLowerCase() === "mehakiqbal978@gmail.com" ||
                userRole === "ADMIN"
              ) {
                userRole = "ADMIN";
                isSupporter = true;
                supporterTier = "patron";
              }

              if (privSettings?.kofi_email) {
                linkedKofiEmail = privSettings.kofi_email;
              }

              // Auto-claim any pending payments if confirmed email matches
              if (session.user.email_confirmed_at && session.user.email) {
                await client.rpc("claim_unclaimed_kofi_payments", {
                  target_user_id: session.user.id,
                  user_email: session.user.email.toLowerCase(),
                });
              }

              // Send background login telemetry
              if (session.access_token) {
                fetch("/api/auth/telemetry", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${session.access_token}` },
                }).catch(() => { });
              }
            } catch (err) {
              console.warn("Could not fetch server profile:", err);
            }

            const meta = session.user.user_metadata || {};

            const u: UserProfile = {
              id: session.user.id,
              email: session.user.email || "",
              username: dbUsername || meta.full_name || meta.name || meta.user_name || session.user.email?.split("@")[0] || "Reader",
              avatar_url: dbAvatar || meta.avatar_url || meta.picture || null,
              bio: bioText,
              is_supporter: isSupporter,
              supporter_tier: supporterTier,
              is_private: isPrivateProfile,
              kofi_email: linkedKofiEmail,
              role: userRole,
              is_banned: isBanned,
              is_shadow_banned: isShadowBanned,
              ban_reason: banReason,
              created_at: session.user.created_at,
            };
            setUser(u);
            setStoredUser(u);
            await Promise.all([
              refreshLibrary(u.id),
              refreshCollections(u.id),
              refreshNotifications(u.id),
            ]);
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            setStoredUser(null);
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, [refreshLibrary, refreshCollections, refreshNotifications]);

  /* ── Auth Actions ── */
  const login = async (email: string, pass: string) => {
    try {
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) return { success: false, error: error.message };

        // Fetch verified profile from Supabase
        let isSupporter = false;
        let supporterTier = "none";
        let bioText: string | null = null;
        let dbUsername: string | null = null;
        let dbAvatar: string | null = null;
        let userRole: any = "USER";

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url, bio, is_supporter, supporter_tier, role, is_banned, ban_reason")
            .eq("id", data.user.id)
            .single();

          if (profile) {
            if (profile.is_banned) {
              await supabase.auth.signOut();
              return {
                success: false,
                error: `Your account has been suspended: ${profile.ban_reason || "Violation of Community Guidelines"}`,
              };
            }
            isSupporter = Boolean(profile.is_supporter);
            supporterTier = profile.supporter_tier || "none";
            bioText = profile.bio || null;
            dbUsername = profile.username || null;
            dbAvatar = profile.avatar_url || null;
            userRole = profile.role || "USER";
          }
        } catch (err) {
          console.warn("Could not fetch server profile on login:", err);
        }

        if (
          data.user.email?.toLowerCase() === "mehakiqbal974@gmail.com" ||
          data.user.email?.toLowerCase() === "mehakiqbal978@gmail.com" ||
          userRole === "ADMIN"
        ) {
          userRole = "ADMIN";
          isSupporter = true;
          supporterTier = "patron";
        }

        const u: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          username: dbUsername || data.user.user_metadata?.username || email.split("@")[0],
          avatar_url: dbAvatar || data.user.user_metadata?.avatar_url || null,
          bio: bioText,
          is_supporter: isSupporter,
          supporter_tier: supporterTier,
          role: userRole,
          created_at: data.user.created_at,
        };
        setUser(u);
        setStoredUser(u);
        await Promise.all([refreshLibrary(u.id), refreshCollections(u.id), refreshNotifications(u.id)]);
        return { success: true };
      }

      // Hard-disable fake offline login bypass
      return {
        success: false,
        error: "Supabase authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to log in.",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to log in" };
    }
  };

  const signup = async (email: string, pass: string, username: string) => {
    try {
      const RESERVED = ["admin", "staff", "mangapulse", "moderator", "mod", "system", "support"];
      const checkName = (username || "").toLowerCase().trim();
      if (RESERVED.some((r) => checkName === r || checkName.includes(r))) {
        return { success: false, error: "Username contains reserved staff keywords." };
      }

      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { username } },
        });
        if (error) return { success: false, error: error.message };

        if (data.user) {
          const isAdminEmail =
            data.user.email?.toLowerCase() === "mehakiqbal974@gmail.com" ||
            data.user.email?.toLowerCase() === "mehakiqbal978@gmail.com";

          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            username: username || email.split("@")[0],
            avatar_url: null,
            role: isAdminEmail ? "ADMIN" : "USER",
            is_supporter: isAdminEmail,
            supporter_tier: isAdminEmail ? "patron" : "none",
            created_at: data.user.created_at,
          };
          setUser(u);
          setStoredUser(u);
          return { success: true };
        }
      }

      // Hard-disable fake offline signup bypass
      return {
        success: false,
        error: "Supabase authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to register.",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign up" };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase || !isSupabaseConfigured) {
      // In local mode without Supabase credentials, provide clean simulation or guide
      return {
        success: false,
        error: "Supabase credentials required. Please provide your Supabase URL & Anon Key in .env.local to enable live Google OAuth.",
      };
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Google sign-in error" };
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setStoredUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    // Entitlement security: Strip privileged supporter and role fields so client cannot elevate itself
    const sanitized = { ...updates };
    delete sanitized.is_supporter;
    delete sanitized.supporter_tier;
    delete sanitized.role;
    delete sanitized.is_banned;
    delete sanitized.is_shadow_banned;
    delete sanitized.ban_reason;

    if (sanitized.username) {
      const RESERVED = ["admin", "staff", "mangapulse", "moderator", "mod", "system", "support"];
      const checkName = sanitized.username.toLowerCase().trim();
      if (user?.role !== "ADMIN" && RESERVED.some((r) => checkName === r || checkName.includes(r))) {
        throw new Error("Username contains reserved staff keywords.");
      }
    }

    const updated = await storeUpdateUserProfile(sanitized);
    if (updated) {
      // Preserve verified supporter & role status from existing server session
      setUser({
        ...updated,
        is_supporter: user?.is_supporter ?? false,
        supporter_tier: user?.supporter_tier ?? "none",
        role: user?.role ?? "USER",
      });
    }
    return updated;
  };

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url, bio, is_supporter, supporter_tier, is_private, role, is_banned, is_shadow_banned, ban_reason")
          .eq("id", session.user.id)
          .single();

        let userRole = profile?.role || "USER";
        let isSupporter = profile ? Boolean(profile.is_supporter) : false;
        let supporterTier = profile?.supporter_tier || "none";

        if (
          session.user.email?.toLowerCase() === "mehakiqbal974@gmail.com" ||
          session.user.email?.toLowerCase() === "mehakiqbal978@gmail.com" ||
          userRole === "ADMIN"
        ) {
          userRole = "ADMIN";
          isSupporter = true;
          supporterTier = "patron";
        }

        setUser((prev) => {
          if (!prev) return prev;
          const updated: UserProfile = {
            ...prev,
            role: userRole as any,
            is_supporter: isSupporter,
            supporter_tier: supporterTier,
          };
          setStoredUser(updated);
          return updated;
        });
      }
    } catch (err) {
      console.warn("Could not refresh profile:", err);
    }
  }, []);

  /* ── Library Actions ── */
  const updateLibrary = async (
    entry: Omit<UserLibraryEntry, "id" | "user_id" | "created_at" | "updated_at"> & {
      id?: string;
      user_id?: string;
      notes?: string | null;
    }
  ) => {
    const prev = library.find((it) => it.manga_id === entry.manga_id);
    const prevChapter = prev?.progress_chapter || 0;
    const newChapter = entry.progress_chapter || 0;
    const delta = newChapter - prevChapter;

    await saveLibraryEntry({
      ...entry,
      notes: entry.notes ?? null,
      user_id: entry.user_id || user?.id || "guest",
    });

    // Automatically record reading activity for heatmap, streaks & weekly goal
    if (newChapter > 0 && newChapter !== prevChapter) {
      logActivity({
        manga_id: entry.manga_id,
        manga_title: entry.manga_title,
        manga_slug: entry.manga_slug,
        manga_cover: entry.manga_cover || "",
        action_type: "read_chapter",
        chapter_number: newChapter,
        chapters_count: Math.max(1, delta > 0 ? delta : 1),
      });
    }

    await refreshLibrary(user?.id);
  };

  const importLibraryBatch = async (
    entries: (Omit<UserLibraryEntry, "id" | "created_at" | "updated_at"> & { id?: string })[]
  ) => {
    const updated = await saveLibraryBatch(entries, user?.id);
    setLibrary(updated);
    return updated;
  };

  const removeFromLibrary = async (mangaId: number) => {
    await deleteLibraryEntry(mangaId, user?.id);
    await refreshLibrary(user?.id);
  };

  const incrementChapter = async (mangaId: number) => {
    const match = library.find((it) => it.manga_id === mangaId);
    if (!match) return;
    const nextChapter = match.progress_chapter + 1;
    await saveLibraryEntry({
      ...match,
      progress_chapter: nextChapter,
    });
    logActivity({
      manga_id: match.manga_id,
      manga_title: match.manga_title,
      manga_slug: match.manga_slug,
      manga_cover: match.manga_cover || "",
      action_type: "read_chapter",
      chapter_number: nextChapter,
      chapters_count: 1,
    });
    await refreshLibrary(user?.id);
  };

  /* ── Collections Actions ── */
  const createCollection = async (name: string, description?: string): Promise<UserCollection> => {
    const col = await storeCreateCollection(name, description, user?.id);
    await refreshCollections(user?.id);
    return col;
  };

  const deleteCollection = async (id: string) => {
    await storeDeleteCollection(id, user?.id);
    await refreshCollections(user?.id);
  };

  const toggleInCollection = async (collectionId: string, manga: MangaItem) => {
    const mangaId = Number(manga.id);
    const mangaSlug =
      manga.slug ||
      (manga as any).manga_slug ||
      slugify(manga.displayTitle || (manga as any).title?.userPreferred || (manga as any).title?.english || "manga");
    const mangaTitle =
      manga.displayTitle ||
      manga.title?.userPreferred ||
      manga.title?.english ||
      manga.title?.romaji ||
      (manga as any).manga_title ||
      "Untitled Manga";
    const coverUrl =
      "cover" in (manga as any)
        ? (manga as any).cover
        : manga.coverImage?.extraLarge ||
        manga.coverImage?.large ||
        manga.coverImage?.medium ||
        (manga as any).manga_cover ||
        "";

    // Check if adding or removing
    const targetCol = collections.find((c) => c.id === collectionId);
    const isAdding = !(targetCol?.items || []).some(
      (it) => String(it.manga_id) === String(mangaId)
    );

    // Optimistic UI update so checkmark changes instantaneously
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id !== collectionId) return col;
        const items = col.items || [];
        const exists = items.some((it) => String(it.manga_id) === String(mangaId));
        return {
          ...col,
          items: exists
            ? items.filter((it) => String(it.manga_id) !== String(mangaId))
            : [
              ...items,
              {
                id: `ci-${Date.now()}`,
                collection_id: collectionId,
                manga_id: mangaId,
                manga_slug: mangaSlug,
                manga_title: mangaTitle,
                manga_cover: coverUrl,
                added_at: new Date().toISOString(),
              },
            ],
        };
      })
    );

    // If adding to collection and not already in library, also auto-register in library
    // as "plan_to_read" so it immediately surfaces on Dashboard and Library views!
    if (isAdding) {
      const inLibrary = library.some((l) => Number(l.manga_id) === mangaId);
      if (!inLibrary) {
        const verified = getVerifiedSchedule(mangaId, mangaTitle, undefined, manga.chapters || undefined);
        const resolvedTotal = verified.isVerifiedInDb ? (verified.totalChapters || verified.latestChapter) : (manga.chapters || null);
        await updateLibrary({
          manga_id: mangaId,
          manga_slug: mangaSlug,
          manga_title: mangaTitle,
          manga_cover: coverUrl,
          status: "plan_to_read",
          progress_chapter: 0,
          total_chapters: resolvedTotal,
          rating: null,
          notes: null,
        });
      }
    }

    const res = await storeToggleManga(collectionId, manga, user?.id);
    await refreshCollections(user?.id);
    return res;
  };

  const openCollectionPicker = (manga: MangaItem) => {
    setSelectedMangaForCollection(manga);
    setCollectionPickerOpen(true);
  };

  /* ── Notification Actions ── */
  const markAsRead = (id: string) => {
    storeMarkRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    storeMarkAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("MangaPulse Notifications Active", {
          body: "You will now receive alerts when your tracked manga chapters release!",
          icon: "/icon-192.png",
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        isSupabaseConfigured,
        login,
        signup,
        signInWithGoogle,
        logout,
        updateProfile,
        refreshProfile,

        library,
        refreshLibrary: (uid?: string) => refreshLibrary(uid ?? user?.id),
        updateLibrary,
        importLibraryBatch,
        removeFromLibrary,
        incrementChapter,

        collections,
        createCollection,
        deleteCollection,
        toggleInCollection,

        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        requestNotificationPermission,

        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,

        collectionPickerOpen,
        setCollectionPickerOpen,
        selectedMangaForCollection,
        openCollectionPicker,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
