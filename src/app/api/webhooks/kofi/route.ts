import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Ko-fi Webhook Handler
 * Verifies webhook signature with KOFI_VERIFICATION_TOKEN
 * and updates public.subscriptions table using the Supabase Service Role Key.
 */
export async function POST(req: NextRequest) {
  try {
    const kofiSecret = process.env.KOFI_VERIFICATION_TOKEN;
    if (!kofiSecret) {
      console.error("Missing KOFI_VERIFICATION_TOKEN in environment.");
      return NextResponse.json({ error: "Server webhook configuration error" }, { status: 500 });
    }

    // Ko-fi sends payload as x-www-form-urlencoded with a "data" string field,
    // or as raw JSON depending on configuration.
    let payloadRaw: string | null = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      payloadRaw = (formData.get("data") as string) || null;
    } else {
      const body = await req.json();
      payloadRaw = typeof body === "string" ? body : JSON.stringify(body);
    }

    if (!payloadRaw) {
      return NextResponse.json({ error: "Empty webhook payload" }, { status: 400 });
    }

    const data = typeof payloadRaw === "string" ? JSON.parse(payloadRaw) : payloadRaw;

    // 1. Signature / Verification Token Check
    if (data.verification_token !== kofiSecret) {
      console.warn("Invalid Ko-fi verification token received:", data.verification_token);
      return NextResponse.json({ error: "Unauthorized verification token" }, { status: 401 });
    }

    const {
      message_id,
      timestamp,
      type, // 'Donation', 'Subscription', 'Shop Order'
      is_subscription_payment,
      is_first_subscription_payment,
      kofi_transaction_id,
      email,
      amount,
      tier_name,
    } = data;

    console.log(`[Ko-fi Webhook] Received ${type} from ${email} (${amount} USD). Transaction: ${kofi_transaction_id}`);

    // 2. Connect via Supabase Service Role (Server-only bypass of RLS to grant verified entitlement)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not configured. Event acknowledged without DB sync.");
      return NextResponse.json({ success: true, note: "Webhook received; DB sync requires SUPABASE_SERVICE_ROLE_KEY." });
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // 3. Resolve user by email
    const { data: users, error: userError } = await adminSupabase.auth.admin.listUsers();
    if (userError) {
      console.error("Failed to list users for email resolution:", userError);
      return NextResponse.json({ error: "Database lookup failed" }, { status: 500 });
    }

    const matchedUser = users?.users?.find((u) => u.email?.toLowerCase() === email?.toLowerCase());

    if (!matchedUser) {
      console.log(`[Ko-fi Webhook] No matching MangaPulse user found for email: ${email}. Recorded for manual link.`);
      return NextResponse.json({ success: true, note: `User with email ${email} not found in MangaPulse.` });
    }

    // Determine tier
    let tier: "coffee" | "supporter" | "legend" = "coffee";
    const lowerTier = (tier_name || "").toLowerCase();
    const parsedAmount = parseFloat(amount || "0");

    if (lowerTier.includes("legend") || parsedAmount >= 15) {
      tier = "legend";
    } else if (lowerTier.includes("supporter") || parsedAmount >= 5) {
      tier = "supporter";
    }

    // Subscriptions have a 32-day cycle; one-time tips grant coffee tier
    const periodEnd = is_subscription_payment
      ? new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Upsert subscription record
    const { error: subError } = await adminSupabase.from("subscriptions").upsert(
      {
        user_id: matchedUser.id,
        provider: "kofi",
        provider_customer_id: email,
        provider_subscription_id: kofi_transaction_id || message_id,
        status: "active",
        tier,
        amount_cents: Math.round(parsedAmount * 100),
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    if (subError) {
      console.error("Failed to upsert subscription in database:", subError);
      return NextResponse.json({ error: "Failed to persist subscription" }, { status: 500 });
    }

    console.log(`[Ko-fi Webhook] Successfully activated ${tier} tier for user ${matchedUser.id} (${email})`);

    return NextResponse.json({
      success: true,
      message: `Supporter status activated for user ${matchedUser.id}`,
      tier,
      transaction_id: kofi_transaction_id,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Ko-fi webhook processing exception:", errorMsg);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
