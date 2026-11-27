import { MangaDisplaySettings } from "@/types/manga";

const STORAGE_KEYS = {
  READ_CHAPTERS: "mangapulse_read_chapters_",
  NOTES: "mangapulse_manga_notes_",
  DISPLAY_SETTINGS: "mangapulse_display_settings",
};

export const DEFAULT_DISPLAY_SETTINGS: MangaDisplaySettings = {
  showCover: true,
  showTitle: true,
  showRating: true,
  showLatestChapter: true,
  showUnreadCount: true,
};

// ── Display Settings ──

export function getDisplaySettings(): MangaDisplaySettings {
  if (typeof window === "undefined") return DEFAULT_DISPLAY_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISPLAY_SETTINGS);
    return raw ? { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(raw) } : DEFAULT_DISPLAY_SETTINGS;
  } catch {
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

export function saveDisplaySettings(settings: MangaDisplaySettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event("mangapulse-display-settings-changed"));
  } catch (err) {
    console.error("Failed to save display settings:", err);
  }
}

// ── User Scoping Helper ──
function getActiveUserId(): string {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("mangapulse_user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.id) return u.id;
      }
    }
  } catch {}
  return "guest";
}

// ── Read Chapters ──

export function getReadChapters(mangaId: number, userId?: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  const uid = userId || getActiveUserId();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.READ_CHAPTERS}${uid}_${mangaId}`);
    if (raw) return new Set(JSON.parse(raw));

    // Fallback: If guest, check legacy key
    if (uid === "guest") {
      const legacy = localStorage.getItem(`${STORAGE_KEYS.READ_CHAPTERS}${mangaId}`);
      if (legacy) return new Set(JSON.parse(legacy));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

export function saveReadChapters(mangaId: number, chapters: Set<number>, userId?: string): void {
  if (typeof window === "undefined") return;
  const uid = userId || getActiveUserId();
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.READ_CHAPTERS}${uid}_${mangaId}`,
      JSON.stringify(Array.from(chapters))
    );
    window.dispatchEvent(new CustomEvent("mangapulse-chapters-updated", { detail: { mangaId } }));
  } catch (err) {
    console.error("Failed to save read chapters:", err);
  }
}

export function toggleChapterRead(mangaId: number, chapterNum: number, userId?: string): boolean {
  const read = getReadChapters(mangaId, userId);
  let isNowRead = false;
  if (read.has(chapterNum)) {
    read.delete(chapterNum);
    isNowRead = false;
  } else {
    read.add(chapterNum);
    isNowRead = true;
  }
  saveReadChapters(mangaId, read, userId);
  return isNowRead;
}

export function markChaptersRead(mangaId: number, chapterNums: number[], userId?: string): void {
  const read = getReadChapters(mangaId, userId);
  chapterNums.forEach((n) => read.add(n));
  saveReadChapters(mangaId, read, userId);
}

export function markChaptersUnread(mangaId: number, chapterNums: number[], userId?: string): void {
  const read = getReadChapters(mangaId, userId);
  chapterNums.forEach((n) => read.delete(n));
  saveReadChapters(mangaId, read, userId);
}

export function markAllBelowRead(mangaId: number, targetChapter: number, userId?: string): void {
  const read = getReadChapters(mangaId, userId);
  for (let i = 1; i <= targetChapter; i++) {
    read.add(i);
  }
  saveReadChapters(mangaId, read, userId);
}

export function markAllBelowUnread(mangaId: number, targetChapter: number, userId?: string): void {
  const read = getReadChapters(mangaId, userId);
  for (let i = 1; i <= targetChapter; i++) {
    read.delete(i);
  }
  saveReadChapters(mangaId, read, userId);
}

export function markAllChaptersRead(mangaId: number, totalChapters: number, userId?: string): void {
  const read = new Set<number>();
  for (let i = 1; i <= totalChapters; i++) {
    read.add(i);
  }
  saveReadChapters(mangaId, read, userId);
}

export function clearAllChaptersRead(mangaId: number, userId?: string): void {
  saveReadChapters(mangaId, new Set<number>(), userId);
}

// ── Manga Notes ──

export function getMangaNote(mangaId: number, userId?: string): string {
  if (typeof window === "undefined") return "";
  const uid = userId || getActiveUserId();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.NOTES}${uid}_${mangaId}`);
    if (raw) return raw;
    if (uid === "guest") {
      return localStorage.getItem(`${STORAGE_KEYS.NOTES}${mangaId}`) || "";
    }
    return "";
  } catch {
    return "";
  }
}

export function saveMangaNote(mangaId: number, content: string, userId?: string): void {
  if (typeof window === "undefined") return;
  const uid = userId || getActiveUserId();
  try {
    if (!content.trim()) {
      localStorage.removeItem(`${STORAGE_KEYS.NOTES}${uid}_${mangaId}`);
    } else {
      localStorage.setItem(`${STORAGE_KEYS.NOTES}${uid}_${mangaId}`, content);
    }
    window.dispatchEvent(new CustomEvent("mangapulse-note-updated", { detail: { mangaId } }));
  } catch (err) {
    console.error("Failed to save note:", err);
  }
}

export function deleteMangaNote(mangaId: number, userId?: string): void {
  if (typeof window === "undefined") return;
  const uid = userId || getActiveUserId();
  try {
    localStorage.removeItem(`${STORAGE_KEYS.NOTES}${uid}_${mangaId}`);
    window.dispatchEvent(new CustomEvent("mangapulse-note-updated", { detail: { mangaId } }));
  } catch (err) {
    console.error("Failed to delete note:", err);
  }
}

