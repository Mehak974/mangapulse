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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultView: "grid",
  preferredPublisher: "all",
  spoilerFilter: true,
  pushNotifications: true,
  weeklyGoalChapters: 15,
  cadenceAlerts: true,
  is_private: false,
};

export interface VisualPreset {
  id: string;
  name: string;
  url: string;
}

export const AVATAR_PRESETS: VisualPreset[] = [
  {
    id: "avatar-kenmei",
    name: "Kenmei Protagonist",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "avatar-ronin",
    name: "Cyber Ronin",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "avatar-paladin",
    name: "Solar Paladin",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "avatar-mage",
    name: "Twilight Mage",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "avatar-shadow",
    name: "Shadow Hunter",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "avatar-starlight",
    name: "Starlight Dreamer",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop",
  },
];

export const COVER_PRESETS: VisualPreset[] = [
  {
    id: "cover-sunset",
    name: "Kenmei Sunset Twilight",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "cover-cyberpunk",
    name: "Tokyo Cyberpunk Neon",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "cover-sakura",
    name: "Sakura Blossom Evening",
    url: "https://images.unsplash.com/photo-1528164344705-475426879c0d?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "cover-galaxy",
    name: "Midnight Nebula Cosmic",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "cover-golden",
    name: "Golden Dawn Horizon",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "cover-aurora",
    name: "Platinum Starlight Aurora",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
  },
];

export function getRandomAvatarPreset(): string {
  const idx = Math.floor(Math.random() * AVATAR_PRESETS.length);
  return AVATAR_PRESETS[idx].url;
}

export function getRandomCoverPreset(): string {
  const idx = Math.floor(Math.random() * COVER_PRESETS.length);
  return COVER_PRESETS[idx].url;
}

