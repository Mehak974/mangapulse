import { query } from "@/lib/serverDb";

// Cached delisted slugs with 60s TTL to protect high-throughput routes
let delistedCache: Set<string> | null = null;
let lastDelistedFetch = 0;

export async function isMangaDelisted(slugOrTitle: string): Promise<boolean> {
  if (!slugOrTitle) return false;
  const now = Date.now();

  if (!delistedCache || now - lastDelistedFetch > 60000) {
    try {
      const rows = await query<{ manga_slug: string }>(
        `SELECT manga_slug FROM public.manga_overrides WHERE is_delisted = true;`
      );
      delistedCache = new Set(rows.map((r) => r.manga_slug.toLowerCase().trim()));
      lastDelistedFetch = now;
    } catch {
      return false;
    }
  }

  const clean = slugOrTitle.toLowerCase().trim();
  return delistedCache.has(clean);
}

export async function getAllDelistedSlugs(): Promise<string[]> {
  try {
    const rows = await query<{ manga_slug: string }>(
      `SELECT manga_slug FROM public.manga_overrides WHERE is_delisted = true;`
    );
    return rows.map((r) => r.manga_slug.toLowerCase().trim());
  } catch {
    return [];
  }
}
