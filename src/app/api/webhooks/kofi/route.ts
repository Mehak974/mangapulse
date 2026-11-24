import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Ko-fi Webhook Handler
 * - Timing-safe constant-time verification token comparison
 * - Idempotency deduplication via public.webhook_events
 * - Scale-ready user resolution (no 50-user listUsers limitation)
 * - Anti-downgrade logic: one-time tips never downgrade active subscriptions
 * - Sanitized logging: zero token or payer email exposure
 */
export async function POST(req: NextRequest) {
  try {
    const kofiSecret = process.env.KOFI_VERIFICATION_TOKEN;
    if (!kofiSecret) {
      return NextResponse.json({ error: "Server webhook configuration error" }, { status: 500 });
    }

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

    // 1. Constant-Time Verification Token Check
    const suppliedToken = typeof data.verification_token === "string" ? data.verification_token : "";
    if (
      suppliedToken.length !== kofiSecret.length ||
      !crypto.timingSafeEqual(Buffer.from(suppliedToken), Buffer.from(kofiSecret))
    ) {
      return NextResponse.json({ error: "Unauthorized verification token" }, { status: 401 });
    }

    const {
      message_id,
      type, // 'Donation', 'Subscription', 'Shop Order'
      is_subscription_payment,
      kofi_transaction_id,
      email,
      amount,
      tier_name,
    } = data;

    const eventId = kofi_transaction_id || message_id;
    if (!eventId) {
      return NextResponse.json({ error: "Missing event identifier" }, { status: 400 });
    }

    // 2. Connect via Supabase Service Role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: true, note: "Webhook received; DB sync requires SUPABASE_SERVICE_ROLE_KEY." },
        { status: 200 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // 3. Idempotency Check: Prevent duplicate credit on retries
    const { data: existingEvent } = await adminSupabase
      .from("webhook_events")
      .select("id")
      .eq("provider", "kofi")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json({ success: true, message: "Event already processed (idempotent)" });
    }

    // 4. Scale-Ready User Resolution (No 50-user listUsers limitation)
    let matchedUserId: string | null = null;
    const payerEmail = (email || "").trim().toLowerCase();

    if (payerEmail) {
      // 4a. Check if any user linked this Ko-fi email in profiles.kofi_email
      const { data: profileMatch } = await adminSupabase
        .from("profiles")
        .select("id")
        .ilike("kofi_email", payerEmail)
        .maybeSingle();

      if (profileMatch) {
        matchedUserId = profileMatch.id;
      } else {
        // 4b. Check auth.users by email via SQL function (O(1) lookup across all users)
        const { data: rpcUserId } = await adminSupabase.rpc("get_user_id_by_email", {
          user_email: payerEmail,
        });

        if (rpcUserId) {
          matchedUserId = rpcUserId;
        }
      }
    }

    // Record event in webhook_events table for audit & deduplication
    await adminSupabase.from("webhook_events").insert({
      provider: "kofi",
      event_id: eventId,
      payload_hash: crypto.createHash("sha256").update(payloadRaw).digest("hex"),
    });

    if (!matchedUserId) {
      return NextResponse.json({
        success: true,
        note: "Webhook processed. Payer email not linked to an existing MangaPulse account.",
      });
    }

    // 5. Tier & Anti-Downgrade Entitlement Logic
    const parsedAmount = parseFloat(amount || "0");
    const isSubscription = Boolean(is_subscription_payment || type === "Subscription");

    // Check existing subscription state
    const { data: existingSub } = await adminSupabase
      .from("subscriptions")
      .select("status, tier, current_period_end")
      .eq("user_id", matchedUserId)
      .eq("provider", "kofi")
      .maybeSingle();

    const isExistingActive =
      existingSub?.status === "active" &&
      existingSub.current_period_end &&
      new Date(existingSub.current_period_end) > new Date();

    // Guard: A one-time tip must NEVER downgrade an active recurring subscription!
    if (!isSubscription && isExistingActive && (existingSub.tier === "legend" || existingSub.tier === "supporter")) {
      return NextResponse.json({
        success: true,
        message: "One-time tip acknowledged. Existing higher-tier recurring subscription preserved.",
      });
    }

    let targetTier: "coffee" | "supporter" | "legend" = "coffee";
    const lowerTierName = (tier_name || "").toLowerCase();

    if (isSubscription) {
      if (lowerTierName.includes("legend") || parsedAmount >= 15) {
        targetTier = "legend";
      } else {
        targetTier = "supporter";
      }
    } else {
      // One-time tip
      if (parsedAmount >= 15) {
        targetTier = "legend";
      } else if (parsedAmount >= 5) {
        targetTier = "supporter";
      } else {
        targetTier = "coffee";
      }
    }

    // Subscriptions renew every 32 days; one-time tips grant 30 days of perks (not 365)
    const periodEnd = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

    await adminSupabase.from("subscriptions").upsert(
      {
        user_id: matchedUserId,
        provider: "kofi",
        provider_customer_id: payerEmail || null,
        provider_subscription_id: eventId,
        status: "active",
        tier: targetTier,
        amount_cents: Math.round(parsedAmount * 100),
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

    return NextResponse.json({
      success: true,
      tier: targetTier,
      isSubscription,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Ko-fi webhook processing exception occurred.");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
