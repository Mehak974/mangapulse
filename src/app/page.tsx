import React from "react";
import Link from "next/link";
import { fetchPopular, fetchTrending } from "@/lib/anilist";
import MangaCard from "@/components/MangaCard";
import CountdownTimer from "@/components/CountdownTimer";
import WeeklyScheduleSection from "@/components/WeeklyScheduleSection";
import {
  Calendar,
  Clock,
  Flame,
  Trophy,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Shield,
  Star,
  Layers,
  ChevronRight,
  Crown,
  Sparkles,
} from "lucide-react";

export const revalidate = 3600; // 1 hour cache

const WEEKLY_SCHEDULE = [
  {
    day: "Sunday",
    utcTime: "15:00 UTC / 00:00 JST",
    magazine: "Weekly Shonen Jump (Shueisha)",
    platform: "MANGA Plus / Viz Media",
    titles: [
      { name: "One Piece", ch: "1135", slug: "one-piece-30013" },
      { name: "Sakamoto Days", ch: "198", slug: "sakamoto-days-125828" },
      { name: "Kagurabachi", ch: "68", slug: "kagurabachi-169355" },
      { name: "Blue Box", ch: "182", slug: "blue-box-132182" },
      { name: "Akane-banashi", ch: "142", slug: "akane-banashi-144866" },
      { name: "Witch Watch", ch: "189", slug: "witch-watch-128896" },
    ],
  },
  {
    day: "Tuesday",
    utcTime: "15:00 UTC / 00:00 JST",
    magazine: "Shonen Jump+ (Digital)",
    platform: "MANGA Plus / Viz",
    titles: [
      { name: "Chainsaw Man", ch: "192", slug: "chainsaw-man-105778" },
      { name: "Dandadan", ch: "180", slug: "dandadan-132029" },
      { name: "Spy x Family", ch: "109", slug: "spy-x-family-108556" },
      { name: "Kaiju No. 8", ch: "118", slug: "kaiju-no-8-120760" },
    ],
  },
  {
    day: "Wednesday",
    utcTime: "15:00 UTC / 00:00 JST",
    magazine: "Weekly Shonen Magazine (Kodansha)",
    platform: "K Manga",
    titles: [
      { name: "Blue Lock", ch: "288", slug: "blue-lock-106130" },
      { name: "Hajime no Ippo", ch: "1475", slug: "hajime-no-ippo-30007" },
      { name: "Shangri-La Frontier", ch: "195", slug: "shangri-la-frontier-122063" },
      { name: "Frieren: Beyond Journey's End", ch: "138", slug: "frieren-118586" },
    ],
  },
  {
    day: "Thursday",
    utcTime: "15:00 UTC / 00:00 JST",
    magazine: "Weekly Young Jump / Weekly Shonen Champion",
    platform: "MANGA Plus / K Manga",
    titles: [
      { name: "Kingdom", ch: "818", slug: "kingdom-46765" },
      { name: "Oshi no Ko", ch: "166", slug: "oshi-no-ko-117195" },
      { name: "Choujin X", ch: "62", slug: "choujin-x-126693" },
    ],
  },
  {
    day: "Friday & Saturday",
    utcTime: "14:00 UTC",
    magazine: "KakaoPage / Naver Webtoon (Manhwa)",
    platform: "Tappytoon / WEBTOON",
    titles: [
      { name: "Solo Leveling: Ragnarok", ch: "35", slug: "solo-leveling-ragnarok-179445" },
      { name: "Omniscient Reader", ch: "238", slug: "omniscient-reader-119257" },
      { name: "Tower of God", ch: "632", slug: "tower-of-god-85143" },
      { name: "Eleceed", ch: "315", slug: "eleceed-106929" },
    ],
  },
];

const ALL_TIME_TOP = [
  { rank: 1, title: "Berserk", score: 9.4, author: "Kentarou Miura", year: 1989, ch: 380, slug: "berserk-30002" },
  { rank: 2, title: "JoJo's Bizarre Adventure: Steel Ball Run", score: 9.3, author: "Hirohiko Araki", year: 2004, ch: 95, slug: "steel-ball-run-31706" },
  { rank: 3, title: "One Piece", score: 9.2, author: "Eiichiro Oda", year: 1997, ch: 1130, slug: "one-piece-30013" },
  { rank: 4, title: "Vagabond", score: 9.2, author: "Takehiko Inoue", year: 1998, ch: 327, slug: "vagabond-30656" },
  { rank: 5, title: "Monster", score: 9.1, author: "Naoki Urasawa", year: 1994, ch: 162, slug: "monster-30001" },
  { rank: 6, title: "Vinland Saga", score: 9.0, author: "Makoto Yukimura", year: 2005, ch: 215, slug: "vinland-saga-30642" },
  { rank: 7, title: "Fullmetal Alchemist", score: 9.0, author: "Hiromu Arakawa", year: 2001, ch: 116, slug: "fullmetal-alchemist-30025" },
  { rank: 8, title: "Grand Blue Dreaming", score: 8.9, author: "Kenji Inoue", year: 2014, ch: 95, slug: "grand-blue-87395" },
  { rank: 9, title: "20th Century Boys", score: 8.9, author: "Naoki Urasawa", year: 1999, ch: 249, slug: "20th-century-boys-30003" },
  { rank: 10, title: "Kingdom", score: 8.9, author: "Yasuhisa Hara", year: 2006, ch: 818, slug: "kingdom-46765" },
];

