import { createClient } from "@supabase/supabase-js";
import { UserLibraryEntry, LibraryStatus } from "@/types/manga";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Supabase client instance (or null dummy if no credentials provided)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_STORAGE_KEY = "mangapulse_local_library";

// Local storage fallback so users can track their library immediately without configuring backend
export function getLocalLibrary(): UserLibraryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalLibrary(entries: UserLibraryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Failed to save local library:", err);
  }
}

export async function fetchUserLibrary(userId?: string): Promise<UserLibraryEntry[]> {
  if (supabase && userId) {
    const { data, error } = await supabase
      .from("user_manga_library")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (!error && data) return data as UserLibraryEntry[];
  }
  return getLocalLibrary();
}

export async function upsertLibraryEntry(
  entry: Omit<UserLibraryEntry, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<UserLibraryEntry> {
  const now = new Date().toISOString();

  if (supabase && entry.user_id) {
    const { data, error } = await supabase
      .from("user_manga_library")
      .upsert(
        {
          ...entry,
          updated_at: now,
        },
        { onConflict: "user_id,manga_id" }
      )
      .select()
      .single();

    if (!error && data) return data as UserLibraryEntry;
  }

  // Fallback to localStorage
  const current = getLocalLibrary();
  const existingIdx = current.findIndex((item) => item.manga_id === entry.manga_id);

  const fullEntry: UserLibraryEntry = {
    id: entry.id || `local-${entry.manga_id}`,
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
    created_at: existingIdx >= 0 ? current[existingIdx].created_at : now,
    updated_at: now,
  };

  if (existingIdx >= 0) {
    current[existingIdx] = fullEntry;
  } else {
    current.unshift(fullEntry);
  }

  saveLocalLibrary(current);
  return fullEntry;
}

export async function removeLibraryEntry(mangaId: number, userId?: string): Promise<boolean> {
  if (supabase && userId) {
    const { error } = await supabase
      .from("user_manga_library")
      .delete()
      .eq("user_id", userId)
      .eq("manga_id", mangaId);

    if (!error) return true;
  }

  const current = getLocalLibrary().filter((item) => item.manga_id !== mangaId);
  saveLocalLibrary(current);
  return true;
}

