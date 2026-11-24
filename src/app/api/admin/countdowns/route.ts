import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, recordAuditLog } from "@/lib/adminAuth";
import { query } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminRequest(req, true);
  if (errorResponse) return errorResponse;

  try {
    const overrides = await query(
      `SELECT manga_slug, is_delisted, status_override, next_chapter_override, target_timestamp_override, reason, updated_at
       FROM public.manga_overrides
       ORDER BY updated_at DESC;`
    );
    return NextResponse.json({ overrides });
  } catch (err: any) {
    console.error("Error fetching manga overrides:", err);
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { admin, errorResponse } = await verifyAdminRequest(req, false);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, mangaSlug, payload } = body;

    if (action === "override") {
      if (!mangaSlug) {
        return NextResponse.json({ error: "mangaSlug is required" }, { status: 400 });
      }

      const { statusOverride, nextChapterOverride, targetTimestampOverride, reason } = payload || {};

      await query(
        `INSERT INTO public.manga_overrides (manga_slug, status_override, next_chapter_override, target_timestamp_override, reason, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (manga_slug) DO UPDATE SET
            status_override = EXCLUDED.status_override,
            next_chapter_override = EXCLUDED.next_chapter_override,
            target_timestamp_override = EXCLUDED.target_timestamp_override,
            reason = EXCLUDED.reason,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW();`,
        [
          mangaSlug.toLowerCase().trim(),
          statusOverride || null,
          nextChapterOverride !== undefined ? nextChapterOverride : null,
          targetTimestampOverride !== undefined ? targetTimestampOverride : null,
          reason || null,
          admin!.id,
        ]
      );

      await recordAuditLog(
        admin!.id,
        "RELEASE_OVERRIDE",
        mangaSlug,
        { statusOverride, nextChapterOverride, targetTimestampOverride, reason },
        admin!.ipAddress
      );

      return NextResponse.json({ success: true, message: `Countdown override saved for ${mangaSlug}.` });
    }

    if (action === "trigger_bot") {
      const cronSecret = process.env.CRON_SECRET;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

      if (!cronSecret) {
        return NextResponse.json(
          { error: "CRON_SECRET is not configured on the server." },
          { status: 500 }
        );
      }

      // Trigger the release-bot cron route
      const botResponse = await fetch(`${siteUrl}/api/cron/release-bot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
      });

      const result = await botResponse.json().catch(() => ({ status: "triggered" }));

      await recordAuditLog(
        admin!.id,
        "RELEASE_BOT_MANUAL_TRIGGER",
        null,
        { resultStatus: botResponse.status },
        admin!.ipAddress
      );

      return NextResponse.json({
        success: true,
        message: "Release bot executed successfully.",
        botResponse: result,
      });
    }

    return NextResponse.json({ error: "Invalid countdown action" }, { status: 400 });
  } catch (err: any) {
    console.error("Error in countdown action:", err);
    return NextResponse.json({ error: "Failed to perform countdown action" }, { status: 500 });
  }
}
