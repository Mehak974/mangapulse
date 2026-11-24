import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, recordAuditLog } from "@/lib/adminAuth";
import { query, queryOne } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

/**
 * Public & Admin GET endpoint:
 * Anyone can fetch the current active broadcast banner.
 */
export async function GET(req: NextRequest) {
  try {
    const active = await queryOne<{
      id: string;
      message: string;
      level: string;
      is_active: boolean;
      updated_at: string;
    }>(
      `SELECT id, message, level, is_active, updated_at 
       FROM public.sitewide_broadcasts 
       WHERE is_active = true 
       ORDER BY updated_at DESC LIMIT 1;`
    );

    return NextResponse.json({ broadcast: active || null });
  } catch (err: any) {
    console.error("Error fetching sitewide broadcast:", err);
    return NextResponse.json({ broadcast: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { admin, errorResponse } = await verifyAdminRequest(req, false);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, message, level, is_active } = body;

    if (action === "clear") {
      await query(`UPDATE public.sitewide_broadcasts SET is_active = false, updated_at = NOW();`);

      await recordAuditLog(
        admin!.id,
        "BROADCAST_CLEARED",
        null,
        null,
        admin!.ipAddress
      );

      return NextResponse.json({ success: true, message: "Sitewide broadcast cleared." });
    }

    if (action === "update") {
      if (!message || typeof message !== "string") {
        return NextResponse.json({ error: "Message is required." }, { status: 400 });
      }

      const broadcastLevel = ["info", "warning", "critical"].includes(level) ? level : "info";
      const activeState = Boolean(is_active);

      // Set previous broadcasts to inactive if new one is active
      if (activeState) {
        await query(`UPDATE public.sitewide_broadcasts SET is_active = false WHERE is_active = true;`);
      }

      const inserted = await queryOne(
        `INSERT INTO public.sitewide_broadcasts (message, level, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, message, level, is_active, updated_at;`,
        [message.trim(), broadcastLevel, activeState, admin!.id]
      );

      await recordAuditLog(
        admin!.id,
        "BROADCAST_UPDATED",
        inserted?.id || null,
        { message, level: broadcastLevel, is_active: activeState },
        admin!.ipAddress
      );

      return NextResponse.json({
        success: true,
        message: "Sitewide broadcast published.",
        broadcast: inserted,
      });
    }

    return NextResponse.json({ error: "Invalid broadcast action." }, { status: 400 });
  } catch (err: any) {
    console.error("Error updating broadcast:", err);
    return NextResponse.json({ error: "Failed to update broadcast." }, { status: 500 });
  }
}