const PUBLISHERS_DIRECTORY = [
  {
    name: "MANGA Plus by Shueisha",
    headquarters: "Tokyo, Japan",
    freePolicy: "First 3 chapters & last 3 chapters permanently free. Complete series free once in app.",
    simulpubDay: "Sundays & Tuesdays 15:00 UTC",
    catalog: "Weekly Shonen Jump, Jump+, Jump SQ (One Piece, Chainsaw Man, Sakamoto Days, Dandadan)",
    url: "https://mangaplus.shueisha.co.jp",
  },
  {
    name: "Viz Media (Shonen Jump)",
    headquarters: "San Francisco, USA",
    freePolicy: "Latest 3 chapters free on web. $2.99/mo digital vault for 15,000+ backlog chapters.",
    simulpubDay: "Sundays & Tuesdays 07:00 PST",
    catalog: "Official English Shonen Jump, Viz Signature, Shojo Beat",
    url: "https://www.viz.com",
  },
  {
    name: "K Manga (Kodansha)",
    headquarters: "Tokyo, Japan / USA",
    freePolicy: "Daily ticket system for free chapters + paid point simulpubs for latest releases.",
    simulpubDay: "Wednesdays 00:00 JST",
    catalog: "Weekly Shonen Magazine, Morning, Afternoon (Blue Lock, Attack on Titan, Vinland Saga)",
    url: "https://kmanga.kodansha.com",
  },
  {
    name: "WEBTOON (Naver)",
    headquarters: "Seoul, South Korea / Los Angeles, USA",
    freePolicy: "Ad-supported weekly free chapters on release + Fast Pass coin system.",
    simulpubDay: "Daily rolling updates at 18:00 EST",
    catalog: "Top South Korean Manhwa (Tower of God, Omniscient Reader, Lore Olympus)",
    url: "https://www.webtoons.com",
  },
];

