import { NextRequest, NextResponse } from "next/server";
import { getScheduledDropsForDate, ScheduledDropItem } from "@/lib/mangaScheduleDb";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * MangaPulse Release Bot Cron Endpoint
 * Automatically triggered by Vercel Cron daily at 15:00 UTC (Shonen Jump drop hour).
 * - Fails closed: Rejects requests unless valid CRON_SECRET is provided via Authorization Bearer
 * - Prunes expired supporter subscriptions
 * - Formats rich embeds and dispatches instant drop notifications to Discord Webhook
 */
export async function GET(req: NextRequest) {
  return handleReleaseBot(req);
}

export async function POST(req: NextRequest) {
  return handleReleaseBot(req);
}

async function handleReleaseBot(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // 1. Fail Closed Security Check
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron execution disabled: CRON_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : "";

  if (
    bearerToken.length !== cronSecret.length ||
    !crypto.timingSafeEqual(Buffer.from(bearerToken), Buffer.from(cronSecret))
  ) {
    return NextResponse.json(
      { error: "Unauthorized. Valid Bearer token required in Authorization header." },
      { status: 401 }
    );
  }

  // 2. Automated Subscription Expiry Cleanup
  let expiredCount = 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
      const nowIso = new Date().toISOString();
      const { data: expiredRows, error: expireError } = await adminSupabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: nowIso })
        .eq("status", "active")
        .lt("current_period_end", nowIso)
        .select("id");

      if (!expireError && expiredRows) {
        expiredCount = expiredRows.length;
      }
    } catch (err) {
      console.warn("Subscription expiry pruning exception:", err);
    }
  }

  // 3. Parse target date (defaults to current UTC date)
  const url = new URL(req.url);
  let checkDate = new Date();
  const targetDateParam = url.searchParams.get("date");
  if (targetDateParam) {
    const parsed = new Date(targetDateParam);
    if (!isNaN(parsed.getTime())) {
      checkDate = parsed;
    }
  }

  // 4. Find today's drops
  const drops = getScheduledDropsForDate(checkDate);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mangapulse.vercel.app";
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const isDryRun = url.searchParams.get("dryRun") === "true" || !webhookUrl;

  if (drops.length === 0) {
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dateChecked: checkDate.toISOString(),
      dropsCount: 0,
      expiredSubscriptionsPruned: expiredCount,
      dispatched: false,
      message: "No scheduled manga drops for this calendar date.",
    });
  }

  // 5. Generate In-App User Notifications for Tracked Library Series
  let inAppNotifsCreated = 0;
  if (supabaseUrl && serviceRoleKey && drops.length > 0) {
    try {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
      for (const drop of drops) {
        const { data: libraryUsers } = await adminSupabase
          .from("user_manga_library")
          .select("user_id")
          .eq("manga_id", drop.id);

        if (libraryUsers && libraryUsers.length > 0) {
          const notifs = libraryUsers.map((u) => ({
            user_id: u.user_id,
            manga_id: drop.id,
            title: `${drop.title} Chapter ${drop.latestChapter}`,
            message: `New chapter officially released on ${drop.publisher}.`,
            url: `/manga/${drop.slug}`,
            type: "release",
            is_read: false,
          }));

          await adminSupabase.from("user_notifications").insert(notifs);
          inAppNotifsCreated += notifs.length;
        }
      }
    } catch (err) {
      console.warn("Could not record in-app drop notifications:", err);
    }
  }

  // 6. Build Discord Webhook Embeds (up to 10 embeds per Discord webhook call)
  const embeds = drops.slice(0, 10).map((drop) => {
    const mangaUrl = `${siteUrl}/manga/${drop.slug}`;
    return {
      title: `${drop.title} — Chapter ${drop.latestChapter}`,
      url: mangaUrl,
      description: `New chapter released via **${drop.publisher}**.\nSerialization: **${drop.magazine}** (${drop.cadence} simulpub).`,
      color: 0x2563eb,
      fields: [
        { name: "Next Drop", value: `Chapter ${drop.nextChapter}`, inline: true },
        { name: "Cadence", value: drop.cadence.toUpperCase(), inline: true },
        { name: "Official Tracking", value: `[View Live Countdown & Legal Links](${mangaUrl})`, inline: false },
      ],
      footer: { text: "MangaPulse • 100% Legal Manga Tracker & Release Directory" },
      timestamp: new Date().toISOString(),
    };
  });

  const discordPayload = {
    username: "MangaPulse Release Bot",
    avatar_url: `${siteUrl}/branding/logo.png`,
    content: `🚨 **NEW CHAPTERS OFFICIALLY RELEASED TODAY** (${drops.length} series updated)`,
    embeds,
  };

  // 6. Dispatch or return dry-run
  if (!isDryRun && webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          {
            success: false,
            error: `Discord webhook failed with HTTP ${response.status}`,
            details: errorText,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        dateChecked: checkDate.toISOString(),
        dropsCount: drops.length,
        expiredSubscriptionsPruned: expiredCount,
        inAppNotificationsCreated: inAppNotifsCreated,
        dispatched: true,
        message: `Successfully broadcasted ${drops.length} manga drop alerts to Discord webhook.`,
        drops,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { success: false, error: "Failed to dispatch Discord webhook", details: errorMsg },
        { status: 500 }
      );
    }
  }

  // Dry run or webhook unconfigured
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    dateChecked: checkDate.toISOString(),
    dropsCount: drops.length,
    expiredSubscriptionsPruned: expiredCount,
    inAppNotificationsCreated: inAppNotifsCreated,
    dispatched: false,
    dryRun: true,
    note: webhookUrl ? "Dry run executed." : "DISCORD_WEBHOOK_URL is not set.",
    drops,
    samplePayload: discordPayload,
  });
}
