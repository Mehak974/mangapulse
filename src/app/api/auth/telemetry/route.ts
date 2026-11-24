import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp } from "@/lib/adminAuth";
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
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid user token" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || null;
    const provider = user.app_metadata?.provider || "email";

    await query(
      `UPDATE public.profiles
       SET last_login_at = NOW(),
           last_login_ip = $1,
           last_user_agent = $2,
           auth_provider = COALESCE(auth_provider, $3),
           signup_ip = COALESCE(signup_ip, $1),
           updated_at = NOW()
       WHERE id = $4;`,
      [ip, userAgent, provider, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Telemetry update error:", err);
    return NextResponse.json({ error: "Failed to record telemetry" }, { status: 500 });
  }
}
