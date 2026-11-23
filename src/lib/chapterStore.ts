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

// ── Read Chapters ──

export function getReadChapters(mangaId: number): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.READ_CHAPTERS}${mangaId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadChapters(mangaId: number, chapters: Set<number>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.READ_CHAPTERS}${mangaId}`,
      JSON.stringify(Array.from(chapters))
    );
    window.dispatchEvent(new CustomEvent("mangapulse-chapters-updated", { detail: { mangaId } }));
  } catch (err) {
    console.error("Failed to save read chapters:", err);
  }
}

export function toggleChapterRead(mangaId: number, chapterNum: number): boolean {
  const read = getReadChapters(mangaId);
  let isNowRead = false;
  if (read.has(chapterNum)) {
    read.delete(chapterNum);
    isNowRead = false;
  } else {
    read.add(chapterNum);
    isNowRead = true;
  }
  saveReadChapters(mangaId, read);
  return isNowRead;
}

export function markChaptersRead(mangaId: number, chapterNums: number[]): void {
  const read = getReadChapters(mangaId);
  chapterNums.forEach((n) => read.add(n));
  saveReadChapters(mangaId, read);
}

export function markChaptersUnread(mangaId: number, chapterNums: number[]): void {
  const read = getReadChapters(mangaId);
  chapterNums.forEach((n) => read.delete(n));
  saveReadChapters(mangaId, read);
}

export function markAllBelowRead(mangaId: number, targetChapter: number): void {
  const read = getReadChapters(mangaId);
  for (let i = 1; i <= targetChapter; i++) {
    read.add(i);
  }
  saveReadChapters(mangaId, read);
}

export function markAllBelowUnread(mangaId: number, targetChapter: number): void {
  const read = getReadChapters(mangaId);
  for (let i = 1; i <= targetChapter; i++) {
    read.delete(i);
  }
  saveReadChapters(mangaId, read);
}

export function markAllChaptersRead(mangaId: number, totalChapters: number): void {
  const read = new Set<number>();
  for (let i = 1; i <= totalChapters; i++) {
    read.add(i);
  }
  saveReadChapters(mangaId, read);
}

export function clearAllChaptersRead(mangaId: number): void {
  saveReadChapters(mangaId, new Set<number>());
}

// ── Manga Notes ──

export function getMangaNote(mangaId: number): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(`${STORAGE_KEYS.NOTES}${mangaId}`) || "";
  } catch {
    return "";
  }
}

export function saveMangaNote(mangaId: number, content: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!content.trim()) {
      localStorage.removeItem(`${STORAGE_KEYS.NOTES}${mangaId}`);
    } else {
      localStorage.setItem(`${STORAGE_KEYS.NOTES}${mangaId}`, content);
    }
    window.dispatchEvent(new CustomEvent("mangapulse-note-updated", { detail: { mangaId } }));
  } catch (err) {
    console.error("Failed to save note:", err);
  }
}

export function deleteMangaNote(mangaId: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_KEYS.NOTES}${mangaId}`);
    window.dispatchEvent(new CustomEvent("mangapulse-note-updated", { detail: { mangaId } }));
  } catch (err) {
    console.error("Failed to delete note:", err);
  }
}

