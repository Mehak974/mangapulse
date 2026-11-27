import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabase";

export const TOTAL_FOUNDING_SLOTS = 20;

export interface PromoState {
  claimedUsers: {
    userId: string;
    email?: string;
    claimedAt: string;
    expiresAt: string;
    isFoundingCohort?: boolean;
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
      if (parsed && Array.isArray(parsed.claimedUsers)) {
        return parsed;
      }
    }
  } catch {}

  return {
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

export function getPromoStats(
  userId?: string | null,
  userEmail?: string | null,
  userRole?: string | null,
  userCreatedAt?: string | null
) {
  const state = getStoredPromo();
  const isAdmin = isAdminUser(userEmail, userRole);

  const hasClaimed = Boolean(
    userId && state.claimedUsers.some((u) => u.userId === userId)
  );

  // Check if user is part of the founding 9 cohort (registered on or before 2026-11-27 04:00 UTC)
  const isFoundingCohort = Boolean(
    userCreatedAt && new Date(userCreatedAt).getTime() <= new Date("2026-11-27T04:00:00.000Z").getTime()
  );

  // 9 reserved slots for original members, 11 for new users
  const foundingClaims = state.claimedUsers.filter((u) => u.isFoundingCohort).length;
  const newClaims = state.claimedUsers.filter((u) => !u.isFoundingCohort).length;

  const foundingRemaining = Math.max(0, 9 - foundingClaims);
  const newRemaining = Math.max(0, 11 - newClaims);

  // For founding cohort users, they are always eligible to see their celebratory patron modal unless dismissed/claimed locally
  // For new users, they are eligible if open slots remain and they haven't claimed yet
  const isEligible = isFoundingCohort
    ? !isAdmin
    : Boolean(userId && !isAdmin && !hasClaimed && newRemaining > 0);

  const remaining = isFoundingCohort ? 9 : newRemaining;

  return {
    totalSlots: TOTAL_FOUNDING_SLOTS,
    claimedCount: state.claimedUsers.length,
    remainingSlots: remaining,
    foundingRemaining,
    newRemaining,
    isEligible,
    hasClaimed,
    isAdmin,
    isFoundingCohort,
    alreadyGranted: isFoundingCohort,
  };
}

export async function claimFoundingPatronSlot(
  userId: string,
  userEmail?: string | null,
  userRole?: string | null,
  userCreatedAt?: string | null
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
      remainingSlots: Math.max(0, TOTAL_FOUNDING_SLOTS - state.claimedUsers.length),
      message: "You have already claimed your 1-Month Free Patron Pass!",
      expiresAt: existing?.expiresAt,
    };
  }

  if (state.claimedUsers.length >= TOTAL_FOUNDING_SLOTS) {
    return {
      success: false,
      remainingSlots: 0,
      message: "All 20 Founding Member Passes have already been claimed.",
    };
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 Days

  const isFoundingCohort = Boolean(
    userCreatedAt && new Date(userCreatedAt).getTime() <= new Date("2026-11-27T04:00:00.000Z").getTime()
  );

  state.claimedUsers.push({
    userId,
    email: userEmail || undefined,
    claimedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    isFoundingCohort,
  });

  savePromoState(state);

  // Directly update profiles in Postgres using serverDb pool (bypasses RLS)
  try {
    const { query } = await import("@/lib/serverDb");
    await query(
      `UPDATE profiles SET is_supporter = true, supporter_tier = 'patron', updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  } catch (err) {
    console.warn("Could not sync promo claim to Postgres profiles:", err);
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
      } catch (subErr) {
        console.warn("Supabase fallback failed:", subErr);
      }
    }
  }

  return {
    success: true,
    remainingSlots: Math.max(0, TOTAL_FOUNDING_SLOTS - state.claimedUsers.length),
    message: "Congratulations! 1 Month of Free Manga Patron mode has been unlocked.",
    expiresAt: expires.toISOString(),
  };
}