// Safe LocalStorage helpers
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw && key === STORAGE_KEYS.LIBRARY) {
      const legacy = localStorage.getItem("mangareader_library_v1") || localStorage.getItem("mangapulse_user_library");
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(key, legacy);
            return parsed as T;
          }
        } catch {}
      }
    }
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
    is_private: updates.is_private !== undefined ? updates.is_private : current.is_private,
    kofi_email: updates.kofi_email !== undefined ? updates.kofi_email : current.kofi_email,
  };

  setStoredUser(merged);

  if (supabase && current.id && current.id !== "guest" && !current.id.startsWith("usr-")) {
    try {
      // 1. Update public profile (Zero kofi_email leakage)
      await supabase.from("profiles").upsert({
        id: current.id,
        username: merged.username,
        display_name: merged.displayName || null,
        avatar_url: merged.avatar_url || null,
        bio: merged.bio || null,
        is_private: merged.is_private ?? false,
        preferences: merged.preferences,
        reading_goal: merged.reading_goal || 15,
        updated_at: new Date().toISOString(),
      });

      // 2. Update private settings table for sensitive kofi_email with unique check
      if (updates.kofi_email !== undefined) {
        const cleanEmail = updates.kofi_email ? updates.kofi_email.trim().toLowerCase() : null;
        const { error: privErr } = await supabase.from("user_private_settings").upsert({
          user_id: current.id,
          kofi_email: cleanEmail,
          updated_at: new Date().toISOString(),
        });

        if (privErr) {
          if (privErr.code === "23505" || privErr.message?.includes("unique")) {
            throw new Error("This Ko-fi email is already linked to another MangaPulse account.");
          }
          throw privErr;
        }

        // 3. Atomically claim any pending unclaimed payments for this linked email
        if (cleanEmail) {
          try {
            await supabase.rpc("claim_unclaimed_kofi_payments", {
              target_user_id: current.id,
              user_email: cleanEmail,
            });
          } catch (claimErr) {
            console.warn("Unclaimed payment check completed:", claimErr);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to sync profile update to Supabase:", err);
      throw err;
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mangapulse-profile-updated"));
  }

  return merged;
}

/* ────────────────────────── LIBRARY ────────────────────────── */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(id?: string | null): boolean {
  return Boolean(id && UUID_REGEX.test(id));
}

export async function getUserLibrary(userId?: string): Promise<UserLibraryEntry[]> {
  const localItems = getLocal<UserLibraryEntry[]>(STORAGE_KEYS.LIBRARY, []);

  if (supabase && isValidUuid(userId)) {
    try {
      const { data, error } = await supabase
        .from("user_manga_library")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          setLocal(STORAGE_KEYS.LIBRARY, data);
          return data as UserLibraryEntry[];
        }
        // If Supabase returned 0 items but local storage has tracked/imported items,
        // sync them up to Supabase so they don't get lost on page refresh!
        if (localItems.length > 0) {
          saveLibraryBatch(localItems, userId).catch(() => {});
          return localItems;
        }
        return [];
      }
    } catch (e) {
      console.warn("Supabase library fetch error:", e);
    }
  }
  return localItems;
}

export async function saveLibraryEntry(
  entry: Omit<UserLibraryEntry, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<UserLibraryEntry> {
  const now = new Date().toISOString();
  let savedDbRecord: UserLibraryEntry | null = null;

  if (supabase && isValidUuid(entry.user_id)) {
    try {
      const payload: Record<string, any> = {
        user_id: entry.user_id,
        manga_id: entry.manga_id,
        manga_slug: entry.manga_slug,
        manga_title: entry.manga_title,
        manga_cover: entry.manga_cover,
        status: entry.status,
        progress_chapter: Math.max(0, entry.progress_chapter || 0),
        total_chapters: entry.total_chapters || null,
        rating: entry.rating && entry.rating >= 1 && entry.rating <= 10 ? entry.rating : null,
        notes: entry.notes || null,
        updated_at: now,
      };

      if (isValidUuid(entry.id)) {
        payload.id = entry.id;
      }

      const { data, error } = await supabase
        .from("user_manga_library")
        .upsert(payload, { onConflict: "user_id,manga_id" })
        .select()
        .single();

      if (!error && data) {
        savedDbRecord = data as UserLibraryEntry;
      } else if (error) {
        console.error("Supabase library upsert error:", error.message);
      }
    } catch (e) {
      console.warn("Supabase library upsert exception:", e);
    }
  }

  const list = getLocal<UserLibraryEntry[]>(STORAGE_KEYS.LIBRARY, []);
  const idx = list.findIndex((it) => it.manga_id === entry.manga_id);

  const full: UserLibraryEntry = savedDbRecord || {
    id: isValidUuid(entry.id) ? entry.id! : `local-lib-${entry.manga_id}`,
    user_id: entry.user_id || "guest",
    manga_id: entry.manga_id,
    manga_slug: entry.manga_slug,
    manga_title: entry.manga_title,
    manga_cover: entry.manga_cover,
    status: entry.status,
    progress_chapter: Math.max(0, entry.progress_chapter || 0),
    total_chapters: entry.total_chapters || null,
    rating: entry.rating && entry.rating >= 1 && entry.rating <= 10 ? entry.rating : null,
    notes: entry.notes || null,
    created_at: idx >= 0 ? list[idx].created_at : now,
    updated_at: now,
  };

  if (idx >= 0) list[idx] = full;
  else list.unshift(full);

  setLocal(STORAGE_KEYS.LIBRARY, list);
  return full;
}

export async function saveLibraryBatch(
  entries: (Omit<UserLibraryEntry, "id" | "created_at" | "updated_at"> & { id?: string })[],
  userId?: string
): Promise<UserLibraryEntry[]> {
  if (!entries || entries.length === 0) return [];
  const now = new Date().toISOString();
  const targetUserId = userId || "guest";
  const isTargetUserValidUuid = isValidUuid(userId);

  // 1. Bulk upsert to Supabase if logged in with valid UUID
  if (supabase && isTargetUserValidUuid) {
    try {
      const records = entries.map((entry) => {
        const payload: Record<string, any> = {
          user_id: userId,
          manga_id: entry.manga_id,
          manga_slug: entry.manga_slug,
          manga_title: entry.manga_title,
          manga_cover: entry.manga_cover,
          status: entry.status,
          progress_chapter: Math.max(0, entry.progress_chapter || 0),
          total_chapters: entry.total_chapters || null,
          rating: entry.rating && entry.rating >= 1 && entry.rating <= 10 ? entry.rating : null,
          notes: entry.notes || null,
          updated_at: now,
        };
        if (isValidUuid(entry.id)) {
          payload.id = entry.id;
        }
        return payload;
      });

      // Upsert in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("user_manga_library")
          .upsert(chunk, { onConflict: "user_id,manga_id" });
        if (error) {
          console.error("Supabase batch upsert chunk error:", error.message);
        }
      }

      const { data, error } = await supabase
        .from("user_manga_library")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!error && data && data.length > 0) {
        setLocal(STORAGE_KEYS.LIBRARY, data);
        return data as UserLibraryEntry[];
      }
    } catch (e) {
      console.warn("Supabase batch save exception:", e);
    }
  }

  // 2. Local storage bulk sync
  const list = getLocal<UserLibraryEntry[]>(STORAGE_KEYS.LIBRARY, []);
  for (const entry of entries) {
    const idx = list.findIndex((it) => it.manga_id === entry.manga_id);
    const full: UserLibraryEntry = {
      id: isValidUuid(entry.id) ? entry.id! : `local-lib-${entry.manga_id}`,
      user_id: targetUserId,
      manga_id: entry.manga_id,
      manga_slug: entry.manga_slug,
      manga_title: entry.manga_title,
      manga_cover: entry.manga_cover,
      status: entry.status,
      progress_chapter: Math.max(0, entry.progress_chapter || 0),
      total_chapters: entry.total_chapters || null,
      rating: entry.rating && entry.rating >= 1 && entry.rating <= 10 ? entry.rating : null,
      notes: entry.notes || null,
      created_at: idx >= 0 ? list[idx].created_at : now,
      updated_at: now,
    };
    if (idx >= 0) list[idx] = full;
    else list.unshift(full);
  }

  setLocal(STORAGE_KEYS.LIBRARY, list);
  return list;
}

