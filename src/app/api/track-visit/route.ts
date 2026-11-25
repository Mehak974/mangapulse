import { NextRequest, NextResponse } from "next/server";
import { recordVisitedPage, getVisitedPages } from "@/lib/visitedPages";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty or plain text beacon
    }

    const path = typeof body?.path === "string" ? body.path : null;
    const title = typeof body?.title === "string" ? body.title : undefined;

    if (!path) {
      return NextResponse.json(
        { ok: false, message: "Missing or invalid 'path' in request body" },
        { status: 400 }
      );
    }

    const recorded = await recordVisitedPage(path, { title });

    if (!recorded) {
      return NextResponse.json({
        ok: false,
        message: "Path ignored (internal/system/delisted route)",
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
