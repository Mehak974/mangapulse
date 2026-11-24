import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// In-memory counter for traffic stats aggregated by publisher
const outboundClickStats = new Map<string, number>();

// Sliding window rate limiter (max 30 requests per minute per IP)
const rateLimitMap = new Map<string, number[]>();

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const now = Date.now();

    // 1. In-memory Rate Limiting
    const clientHistory = rateLimitMap.get(clientIp) || [];
    const recentRequests = clientHistory.filter((timestamp) => now - timestamp < 60000);

    if (recentRequests.length >= 30) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 30 click tracking events per minute." },
        { status: 429 }
      );
    }

    recentRequests.push(now);
    rateLimitMap.set(clientIp, recentRequests);

    // Housekeeping: prevent memory bloat
    if (rateLimitMap.size > 1000) {
      for (const [ip, history] of rateLimitMap.entries()) {
        if (history.every((t) => now - t >= 60000)) {
          rateLimitMap.delete(ip);
        }
      }
    }

    // 2. Strict Input Validation
    const body = await request.json();
    const { publisher, mangaTitle, targetUrl } = body;

    if (typeof publisher !== "string" || publisher.trim().length === 0 || publisher.length > 60) {
      return NextResponse.json({ error: "Invalid publisher identifier (1-60 chars required)" }, { status: 400 });
    }

    if (mangaTitle && (typeof mangaTitle !== "string" || mangaTitle.length > 150)) {
      return NextResponse.json({ error: "Invalid mangaTitle (max 150 chars)" }, { status: 400 });
    }

    if (targetUrl && (typeof targetUrl !== "string" || targetUrl.length > 500)) {
      return NextResponse.json({ error: "Invalid targetUrl (max 500 chars)" }, { status: 400 });
    }

    const cleanPublisher = publisher.trim();
    const cleanTitle = mangaTitle ? mangaTitle.trim() : null;
    const cleanUrl = targetUrl ? targetUrl.trim() : null;

    // Increment aggregated in-memory counter
    const current = outboundClickStats.get(cleanPublisher) || 0;
    outboundClickStats.set(cleanPublisher, current + 1);

    // Asynchronously record event in Supabase table
    if (supabase) {
      Promise.resolve(
        supabase.from("outbound_click_events").insert({
          publisher: cleanPublisher,
          manga_title: cleanTitle,
          target_url: cleanUrl,
          created_at: new Date().toISOString(),
        })
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, count: current + 1 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Fail Closed Security Check
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Telemetry query disabled: CRON_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : "";

  // Constant-time token verification
  if (
    bearerToken.length !== cronSecret.length ||
    !crypto.timingSafeEqual(Buffer.from(bearerToken), Buffer.from(cronSecret))
  ) {
    return NextResponse.json(
      { error: "Unauthorized. Valid Bearer token required in Authorization header." },
      { status: 401 }
    );
  }

  // Read aggregated stats
  const stats: Record<string, number> = {};
  for (const [pub, count] of outboundClickStats.entries()) {
    stats[pub] = count;
  }
  return NextResponse.json({ outboundStats: stats });
}
