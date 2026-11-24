"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Crown, Sparkles, Zap, Coffee, X, Check, ExternalLink, ShieldCheck, CreditCard } from "lucide-react";

export type SupporterTierLevel = "coffee" | "supporter" | "legend";

export interface PerkLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier?: SupporterTierLevel;
  featureName?: string;
  message?: string;
  highlights?: string[];
  ctaUrl?: string;
  ctaText?: string;
  onDevSimulate?: () => void;
}

export default function PerkLockModal({
  isOpen,
  onClose,
  tier = "legend",
  featureName = "Custom Theme Selection",
  message = "Custom Theme selection is a Manga Patron ($15) exclusive perk!",
  highlights,
  ctaUrl,
  ctaText,
  onDevSimulate,
}: PerkLockModalProps) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPatron = tier === "legend";
  const isPro = tier === "supporter";

  // Tier configuration
  const config = isPatron
    ? {
        tierName: "Manga Patron VIP",
        tierPrice: "$15",
        badgeBg: "bg-white/10 text-slate-100 border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.3)]",
        icon: Crown,
        iconColor: "text-slate-100",
        auraColor: "from-white/10 via-slate-400/5 to-transparent",
        ctaDefaultUrl: "https://ko-fi.com/summary/1a4fc898-513d-4a7e-9f04-5f25aa1c00f8",
        ctaDefaultText: "Unlock Manga Patron ($15)",
        ctaBtnClass:
          "bg-gradient-to-r from-slate-200 via-white to-slate-200 text-black font-black shadow-[0_0_20px_rgba(255,255,255,0.35)] hover:scale-[1.02]",
        defaultHighlights: [
          "Full access to luxury anime illustrated profile skies & themes",
          "Shiny metallic animated silver crown avatar border",
          "Permanent inscription on the Manga Patron Wall of Fame",
          "Unlock Reading Status, Content Types & Standout Analytics",
          "100% Legal, ad-free high-speed official chapter countdowns",
        ],
      }
    : isPro
    ? {
        tierName: "Pro Supporter",
        tierPrice: "$5",
        badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
        icon: Zap,
        iconColor: "text-amber-400",
        auraColor: "from-amber-500/10 via-amber-600/5 to-transparent",
        ctaDefaultUrl: "https://ko-fi.com/summary/a77a77c8-7d0b-4d88-a702-0868a1d89f40",
        ctaDefaultText: "Upgrade to Pro ($5)",
        ctaBtnClass:
          "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02]",
        defaultHighlights: [
          "Kenmei 4-tab extended dashboard & full activity history",
          "Golden amber glowing supporter avatar border & PRO badge",
          "Instant webhook notification priority on new chapter drops",
          "100% clean, non-intrusive official legal indexing",
        ],
      }
    : {
        tierName: "Coffee Champion",
        tierPrice: "$3",
        badgeBg: "bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.25)]",
        icon: Coffee,
        iconColor: "text-blue-400",
        auraColor: "from-blue-500/10 via-blue-600/5 to-transparent",
        ctaDefaultUrl: "https://ko-fi.com/summary/fac3feec-8f73-4a5f-a269-1a7ecadd17dc",
        ctaDefaultText: "Buy a Coffee ($3)",
        ctaBtnClass:
          "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02]",
        defaultHighlights: [
          "Glowing electric blue supporter avatar border for 32 days",
          "Unlock Reading Status, Content Types & Top Genres charts",
          "Coffee supporter badge on comments and profile",
        ],
      };

  const TierIcon = config.icon;
  const perkList = highlights && highlights.length > 0 ? highlights : config.defaultHighlights;
  const targetCtaUrl = ctaUrl || config.ctaDefaultUrl;
  const targetCtaText = ctaText || config.ctaDefaultText;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md bg-[#10141c] border border-[#2a3344] rounded-2xl p-4 sm:p-7 shadow-2xl text-white max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-12 -left-12 -right-12 h-36 bg-gradient-to-b ${config.auraColor} rounded-full blur-2xl pointer-events-none`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94a1b5] hover:text-white hover:bg-white/5 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Icon and Badge */}
        <div className="relative z-10 flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-[#161c28] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner`}
          >
            <TierIcon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${config.badgeBg}`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{config.tierName}</span>
              </span>
              <span className="text-xs font-mono text-[#94a1b5]">{config.tierPrice}/mo</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-0.5">{featureName}</h2>
          </div>
        </div>

        {/* Highlight Callout Banner */}
        <div className="relative z-10 p-3.5 rounded-xl bg-[#0a0d13] border border-[#1e2430] mb-4">
          <p className="text-xs text-slate-200 leading-relaxed font-medium">{message}</p>
        </div>

        {/* Perks List */}
        <div className="relative z-10 mb-6 space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#94a1b5] font-semibold">
            Included with this tier:
          </div>
          <div className="space-y-2">
            {perkList.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-[#cbd5e1] leading-snug">
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 space-y-2.5">
          <a
            href={targetCtaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all ${config.ctaBtnClass}`}
          >
            <span>{targetCtaText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href="https://www.patreon.com/17189920/join"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#2a3344] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
            <span>Pay with Debit Card (Patreon)</span>
            <ExternalLink className="w-3 h-3 text-[#5e6b82]" />
          </a>

          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <Link
              href="/donate"
              onClick={onClose}
              className="text-[#94a1b5] hover:text-white underline underline-offset-4 text-[11px] transition-colors"
            >
              Compare membership &amp; upgrade tiers &rarr;
            </Link>

            <button
              onClick={onClose}
              className="text-[#5e6b82] hover:text-[#94a1b5] text-[11px] font-medium transition-colors cursor-pointer"
            >
              Maybe later
            </button>
          </div>

          {/* Dev-only simulation helper */}
          {process.env.NODE_ENV !== "production" && onDevSimulate && (
            <div className="pt-2 border-t border-[#1e2430]">
              <button
                type="button"
                onClick={() => {
                  onDevSimulate();
                  onClose();
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-[10px] font-mono text-slate-300 transition-colors"
              >
                [Dev Only] Simulate {config.tierName} Unlock
              </button>
            </div>
          )}
        </div>

        {/* Ko-fi Security Guarantee Footer */}
        <div className="relative z-10 mt-4 pt-3 border-t border-[#1e2430] flex items-center justify-center gap-1.5 text-[10px] text-[#5e6b82]">
          <ShieldCheck className="w-3 h-3 text-emerald-500/70" />
          <span>100% safe transaction via Ko-fi. Zero payment data stored on MangaPulse.</span>
        </div>
      </div>
    </div>
  );
}
