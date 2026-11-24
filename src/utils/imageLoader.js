/**
 * Custom Next.js Image Loader
 * Bypasses Vercel Image Optimization quota (1,000 images/month limit)
 * by serving assets directly from their origin CDNs (AniList, MangaDex, Kitsu, etc.)
 * Exactly matching the reference implementation.
 */

export default function myImageLoader({ src, width, quality }) {
  if (!src) return "/placeholder-cover.png";
  if (src.startsWith("/")) return src;

  // Direct CDNs that already provide global edge caching & compression
  const DIRECT_DOMAINS = [
    "anilist.co",
    "s4.anilist.co",
    "s5.anilist.co",
    "mangadex.org",
    "uploads.mangadex.org",
    "kitsu.app",
    "media.kitsu.app",
    "kitsu.io",
    "media.kitsu.io",
    "images.unsplash.com",
    "unsplash.com",
    "googleusercontent.com",
    "mangaplus.shueisha.co.jp",
    "shueisha.co.jp",
    "viz.com",
    "m.media-amazon.com",
    "images-na.ssl-images-amazon.com",
    "cdn.myanimelist.net",
    "myanimelist.net",
    "static.wikia.nocookie.net",
    "wikia.nocookie.net",
  ];

  if (DIRECT_DOMAINS.some((d) => src.includes(d))) {
    // Return direct CDN URL - completely bypasses Vercel /_next/image optimizer
    return src;
  }

  // Tracking / analytics domains (pass-through)
  const TRACKING_DOMAINS = [
    "google-analytics.com",
    "doubleclick.net",
    "googletagmanager.com",
    "cloudflareinsights.com",
    "cloudflare-analytics.com",
  ];
  if (TRACKING_DOMAINS.some((d) => src.includes(d))) return src;

  // Optional: Cloudflare image proxy worker or backend proxy if configured
  const workerUrl = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_WORKER_URL
    ? process.env.NEXT_PUBLIC_WORKER_URL.trim().replace(/\/$/, "")
    : "";
  if (workerUrl && src.startsWith(workerUrl)) {
    if (!src.includes("w=") && width) return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
    return src;
  }

  // Fallback: return direct source URL
  return src;
}
