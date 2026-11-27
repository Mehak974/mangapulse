import { NextRequest, NextResponse } from "next/server";
import { getPromoStats, claimFoundingPatronSlot } from "@/lib/promoStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const email = searchParams.get("email") || undefined;
    const role = searchParams.get("role") || undefined;
    const createdAt = searchParams.get("createdAt") || undefined;

    const stats = getPromoStats(userId, email, role, createdAt);
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch promo stats" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, role, createdAt } = body || {};

    if (!userId) {
      return NextResponse.json({ error: "Missing required userId" }, { status: 400 });
    }

    const result = await claimFoundingPatronSlot(userId, email, role, createdAt);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to claim promotional slot" },
      { status: 500 }
    );
  }
}
