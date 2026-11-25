import { NextRequest, NextResponse } from "next/server";
import { recordVisitedPage, getVisitedPages, isValidTrackPath } from "@/lib/visitedPages";

export async function POST(req: NextRequest) {
  try {
    // 1. Origin and Referer verification to block automated third-party spam bots
    const origin = req.headers.get("origin") || "";
    const referer = req.headers.get("referer") || "";
    const host = req.headers.get("host") || "";

    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    const isAllowedOrigin =
      isLocalhost ||
      origin.includes("mangapulse.co") ||
      referer.includes("mangapulse.co");

    if (!isAllowedOrigin && (origin || referer)) {
      return NextResponse.json({ ok: false, message: "Forbidden: External origin" }, { status: 403 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty or plain text beacon
    }

    const path = typeof body?.path === "string" ? body.path.trim() : null;
    const title = typeof body?.title === "string" ? body.title : undefined;

    if (!path) {
      return NextResponse.json(
        { ok: false, message: "Missing or invalid 'path' in request body" },
        { status: 400 }
      );
    }

    // 2. Strict route structure validation before touching disk or IndexNow
    if (!isValidTrackPath(path)) {
      return NextResponse.json(
        { ok: false, message: "Invalid path pattern: only verified manga, countdown, and core catalog routes allowed" },
        { status: 400 }
      );
    }

    const recorded = await recordVisitedPage(path, { title });

    if (!recorded) {
      return NextResponse.json({
        ok: false,
        message: "Path ignored (delisted or non-indexable route)",
      });
    }

    return NextResponse.json({
      ok: true,
      url: recorded.url,
      path: recorded.path,
      visitCount: recorded.visit_count,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pages = await getVisitedPages();
    return NextResponse.json({
      ok: true,
      totalVisitedPages: pages.length,
      sampleUrls: pages.slice(0, 10).map((p) => p.url),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
