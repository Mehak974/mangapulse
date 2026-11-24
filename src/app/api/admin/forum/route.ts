import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, recordAuditLog } from "@/lib/adminAuth";
import { query } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminRequest(req, true);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "threads"; // 'threads' | 'posts'
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "40", 10)));

    if (mode === "posts") {
      const posts = await query(
        `SELECT 
          p.id,
          p.thread_id,
          p.author_id,
          pr.username as author_username,
          pr.role as author_role,
          p.content,
          p.is_deleted,
          p.deleted_at,
          p.created_at,
          t.title as thread_title
         FROM public.forum_posts p
         JOIN public.profiles pr ON p.author_id = pr.id
         JOIN public.forum_threads t ON p.thread_id = t.id
         ORDER BY p.created_at DESC
         LIMIT $1;`,
        [limit]
      );
      return NextResponse.json({ posts });
    }

    const threads = await query(
      `SELECT 
        t.id,
        t.category_id,
        t.author_id,
        pr.username as author_username,
        pr.role as author_role,
        t.title,
        t.content,
        t.is_pinned,
        t.is_locked,
        t.is_deleted,
        t.deleted_at,
        t.views_count,
        t.replies_count,
        t.created_at
       FROM public.forum_threads t
       JOIN public.profiles pr ON t.author_id = pr.id
       ORDER BY t.is_pinned DESC, t.created_at DESC
       LIMIT $1;`,
      [limit]
    );

    return NextResponse.json({ threads });
  } catch (err: any) {
    console.error("Error fetching forum moderation items:", err);
    return NextResponse.json({ error: "Failed to fetch forum items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { admin, errorResponse } = await verifyAdminRequest(req, true);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, targetId, payload } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    if (action === "pin_thread") {
      const isPinned = Boolean(payload?.isPinned);
      await query(`UPDATE public.forum_threads SET is_pinned = $1 WHERE id = $2;`, [isPinned, targetId]);
      await recordAuditLog(admin!.id, isPinned ? "THREAD_PINNED" : "THREAD_UNPINNED", targetId, null, admin!.ipAddress);
      return NextResponse.json({ success: true, message: isPinned ? "Thread pinned." : "Thread unpinned." });
    }

    if (action === "lock_thread") {
      const isLocked = Boolean(payload?.isLocked);
      await query(`UPDATE public.forum_threads SET is_locked = $1 WHERE id = $2;`, [isLocked, targetId]);
      await recordAuditLog(admin!.id, isLocked ? "THREAD_LOCKED" : "THREAD_UNLOCKED", targetId, null, admin!.ipAddress);
      return NextResponse.json({ success: true, message: isLocked ? "Thread locked." : "Thread unlocked." });
    }

    if (action === "delete_thread") {
      await query(
        `UPDATE public.forum_threads 
         SET is_deleted = true, deleted_at = NOW(), deleted_by = $1, title = '[Thread removed by moderator]' 
         WHERE id = $2;`,
        [admin!.id, targetId]
      );
      await recordAuditLog(admin!.id, "THREAD_SOFT_DELETED", targetId, null, admin!.ipAddress);
      return NextResponse.json({ success: true, message: "Thread soft-deleted." });
    }

    if (action === "delete_post") {
      await query(
        `UPDATE public.forum_posts 
         SET is_deleted = true, deleted_at = NOW(), deleted_by = $1, content = '[Post removed by moderator]' 
         WHERE id = $2;`,
        [admin!.id, targetId]
      );
      await recordAuditLog(admin!.id, "POST_SOFT_DELETED", targetId, null, admin!.ipAddress);
      return NextResponse.json({ success: true, message: "Post soft-deleted." });
    }

    if (action === "purge_user_posts") {
      const authorId = targetId;
      await query(
        `UPDATE public.forum_posts 
         SET is_deleted = true, deleted_at = NOW(), deleted_by = $1, content = '[Post purged by moderator]' 
         WHERE author_id = $2;`,
        [admin!.id, authorId]
      );
      await query(
        `UPDATE public.forum_threads 
         SET is_deleted = true, deleted_at = NOW(), deleted_by = $1, title = '[Thread purged by moderator]' 
         WHERE author_id = $2;`,
        [admin!.id, authorId]
      );
      await recordAuditLog(admin!.id, "USER_POSTS_PURGED", authorId, null, admin!.ipAddress);
      return NextResponse.json({ success: true, message: "All posts by user purged." });
    }

    return NextResponse.json({ error: "Invalid forum moderation action." }, { status: 400 });
  } catch (err: any) {
    console.error("Error in forum moderation action:", err);
    return NextResponse.json({ error: "Failed to perform forum moderation" }, { status: 500 });
  }
}
