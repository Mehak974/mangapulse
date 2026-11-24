import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, recordAuditLog } from "@/lib/adminAuth";
import { query, queryOne } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { admin, errorResponse } = await verifyAdminRequest(req, true);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim() || "";
    const filter = searchParams.get("filter")?.trim() || "all";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    let whereConditions: string[] = ["1=1"];
    const params: any[] = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const idx = params.length;
      whereConditions.push(
        `(LOWER(p.username) LIKE $${idx} OR LOWER(u.email) LIKE $${idx} OR p.last_login_ip LIKE $${idx} OR p.signup_ip LIKE $${idx})`
      );
    }

    if (filter === "banned") {
      whereConditions.push("p.is_banned = true");
    } else if (filter === "staff") {
      whereConditions.push("p.role IN ('ADMIN', 'MODERATOR')");
    } else if (filter === "supporter") {
      whereConditions.push("(p.role = 'SUPPORTER' OR p.is_supporter = true)");
    }

    const whereClause = whereConditions.join(" AND ");

    const users = await query(
      `SELECT 
        p.id,
        u.email,
        p.username,
        p.display_name,
        p.role,
        p.is_supporter,
        p.supporter_tier,
        p.created_at,
        p.last_login_at,
        p.last_login_ip,
        p.last_user_agent,
        p.signup_ip,
        p.auth_provider,
        p.is_banned,
        p.is_shadow_banned,
        p.ban_reason,
        p.banned_at
       FROM public.profiles p
       JOIN auth.users u ON p.id = u.id
       WHERE ${whereClause}
       ORDER BY p.last_login_at DESC NULLS LAST, p.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2};`,
      [...params, limit, offset]
    );

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("Error fetching users list:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { admin, errorResponse } = await verifyAdminRequest(req, false);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, targetUserId, payload } = body;

    if (!action || !targetUserId) {
      return NextResponse.json({ error: "Missing required parameters: action and targetUserId." }, { status: 400 });
    }

    // Protect against self-demotion or banning own account
    if (targetUserId === admin!.id && (action === "ban" || action === "change_role" || action === "purge")) {
      return NextResponse.json({ error: "Cannot perform destructive action on your own admin account." }, { status: 400 });
    }

    if (action === "change_role") {
      const { newRole } = payload || {};
      if (!["USER", "SUPPORTER", "MODERATOR", "ADMIN"].includes(newRole)) {
        return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
      }

      await query(`UPDATE public.profiles SET role = $1, updated_at = NOW() WHERE id = $2;`, [newRole, targetUserId]);

      await recordAuditLog(
        admin!.id,
        "ROLE_CHANGED",
        targetUserId,
        { previousAction: "change_role", assignedRole: newRole },
        admin!.ipAddress
      );

      return NextResponse.json({ success: true, message: `User role updated to ${newRole}.` });
    }

    if (action === "ban") {
      const reason = payload?.reason || "Violation of Community Guidelines";
      await query(
        `UPDATE public.profiles 
         SET is_banned = true, ban_reason = $1, banned_at = NOW(), banned_by = $2, updated_at = NOW() 
         WHERE id = $3;`,
        [reason, admin!.id, targetUserId]
      );

      await recordAuditLog(
        admin!.id,
        "USER_BANNED",
        targetUserId,
        { reason },
        admin!.ipAddress
      );

      return NextResponse.json({ success: true, message: "User hard-banned successfully." });
    }

    if (action === "unban") {
      await query(
        `UPDATE public.profiles 
         SET is_banned = false, ban_reason = null, banned_at = null, banned_by = null, updated_at = NOW() 
         WHERE id = $1;`,
        [targetUserId]
      );

      await recordAuditLog(
        admin!.id,
        "USER_UNBANNED",
        targetUserId,
        null,
        admin!.ipAddress
      );

      return NextResponse.json({ success: true, message: "User unbanned successfully." });
    }

    if (action === "shadowban") {
      const isShadowBanned = Boolean(payload?.isShadowBanned);
      await query(
        `UPDATE public.profiles 
         SET is_shadow_banned = $1, updated_at = NOW() 
         WHERE id = $2;`,
        [isShadowBanned, targetUserId]
      );

      await recordAuditLog(
        admin!.id,
        isShadowBanned ? "USER_SHADOWBANNED" : "USER_UNSHADOWBANNED",
        targetUserId,
        { isShadowBanned },
        admin!.ipAddress
      );

      return NextResponse.json({
        success: true,
        message: isShadowBanned ? "User shadowbanned." : "User shadowban lifted.",
      });
    }

    if (action === "purge") {
      // GDPR Data Purge: cascade delete user's data
      await query(`DELETE FROM public.user_manga_library WHERE user_id = $1;`, [targetUserId]);
      await query(`DELETE FROM public.user_collections WHERE user_id = $1;`, [targetUserId]);
      await query(`DELETE FROM public.user_notifications WHERE user_id = $1;`, [targetUserId]);
      await query(`DELETE FROM public.forum_posts WHERE author_id = $1;`, [targetUserId]);
      await query(`DELETE FROM public.forum_threads WHERE author_id = $1;`, [targetUserId]);
      await query(`DELETE FROM public.profiles WHERE id = $1;`, [targetUserId]);

      await recordAuditLog(
        admin!.id,
        "USER_PURGED_GDPR",
        targetUserId,
        { note: "Permanently erased all user libraries, posts, collections, and profile data." },
        admin!.ipAddress
      );

      return NextResponse.json({ success: true, message: "User data permanently purged under GDPR compliance." });
    }

    return NextResponse.json({ error: "Unrecognized admin user action." }, { status: 400 });
  } catch (err: any) {
    console.error("Error executing admin user action:", err);
    return NextResponse.json({ error: "Failed to execute user action." }, { status: 500 });
  }
}
