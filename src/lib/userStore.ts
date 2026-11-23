import {
  UserProfile,
  UserLibraryEntry,
  UserCollection,
  CollectionManga,
  NotificationItem,
  MangaItem,
  LibraryStatus,
  UserPreferences,
  ActivityItem,
} from "@/types/manga";
import { supabase } from "./supabase";

const STORAGE_KEYS = {
  USER: "mangapulse_user",
  LIBRARY: "mangapulse_library",
  COLLECTIONS: "mangapulse_collections",
  NOTIFICATIONS: "mangapulse_notifications",
  ACTIVITIES: "mangapulse_activities",
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultView: "grid",
  preferredPublisher: "all",
  spoilerFilter: true,
  pushNotifications: true,
  weeklyGoalChapters: 15,
  cadenceAlerts: true,
};

// Safe LocalStorage helpers
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

// Default collections when a new user starts
const DEFAULT_COLLECTIONS: UserCollection[] = [
  {
    id: "col-favorites",
    user_id: "local",
    name: "Favorites",
    description: "All-time favorite manga & manhwa series",
    is_private: false,
    created_at: new Date().toISOString(),
    items: [],
  },
  {
    id: "col-peak",
    user_id: "local",
    name: "Peak Fiction",
    description: "Masterpiece writing and god-tier artwork",
    is_private: false,
    created_at: new Date().toISOString(),
    items: [],
  },
  {
    id: "col-plan",
    user_id: "local",
    name: "Plan to Read",
    description: "Series recommended by friends and community",
    is_private: false,
    created_at: new Date().toISOString(),
    items: [],
  },
];

// Initial seeded notifications for realistic experience
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    user_id: "local",
    manga_id: 30013,
    title: "One Piece Chapter 1135 Release",
    message: "Chapter 1135 is scheduled to release this Sunday at 15:00 UTC on MANGA Plus.",
    url: "/release-date/one-piece-30013",
    is_read: false,
    type: "countdown",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-2",
    user_id: "local",
    manga_id: 105778,
    title: "Chainsaw Man Chapter 192",
    message: "New chapter drops Tuesday at 15:00 UTC on Shonen Jump+ & MANGA Plus.",
    url: "/release-date/chainsaw-man-105778",
    is_read: false,
    type: "release",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "notif-3",
    user_id: "local",
    manga_id: null,
    title: "Welcome to MangaPulse!",
    message: "Create custom collections, track reading chapters, and get release countdowns.",
    url: "/#schedule",
    is_read: true,
    type: "system",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

/* ────────────────────────── AUTH / USER ────────────────────────── */

export function getStoredUser(): UserProfile | null {
  return getLocal<UserProfile | null>(STORAGE_KEYS.USER, null);
}

