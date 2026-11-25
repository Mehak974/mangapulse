import fs from "fs";
import path from "path";
import { SITE_URL } from "@/lib/seo";
import { indexDiscoveredPages } from "@/lib/indexnow";
import { isMangaDelisted, getAllDelistedSlugs } from "@/lib/mangaOverrides";
import { pool, query } from "@/lib/serverDb";
import { supabase } from "@/lib/supabase";

export interface DiscoveredPage {
  url: string;
  path: string;
  title?: string;
  last_visited_at: string;
  visit_count: number;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

// In-memory cache for fast lookups
const inMemoryDiscoveredPages = new Map<string, DiscoveredPage>();
let isInitialized = false;

// Determine writable file path for fallback persistence
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "discovered_pages.json");
const TMP_DATA_FILE = path.join("/tmp", "discovered_pages.json");

function getStorageFilePath(): string {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    return DATA_FILE;
  } catch {
    return TMP_DATA_FILE;
  }
}

// Load cached pages from local storage file
function loadStoredPages(): void {
  if (isInitialized) return;
  isInitialized = true;

  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list: DiscoveredPage[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.url) {
            inMemoryDiscoveredPages.set(item.url, item);
          }
        }
      }
    }
  } catch (err) {
    // Non-fatal cache read error
  }
}

let saveTimeout: NodeJS.Timeout | null = null;
function persistPagesToFile(): void {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      const filePath = getStorageFilePath();
      const list = Array.from(inMemoryDiscoveredPages.values());
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
    } catch {
      // Non-fatal disk write error (e.g. read-only serverless environment)
    }
  }, 1000);
}

