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
  Trophy,
  Medal,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SupporterAvatar from "@/components/SupporterAvatar";

export default function DonatePage() {
  const { user, isLoggedIn, updateProfile, setAuthModalOpen } = useAuth();
  const [selectedTier, setSelectedTier] = useState<number>(5);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const [kofiEmailInput, setKofiEmailInput] = useState<string>(user?.kofi_email || "");
  const [kofiSaveStatus, setKofiSaveStatus] = useState<string | null>(null);
  const [isSavingKofi, setIsSavingKofi] = useState(false);

  // Active Hall of Fame Tab: "patron" | "pro" | "coffee"
  const [activeHall, setActiveHall] = useState<"patron" | "pro" | "coffee">("patron");

  // Official Ko-fi Direct Checkout Links per tier
  const KOFI_TIER_CHECKOUT: Record<string, string> = {
    coffee: "https://ko-fi.com/summary/fac3feec-8f73-4a5f-a269-1a7ecadd17dc",
    pro: "https://ko-fi.com/summary/a77a77c8-7d0b-4d88-a702-0868a1d89f40",
    patron: "https://ko-fi.com/summary/1a4fc898-513d-4a7e-9f04-5f25aa1c00f8",
  };

  const PATREON_JOIN_URL = "https://www.patreon.com/17189920/join";

  const handleOfficialCheckout = (amount: number, tierName: string) => {
    let checkoutUrl = "https://ko-fi.com/mangapulse";
    const lower = tierName.toLowerCase();

    if (lower.includes("patron") || amount >= 15) {
      checkoutUrl = KOFI_TIER_CHECKOUT.patron;
    } else if (lower.includes("pro") || amount === 5) {
      checkoutUrl = KOFI_TIER_CHECKOUT.pro;
    } else if (lower.includes("coffee") || amount === 3) {
      checkoutUrl = KOFI_TIER_CHECKOUT.coffee;
    }

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
      setKofiSaveStatus("Ko-fi email linked! Incoming tips and any pending payments have been credited.");
      setTimeout(() => setKofiSaveStatus(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to link email. Please check your connection.";
      setKofiSaveStatus(msg);
    } finally {
      setIsSavingKofi(false);
    }
  };

  const isPatronUser = Boolean(
    user?.is_supporter &&
      (user.supporter_tier?.toLowerCase().includes("legend") ||
        user.supporter_tier?.toLowerCase().includes("patron"))
  );
  const isProUser = Boolean(
    user?.is_supporter &&
      !isPatronUser &&
      (user.supporter_tier?.toLowerCase().includes("pro") ||
        user.supporter_tier?.toLowerCase().includes("supporter"))
  );
  const isCoffeeUser = Boolean(
    user?.is_supporter &&
      !isPatronUser &&
      !isProUser &&
      user.supporter_tier?.toLowerCase().includes("coffee")
  );

  return (
    <div className="min-w-0 pb-20">
      {/* ── Header Banner ── */}
      <section className="bg-[#0c0e12] border-b border-[#1e2430] py-12 px-4 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            MangaPulse Pro Plans &amp; Membership
          </h1>

          {/* Link Ko-fi Payer Email Hero Section */}
          <div className="max-w-xl mx-auto mt-3 sm:mt-5 p-3.5 sm:p-5 rounded-2xl bg-[#13171f] border border-[#2a3344] text-left shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Link Your Ko-fi Payer Email</span>
              </span>
              {user?.kofi_email && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Linked: {user.kofi_email}
                </span>
              )}
            </div>
            <p className="hidden sm:block text-xs text-[#94a1b5] mb-3 leading-relaxed">
              If your Ko-fi or PayPal email differs from your MangaPulse account, link it here. Our verified webhook matches incoming tips to unlock your custom badges and VIP perks automatically.
            </p>

            {user ? (
              <form onSubmit={handleSaveKofiEmail} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  placeholder="your-kofi-paypal@example.com"
                  value={kofiEmailInput}
                  onChange={(e) => setKofiEmailInput(e.target.value)}
                  className="flex-1 bg-[#0c0e12] border border-[#2a3344] focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#5e6b82] outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={isSavingKofi}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-colors whitespace-nowrap cursor-pointer shadow-md"
                >
                  {isSavingKofi ? "Linking..." : "Link Email"}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e12] border border-[#1e2430] text-xs text-[#94a1b5]">
                <span>Sign in to link your Ko-fi email and auto-sync supporter perks.</span>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="font-bold text-blue-400 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}

            {kofiSaveStatus && (
              <div className="mt-2.5 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>{kofiSaveStatus}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-6 sm:mt-10 space-y-6 sm:space-y-10">
        {/* Checkout Alert */}
        {checkoutNotice && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span>{checkoutNotice}</span>
            </div>
            <button onClick={() => setCheckoutNotice(null)} className="font-bold underline text-white text-xs cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* ── Pay with Debit Card Banner (Compact) ── */}
        <div className="surface-card bg-[#13171f] p-3 sm:p-4 rounded-xl border border-[#2a3344] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-0.5 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono text-[9px] font-bold uppercase tracking-wider border border-blue-500/20">
              <CreditCard className="w-2.5 h-2.5" />
              <span>Direct Card Checkout</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">Pay with Debit Card</h2>
            <p className="text-xs text-[#94a1b5] leading-relaxed">
              Prefer paying directly with Debit Card, Apple Pay, or Google Pay? Join directly through our official Patreon portal.
            </p>
          </div>

          <a
            href={PATREON_JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow cursor-pointer flex-shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5 text-white" />
            <span className="text-white">Pay with Debit Card (Patreon)</span>
            <ExternalLink className="w-3 h-3 text-white/80" />
          </a>
        </div>

        {/* ── 3 Supporter Tiers ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: Buy a Coffee */}
          <div className="p-6 rounded-2xl bg-[#13171f] border border-[#1e2430] flex flex-col justify-between hover:border-[#2a3344] transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Buy Us a Coffee</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black font-mono text-white">$3</span>
                  <span className="text-xs text-[#5e6b82]">/ 32-day access</span>
                </div>
                <p className="text-xs text-[#94a1b5] mt-2 leading-relaxed">
                  A small tip that directly fuels late-night server maintenance and chapter sync scripts.
                </p>
              </div>

              <ul className="space-y-2 pt-2 text-xs text-[#c4cfde]">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Electric blue avatar border with glowing coffee cup</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Coffee Supporter Insights (Reading status, genres)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                  <span>Permanent listing in Coffee Donator Hall of Fame</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => handleOfficialCheckout(3, "Coffee Supporter")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1a1f2a] hover:bg-[#252f40] text-white font-bold text-xs border border-[#2a3344] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>Tip $3 via Ko-fi</span>
              </button>
              <a
                href={PATREON_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#2a3344] text-[#94a1b5] hover:text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3 h-3 text-blue-400" />
                <span>Pay with Debit Card</span>
              </a>
            </div>
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
                  <span>Full Kenmei-style 4-tab dashboard profile layout</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Listing in Pro Supporter Hall of Fame</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Priority countdown webhook notifications</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => handleOfficialCheckout(5, "Pro Supporter")}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Join Pro Tier ($5/mo)</span>
              </button>
              <a
                href={PATREON_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#2a3344] text-[#94a1b5] hover:text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3 h-3 text-blue-400" />
                <span>Pay with Debit Card</span>
              </a>
            </div>
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
                  <span>Custom profile banner themes unlocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-300" />
                  <span>All detailed statistics &amp; activity history unlocked</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-300" />
                  <span>VIP listing in Manga Patron Hall of Fame</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => handleOfficialCheckout(15, "Manga Patron")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1a1f2a] hover:bg-[#252f40] text-white font-bold text-xs border border-[#2a3344] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-purple-400" />
                <span>Become a Patron ($15)</span>
              </button>
              <a
                href={PATREON_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#2a3344] text-[#94a1b5] hover:text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3 h-3 text-blue-400" />
                <span>Pay with Debit Card</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Payment Security Guarantee (Moved below plans) ── */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-emerald-300 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-white block">100% Secure Checkout • Debit Cards, Credit Cards, PayPal &amp; Stripe</span>
              <span className="text-[#94a1b5] text-[11px]">
                MangaPulse never handles or stores credit cards or banking data. All transactions are securely processed off-site via Patreon &amp; Ko-fi with full buyer protection.
              </span>
            </div>
          </div>
          <Link
            href="/terms"
            className="text-[11px] font-mono text-emerald-400 hover:underline whitespace-nowrap"
          >
            Read Terms &rarr;
          </Link>
        </div>

        {/* ── 3 HALLS OF FAME: Patron, Pro, Coffee ── */}
        <section id="halls" className="p-5 sm:p-7 rounded-2xl bg-[#13171f] border border-[#2a3344] relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white tracking-tight">
                  MangaPulse Supporter Halls of Fame
                </h3>
              </div>
              <p className="text-xs text-[#94a1b5] mt-1">
                Celebrating the community members who power our open APIs, chapter trackers, and servers.
              </p>
            </div>

            {/* Hall Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c0e12] border border-[#2a3344]">
              <button
                type="button"
                onClick={() => setActiveHall("patron")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeHall === "patron"
                    ? "bg-gradient-to-r from-slate-200 to-white text-black shadow-md shadow-white/20"
                    : "text-[#94a1b5] hover:text-white"
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Patrons ($15)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHall("pro")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeHall === "pro"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-[#94a1b5] hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Pro ($5)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHall("coffee")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeHall === "coffee"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-[#94a1b5] hover:text-white"
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Coffee ($3)</span>
              </button>
            </div>
          </div>

          {/* HALL 1: MANGA PATRONS ($15) */}
          {activeHall === "patron" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-700/50 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-mono flex items-center gap-1.5 text-[11px] truncate">
                  <Crown className="w-3.5 h-3.5 text-slate-100 flex-shrink-0" />
                  <span className="truncate"><strong>Patron VIP:</strong> Silver border &amp; crown</span>
                </span>
                <button
                  onClick={() => handleOfficialCheckout(15, "Manga Patron")}
                  className="px-2.5 py-1 rounded-lg bg-white text-black font-bold text-[10px] whitespace-nowrap hover:scale-105 transition-transform flex-shrink-0 cursor-pointer"
                >
                  Join VIP
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Logged in Patron */}
                {isPatronUser && (
                  <div className="p-4 rounded-xl bg-[#0c0e12] border-2 border-slate-200/80 shadow-[0_0_18px_rgba(255,255,255,0.25)] flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute top-1 right-2 text-[9px] font-mono font-bold text-slate-200 uppercase tracking-wider">
                      ★ YOU
                    </div>
                    <SupporterAvatar
                      avatarUrl={user?.avatar_url}
                      username={user?.displayName || user?.username}
                      isSupporter={true}
                      tier="legend"
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                        <span>{user?.displayName || user?.username}</span>
                        <Sparkles className="w-3 h-3 text-white fill-white" />
                      </div>
                      <div className="text-[10px] font-mono text-slate-300">Active VIP Patron</div>
                      <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">Verified Patron</div>
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-xl bg-[#0c0e12]/60 border border-[#2a3344] sm:col-span-2 lg:col-span-3 text-center max-w-xl mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-400 flex items-center justify-center mx-auto text-slate-200">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Verified Manga Patron VIP Roster</h4>
                    <p className="text-xs text-[#94a1b5] mt-1 leading-relaxed">
                      Supporters who subscribe via Ko-fi and link their email are automatically enshrined here on the official Wall of Fame with their custom anime avatar borders and silver crowns.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOfficialCheckout(15, "Manga Patron")}
                    className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:scale-105 transition-transform cursor-pointer"
                  >
                    Claim Your Spot ($15/mo)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HALL 2: PRO SUPPORTERS ($5) */}
          {activeHall === "pro" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="py-2 px-3 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                <span className="text-amber-300 font-mono flex items-center gap-1.5 text-[11px] truncate">
                  <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate"><strong>Pro Roster:</strong> Amber border &amp; PRO badge</span>
                </span>
                <button
                  onClick={() => handleOfficialCheckout(5, "Pro Supporter")}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-[10px] whitespace-nowrap hover:scale-105 transition-transform flex-shrink-0 cursor-pointer"
                >
                  Join Pro
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Logged in Pro */}
                {isProUser && (
                  <div className="p-4 rounded-xl bg-[#0c0e12] border-2 border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.25)] flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute top-1 right-2 text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      ★ YOU
                    </div>
                    <SupporterAvatar
                      avatarUrl={user?.avatar_url}
                      username={user?.displayName || user?.username}
                      isSupporter={true}
                      tier="supporter"
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                        <span>{user?.displayName || user?.username}</span>
                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                      </div>
                      <div className="text-[10px] font-mono text-amber-300">Active Pro Supporter</div>
                      <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">Verified Reader</div>
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-xl bg-[#0c0e12]/60 border border-[#2a3344] sm:col-span-2 lg:col-span-3 text-center max-w-xl mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Verified Pro Supporter Roster</h4>
                    <p className="text-xs text-[#94a1b5] mt-1 leading-relaxed">
                      Pro Supporters power our countdown servers and unlock full Kenmei-style 4-tab dashboard layouts. Your badge activates automatically upon Ko-fi confirmation.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOfficialCheckout(5, "Pro Supporter")}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:scale-105 transition-transform cursor-pointer"
                  >
                    Join Pro Roster ($5/mo)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HALL 3: COFFEE DONATORS ($3) */}
          {activeHall === "coffee" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="py-2 px-3 rounded-lg bg-blue-950/30 border border-blue-500/30 flex items-center justify-between gap-2 text-xs">
                <span className="text-blue-300 font-mono flex items-center gap-1.5 text-[11px] truncate">
                  <Coffee className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate"><strong>Coffee Roster:</strong> Blue border &amp; cup</span>
                </span>
                <button
                  onClick={() => handleOfficialCheckout(3, "Coffee Supporter")}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] whitespace-nowrap hover:scale-105 transition-transform flex-shrink-0 cursor-pointer"
                >
                  Tip $3
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Logged in Coffee */}
                {isCoffeeUser && (
                  <div className="p-4 rounded-xl bg-[#0c0e12] border-2 border-blue-500/80 shadow-[0_0_18px_rgba(59,130,246,0.25)] flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute top-1 right-2 text-[9px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                      ★ YOU
                    </div>
                    <SupporterAvatar
                      avatarUrl={user?.avatar_url}
                      username={user?.displayName || user?.username}
                      isSupporter={true}
                      tier="coffee"
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                        <span>{user?.displayName || user?.username}</span>
                        <Coffee className="w-3 h-3 text-blue-400" />
                      </div>
                      <div className="text-[10px] font-mono text-blue-300">Coffee Donator</div>
                      <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">Generous Reader</div>
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-xl bg-[#0c0e12]/60 border border-[#2a3344] sm:col-span-2 lg:col-span-3 text-center max-w-xl mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-950/40 border border-blue-500/50 flex items-center justify-center mx-auto text-blue-400">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Verified Coffee Donator Roster</h4>
                    <p className="text-xs text-[#94a1b5] mt-1 leading-relaxed">
                      Fuel our chapter sync engines with a $3 coffee tip. Unlocks the glowing electric blue profile border, coffee icon, and Reading Status analytics for 32 days.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOfficialCheckout(3, "Coffee Supporter")}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Tip $3 via Ko-fi
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Supporter Hall of Fame (Lifetime Community Recognition Standards) ── */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#13171f] border border-[#2a3344] relative shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2430] mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-base text-white">
                  Supporter Hall of Fame • Recognition Standards
                </h3>
                <p className="text-xs text-[#94a1b5] mt-0.5">
                  Honoring the community champions who support the ongoing development and legal indexing of MangaPulse.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              100% VERIFIED TIERS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-[#0c0e12] border border-slate-300/40 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥇</span>
                <div>
                  <h4 className="font-bold text-sm text-white">Manga Patron VIP</h4>
                  <span className="text-[10px] font-mono text-slate-300">$15 / month</span>
                </div>
              </div>
              <p className="text-xs text-[#94a1b5] leading-relaxed">
                Elite rank for sustained high-volume infrastructure support. Unlocks custom anime illustrated sky themes, metallic silver crown avatar border, and top billing on the Wall of Fame.
              </p>
              <div className="text-[11px] font-mono text-slate-300 font-semibold pt-2 border-t border-[#1e2430]">
                Perks: Custom Themes + VIP Crown Flair
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0c0e12] border border-amber-500/40 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥈</span>
                <div>
                  <h4 className="font-bold text-sm text-white">Pro Supporter</h4>
                  <span className="text-[10px] font-mono text-amber-400">$5 / month</span>
                </div>
              </div>
              <p className="text-xs text-[#94a1b5] leading-relaxed">
                Core supporter tier keeping our legal indexing completely ad-free. Unlocks golden amber borders, PRO badges, priority webhook notifications, and Kenmei 4-tab layouts.
              </p>
              <div className="text-[11px] font-mono text-amber-400 font-semibold pt-2 border-t border-[#1e2430]">
                Perks: 4-Tab Dashboard + Golden Badge
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0c0e12] border border-blue-500/40 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥉</span>
                <div>
                  <h4 className="font-bold text-sm text-white">Coffee Champion</h4>
                  <span className="text-[10px] font-mono text-blue-400">$3 / tip (32 days)</span>
                </div>
              </div>
              <p className="text-xs text-[#94a1b5] leading-relaxed">
                Voluntary one-time tip fueling late-night maintenance and chapter synchronizers. Unlocks the glowing electric blue profile border, coffee icon, and Reading Status analytics.
              </p>
              <div className="text-[11px] font-mono text-blue-400 font-semibold pt-2 border-t border-[#1e2430]">
                Perks: Coffee Icon + Reading Status
              </div>
            </div>
          </div>
        </section>

        {/* ── Transparent Cost Breakdown ── */}
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
              <div className="font-bold text-xs text-white">Next.js Edge CDN &amp; Compute</div>
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
              <div className="font-bold text-xs text-white">Legal &amp; Official Affiliates</div>
              <div className="text-[11px] text-[#94a1b5] mt-1">
                Maintains publisher relationships and verified links directly to authorized distributors.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
