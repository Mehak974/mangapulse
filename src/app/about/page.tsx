import React from "react";
import Link from "next/link";
import {
  Compass,
  Clock,
  ShieldCheck,
  BookOpen,
  Users,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Globe2,
} from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Us — Manga Release Tracker & Official Reading Directory",
  description:
    "Learn about MangaPulse's mission: providing real-time worldwide simulpub countdowns, official publisher directories, and personal library tracking with zero piracy or image hosting.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-[#94a1b5] space-y-12">
      {/* Return Navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>

      {/* Header Banner */}
      <div className="border-b border-[#1e2430] pb-8 space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          <Compass className="w-3.5 h-3.5" /> About MangaPulse
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Empowering Manga Readers with Accurate Releases & Legal Discovery
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-[#94a1b5] max-w-2xl">
          MangaPulse is an independent directory and countdown calendar designed to support the manga industry by connecting fans with official, legal simulpubs. We provide real-time release schedules, library tracking, and direct access to licensed distributors.
        </p>
      </div>

      {/* Mission Statement */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Our Mission
        </h2>
        <p className="text-sm leading-relaxed text-[#94a1b5]">
          For years, manga fans around the world have struggled with contradictory release schedules, conflicting time zones, and broken countdown timers. MangaPulse was built to solve this challenge once and for all: providing synchronized, mathematical release countdowns tied directly to official Japanese publication cadences.
        </p>
        <p className="text-sm leading-relaxed text-[#94a1b5]">
          We believe in celebrating the creators, artists, and mangaka who bring these stories to life. By partnering readers with licensed distributors, we help support the legal manga ecosystem worldwide.
        </p>
      </section>

      {/* Core Pillars Grid */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          What Sets MangaPulse Apart
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Live Countdown Engine</h3>
            <p className="text-xs text-[#94a1b5] leading-relaxed">
              Every timer reflects genuine magazine drops (Weekly Shonen Jump, Young Jump, Kodansha K Manga, WEBTOON) with automatic break and holiday detection.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Official Directory & DMCA Compliance</h3>
            <p className="text-xs text-[#94a1b5] leading-relaxed">
              We operate under a strict Zero Image Hosting policy. We do not store, scan, or distribute copyrighted manga pages. We index metadata and point users to licensed sources.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Personal Library Tracker</h3>
            <p className="text-xs text-[#94a1b5] leading-relaxed">
              Organize your reading journey with customized collections, chapter increment tracking, reading goals, and cross-device cloud synchronization.
            </p>
          </div>
        </div>
      </section>

      {/* Official Publisher Directory & Attribution */}
      <section className="p-6 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-blue-400" />
          Where to Read Officially
        </h2>
        <p className="text-xs leading-relaxed text-[#94a1b5]">
          MangaPulse encourages readers to support official platforms. Every series listed in our directory includes direct attribution to licensed partners:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <a
            href="https://mangaplus.shueisha.co.jp"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#0c0e12] border border-[#2a3344] hover:border-blue-500/50 text-center transition-colors group"
          >
            <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
              MANGA Plus
            </div>
            <div className="text-[10px] text-[#5e6b82] mt-0.5">Shueisha Official</div>
          </a>
          <a
            href="https://www.viz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#0c0e12] border border-[#2a3344] hover:border-blue-500/50 text-center transition-colors group"
          >
            <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
              VIZ Media
            </div>
            <div className="text-[10px] text-[#5e6b82] mt-0.5">Shonen Jump</div>
          </a>
          <a
            href="https://kmanga.kodansha.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#0c0e12] border border-[#2a3344] hover:border-blue-500/50 text-center transition-colors group"
          >
            <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
              K Manga
            </div>
            <div className="text-[10px] text-[#5e6b82] mt-0.5">Kodansha Official</div>
          </a>
          <a
            href="https://www.webtoons.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#0c0e12] border border-[#2a3344] hover:border-blue-500/50 text-center transition-colors group"
          >
            <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
              WEBTOON
            </div>
            <div className="text-[10px] text-[#5e6b82] mt-0.5">Naver Official</div>
          </a>
        </div>
      </section>

      {/* Community & Contact Callout */}
      <section className="border-t border-[#1e2430] pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Have questions or suggestions?</h3>
          <p className="text-xs text-[#94a1b5] mt-1">
            Our team welcomes feedback, corrections, and inquiries from readers and rights holders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg"
          >
            Contact Us
          </Link>
          <Link
            href="/dmca"
            className="py-2.5 px-4 rounded-xl bg-[#13171f] hover:bg-[#1a1f2a] border border-[#2a3344] text-[#94a1b5] hover:text-white text-xs font-semibold transition-colors"
          >
            Legal & DMCA
          </Link>
        </div>
      </section>
    </div>
  );
}