export async function deleteLibraryEntry(mangaId: number, userId?: string): Promise<void> {
  if (supabase && isValidUuid(userId)) {
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
  const isUserUuid = isValidUuid(userId);
  if (supabase && isUserUuid) {
    try {
      const { data, error } = await supabase
        .from("user_collections")
        .select("*, items:collection_manga(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Merge Supabase collections with local default collections so they never disappear
        const localList = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
        const localDefaults = localList.filter((c) => !isValidUuid(c.id));
        const merged: UserCollection[] = [...(data as UserCollection[])];
        for (const def of localDefaults) {
          if (!merged.some((m) => m.name.toLowerCase() === def.name.toLowerCase() || m.id === def.id)) {
            merged.push(def);
          }
        }
        return merged;
      }
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
  manga: MangaItem | { id: number; slug?: string; displayTitle?: string; cover?: string },
  userId?: string
): Promise<boolean> {
  const isUuid = isValidUuid(collectionId);
  const mangaId = Number(manga.id);
  const mangaSlug =
    ("slug" in manga && manga.slug) ||
    (manga as any).manga_slug ||
    slugify(("displayTitle" in manga && manga.displayTitle) || (manga as any).title?.userPreferred || "manga");
  const mangaTitle =
    ("displayTitle" in manga && manga.displayTitle) ||
    (manga as any).title?.userPreferred ||
    (manga as any).title?.english ||
    (manga as any).title?.romaji ||
    (manga as any).manga_title ||
    "Untitled Manga";
  const coverUrl =
    "cover" in manga
      ? (manga as any).cover
      : (manga as any).coverImage?.extraLarge ||
        (manga as any).coverImage?.large ||
        (manga as any).coverImage?.medium ||
        (manga as any).manga_cover ||
        "";

  let added = false;

  // 1. Supabase persistence for authenticated users with UUID collections
  if (supabase && isUuid) {
    try {
      const { data: existing } = await supabase
        .from("collection_manga")
        .select("id")
        .eq("collection_id", collectionId)
        .eq("manga_id", mangaId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("collection_manga")
          .delete()
          .eq("collection_id", collectionId)
          .eq("manga_id", mangaId);
        added = false;
      } else {
        await supabase.from("collection_manga").insert({
          collection_id: collectionId,
          manga_id: mangaId,
          manga_slug: mangaSlug,
          manga_title: mangaTitle,
          manga_cover: coverUrl,
        });
        added = true;
      }
    } catch (e) {
      console.warn("Supabase toggle collection manga error:", e);
    }
  }

  // 2. LocalStorage persistence (synced cache)
  const list = getLocal<UserCollection[]>(STORAGE_KEYS.COLLECTIONS, DEFAULT_COLLECTIONS);
  let targetCol = list.find((c) => c.id === collectionId);

  if (!targetCol && isUuid) {
    targetCol = {
      id: collectionId,
      user_id: userId || "local",
      name: "Collection",
      description: null,
      is_private: false,
      created_at: new Date().toISOString(),
      items: [],
    };
    list.push(targetCol);
  }

  if (targetCol) {
    targetCol.items = targetCol.items || [];
    const existingIdx = targetCol.items.findIndex(
      (it) => String(it.manga_id) === String(mangaId)
    );

    if (existingIdx >= 0) {
      targetCol.items.splice(existingIdx, 1);
      if (!isUuid) added = false;
    } else {
      targetCol.items.push({
        id: `ci-${Date.now()}`,
        collection_id: collectionId,
        manga_id: mangaId,
        manga_slug: mangaSlug,
        manga_title: mangaTitle,
        manga_cover: coverUrl,
        added_at: new Date().toISOString(),
      });
      if (!isUuid) added = true;
    }

    setLocal(STORAGE_KEYS.COLLECTIONS, list);
  }

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
    // Only return demo seed on localhost development, NEVER in production!
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".localhost"));
    if (isLocalhost && process.env.NODE_ENV !== "production") {
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
    return [];
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
  if (list.length > 500) list.length = 500;
  setLocal(STORAGE_KEYS.ACTIVITIES, list);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("mangapulse-activity-logged"));
  }
}

