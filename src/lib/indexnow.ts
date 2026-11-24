/**
 * IndexNow Protocol Integration for Instant Search Engine Indexing (Bing, Yandex, Naver, Seznam)
 * Protocol spec: https://www.indexnow.org/documentation
 */

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "c839f8216ba44621a162e08e64593a21";
export const INDEXNOW_HOST = process.env.INDEXNOW_HOST || "www.mangapulse.co";

export interface IndexNowResult {
  success: boolean;
  status: number;
  message: string;
  submittedCount: number;
}

/**
 * Submits a list of URLs to the IndexNow API for instant indexing.
 * @param urls Array of absolute URLs (up to 10,000 per request)
 */
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (!urls || urls.length === 0) {
    return {
      success: true,
      status: 200,
      message: "No URLs provided to submit",
      submittedCount: 0,
    };
  }

  // Deduplicate and filter valid HTTP/HTTPS URLs
  const cleanUrls = Array.from(new Set(urls))
    .filter((u) => u && (u.startsWith("http://") || u.startsWith("https://")))
    .slice(0, 10000);

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: cleanUrls,
  };

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "MangaPulse-IndexNow/1.0",
      },
      body: JSON.stringify(payload),
    });

    // IndexNow returns 200 (OK) or 202 (Accepted)
    const isOk = res.ok || res.status === 200 || res.status === 202;

    return {
      success: isOk,
      status: res.status,
      message: res.statusText || (isOk ? "URLs submitted successfully to IndexNow" : "IndexNow error"),
      submittedCount: cleanUrls.length,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("IndexNow submission network exception:", msg);
    return {
      success: false,
      status: 500,
      message: msg,
      submittedCount: 0,
    };
  }
}

// In-memory LRU set to prevent repeated submissions of the same URL across requests
const recentlyIndexedUrls = new Set<string>();

/**
 * Automatically indexes newly discovered pages (triggered when users view a manga page,
 * countdown page, or discover manga in search results).
 * Runs completely asynchronously (fire-and-forget) so user page responses are never delayed.
 */
export function indexDiscoveredPages(urls: (string | null | undefined)[]): void {
  try {
    const validUrls = urls.filter(
      (u): u is string => typeof u === "string" && (u.startsWith("https://") || u.startsWith("http://"))
    );

    const freshUrls = validUrls.filter((u) => !recentlyIndexedUrls.has(u));
    if (freshUrls.length === 0) return;

    for (const u of freshUrls) {
      recentlyIndexedUrls.add(u);
      if (recentlyIndexedUrls.size > 10000) {
        const oldest = recentlyIndexedUrls.values().next().value;
        if (oldest) recentlyIndexedUrls.delete(oldest);
      }
    }

    // Submit non-blocking in background
    submitToIndexNow(freshUrls).catch((err) => {
      // Non-fatal background error
      if (process.env.NODE_ENV !== "production") {
        console.warn("IndexNow auto-indexing background notice:", err?.message || err);
      }
    });
  } catch {
    // Non-fatal guard
  }
}
