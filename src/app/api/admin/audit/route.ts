import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { query } from "@/lib/serverDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { errorResponse } = await verifyAdminRequest(req, false);
  if (errorResponse) return errorResponse;

  try {
    const logs = await query(
      `SELECT 
        a.id,
        a.admin_id,
        p.username as admin_username,
        u.email as admin_email,
        a.action,
        a.target_id,
        a.details,
        a.ip_address,
        a.created_at
       FROM public.audit_logs a
       LEFT JOIN public.profiles p ON a.admin_id = p.id
       LEFT JOIN auth.users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 100;`
    );

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("Error fetching audit logs:", err);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
