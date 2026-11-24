import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, recordAuditLog } from "@/lib/adminAuth";
import { query } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminRequest(req, true);
  if (errorResponse) return errorResponse;

  try {
    const delisted = await query(
      `SELECT manga_slug, is_delisted, reason, updated_at
       FROM public.manga_overrides
       WHERE is_delisted = true
       ORDER BY updated_at DESC;`
    );
    return NextResponse.json({ delisted });
  } catch (err: any) {
    console.error("Error fetching delisted manga:", err);
    return NextResponse.json({ error: "Failed to fetch DMCA delisted items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { admin, errorResponse } = await verifyAdminRequest(req, false);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, mangaSlug, reason } = body;

    if (!mangaSlug) {
      return NextResponse.json({ error: "mangaSlug is required." }, { status: 400 });
    }

    const cleanSlug = mangaSlug.toLowerCase().trim();

    if (action === "delist") {
      await query(
        `INSERT INTO public.manga_overrides (manga_slug, is_delisted, reason, updated_by, updated_at)
         VALUES ($1, true, $2, $3, NOW())
         ON CONFLICT (manga_slug) DO UPDATE SET
            is_delisted = true,
            reason = EXCLUDED.reason,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW();`,
        [cleanSlug, reason || "DMCA Takedown Notice", admin!.id]
      );

      await recordAuditLog(
        admin!.id,
        "DMCA_KILLSWITCH_ACTIVATED",
        cleanSlug,
        { reason: reason || "DMCA Takedown Notice" },
        admin!.ipAddress
      );

      return NextResponse.json({
        success: true,
        message: `Manga ${cleanSlug} is now delisted from all browse, search, and sitemap endpoints (returns 404/410).`,
      });
    }

    if (action === "restore") {
      await query(
        `UPDATE public.manga_overrides
         SET is_delisted = false, updated_by = $1, updated_at = NOW()
         WHERE manga_slug = $2;`,
        [admin!.id, cleanSlug]
      );

      await recordAuditLog(
        admin!.id,
        "DMCA_TITLE_RESTORED",
        cleanSlug,
        null,
        admin!.ipAddress
      );

      return NextResponse.json({
        success: true,
        message: `Manga ${cleanSlug} has been restored to public index.`,
      });
    }

    return NextResponse.json({ error: "Invalid DMCA action." }, { status: 400 });
  } catch (err: any) {
    console.error("Error updating DMCA status:", err);
    return NextResponse.json({ error: "Failed to execute DMCA action." }, { status: 500 });
  }
}
