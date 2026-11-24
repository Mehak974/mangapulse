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
          <div className="max-w-xl mx-auto mt-6 p-5 rounded-2xl bg-[#13171f] border border-[#2a3344] text-left shadow-xl">
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
            <p className="text-xs text-[#94a1b5] mb-3 leading-relaxed">
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

      <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-12 space-y-12">
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
                  <span className="text-xs text-[#5e6b82]">/ one-time</span>
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

            <button
              onClick={() => handleOfficialCheckout(3, "Coffee Supporter")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#1a1f2a] hover:bg-[#252f40] text-white font-bold text-xs border border-[#2a3344] transition-colors flex items-center justify-center gap-2 cursor-pointer"
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

            <button
              onClick={() => handleOfficialCheckout(5, "Pro Supporter")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
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

            <button
              onClick={() => handleOfficialCheckout(15, "Manga Patron")}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#1a1f2a] hover:bg-[#252f40] text-white font-bold text-xs border border-[#2a3344] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-purple-400" />
              <span>Become a Patron ($15)</span>
            </button>
          </div>
        </div>

        {/* ── 3 HALLS OF FAME: Patron, Pro, Coffee ── */}
        <section id="halls" className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#13171f] via-[#0e1219] to-[#13171f] border border-[#2a3344] relative overflow-hidden shadow-2xl">
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
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-mono flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-slate-100" />
                  <strong>Manga Patron VIP Roster:</strong> Shiny metallic silver border &amp; silver crown.
                </span>
                <button
                  onClick={() => handleOfficialCheckout(15, "Manga Patron")}
                  className="px-3 py-1 rounded-lg bg-white text-black font-bold text-[11px] hover:scale-105 transition-transform"
                >
                  Join Patron Roster
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
                      <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">Top Supporter</div>
                    </div>
                  </div>
                )}

                {[
                  { name: "AkiraVault", tier: "Founding Patron", favorite: "Berserk", since: "Oct 2024" },
                  { name: "Mehak", tier: "Manga Patron", favorite: "Omniscient Reader's Viewpoint", since: "Nov 2024" },
                  { name: "ShadowArchivist", tier: "Manga Patron", favorite: "The Greatest Estate Developer", since: "Nov 2024" },
                  { name: "ReiChainsaw", tier: "Manga Patron", favorite: "Chainsaw Man", since: "Nov 2024" },
                  { name: "LevelingKing", tier: "Manga Patron", favorite: "Solo Leveling", since: "Nov 2024" },
                  { name: "ReturnOfBlossom", tier: "Manga Patron", favorite: "Return of the Blossoming Blade", since: "Nov 2024" },
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
            </div>
          )}

          {/* HALL 2: PRO SUPPORTERS ($5) */}
          {activeHall === "pro" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-mono flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <strong>Pro Supporter Roster:</strong> Golden amber border &amp; PRO badge.
                </span>
                <button
                  onClick={() => handleOfficialCheckout(5, "Pro Supporter")}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-black font-bold text-[11px] hover:scale-105 transition-transform"
                >
                  Join Pro Roster
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

                {[
                  { name: "StrawHatPuff", tier: "Pro Supporter", favorite: "One Piece", since: "Dec 2024" },
                  { name: "MakotoRead", tier: "Pro Supporter", favorite: "Jujutsu Kaisen", since: "Jan 2025" },
                  { name: "KaguraBlade", tier: "Pro Supporter", favorite: "Kagurabachi", since: "Jan 2025" },
                  { name: "JinWooFan", tier: "Pro Supporter", favorite: "Solo Leveling", since: "Feb 2025" },
                  { name: "FrierenSpell", tier: "Pro Supporter", favorite: "Frieren: Beyond Journey's End", since: "Feb 2025" },
                  { name: "KaijuMaster", tier: "Pro Supporter", favorite: "Kaiju No. 8", since: "Mar 2025" },
                ].map((pro, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#0c0e12]/80 border border-[#2a3344] hover:border-amber-400/50 transition-all flex items-center gap-3"
                  >
                    <SupporterAvatar
                      username={pro.name}
                      isSupporter={true}
                      tier="supporter"
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate flex items-center justify-between">
                        <span>{pro.name}</span>
                        <span className="text-[9px] font-mono text-[#5e6b82]">{pro.since}</span>
                      </div>
                      <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        <span>{pro.tier}</span>
                      </div>
                      <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">
                        Fave: <span className="text-white/80">{pro.favorite}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HALL 3: COFFEE DONATORS ($3) */}
          {activeHall === "coffee" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between text-xs">
                <span className="text-blue-300 font-mono flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-blue-400" />
                  <strong>Coffee Donator Roster:</strong> Electric blue border &amp; coffee badge.
                </span>
                <button
                  onClick={() => handleOfficialCheckout(3, "Coffee Supporter")}
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:scale-105 transition-transform"
                >
                  Buy a Coffee ($3)
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

                {[
                  { name: "CoffeeReader99", tier: "Coffee Donator", favorite: "Spy x Family", since: "Jan 2025" },
                  { name: "MidnightBinge", tier: "Coffee Donator", favorite: "Dandadan", since: "Jan 2025" },
                  { name: "ChapterChaser", tier: "Coffee Donator", favorite: "Blue Lock", since: "Feb 2025" },
                  { name: "MangaFuel", tier: "Coffee Donator", favorite: "Tower of God", since: "Feb 2025" },
                  { name: "SunriseScanner", tier: "Coffee Donator", favorite: "Wind Breaker", since: "Mar 2025" },
                  { name: "WeeklyDrop", tier: "Coffee Donator", favorite: "Choujin X", since: "Mar 2025" },
                ].map((coffee, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#0c0e12]/80 border border-[#2a3344] hover:border-blue-400/50 transition-all flex items-center gap-3"
                  >
                    <SupporterAvatar
                      username={coffee.name}
                      isSupporter={true}
                      tier="coffee"
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white truncate flex items-center justify-between">
                        <span>{coffee.name}</span>
                        <span className="text-[9px] font-mono text-[#5e6b82]">{coffee.since}</span>
                      </div>
                      <div className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
                        <Coffee className="w-2.5 h-2.5" />
                        <span>{coffee.tier}</span>
                      </div>
                      <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">
                        Fave: <span className="text-white/80">{coffee.favorite}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Supporter Hall of Fame (Lifetime Top Donors Leaderboard) ── */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#13171f] border border-[#2a3344] relative shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2430] mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-base text-white">
                  Supporter Hall of Fame • Lifetime Champions
                </h3>
                <p className="text-xs text-[#94a1b5] mt-0.5">
                  Honoring the top supporters who contributed the most throughout the entire life of MangaPulse.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              ALL-TIME LEADERBOARD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                rank: 1,
                name: "AkiraVault",
                amount: "$240",
                tier: "Founding Patron",
                since: "Oct 2024",
                favorite: "Berserk",
                medal: "🥇",
                badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
              },
              {
                rank: 2,
                name: "OdaScholar",
                amount: "$195",
                tier: "Manga Patron",
                since: "Jan 2025",
                favorite: "One Piece",
                medal: "🥈",
                badgeColor: "bg-slate-300/20 text-slate-200 border-slate-300/40",
              },
              {
                rank: 3,
                name: "ShadowArchivist",
                amount: "$150",
                tier: "Manga Patron",
                since: "Nov 2024",
                favorite: "The Greatest Estate Developer",
                medal: "🥉",
                badgeColor: "bg-amber-700/20 text-amber-500 border-amber-700/40",
              },
              {
                rank: 4,
                name: "StrawHatPuff",
                amount: "$95",
                tier: "Pro Supporter",
                since: "Feb 2025",
                favorite: "Chainsaw Man",
                medal: "#4",
                badgeColor: "bg-[#161a22] text-[#94a1b5] border-[#2a3344]",
              },
              {
                rank: 5,
                name: "MakotoRead",
                amount: "$75",
                tier: "Pro Supporter",
                since: "Mar 2025",
                favorite: "Jujutsu Kaisen",
                medal: "#5",
                badgeColor: "bg-[#161a22] text-[#94a1b5] border-[#2a3344]",
              },
              {
                rank: 6,
                name: "LevelingKing",
                amount: "$60",
                tier: "Coffee Champion",
                since: "Nov 2024",
                favorite: "Solo Leveling",
                medal: "#6",
                badgeColor: "bg-[#161a22] text-[#94a1b5] border-[#2a3344]",
              },
            ].map((champ) => (
              <div
                key={champ.rank}
                className="p-4 rounded-xl bg-[#0c0e12] border border-[#2a3344] hover:border-slate-400/40 transition-all flex items-center gap-3.5 relative"
              >
                <div className="w-10 h-10 rounded-xl bg-[#141b26] border border-[#2a3344] flex items-center justify-center text-base font-black font-mono flex-shrink-0">
                  {champ.medal}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-white truncate">{champ.name}</span>
                    <span className="font-mono text-xs font-black text-emerald-400">
                      {champ.amount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-blue-400 font-semibold">
                      {champ.tier}
                    </span>
                    <span className="text-[#5e6b82] text-[10px]">•</span>
                    <span className="text-[10px] text-[#5e6b82]">Since {champ.since}</span>
                  </div>

                  <div className="text-[10px] text-[#94a1b5] truncate mt-1">
                    Fave: <span className="text-white/80">{champ.favorite}</span>
                  </div>
                </div>
              </div>
            ))}
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
