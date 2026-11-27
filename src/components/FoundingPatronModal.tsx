"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Crown, Sparkles, X, Check, ShieldCheck, Zap, BookOpen } from "lucide-react";

export default function FoundingPatronModal() {
  const { user, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [remainingSlots, setRemainingSlots] = useState<number>(11);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!user || !user.id) return;

    // Admins do not count or need promo popup (they already have permanent patron)
    const isAdmin =
      user.role === "ADMIN" ||
      user.email?.toLowerCase() === "mehakiqbal974@gmail.com" ||
      user.email?.toLowerCase() === "mehakiqbal978@gmail.com";

    if (isAdmin) return;

    // Check if already claimed in local storage
    const storageKey = `mangapulse_founding_patron_claimed_${user.id}`;
    const alreadyClaimedLocal = localStorage.getItem(storageKey);
    const dismissedKey = `mangapulse_founding_patron_dismissed_${user.id}`;
    const alreadyDismissed = sessionStorage.getItem(dismissedKey);

    if (alreadyClaimedLocal || alreadyDismissed) return;

    // If user already has Patron or is a paying supporter, do not interrupt
    if (user.is_supporter && user.supporter_tier === "patron") return;

    // Query live promo status
    fetch(`/api/promo/founding-patron?userId=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email || "")}&role=${encodeURIComponent(user.role || "")}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.remainingSlots === "number") {
          setRemainingSlots(data.remainingSlots);
          if (data.isEligible && data.remainingSlots > 0) {
            // Delay slightly after mount for a smooth arrival experience
            const timer = setTimeout(() => setIsOpen(true), 800);
            return () => clearTimeout(timer);
          }
        }
      })
      .catch(() => {});
  }, [user]);

  const handleDismiss = () => {
    if (user?.id) {
      sessionStorage.setItem(`mangapulse_founding_patron_dismissed_${user.id}`, "true");
    }
    setIsOpen(false);
  };

  const handleClaim = async () => {
    if (!user || !user.id || isClaiming) return;
    setIsClaiming(true);

    try {
      const res = await fetch("/api/promo/founding-patron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Upgrade client state immediately
        await updateProfile({
          is_supporter: true,
          supporter_tier: "patron",
        });

        localStorage.setItem(`mangapulse_founding_patron_claimed_${user.id}`, "true");
        setIsSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 2200);
      }
    } catch (err) {
      console.warn("Failed to claim promo:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e121a] border border-[#2a3344] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Luxury Glow Background Accent */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-amber-500/15 via-purple-500/10 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg bg-[#1a202c]/80 hover:bg-[#2d3748] border border-[#2a3344] text-[#94a1b5] hover:text-white transition-colors flex items-center justify-center z-10"
          aria-label="Close promotion dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-6 relative z-10">
          {/* Header Badge & Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 via-purple-500/20 to-blue-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.3)]">
                <Crown className="w-8 h-8 animate-bounce duration-1000" />
              </div>
              <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25">
              <span>🎉 Special Launch Promotion</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              Congratulations! You Fall Under Our Special Promotion
            </h2>

            <p className="text-xs sm:text-sm text-[#94a1b5] leading-relaxed max-w-md">
              You are eligible for <strong className="text-white">1st Month Free Upgrade</strong> to VIP Manga Patron! Enjoy 30 days of founding member perks with zero credit card required.
            </p>
          </div>

          {/* Scarcity Counter Bar */}
          <div className="p-3.5 rounded-xl bg-[#13171f] border border-[#1e2430] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Founding Member Passes</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {remainingSlots} of 20 spots remaining
              </span>
            </div>
            <div className="w-full bg-[#1e2430] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.round(((20 - remainingSlots) / 20) * 100)}%` }}
              />
            </div>
          </div>

          {/* Perks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left text-xs">
            <div className="p-3 rounded-lg bg-[#13171f] border border-[#1e2430] flex items-start gap-2.5">
              <Crown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Gold Patron Badge</div>
                <div className="text-[11px] text-[#94a1b5]">Glowing gold crown avatar ring on profile & forum</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#13171f] border border-[#1e2430] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">100% Ad-Free Priority</div>
                <div className="text-[11px] text-[#94a1b5]">Ultra-clean, lightning-fast tracking experience</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#13171f] border border-[#1e2430] flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Unlimited Collections</div>
                <div className="text-[11px] text-[#94a1b5]">Organize custom tiers, reading folders & tags</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#13171f] border border-[#1e2430] flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Priority Release Alerts</div>
                <div className="text-[11px] text-[#94a1b5]">Instant countdown pings when new chapters drop</div>
              </div>
            </div>
          </div>

          {/* Success or Action CTA */}
          {isSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1 animate-in zoom-in-95 duration-200">
              <div className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Patron Mode Successfully Activated!</span>
              </div>
              <p className="text-xs text-[#94a1b5]">
                Welcome to Founding Member status. Enjoy your 1-month VIP perks!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm py-3.5 px-6 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <Crown className="w-4 h-4" />
                <span>{isClaiming ? "Activating Patron Mode..." : "Enjoy Patron Mode — Claim 1st Month Free"}</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-[#5e6b82]">
                <span>Zero payment info required</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="hover:text-[#94a1b5] transition-colors underline underline-offset-2"
                >
                  Maybe later
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