export default async function HomePage() {
  const [popularManga, trendingManga] = await Promise.all([
    fetchPopular(1, 18),
    fetchTrending(1, 10),
  ]);

  const countdownManga = trendingManga
    .filter((m) => m.nextAiringChapter && m.status === "RELEASING")
    .slice(0, 3);

  return (
    <div className="space-y-16 pb-20">
      {/* Index Status Sub-header */}
      <section className="border-b border-[#1e2430] bg-[#0f1217] py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#94a1b5]">
                MangaPulse Release Directory & Tracker
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Manga Release Schedule, Countdowns & Official Directory
            </h1>
            <p className="text-xs sm:text-sm text-[#94a1b5] leading-relaxed">
              Tracking simultaneous chapter releases across Shueisha, Kodansha, Viz Media, and Kakao. Zero scanlations. Direct verified access to official publishers and chapter clocks.
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: Active Imminent Chapter Countdowns */}
      {countdownManga.length > 0 && (
        <section id="countdowns" className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#1e2430]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">
                Active Simulpub Chapter Countdowns
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#5e6b82]">
              Synced to Japanese Midnight JST Drop Times
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {countdownManga.map((manga) => (
              <div
                key={manga.id}
                className="surface-card rounded-xl p-5 border border-[#2a3344] hover:border-[#3d4960] transition-colors flex flex-col justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 relative rounded bg-[#0c0e12] overflow-hidden flex-shrink-0 border border-[#1e2430]">
                    <img
                      src={manga.coverImage.medium || manga.coverImage.large || ""}
                      alt={manga.displayTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/manga/${manga.slug}`}
                      className="font-bold text-sm text-white hover:text-blue-400 transition-colors line-clamp-1"
                    >
                      {manga.displayTitle}
                    </Link>
                    <div className="text-[11px] text-[#94a1b5] mt-0.5">
                      {manga.genres[0]} • {manga.countryOfOrigin === "KR" ? "Manhwa" : "Manga"}
                    </div>
                    <Link
                      href={`/release-date/${manga.slug}`}
                      aria-label={`View release countdown and full schedule for ${manga.displayTitle}`}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:underline mt-1 py-1 min-h-[28px]"
                    >
                      <span>Full Schedule Page</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {manga.nextAiringChapter && (
                  <CountdownTimer
                    targetTimestamp={manga.nextAiringChapter.airingAt}
                    chapterNumber={manga.nextAiringChapter.episodeOrChapter}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Complete Weekly Release Schedule Calendar */}
      <WeeklyScheduleSection schedule={WEEKLY_SCHEDULE} />

      {/* Section 3: Popular & Trending Series (Dense Grid) */}
      <section id="trending" className="max-w-7xl mx-auto px-4 lg:px-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">
              Trending & Most Tracked Series
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#5e6b82]">
            Updated Daily via AniList
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {popularManga.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      </section>

      {/* Section 4: All-Time Top 10 Ranked Table */}
      <section id="top-rated" className="max-w-7xl mx-auto px-4 lg:px-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">
              Highest Rated Manga of All Time
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#5e6b82]">
            Global Aggregate Ratings
          </span>
        </div>

        <div className="surface-card rounded-xl border border-[#2a3344] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c0e12] border-b border-[#1e2430] text-[#94a1b5] font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Title & Author</th>
                  <th className="py-3 px-4 w-28">Score</th>
                  <th className="py-3 px-4 w-24">Year</th>
                  <th className="py-3 px-4 w-28">Length</th>
                  <th className="py-3 px-4 w-28 text-right">Official Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2430]">
                {ALL_TIME_TOP.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-[#1a1f2a] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-center text-[#94a1b5]">
                      {entry.rank}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/manga/${entry.slug}`}
                        className="font-bold text-white hover:text-blue-400 transition-colors"
                      >
                        {entry.title}
                      </Link>
                      <div className="text-[11px] text-[#5e6b82]">{entry.author}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {entry.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#94a1b5]">{entry.year}</td>
                    <td className="py-3 px-4 font-mono text-[#94a1b5]">{entry.ch} Chapters</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/manga/${entry.slug}`}
                        aria-label={`Official reading directory and links for ${entry.title}`}
                        className="text-xs font-semibold text-blue-400 hover:underline py-1.5 inline-flex items-center min-h-[32px]"
                      >
                        Directory →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Official Publishers & Licensing Hub Directory */}
      <section id="publishers" className="max-w-7xl mx-auto px-4 lg:px-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">
              Official Manga Publishers & Licensing Guide
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#5e6b82]">
            Where to Legally Read Official English Releases
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PUBLISHERS_DIRECTORY.map((pub) => (
            <div key={pub.name} className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-white">{pub.name}</h3>
                  <span className="text-[10px] font-mono text-[#94a1b5] px-1.5 py-0.5 rounded bg-[#0c0e12] border border-[#1e2430]">
                    {pub.headquarters}
                  </span>
                </div>

                <div className="text-xs text-[#94a1b5] leading-relaxed">
                  <span className="text-white font-medium">Free Access Policy: </span>
                  {pub.freePolicy}
                </div>

                <div className="text-xs text-[#94a1b5]">
                  <span className="text-white font-medium">Simulpub Cadence: </span>
                  {pub.simulpubDay}
                </div>

                <div className="text-[11px] text-[#5e6b82] leading-tight">
                  <span className="text-[#94a1b5] font-medium">Key Series: </span>
                  {pub.catalog}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1e2430]">
                <a
                  href={pub.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>Visit Official Platform</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Manga Patron Wall of Fame (Community Honors) ── */}
      <section className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#13171f] via-[#10141b] to-[#0c0e12] border border-slate-300/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-200/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1e2430] mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-slate-100" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Manga Patron Wall of Fame
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-200 border border-white/20">
                OFFICIAL PATRONS
              </span>
            </div>
            <p className="text-xs text-[#94a1b5] mt-1">
              Honoring our elite champions financing high-speed official chapter countdowns and legal indexing.
            </p>
          </div>

          <Link
            href="/donate#patrons"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-200 to-white text-black text-xs font-black shadow-[0_0_14px_rgba(255,255,255,0.7)] hover:scale-105 transition-transform flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>Join Wall of Fame ($15)</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
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
              favorite: "Omniscient Reader",
              since: "Nov 2024",
            },
            {
              name: "ShadowArchivist",
              tier: "Manga Patron",
              favorite: "Estate Developer",
              since: "Nov 2024",
            },
            {
              name: "ReiChainsaw",
              tier: "Manga Patron",
              favorite: "Chainsaw Man",
              since: "Nov 2024",
            },
          ].map((p) => (
            <div
              key={p.name}
              className="p-4 rounded-xl bg-[#0c0e12] border border-slate-300/40 shadow-sm flex items-center gap-3 group hover:border-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-200 flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_rgba(255,255,255,0.4)] flex-shrink-0">
                {p.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                  <span>{p.name}</span>
                  <Crown className="w-3 h-3 text-slate-300" />
                </div>
                <div className="text-[10px] font-mono text-slate-300">{p.tier}</div>
                <div className="text-[10px] text-[#94a1b5] truncate mt-0.5">Top: {p.favorite}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
