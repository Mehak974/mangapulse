import { NextRequest, NextResponse } from "next/server";
import { getScheduledDropsForDate, ScheduledDropItem } from "@/lib/mangaScheduleDb";

export const dynamic = "force-dynamic";

/**
 * MangaPulse Release Bot Cron Endpoint
 * Automatically triggered by Vercel Cron daily at 15:00 UTC (Shonen Jump drop hour).
 * Formats rich embeds and dispatches instant drop notifications to Discord / Webhooks.
 */
export async function GET(req: NextRequest) {
  return handleReleaseBot(req);
}

export async function POST(req: NextRequest) {
  return handleReleaseBot(req);
}

async function handleReleaseBot(req: NextRequest) {
  const url = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET;

  // 1. Secret authorization check (if configured)
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
    const queryKey = url.searchParams.get("key");

    if (bearerToken !== cronSecret && queryKey !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized. Provide valid CRON_SECRET via Authorization header or ?key= param." },
        { status: 401 }
      );
    }
  }

  // 2. Parse target date (defaults to current UTC date)
  let checkDate = new Date();
  const targetDateParam = url.searchParams.get("date");
  if (targetDateParam) {
    const parsed = new Date(targetDateParam);
    if (!isNaN(parsed.getTime())) {
      checkDate = parsed;
    }
  }

  // 3. Find today's drops
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
      dispatched: false,
      message: "No scheduled manga drops for this calendar date.",
    });
  }

  // 4. Build Discord Webhook Embeds
  // Discord allows up to 10 embeds per webhook post
  const embeds = drops.slice(0, 10).map((drop) => {
    const mangaUrl = `${siteUrl}/manga/${drop.slug}`;
    return {
      title: `${drop.title} — Chapter ${drop.latestChapter}`,
      url: mangaUrl,
      description: `New chapter released via **${drop.publisher}**.\nSerialization: **${drop.magazine}** (${drop.cadence} simulpub).`,
      color: 0x2563eb, // MangaPulse Electric Blue #2563eb
      fields: [
        {
          name: "Next Drop",
          value: `Chapter ${drop.nextChapter}`,
          inline: true,
        },
        {
          name: "Cadence",
          value: drop.cadence.toUpperCase(),
          inline: true,
        },
        {
          name: "Official Tracking",
          value: `[View Live Countdown & Legal Links](${mangaUrl})`,
          inline: false,
        },
      ],
      footer: {
        text: "MangaPulse • 100% Legal Manga Tracker & Release Directory",
      },
      timestamp: new Date().toISOString(),
    };
  });

  const discordPayload = {
    username: "MangaPulse Release Bot",
    avatar_url: `${siteUrl}/branding/logo.png`,
    content: `🚨 **NEW CHAPTERS OFFICIALLY RELEASED TODAY** (${drops.length} series updated)`,
    embeds,
  };

  // 5. Dispatch or return dry-run
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
        dispatched: true,
        message: `Successfully broadcasted ${drops.length} manga drop alerts to Discord webhook.`,
        drops,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to dispatch Discord webhook",
          details: errorMsg,
        },
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
    dispatched: false,
    dryRun: true,
    note: webhookUrl ? "Dry run executed (dryRun=true flag passed)." : "DISCORD_WEBHOOK_URL is not set. Set it in .env.local to enable real dispatch.",
    drops,
    samplePayload: discordPayload,
  });
}
