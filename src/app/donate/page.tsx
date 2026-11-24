"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Coffee,
  Crown,
  Sparkles,
  Shield,
  Check,
  CreditCard,
  DollarSign,
  Award,
  Zap,
  Server,
  Database,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DonatePage() {
  const { user, isLoggedIn, setAuthModalOpen } = useAuth();
  const [selectedTier, setSelectedTier] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const handleOfficialCheckout = (amount: number, tierName: string) => {
    // Construct verified Ko-fi redirect URL passing authenticated user memo
    const kofiBase = "https://ko-fi.com/mangapulse";
    const memo = user ? `user_id:${user.id}|email:${user.email}` : "";
    const checkoutUrl = memo ? `${kofiBase}?memo=${encodeURIComponent(memo)}` : kofiBase;

    setCheckoutNotice(
      `Redirecting to secure payment for ${tierName}. Once received, your supporter perks sync automatically via our verified webhook.`
    );

    setTimeout(() => {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    }, 800);
  };

  return (
    <div className="min-w-0 pb-20">
      {/* Header Banner */}
      <section className="bg-[#0c0e12] border-b border-[#1e2430] py-12 px-4 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-semibold">
            <Heart className="w-3.5 h-3.5 fill-rose-400" />
            <span>COMMUNITY-POWERED & 100% LEGAL</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Support MangaPulse
          </h1>

          <p className="text-xs sm:text-sm text-[#94a1b5] max-w-xl mx-auto leading-relaxed">
            MangaPulse hosts zero pirated scans and runs zero shady popunders. Your voluntary support keeps our real-time countdown engines, weekly simulpub databases, and metadata APIs 100% free for everyone.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-12 space-y-12">
        {/* Checkout Alert */}
        {checkoutNotice && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span>{checkoutNotice}</span>
            </div>
            <button onClick={() => setCheckoutNotice(null)} className="font-bold underline text-white text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* 3 Supporter Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: Buy a Coffee */}
          <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430] flex flex-col justify-between hover:border-[#2a3344] transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Buy Us a Coffee</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black font-mono text-white">$3</span>
                  <span className="text-xs text-[#5e6b82]">/ one-time</span>
                </div>
                <p className="text-xs text-[#94a1b5] mt-2 leading-relaxed">
                  A small tip that directly fuels late-night server maintenance and chapter sync scripts.
                </p>
              </div>

              <ul className="space-y-2 pt-2 text-xs text-[#c4cfde]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Coffee Supporter shoutout</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Permanent good karma</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleOfficialCheckout(3, "Coffee Supporter")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#1a1f2a] hover:bg-[#252f40] text-white font-bold text-xs border border-[#2a3344] transition-colors flex items-center justify-center gap-2"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>Tip $3 via Ko-fi</span>
            </button>
          </div>

          {/* Tier 2: Pro Supporter (Featured) */}
          <div className="p-6 rounded-2xl bg-[#13171f] border-2 border-blue-500 flex flex-col justify-between relative shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Pro Supporter</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black font-mono text-blue-400">$5</span>
                  <span className="text-xs text-[#5e6b82]">/ month</span>
                </div>
                <p className="text-xs text-[#94a1b5] mt-2 leading-relaxed">
                  Support sustainable legal manga indexing and unlock VIP profile perks.
                </p>
              </div>

              <ul className="space-y-2 pt-2 text-xs text-[#c4cfde]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Verified &quot;Pro&quot; badge on profile & forum</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>100% completely ad-free browsing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Priority countdown webhook notifications</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleOfficialCheckout(5, "Pro Supporter")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Zap className="w-4 h-4" />
              <span>Join Pro Tier ($5/mo)</span>
            </button>
          </div>

          {/* Tier 3: Manga Patron */}
          <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430] flex flex-col justify-between hover:border-[#2a3344] transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Manga Patron</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black font-mono text-white">$15</span>
                  <span className="text-xs text-[#5e6b82]">/ month</span>
                </div>
                <p className="text-xs text-[#94a1b5] mt-2 leading-relaxed">
                  For the ultimate manga champions helping finance high-speed database scaling.
                </p>
              </div>

              <ul className="space-y-2 pt-2 text-xs text-[#c4cfde]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>All Pro Supporter features</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Gold crown avatar flair on forum</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                  <span>Permanent listing in Supporter Hall of Fame</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleOfficialCheckout(15, "Manga Patron")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#1a1f2a] hover:bg-[#252f40] text-white font-bold text-xs border border-[#2a3344] transition-colors flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-purple-400" />
              <span>Become a Patron ($15)</span>
            </button>
          </div>
        </div>

        {/* Transparent Cost Breakdown */}
        <section className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
          <h3 className="font-bold text-sm text-white uppercase font-mono tracking-wider mb-2">
            Where Does Your Contribution Go?
          </h3>
          <p className="text-xs text-[#94a1b5] mb-6">
            We believe in 100% transparency. MangaPulse operates lean and efficient infrastructure:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430]">
              <Server className="w-4 h-4 text-blue-400 mb-2" />
              <div className="font-bold text-xs text-white">Next.js Edge CDN & Compute</div>
              <div className="text-[11px] text-[#94a1b5] mt-1">
                Serves instantaneous countdown clocks and pre-rendered SEO pages worldwide under 50ms.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430]">
              <Database className="w-4 h-4 text-emerald-400 mb-2" />
              <div className="font-bold text-xs text-white">Supabase PostgreSQL</div>
              <div className="text-[11px] text-[#94a1b5] mt-1">
                Stores user libraries, reading progress, custom collections, and forum discussions.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0c0e12] border border-[#1e2430]">
              <Shield className="w-4 h-4 text-purple-400 mb-2" />
              <div className="font-bold text-xs text-white">Legal & Official Affiliates</div>
              <div className="text-[11px] text-[#94a1b5] mt-1">
                Maintains publisher relationships and verified links directly to authorized distributors.
              </div>
            </div>
          </div>
        </section>

        {/* Supporter Hall of Fame */}
        <section className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e2430]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white uppercase font-mono tracking-wider">
                Supporter Hall of Fame
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#5e6b82]">Honoring our supporters</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { name: "StrawHatPuff", tier: "Patron", since: "Feb 2025" },
              { name: "MakotoRead", tier: "Pro Supporter", since: "Mar 2025" },
              { name: "KaguraBlade", tier: "Pro Supporter", since: "Mar 2025" },
              { name: "OdaScholar", tier: "Patron", since: "Jan 2025" },
            ].map((s) => (
              <div key={s.name} className="p-3 rounded-lg bg-[#0c0e12] border border-[#1e2430]">
                <div className="font-bold text-white truncate">{s.name}</div>
                <div className="text-[10px] text-blue-400 font-mono mt-0.5">{s.tier}</div>
                <div className="text-[10px] text-[#5e6b82] mt-0.5">Member since {s.since}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

