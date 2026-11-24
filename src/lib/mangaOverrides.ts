import { pool, query } from "@/lib/serverDb";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// Cached delisted slugs with 60s TTL to protect high-throughput routes
let delistedCache: Set<string> | null = null;
let lastDelistedFetch = 0;

export async function isMangaDelisted(slugOrTitle: string): Promise<boolean> {
  if (!slugOrTitle) return false;
  const now = Date.now();

  if (!delistedCache || now - lastDelistedFetch > 60000) {
    try {
      const slugs = await getAllDelistedSlugs();
      delistedCache = new Set(slugs);
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
    if (pool) {
      const rows = await query<{ manga_slug: string }>(
        `SELECT manga_slug FROM public.manga_overrides WHERE is_delisted = true;`
      );
      return rows.map((r) => r.manga_slug.toLowerCase().trim());
    } else if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await supabase
        .from("manga_overrides")
        .select("manga_slug")
        .eq("is_delisted", true);
      return (data || []).map((r: any) => r.manga_slug.toLowerCase().trim());
    }
    return [];
  } catch {
    return [];
  }
}
