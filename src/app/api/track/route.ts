import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// In-memory counter for traffic stats aggregated by publisher
const outboundClickStats = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { publisher, mangaTitle, targetUrl } = body;

    if (!publisher) {
      return NextResponse.json({ error: "Missing publisher" }, { status: 400 });
    }

    // Increment in-memory counter
    const current = outboundClickStats.get(publisher) || 0;
    outboundClickStats.set(publisher, current + 1);

    console.log(
      `[Outbound Click] -> Publisher: "${publisher}" | Manga: "${mangaTitle || "Unknown"}" | Total for publisher: ${current + 1}`
    );

    // If Supabase is configured and table exists, record event asynchronously
    if (supabase) {
      Promise.resolve(
        supabase.from("outbound_click_events").insert({
          publisher,
          manga_title: mangaTitle || null,
          target_url: targetUrl || null,
          created_at: new Date().toISOString(),
        })
      ).catch((err: any) => {
        // Silent catch so client is never blocked
        console.debug("Supabase outbound click logging note:", err?.message);
      });
    }

    return NextResponse.json({ success: true, count: current + 1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  // Read aggregated stats
  const stats: Record<string, number> = {};
  for (const [pub, count] of outboundClickStats.entries()) {
    stats[pub] = count;
  }
  return NextResponse.json({ outboundStats: stats });
}