export function setStoredUser(user: UserProfile | null): void {
  if (user) setLocal(STORAGE_KEYS.USER, user);
  else if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEYS.USER);
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
  const current = getStoredUser();
  if (!current) return null;

  const merged: UserProfile = {
    ...current,
    ...updates,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(current.preferences || {}),
      ...(updates.preferences || {}),
    },
  };

  setStoredUser(merged);

  if (supabase && current.id && current.id !== "guest" && !current.id.startsWith("usr-")) {
    try {
      await supabase.from("profiles").upsert({
        id: current.id,
        username: merged.username,
        display_name: merged.displayName || null,
        avatar_url: merged.avatar_url || null,
        bio: merged.bio || null,
        preferences: merged.preferences,
        reading_goal: merged.reading_goal || 15,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Failed to sync profile update to Supabase:", err);
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mangapulse-profile-updated"));
  }

  return merged;
}

/* ────────────────────────── LIBRARY ────────────────────────── */

export async function getUserLibrary(userId?: string): Promise<UserLibraryEntry[]> {
  if (supabase && userId && userId !== "guest") {
    try {
      const { data, error } = await supabase
        .from("user_manga_library")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!error && data) return data as UserLibraryEntry[];
    } catch (e) {
      console.warn("Supabase library fetch error:", e);
    }
  }
  return getLocal<UserLibraryEntry[]>(STORAGE_KEYS.LIBRARY, []);
}

export async function saveLibraryEntry(
  entry: Omit<UserLibraryEntry, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<UserLibraryEntry> {
  const now = new Date().toISOString();

  if (supabase && entry.user_id && entry.user_id !== "guest") {
    try {
      const { data, error } = await supabase
        .from("user_manga_library")
        .upsert(
          { ...entry, updated_at: now },
          { onConflict: "user_id,manga_id" }
        )
        .select()
        .single();

      if (!error && data) return data as UserLibraryEntry;
    } catch (e) {
      console.warn("Supabase library upsert error:", e);
    }
  }

  const list = getLocal<UserLibraryEntry[]>(STORAGE_KEYS.LIBRARY, []);
  const idx = list.findIndex((it) => it.manga_id === entry.manga_id);

  const full: UserLibraryEntry = {
    id: entry.id || `local-lib-${entry.manga_id}`,
    user_id: entry.user_id || "guest",
    manga_id: entry.manga_id,
    manga_slug: entry.manga_slug,
    manga_title: entry.manga_title,
    manga_cover: entry.manga_cover,
    status: entry.status,
    progress_chapter: entry.progress_chapter,
    total_chapters: entry.total_chapters,
    rating: entry.rating,
    notes: entry.notes,
    created_at: idx >= 0 ? list[idx].created_at : now,
    updated_at: now,
  };

  if (idx >= 0) list[idx] = full;
  else list.unshift(full);

  setLocal(STORAGE_KEYS.LIBRARY, list);
  return full;
}

export async function deleteLibraryEntry(mangaId: number, userId?: string): Promise<void> {
  if (supabase && userId && userId !== "guest") {
    try {
      await supabase
        .from("user_manga_library")
        .delete()
        .eq("user_id", userId)
        .eq("manga_id", mangaId);
    } catch (e) {
      console.warn("Supabase delete error:", e);
    }
  }

  const list = getLocal<UserLibraryEntry[]>(STORAGE_KEYS.LIBRARY, []).filter(
    (it) => it.manga_id !== mangaId
  );
  setLocal(STORAGE_KEYS.LIBRARY, list);
}

/* ────────────────────────── COLLECTIONS ────────────────────────── */

export async function getUserCollections(userId?: string): Promise<UserCollection[]> {
  if (supabase && userId && userId !== "guest") {
    try {
      const { data, error } = await supabase
        .from("user_collections")
        .select("*, items:collection_manga(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) return data as UserCollection[];
    } catch (e) {
      console.warn("Supabase collections fetch error:", e);
    }
  }

  return getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
}

export async function createCollection(
  name: string,
  description?: string,
  userId = "guest"
): Promise<UserCollection> {
  const newCol: UserCollection = {
    id: `col-${Date.now()}`,
    user_id: userId,
    name: name.trim(),
    description: description?.trim() || null,
    is_private: false,
    created_at: new Date().toISOString(),
    items: [],
  };

  if (supabase && userId !== "guest") {
    try {
      const { data, error } = await supabase
        .from("user_collections")
        .insert({
          user_id: userId,
          name: newCol.name,
          description: newCol.description,
          is_private: false,
        })
        .select()
        .single();

      if (!error && data) return { ...data, items: [] };
    } catch (e) {
      console.warn("Supabase create collection error:", e);
    }
  }

  const list = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
  list.unshift(newCol);
  setLocal(STORAGE_KEYS.COLLECTIONS, list);
  return newCol;
}

export async function deleteCollection(collectionId: string, userId = "guest"): Promise<void> {
  if (supabase && userId !== "guest") {
    try {
      await supabase
        .from("user_collections")
        .delete()
        .eq("id", collectionId)
        .eq("user_id", userId);
    } catch (e) {
      console.warn("Supabase delete collection error:", e);
    }
  }

  const list = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS).filter(
    (c) => c.id !== collectionId
  );
  setLocal(STORAGE_KEYS.COLLECTIONS, list);
}

export async function toggleMangaInCollection(
  collectionId: string,
  manga: MangaItem | { id: number; slug: string; displayTitle: string; cover: string }
): Promise<boolean> {
  const list = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
  const targetCol = list.find((c) => c.id === collectionId);
  if (!targetCol) return false;

  targetCol.items = targetCol.items || [];
  const existingIdx = targetCol.items.findIndex((it) => it.manga_id === manga.id);

  let added = false;
  if (existingIdx >= 0) {
    targetCol.items.splice(existingIdx, 1);
    added = false;
  } else {
    const coverUrl =
      "cover" in manga
        ? manga.cover
        : manga.coverImage.extraLarge ||
          manga.coverImage.large ||
          manga.coverImage.medium ||
          "";

    targetCol.items.push({
      id: `ci-${Date.now()}`,
      collection_id: collectionId,
      manga_id: manga.id,
      manga_slug: manga.slug,
      manga_title: manga.displayTitle,
      manga_cover: coverUrl,
      added_at: new Date().toISOString(),
    });
    added = true;
  }

  setLocal(STORAGE_KEYS.COLLECTIONS, list);
  return added;
}

/* ────────────────────────── NOTIFICATIONS ────────────────────────── */

export async function getUserNotifications(userId?: string): Promise<NotificationItem[]> {
  return getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
}

export function markNotificationRead(id: string): void {
  const list = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const item = list.find((n) => n.id === id);
  if (item) {
    item.is_read = true;
    setLocal(STORAGE_KEYS.NOTIFICATIONS, list);
  }
}

export function markAllNotificationsRead(): void {
  const list = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  list.forEach((n) => (n.is_read = true));
  setLocal(STORAGE_KEYS.NOTIFICATIONS, list);
}

export function addNotification(
  title: string,
  message: string,
  url?: string,
  mangaId?: number
): NotificationItem {
  const list = getLocal<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  const item: NotificationItem = {
    id: `notif-${Date.now()}`,
    user_id: "local",
    manga_id: mangaId || null,
    title,
    message,
    url: url || null,
    is_read: false,
    type: "release",
    created_at: new Date().toISOString(),
  };
  list.unshift(item);
  setLocal(STORAGE_KEYS.NOTIFICATIONS, list);
  return item;
}

/* ────────────────────────── ACTIVITIES ────────────────────────── */

export function getUserActivities(limit = 20): ActivityItem[] {
  const list = getLocal<ActivityItem[]>(STORAGE_KEYS.ACTIVITIES, []);
  if (list.length === 0) {
    // Seed initial demo activities for a lively experience
    return [
      {
        id: "act-init-1",
        manga_id: 30013,
        manga_title: "One Piece",
        manga_slug: "one-piece",
        manga_cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-ulvx9q4Sg1ba.jpg",
        action_type: "read_chapter",
        chapter_number: 1120,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "act-init-2",
        manga_id: 105778,
        manga_title: "Chainsaw Man",
        manga_slug: "chainsaw-man",
        manga_cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-FdzPn3S1t0rB.jpg",
        action_type: "status_change",
        new_status: "reading",
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "act-init-3",
        manga_id: 101517,
        manga_title: "Jujutsu Kaisen",
        manga_slug: "jujutsu-kaisen",
        manga_cover: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-76bUvW7vLz1B.jpg",
        action_type: "rated",
        rating: 9.5,
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ];
  }
  return list.slice(0, limit);
}

export function logActivity(activity: Omit<ActivityItem, "id" | "timestamp">): void {
  const list = getLocal<ActivityItem[]>(STORAGE_KEYS.ACTIVITIES, []);
  const item: ActivityItem = {
    ...activity,
    manga_cover: activity.manga_cover || "/placeholder-cover.png",
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  list.unshift(item);
  if (list.length > 50) list.length = 50;
  setLocal(STORAGE_KEYS.ACTIVITIES, list);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mangapulse-activity-logged"));
  }
}

