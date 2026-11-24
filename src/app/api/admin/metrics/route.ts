import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { pool, query, queryOne } from "@/lib/serverDb";
import { VERIFIED_SCHEDULES } from "@/lib/mangaScheduleDb";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { admin, errorResponse } = await verifyAdminRequest(req, true);
  if (errorResponse) return errorResponse;

  try {
    if (!pool) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "";
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const [{ count: usersCount }, { data: activeBroadcast }, { count: delistedCount }] =
          await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase
              .from("sitewide_broadcasts")
              .select("id, message, level, is_active, updated_at")
              .eq("is_active", true)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase.from("manga_overrides").select("*", { count: "exact", head: true }).eq("is_delisted", true),
          ]);

        const activeCountdowns = VERIFIED_SCHEDULES.length - (delistedCount || 0);

        return NextResponse.json({
          metrics: {
            totalUsers: usersCount || 1,
            todayActive: 1,
            activeCountdowns: Math.max(0, activeCountdowns),
            pendingReports: 0,
            delistedCount: delistedCount || 0,
          },
          activeBroadcast: activeBroadcast || null,
          admin: {
            username: admin?.username,
            role: admin?.role,
          },
        });
      }
    }

    const [
      usersCountRes,
      todayActiveRes,
      delistedCountRes,
      deletedPostsRes,
      activeBroadcastRes,
    ] = await Promise.all([
      queryOne<{ count: string }>(`SELECT COUNT(*)::text as count FROM auth.users;`),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM public.profiles 
         WHERE last_login_at >= NOW() - INTERVAL '24 hours' OR created_at >= NOW() - INTERVAL '24 hours';`
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM public.manga_overrides WHERE is_delisted = true;`
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM public.forum_posts WHERE is_deleted = true;`
      ),
      queryOne<{
        id: string;
        message: string;
        level: string;
        is_active: boolean;
        updated_at: string;
      }>(
        `SELECT id, message, level, is_active, updated_at FROM public.sitewide_broadcasts 
         WHERE is_active = true ORDER BY updated_at DESC LIMIT 1;`
      ),
    ]);

    const totalUsers = parseInt(usersCountRes?.count || "0", 10);
    const todayActive = parseInt(todayActiveRes?.count || "0", 10);
    const delistedCount = parseInt(delistedCountRes?.count || "0", 10);
    const pendingReports = parseInt(deletedPostsRes?.count || "0", 10);
    const activeCountdowns = VERIFIED_SCHEDULES.length - delistedCount;

    return NextResponse.json({
      metrics: {
        totalUsers,
        todayActive,
        activeCountdowns: Math.max(0, activeCountdowns),
        pendingReports,
        delistedCount,
      },
      activeBroadcast: activeBroadcastRes || null,
      admin: {
        username: admin?.username,
        role: admin?.role,
      },
    });
  } catch (err: any) {
    console.error("Failed to fetch admin metrics:", err);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
