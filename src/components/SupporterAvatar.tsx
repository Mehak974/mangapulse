"use client";

import React, { useState, useEffect } from "react";
import { Coffee, Crown, Sparkles, Star } from "lucide-react";

export type SupporterTierType = "coffee" | "supporter" | "legend" | "pro" | "patron" | string | null | undefined;

export interface SupporterAvatarProps {
  avatarUrl?: string | null;
  username?: string | null;
  isSupporter?: boolean;
  tier?: SupporterTierType;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  rounded?: "full" | "2xl" | "xl" | "lg";
  className?: string;
  showBadge?: boolean;
  alt?: string;
}

export function normalizeTier(tier?: SupporterTierType): "coffee" | "supporter" | "legend" | null {
  if (!tier) return null;
  const t = tier.toLowerCase();
  if (t.includes("coffee")) return "coffee";
  if (t.includes("legend") || t.includes("patron")) return "legend";
  if (t.includes("supporter") || t.includes("pro")) return "supporter";
  return null;
}

export default function SupporterAvatar({
  avatarUrl,
  username,
  isSupporter = false,
  tier,
  size = "md",
  rounded = "full",
  className = "",
  showBadge = true,
  alt,
}: SupporterAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [testTier, setTestTier] = useState<string>("legend");

  // ponytail: localhost testing override for supporter badge
  useEffect(() => {
    const syncLocal = () => {
      if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.endsWith(".localhost"))
      ) {
        setIsLocalhost(true);
        const stored = localStorage.getItem("mangapulse_test_tier") || "legend";
        setTestTier(stored);
      }
    };
    syncLocal();
    window.addEventListener("mangapulse-supporter-updated", syncLocal);
    return () => window.removeEventListener("mangapulse-supporter-updated", syncLocal);
  }, []);

  const effectiveIsSupporter = isSupporter || isLocalhost;
  const effectiveTier = isLocalhost && (!tier || tier === "none" || tier === "coffee" || tier === "supporter") ? testTier : tier;
  const activeTier = effectiveIsSupporter ? normalizeTier(effectiveTier) : null;
  const initial = username ? username.trim().substring(0, 2).toUpperCase() : "MP";

  // Size configurations
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-24 h-24 sm:w-28 sm:h-28 text-2xl",
    "2xl": "w-32 h-32 text-3xl",
  }[size];

  // Border & Glow styling based on tier
  let borderGlowStyle = "border border-[#2a3344]";
  if (activeTier === "coffee") {
    // Electric blue border with blue glow
    borderGlowStyle =
      "border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.55)] ring-1 ring-blue-400/40";
  } else if (activeTier === "supporter") {
    // Pro Supporter: Amber/Yellow border with golden glow
    borderGlowStyle =
      "border-2 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.6)] ring-1 ring-amber-300/50";
  } else if (activeTier === "legend") {
    // Manga Patron: Shiny metallic silver border with animated silver shimmer & pulse
    borderGlowStyle =
      "border-2 border-slate-100 ring-2 ring-white/90 animate-patron-border";
  }

  // Rounded class mapping
  const roundedClass = {
    full: "rounded-full",
    "2xl": "rounded-2xl",
    xl: "rounded-xl",
    lg: "rounded-lg",
  }[rounded];

  // Badge scale and positioning
  const badgeConfig = {
    xs: "scale-[0.65] -top-2",
    sm: "scale-75 -top-2",
    md: "scale-90 -top-2.5",
    lg: "scale-100 -top-3",
    xl: "scale-110 -top-3.5",
    "2xl": "scale-125 -top-4",
  }[size];

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {/* Manga Patron: Rotating Metallic Liquid Silver Halo */}
      {activeTier === "legend" && (
        <div
          className={`absolute -inset-1 ${roundedClass} pointer-events-none overflow-hidden z-0 opacity-80`}
        >
          <div className="absolute inset-[-150%] animate-patron-halo bg-[conic-gradient(from_0deg,transparent_0deg,#ffffff_60deg,#94a3b8_120deg,transparent_180deg,#ffffff_240deg,#cbd5e1_300deg,transparent_360deg)] blur-[2px]" />
        </div>
      )}

      {/* Manga Patron: Floating Twinkling Sparkles / Sprinkles */}
      {showBadge && activeTier === "legend" && (
        <>
          {/* Top-Right Sparkle */}
          <div className="absolute -top-2 -right-2 z-30 pointer-events-none animate-patron-sparkle-1">
            <Sparkles className="w-4 h-4 text-white fill-white drop-shadow-[0_0_8px_#ffffff]" />
          </div>

          {/* Bottom-Left Sparkle */}
          <div className="absolute -bottom-2 -left-2 z-30 pointer-events-none animate-patron-sparkle-2">
            <Sparkles className="w-3.5 h-3.5 text-slate-100 fill-slate-200 drop-shadow-[0_0_6px_#ffffff]" />
          </div>

          {/* Bottom-Right Diamond Particle */}
          <div className="absolute -bottom-1 -right-1 z-30 pointer-events-none animate-patron-sparkle-3">
            <Star className="w-2.5 h-2.5 text-white fill-white drop-shadow-[0_0_6px_#ffffff]" />
          </div>

          {/* Top-Left Ambient Glint */}
          <div className="absolute -top-1.5 -left-1 z-30 pointer-events-none animate-patron-sparkle-1">
            <div className="w-1.5 h-1.5 rotate-45 bg-white shadow-[0_0_8px_#ffffff]" />
          </div>
        </>
      )}

      {/* Top Center Floating Badge */}
      {showBadge && activeTier && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center justify-center ${badgeConfig}`}
        >
          {activeTier === "coffee" && (
            <div className="relative flex items-center justify-center">
              {/* Blurred glowing aura */}
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-80" />
              <div className="relative px-1.5 py-0.5 rounded-full bg-[#0c0e12] border border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.85)] flex items-center justify-center">
                <Coffee className="w-3 h-3 text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.9)]" />
              </div>
            </div>
          )}

          {activeTier === "supporter" && (
            <div className="relative flex items-center justify-center">
              {/* Golden glow aura */}
              <div className="absolute inset-0 bg-amber-400 rounded-full blur-sm opacity-70" />
              <div className="relative px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-black font-black text-[9px] tracking-wider uppercase border border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.9)] flex items-center">
                <span>PRO</span>
              </div>
            </div>
          )}

          {activeTier === "legend" && (
            <div className="relative flex items-center justify-center animate-patron-crown">
              {/* Shiny silver aura with animated gleam */}
              <div className="absolute inset-0 bg-white rounded-full blur-md opacity-75" />
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 via-white to-slate-300 rounded-full blur-sm opacity-90" />
              <div className="relative px-2 py-0.5 rounded-full bg-gradient-to-b from-slate-900 via-[#13171f] to-slate-900 border-2 border-slate-100 shadow-[0_0_16px_rgba(255,255,255,1)] flex items-center justify-center gap-0.5">
                <Crown className="w-3.5 h-3.5 text-slate-100 fill-slate-200/40 drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                <Sparkles className="w-2.5 h-2.5 text-white fill-white absolute -top-1.5 -right-1.5 animate-patron-sparkle-1" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Avatar Container with Tier Border & Glow */}
      <div
        className={`${sizeClasses} ${roundedClass} ${borderGlowStyle} relative overflow-hidden bg-[#13171f] flex items-center justify-center transition-all duration-300`}
      >
        {/* Manga Patron: Glossy Light Sweep across photo */}
        {activeTier === "legend" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            <div className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-patron-sweep" />
          </div>
        )}

        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={alt || username || "Avatar"}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1f2a] to-[#252f40] flex items-center justify-center font-black text-white select-none">
            {initial}
          </div>
        )}
      </div>
    </div>
  );
}
