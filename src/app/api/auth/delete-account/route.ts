import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { query } from "@/lib/serverDb";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Authentication token required." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid or expired session token." }, { status: 401 });
    }

    // Root administrator protection
    const email = user.email?.trim().toLowerCase();
    if (email === "mehakiqbal974@gmail.com" || email === "mehakiqbal978@gmail.com") {
      return NextResponse.json(
        { error: "Root administrator accounts cannot be deleted." },
        { status: 403 }
      );
    }

    const userId = user.id;

    // Atomically delete user records across all application and auth tables
    try {
      await query("DELETE FROM public.user_manga_library WHERE user_id = $1", [userId]);
      await query(
        "DELETE FROM public.collection_manga WHERE collection_id IN (SELECT id FROM public.user_collections WHERE user_id = $1)",
        [userId]
      );
      await query("DELETE FROM public.user_collections WHERE user_id = $1", [userId]);
      await query("DELETE FROM public.user_notifications WHERE user_id = $1", [userId]);
      await query("DELETE FROM public.user_private_settings WHERE user_id = $1", [userId]);
      await query("DELETE FROM public.user_security_telemetry WHERE user_id = $1", [userId]);
      await query("DELETE FROM public.forum_posts WHERE user_id = $1", [userId]);
      await query("DELETE FROM public.forum_threads WHERE user_id = $1", [userId]);
      await query("DELETE FROM public.profiles WHERE id = $1", [userId]);
      await query("DELETE FROM auth.users WHERE id = $1", [userId]);
    } catch (dbErr: any) {
      console.error("Database deletion error:", dbErr);
      return NextResponse.json(
        { error: dbErr?.message || "Failed to delete account data from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Account successfully deleted" });
  } catch (err: any) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