// Whitelist patterns for valid public content paths
const VALID_MANGA_PATH_REGEX = /^\/manga\/[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const VALID_COUNTDOWN_PATH_REGEX = /^\/release-date\/[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const ALLOWED_STATIC_PATHS = new Set([
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/dmca",
  "/donate",
  "/browse",
  "/trending",
  "/forum",
]);

/**
 * Validates that an incoming path strictly matches an indexable catalog route
 */
export function isValidTrackPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  const clean = path.split("?")[0].split("#")[0].trim().toLowerCase();
  if (ALLOWED_STATIC_PATHS.has(clean)) return true;
  if (VALID_MANGA_PATH_REGEX.test(clean)) return true;
  if (VALID_COUNTDOWN_PATH_REGEX.test(clean)) return true;
  return false;
}

/**
 * Normalizes and validates incoming URL or path
 */
export function normalizePagePath(pathOrUrl: string): string | null {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return null;

  let cleaned = pathOrUrl.trim();

  // Strip origin if full URL provided
  try {
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      const parsed = new URL(cleaned);
      cleaned = parsed.pathname;
    }
  } catch {
    return null;
  }

  // Remove query strings and hashes
  cleaned = cleaned.split("?")[0].split("#")[0].trim();

  // Ensure leading slash
  if (!cleaned.startsWith("/")) {
    cleaned = "/" + cleaned;
  }

  // Remove trailing slash (except root)
  if (cleaned.length > 1 && cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }

  // Check against strict whitelist (blocks arbitrary/spam paths from polluting sitemap)
  if (!isValidTrackPath(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Records a page visited by a user:
 * 1. Validates and ensures not delisted (DMCA check).
 * 2. Submits to IndexNow (Bing, Yandex, etc.) immediately.
 * 3. Saves to persistent store for dynamic sitemap inclusion.
 */
export async function recordVisitedPage(
  pathOrUrl: string,
  options?: {
    title?: string;
    priority?: number;
    changeFrequency?: DiscoveredPage["changeFrequency"];
  }
): Promise<DiscoveredPage | null> {
  const cleanPath = normalizePagePath(pathOrUrl);
  if (!cleanPath) return null;

  // Verify DMCA delisting status before indexing or registering
  if (cleanPath.startsWith("/manga/") || cleanPath.startsWith("/release-date/")) {
    const slug = cleanPath.split("/")[2];
    if (slug && (await isMangaDelisted(slug))) {
      return null;
    }
  }

  loadStoredPages();

  const canonicalUrl = `${SITE_URL}${cleanPath}`;
  const now = new Date().toISOString();

  // Determine priority and frequency
  const isCountdown = cleanPath.startsWith("/release-date/");
  const isManga = cleanPath.startsWith("/manga/");
  const priority = options?.priority ?? (isManga || isCountdown ? 0.85 : 0.7);
  const changeFrequency = options?.changeFrequency ?? (isCountdown ? "hourly" : "daily");

  const existing = inMemoryDiscoveredPages.get(canonicalUrl);
  const pageEntry: DiscoveredPage = {
    url: canonicalUrl,
    path: cleanPath,
    title: options?.title || existing?.title,
    last_visited_at: now,
    visit_count: (existing?.visit_count || 0) + 1,
    priority,
    changeFrequency,
  };

  if (!existing && inMemoryDiscoveredPages.size >= 3000) {
    const oldest = inMemoryDiscoveredPages.keys().next().value;
    if (oldest) inMemoryDiscoveredPages.delete(oldest);
  }

  inMemoryDiscoveredPages.set(canonicalUrl, pageEntry);

  // Paired indexing: manga page <-> release countdown page
  const urlsToIndex = [canonicalUrl];
  if (isManga) {
    const pairUrl = `${SITE_URL}/release-date/${cleanPath.replace(/^\/manga\//, "")}`;
    urlsToIndex.push(pairUrl);
  } else if (isCountdown) {
    const pairUrl = `${SITE_URL}/manga/${cleanPath.replace(/^\/release-date\//, "")}`;
    urlsToIndex.push(pairUrl);
  }

  // 1. Instant Search Engine Submission via IndexNow
  indexDiscoveredPages(urlsToIndex);

  // 2. Persist to file
  persistPagesToFile();

  // 3. Persist to Database asynchronously (fire-and-forget)
  persistToDatabase(pageEntry).catch(() => {});

  return pageEntry;
}

async function persistToDatabase(entry: DiscoveredPage): Promise<void> {
  try {
    if (pool) {
      await query(
        `INSERT INTO public.discovered_pages (url, path, title, last_visited_at, visit_count)
         VALUES ($1, $2, $3, $4, 1)
         ON CONFLICT (url) DO UPDATE
         SET last_visited_at = EXCLUDED.last_visited_at,
             visit_count = public.discovered_pages.visit_count + 1;`,
        [entry.url, entry.path, entry.title || null, entry.last_visited_at]
      );
    } else if (supabase) {
      await supabase
        .from("discovered_pages")
        .upsert({
          url: entry.url,
          path: entry.path,
          title: entry.title || null,
          last_visited_at: entry.last_visited_at,
          visit_count: entry.visit_count,
        });
    }
  } catch {
    // Non-fatal if table not yet created
  }
}

/**
 * Retrieves all registered visited pages for sitemap inclusion
 */
export async function getVisitedPages(): Promise<DiscoveredPage[]> {
  loadStoredPages();

  const pagesMap = new Map<string, DiscoveredPage>(inMemoryDiscoveredPages);

  // Attempt to enrich from DB if connected
  try {
    if (pool) {
      const rows = await query<{
        url: string;
        path: string;
        title: string | null;
        last_visited_at: string;
        visit_count: number;
      }>(`SELECT url, path, title, last_visited_at, visit_count FROM public.discovered_pages LIMIT 5000;`);
      for (const r of rows) {
        if (!pagesMap.has(r.url)) {
          pagesMap.set(r.url, {
            url: r.url,
            path: r.path,
            title: r.title || undefined,
            last_visited_at: r.last_visited_at,
            visit_count: r.visit_count,
            priority: r.path.startsWith("/manga/") || r.path.startsWith("/release-date/") ? 0.85 : 0.7,
            changeFrequency: r.path.startsWith("/release-date/") ? "hourly" : "daily",
          });
        }
      }
    } else if (supabase) {
      const { data } = await supabase
        .from("discovered_pages")
        .select("url, path, title, last_visited_at, visit_count")
        .limit(5000);
      if (data && Array.isArray(data)) {
        for (const r of data) {
          if (!pagesMap.has(r.url)) {
            pagesMap.set(r.url, {
              url: r.url,
              path: r.path,
              title: r.title || undefined,
              last_visited_at: r.last_visited_at,
              visit_count: r.visit_count,
              priority: r.path.startsWith("/manga/") || r.path.startsWith("/release-date/") ? 0.85 : 0.7,
              changeFrequency: r.path.startsWith("/release-date/") ? "hourly" : "daily",
            });
          }
        }
      }
    }
  } catch {
    // Non-fatal DB read fallback
  }

  // Filter against any delisted DMCA slugs
  const delistedList = await getAllDelistedSlugs();
  const delistedSet = new Set(delistedList.map((s) => s.toLowerCase().trim()));

  const filtered: DiscoveredPage[] = [];
  for (const page of pagesMap.values()) {
    const pathLower = page.path.toLowerCase();
    const isDelisted = Array.from(delistedSet).some((slug) =>
      pathLower.includes(`/manga/${slug}`) || pathLower.includes(`/release-date/${slug}`)
    );
    if (!isDelisted) {
      filtered.push(page);
    }
  }

  return filtered;
}
