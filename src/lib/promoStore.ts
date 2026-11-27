import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";

export const TOTAL_FOUNDING_SLOTS = 20;
export const INITIAL_CLAIMED_COUNT = 9;

export interface PromoState {
  claimedCount: number;
  claimedUsers: {
    userId: string;
    email?: string;
    claimedAt: string;
    expiresAt: string;
  }[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const PROMO_FILE = path.join(DATA_DIR, "promo_founding_patron.json");

export const ADMIN_EMAILS = [
  "mehakiqbal974@gmail.com",
  "mehakiqbal978@gmail.com",
];

function getStoredPromo(): PromoState {
  try {
    if (fs.existsSync(PROMO_FILE)) {
      const raw = fs.readFileSync(PROMO_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.claimedCount === "number") {
        return parsed;
      }
    }
  } catch {}

  return {
    claimedCount: INITIAL_CLAIMED_COUNT,
    claimedUsers: [],
  };
}

function savePromoState(state: PromoState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PROMO_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist promo state:", err);
  }
}

export function isAdminUser(email?: string | null, role?: string | null): boolean {
  if (role === "ADMIN") return true;
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(clean);
}

export function getPromoStats(userId?: string | null, userEmail?: string | null, userRole?: string | null) {
  const state = getStoredPromo();
  const isAdmin = isAdminUser(userEmail, userRole);

  const hasClaimed = Boolean(
    userId && state.claimedUsers.some((u) => u.userId === userId)
  );

  const effectiveCount = Math.max(INITIAL_CLAIMED_COUNT, state.claimedCount);
  const remaining = Math.max(0, TOTAL_FOUNDING_SLOTS - effectiveCount);
  const isEligible = Boolean(userId && !isAdmin && !hasClaimed && remaining > 0);

  return {
    totalSlots: TOTAL_FOUNDING_SLOTS,
    claimedCount: effectiveCount,
    remainingSlots: remaining,
    isEligible,
    hasClaimed,
    isAdmin,
  };
}

export async function claimFoundingPatronSlot(
  userId: string,
  userEmail?: string | null,
  userRole?: string | null
): Promise<{ success: boolean; remainingSlots: number; message: string; expiresAt?: string }> {
  if (!userId) {
    return { success: false, remainingSlots: 0, message: "User ID is required" };
  }

  if (isAdminUser(userEmail, userRole)) {
    return {
      success: true,
      remainingSlots: getPromoStats().remainingSlots,
      message: "Admin accounts already enjoy permanent Patron privileges.",
    };
  }

  const state = getStoredPromo();

  if (state.claimedUsers.some((u) => u.userId === userId)) {
    const existing = state.claimedUsers.find((u) => u.userId === userId);
    return {
      success: true,
      remainingSlots: Math.max(0, TOTAL_FOUNDING_SLOTS - state.claimedCount),
      message: "You have already claimed your 1-Month Free Patron Pass!",
      expiresAt: existing?.expiresAt,
    };
  }

  if (state.claimedCount >= TOTAL_FOUNDING_SLOTS) {
    return {
      success: false,
      remainingSlots: 0,
      message: "All 20 Founding Member Passes have already been claimed.",
    };
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 Days

  state.claimedCount += 1;
  state.claimedUsers.push({
    userId,
    email: userEmail || undefined,
    claimedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  });

  savePromoState(state);

  // Sync with Supabase profiles table if available
  if (supabase) {
    try {
      await supabase
        .from("profiles")
        .update({
          is_supporter: true,
          supporter_tier: "patron",
          updated_at: now.toISOString(),
        })
        .eq("id", userId);
    } catch (err) {
      console.warn("Could not sync promo claim to Supabase profiles:", err);
    }
  }

  return {
    success: true,
    remainingSlots: Math.max(0, TOTAL_FOUNDING_SLOTS - state.claimedCount),
    message: "Congratulations! 1 Month of Free Manga Patron mode has been unlocked.",
    expiresAt: expires.toISOString(),
  };
}
