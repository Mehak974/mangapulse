import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { pool, query, queryOne } from "@/lib/serverDb";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  username: string;
  role: "ADMIN" | "MODERATOR";
  ipAddress: string;
}

/**
 * Extracts client IP from standard reverse proxy and Cloudflare headers.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}

/**
 * Authenticates an incoming API request to verify the user has the ADMIN role.
 * Validates Supabase JWT from Authorization: Bearer <token>.
 */
export async function verifyAdminRequest(
  req: NextRequest,
  allowModerator: boolean = false
): Promise<{ admin: AuthenticatedAdmin | null; errorResponse?: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
  const ipAddress = getClientIp(req);

  if (!token) {
    return {
      admin: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Missing authentication token." },
        { status: 401 }
      ),
    };
  }

  try {
    // 1. Verify token with Supabase Auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        admin: null,
        errorResponse: NextResponse.json(
          { error: "Unauthorized: Invalid or expired session token." },
          { status: 401 }
        ),
      };
    }

    // 2. Query user profile role & banned status directly from Postgres (or Supabase client fallback)
    let profile: {
      id: string;
      username: string;
      role: string;
      is_banned: boolean;
    } | null = null;

    if (pool) {
      profile = await queryOne<{
        id: string;
        username: string;
        role: string;
        is_banned: boolean;
      }>(
        `SELECT id, username, role, is_banned FROM public.profiles WHERE id = $1 LIMIT 1;`,
        [user.id]
      );
    } else {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, role, is_banned")
        .eq("id", user.id)
        .single();
      if (data) {
        profile = {
          id: data.id,
          username: data.username,
          role: data.role,
          is_banned: Boolean(data.is_banned),
        };
      }
    }

    const isOwnerEmail =
      user.email?.toLowerCase() === "mehakiqbal974@gmail.com" ||
      user.email?.toLowerCase() === "mehakiqbal978@gmail.com";

    if (!profile) {
      if (isOwnerEmail) {
        profile = {
          id: user.id,
          username: user.email?.split("@")[0] || "Admin",
          role: "ADMIN",
          is_banned: false,
        };
      } else {
        return {
          admin: null,
          errorResponse: NextResponse.json(
            { error: "Forbidden: User profile not found." },
            { status: 403 }
          ),
        };
      }
    }

    // Owner email always has master ADMIN role
    if (isOwnerEmail) {
      profile.role = "ADMIN";
    }

    if (profile.is_banned) {
      return {
        admin: null,
        errorResponse: NextResponse.json(
          { error: "Forbidden: Account has been suspended." },
          { status: 403 }
        ),
      };
    }

    const isAllowed = allowModerator
      ? profile.role === "ADMIN" || profile.role === "MODERATOR"
      : profile.role === "ADMIN";

    if (!isAllowed) {
      return {
        admin: null,
        errorResponse: NextResponse.json(
          { error: "Forbidden: Administrator privileges required." },
          { status: 403 }
        ),
      };
    }

    return {
      admin: {
        id: profile.id,
        email: user.email || "",
        username: profile.username || "Admin",
        role: profile.role as "ADMIN" | "MODERATOR",
        ipAddress,
      },
    };
  } catch (err: any) {
    console.error("verifyAdminRequest error:", err);
    return {
      admin: null,
      errorResponse: NextResponse.json(
        { error: "Internal server error during authorization verification." },
        { status: 500 }
      ),
    };
  }
}

/**
 * Records an immutable administrative action to public.audit_logs
 */
export async function recordAuditLog(
  adminId: string,
  action: string,
  targetId: string | null = null,
  details: Record<string, any> | null = null,
  ipAddress: string = "127.0.0.1"
): Promise<void> {
  try {
    if (pool) {
      await query(
        `INSERT INTO public.audit_logs (admin_id, action, target_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5);`,
        [adminId, action, targetId, details ? JSON.stringify(details) : null, ipAddress]
      );
    } else {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.from("audit_logs").insert({
        admin_id: adminId,
        action,
        target_id: targetId,
        details: details || null,
        ip_address: ipAddress,
      });
    }
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
