import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer border-t border-[#1e2430] bg-[#08090c] text-[#94a1b5] text-xs py-12 px-4 lg:px-8 mt-24 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand & Manifesto */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <span className="w-6 h-6 rounded bg-white text-black font-black text-xs flex items-center justify-center">
              MP
            </span>
            <span>MANGAPULSE INDEX</span>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-[#5e6b82]">
            Comprehensive release index, chapter countdowns, and official reading directory for Japanese Manga, South Korean Manhwa, and Chinese Manhua.
          </p>
          <div className="text-[11px] font-mono text-[#5e6b82] pt-1">
            Metadata sourced via AniList API. Schedules calculated from publisher release cadences.
          </div>
        </div>

        {/* Index Navigation */}
        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase text-white font-bold tracking-wider">
            Directory
          </div>
          <ul className="space-y-1 text-xs">
            <li>
              <Link href="/trending" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Trending Manga & Catalog
              </Link>
            </li>
            <li>
              <Link href="/guides" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors text-blue-400">
                Editorial Guides & Reading Orders
              </Link>
            </li>
            <li>
              <Link href="/forum" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Community Forum
              </Link>
            </li>
            <li>
              <Link href="/#schedule" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Weekly Worldwide Schedule
              </Link>
            </li>
            <li>
              <Link href="/library" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Personal Tracker & Library
              </Link>
            </li>
            <li>
              <Link href="/donate" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors text-amber-400">
                Upgrade to Supporter
              </Link>
            </li>
          </ul>
        </div>

        {/* Official Publishers */}
        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase text-white font-bold tracking-wider">
            Official Publishers
          </div>
          <ul className="space-y-1 text-xs">
            <li>
              <a href="https://mangaplus.shueisha.co.jp" target="_blank" rel="noopener noreferrer" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Shueisha (MANGA Plus)
              </a>
            </li>
            <li>
              <a href="https://www.viz.com" target="_blank" rel="noopener noreferrer" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Viz Media (Shonen Jump)
              </a>
            </li>
            <li>
              <a href="https://kmanga.kodansha.com" target="_blank" rel="noopener noreferrer" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Kodansha (K Manga)
              </a>
            </li>
            <li>
              <a href="https://www.webtoons.com" target="_blank" rel="noopener noreferrer" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Naver (WEBTOON)
              </a>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase text-white font-bold tracking-wider">
            Company & Legal
          </div>
          <ul className="space-y-1 text-xs">
            <li>
              <Link href="/about" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                About MangaPulse
              </Link>
            </li>
            <li>
              <Link href="/contact" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Contact & Support
              </Link>
            </li>
            <li>
              <Link href="/dmca" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                DMCA Compliance Policy
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/#publishers" className="py-1.5 inline-flex items-center min-h-[32px] hover:text-white transition-colors">
                Official Attribution Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-[#1e2430] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#94a3b8]">
        <div>© {new Date().getFullYear()} MangaPulse. All trademarks and copyrighted titles belong to their respective publishers.</div>
        <div className="font-mono">Independent community directory for manga readers.</div>
      </div>
    </footer>
  );
}
