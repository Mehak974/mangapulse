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

    // Store security telemetry in private administrative table (never leaked via public profiles)
    await query(
      `INSERT INTO public.user_security_telemetry (user_id, last_login_ip, last_user_agent, auth_provider, signup_ip, last_login_at, updated_at)
       VALUES ($1, $2, $3, $4, $2, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET last_login_ip = EXCLUDED.last_login_ip,
           last_user_agent = EXCLUDED.last_user_agent,
           auth_provider = COALESCE(public.user_security_telemetry.auth_provider, EXCLUDED.auth_provider),
           last_login_at = NOW(),
           updated_at = NOW();`,
      [user.id, ip, userAgent, provider]
    );

    // Update public profile timestamp only (no IP or User-Agent stored on profiles)
    await query(
      `UPDATE public.profiles
       SET last_login_at = NOW(),
           auth_provider = COALESCE(auth_provider, $1),
           updated_at = NOW()
       WHERE id = $2;`,
      [provider, user.id]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Telemetry update error:", err);
    return NextResponse.json({ error: "Failed to record telemetry" }, { status: 500 });
  }
}
