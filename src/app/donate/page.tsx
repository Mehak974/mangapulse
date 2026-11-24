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
import SupporterAvatar from "@/components/SupporterAvatar";

export default function DonatePage() {
  const { user, isLoggedIn, updateProfile, setAuthModalOpen } = useAuth();
  const [selectedTier, setSelectedTier] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const [kofiEmailInput, setKofiEmailInput] = useState<string>(user?.kofi_email || "");
  const [kofiSaveStatus, setKofiSaveStatus] = useState<string | null>(null);
  const [isSavingKofi, setIsSavingKofi] = useState(false);

  const handleOfficialCheckout = (amount: number, tierName: string) => {
    // Clean official redirect (zero user tokens or emails in URL)
    const checkoutUrl = "https://ko-fi.com/mangapulse";

    setCheckoutNotice(
      `Opening Ko-fi for ${tierName}. Once confirmed, your perks sync automatically to your account.`
    );

    setTimeout(() => {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    }, 400);
  };

  const handleSaveKofiEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kofiEmailInput.trim()) return;
    setIsSavingKofi(true);
    try {
      await updateProfile({ kofi_email: kofiEmailInput.trim().toLowerCase() });
      setKofiSaveStatus("Ko-fi email linked! Incoming tips will automatically credit to this account.");
      setTimeout(() => setKofiSaveStatus(null), 5000);
    } catch {
      setKofiSaveStatus("Failed to link email. Please check your connection.");
    } finally {
      setIsSavingKofi(false);
    }
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
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Electric blue avatar border with glowing coffee badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Coffee Supporter badge on profile & community</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Permanent good karma & reader appreciation</span>
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
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Golden amber avatar border with &quot;PRO&quot; badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verified &quot;Pro&quot; tag on profile & forum</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>100% completely ad-free browsing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
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
                  <Check className="w-3.5 h-3.5 text-slate-300" />
                  <span>Shiny metallic silver border with silver crown</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-300" />
                  <span>All Pro Supporter features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-300" />
                  <span>Silver crown flair across forum discussions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-300" />
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

        {/* Link Ko-fi Payer Email */}
        <section className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-sm text-white uppercase font-mono tracking-wider">
                Link Your Ko-fi Payer Email
              </h3>
              <p className="text-xs text-[#94a1b5] mt-1">
                If your Ko-fi account or PayPal email differs from your MangaPulse email, link it here. Our verified webhook will match incoming tips and activate your perks automatically.
              </p>
            </div>
          </div>

          {user ? (
            <form onSubmit={handleSaveKofiEmail} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your-kofi-paypal@example.com"
                value={kofiEmailInput}
                onChange={(e) => setKofiEmailInput(e.target.value)}
                className="flex-1 bg-[#0c0e12] border border-[#2a3344] focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#5e6b82] outline-none"
              />
              <button
                type="submit"
                disabled={isSavingKofi}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-colors whitespace-nowrap"
              >
                {isSavingKofi ? "Linking..." : "Link Ko-fi Email"}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e12] border border-[#1e2430] text-xs text-[#94a1b5]">
              <span>Sign in to link your Ko-fi email and auto-sync supporter badges.</span>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="font-bold text-blue-400 hover:underline"
              >
                Sign In
              </button>
            </div>
          )}

          {kofiSaveStatus && (
            <div className="mt-3 text-xs text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{kofiSaveStatus}</span>
            </div>
          )}
        </section>

        {/* 👑 Manga Patron Hall of Fame */}
        <section id="patrons" className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#13171f] via-[#0e1219] to-[#13171f] border-2 border-slate-300/40 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-slate-100" />
                <h3 className="font-bold text-base text-white tracking-tight">
                  Manga Patron Hall of Fame
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-100 border border-white/20">
                  VIP ROSTER
                </span>
              </div>
              <p className="text-xs text-[#94a1b5]">
                Permanent recognition honoring the elite manga champions financing high-speed database scaling and legal indexing.
              </p>
            </div>

            <button
              onClick={() => handleOfficialCheckout(15, "Manga Patron")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200 to-white text-black text-xs font-black shadow-[0_0_14px_rgba(255,255,255,0.7)] hover:scale-105 transition-transform flex items-center gap-1.5 whitespace-nowrap"
            >
              <Crown className="w-3.5 h-3.5 text-black" />
              <span>Claim Your Spot ($15)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {/* If logged in user is patron, showcase them first */}
            {user?.is_supporter && (user.supporter_tier?.toLowerCase().includes("legend") || user.supporter_tier?.toLowerCase().includes("patron")) && (
              <div className="p-4 rounded-xl bg-[#0c0e12] border-2 border-slate-200/80 shadow-[0_0_18px_rgba(255,255,255,0.25)] flex items-center gap-3 relative overflow-hidden">
                <div className="absolute top-1 right-2 text-[9px] font-mono font-bold text-slate-200 uppercase tracking-wider">
                  ★ YOU
                </div>
                <SupporterAvatar
                  avatarUrl={user.avatar_url}
                  username={user.displayName || user.username}
                  isSupporter={true}
                  tier="legend"
                  size="md"
                />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                    <span>{user.displayName || user.username}</span>
                    <Sparkles className="w-3 h-3 text-white fill-white" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-300">Active VIP Patron</div>
                  <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">Top Supporter</div>
                </div>
              </div>
            )}

            {[
              {
                name: "AkiraVault",
                tier: "Founding Patron",
                favorite: "Berserk",
                since: "Oct 2024",
              },
              {
                name: "Mehak",
                tier: "Manga Patron",
                favorite: "Omniscient Reader's Viewpoint",
                since: "Nov 2024",
              },
              {
                name: "ShadowArchivist",
                tier: "Manga Patron",
                favorite: "The Greatest Estate Developer",
                since: "Nov 2024",
              },
              {
                name: "ReiChainsaw",
                tier: "Manga Patron",
                favorite: "Chainsaw Man",
                since: "Nov 2024",
              },
              {
                name: "LevelingKing",
                tier: "Manga Patron",
                favorite: "Solo Leveling",
                since: "Nov 2024",
              },
              {
                name: "ReturnOfBlossom",
                tier: "Manga Patron",
                favorite: "Return of the Blossoming Blade",
                since: "Nov 2024",
              },
            ].map((patron, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0c0e12]/80 border border-[#2a3344] hover:border-slate-300/50 transition-all flex items-center gap-3"
              >
                <SupporterAvatar
                  username={patron.name}
                  isSupporter={true}
                  tier="legend"
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white truncate flex items-center justify-between">
                    <span>{patron.name}</span>
                    <span className="text-[9px] font-mono text-[#5e6b82]">{patron.since}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 text-slate-200" />
                    <span>{patron.tier}</span>
                  </div>
                  <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">
                    Fave: <span className="text-white/80">{patron.favorite}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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

