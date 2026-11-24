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
  deleteLibraryEntry,
  getUserCollections,
  createCollection as storeCreateCollection,
  deleteCollection as storeDeleteCollection,
  toggleMangaInCollection as storeToggleManga,
  getUserNotifications,
  markNotificationRead as storeMarkRead,
  markAllNotificationsRead as storeMarkAllRead,
  addNotification as storeAddNotification,
  logActivity,
} from "@/lib/userStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;

  // Library
  library: UserLibraryEntry[];
  refreshLibrary: () => Promise<void>;
  updateLibrary: (entry: Omit<UserLibraryEntry, "id" | "created_at" | "updated_at"> & { id?: string }) => Promise<void>;
  removeFromLibrary: (mangaId: number) => Promise<void>;
  incrementChapter: (mangaId: number) => Promise<void>;

  // Collections
  collections: UserCollection[];
  createCollection: (name: string, description?: string) => Promise<void>;
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
    const data = await getUserLibrary(userId);
    setLibrary(data);
  }, []);

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

    // ponytail: localhost testing override for supporter badge
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".localhost"))
    ) {
      const testTier = localStorage.getItem("mangapulse_test_tier") || "supporter";
      if (!existingUser) {
        existingUser = {
          id: "local_tester",
          email: "tester@localhost",
          username: "LocalTester",
          displayName: "Local Tester",
          created_at: new Date().toISOString(),
          is_supporter: true,
          supporter_tier: testTier,
        };
      } else {
        existingUser.is_supporter = true;
        existingUser.supporter_tier = testTier;
      }
      setStoredUser(existingUser);
    }

    if (existingUser) setUser(existingUser);

    // Listen to local testing tier switches
    const handleSupporterSync = () => {
      if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.endsWith(".localhost"))
      ) {
        const testTier = localStorage.getItem("mangapulse_test_tier") || "supporter";
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
            // Fetch verified server-side profile to enforce real supporter status
            let isSupporter = false;
            let supporterTier = "none";
            let bioText: string | null = null;
            let dbUsername: string | null = null;
            let dbAvatar: string | null = null;

            try {
              const { data: profile } = await client
                .from("profiles")
                .select("username, display_name, avatar_url, bio, is_supporter, supporter_tier")
                .eq("id", session.user.id)
                .single();

              if (profile) {
                isSupporter = Boolean(profile.is_supporter);
                supporterTier = profile.supporter_tier || "none";
                bioText = profile.bio || null;
                dbUsername = profile.username || null;
                dbAvatar = profile.avatar_url || null;
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

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url, bio, is_supporter, supporter_tier")
            .eq("id", data.user.id)
            .single();

          if (profile) {
            isSupporter = Boolean(profile.is_supporter);
            supporterTier = profile.supporter_tier || "none";
            bioText = profile.bio || null;
            dbUsername = profile.username || null;
            dbAvatar = profile.avatar_url || null;
          }
        } catch (err) {
          console.warn("Could not fetch server profile on login:", err);
        }

        const u: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          username: dbUsername || data.user.user_metadata?.username || email.split("@")[0],
          avatar_url: dbAvatar || data.user.user_metadata?.avatar_url || null,
          bio: bioText,
          is_supporter: isSupporter,
          supporter_tier: supporterTier,
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
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { username } },
        });
        if (error) return { success: false, error: error.message };

        if (data.user) {
          const u: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            username: username || email.split("@")[0],
            avatar_url: null,
            is_supporter: false,
            supporter_tier: "none",
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
    // Entitlement security: Strip privileged supporter fields so client cannot elevate itself
    const sanitized = { ...updates };
    delete sanitized.is_supporter;
    delete sanitized.supporter_tier;

    const updated = await storeUpdateUserProfile(sanitized);
    if (updated) {
      // Preserve verified supporter status from existing server session
      setUser({
        ...updated,
        is_supporter: user?.is_supporter ?? false,
        supporter_tier: user?.supporter_tier ?? "none",
      });
    }
    return updated;
  };

  /* ── Library Actions ── */
  const updateLibrary = async (
    entry: Omit<UserLibraryEntry, "id" | "created_at" | "updated_at"> & { id?: string }
  ) => {
    await saveLibraryEntry({
      ...entry,
      user_id: user?.id || "guest",
    });
    await refreshLibrary(user?.id);
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
    await refreshLibrary(user?.id);
  };

  /* ── Collections Actions ── */
  const createCollection = async (name: string, description?: string) => {
    await storeCreateCollection(name, description, user?.id);
    await refreshCollections(user?.id);
  };

  const deleteCollection = async (id: string) => {
    await storeDeleteCollection(id, user?.id);
    await refreshCollections(user?.id);
  };

  const toggleInCollection = async (collectionId: string, manga: MangaItem) => {
    const res = await storeToggleManga(collectionId, manga);
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

        library,
        refreshLibrary: () => refreshLibrary(user?.id),
        updateLibrary,
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
