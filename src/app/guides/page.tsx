import React from "react";
import Link from "next/link";
import { BookOpen, Clock, Calendar, ArrowRight, ShieldCheck, Tag, Sparkles } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { EDITORIAL_GUIDES } from "@/data/guidesData";

export const metadata = buildMetadata({
  title: "Manga & Manhwa Editorial Guides, Reading Orders & Publisher Breakdown",
  description:
    "Comprehensive, human-written editorial guides for manga and manhwa readers: simulpub schedules, legal platform comparisons, reading orders, and industry analysis.",
  path: "/guides",
});

export default function GuidesPage() {
  const featured = EDITORIAL_GUIDES[0];
  const remaining = EDITORIAL_GUIDES.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-12">
      {/* Header Banner */}
      <div className="border-b border-[#1e2430] pb-8 space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>MangaPulse Editorial Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Editorial Guides &amp; Industry Analysis
        </h1>
        <p className="text-sm sm:text-base text-[#94a1b5] max-w-3xl leading-relaxed">
          In-depth guides, verified legal platform comparisons, reading orders, and release breakdown articles curated by the MangaPulse editorial team to help fans support the official manga and manhwa industry.
        </p>
      </div>

      {/* Featured Article Card */}
      {featured && (
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#13171f] via-[#10141d] to-[#0c0e12] border border-[#2a3344] p-6 sm:p-8 shadow-2xl group">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                  Featured Guide
                </span>
                <span className="text-xs font-mono text-[#94a1b5]">
                  {featured.category}
                </span>
                <span className="text-[#5e6b82]">•</span>
                <span className="text-xs text-[#94a1b5] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {featured.readTime}
                </span>
              </div>

              <Link href={`/guides/${featured.slug}`} className="block group-hover:text-blue-400 transition-colors">
                <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  {featured.title}
                </h2>
              </Link>

              <p className="text-xs sm:text-sm text-[#94a1b5] leading-relaxed line-clamp-3">
                {featured.summary}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {featured.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0c0e12] border border-[#1e2430] text-[#94a1b5]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href={`/guides/${featured.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-500/20"
                >
                  <span>Read Complete Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative aspect-[16/10] rounded-xl overflow-hidden border border-[#2a3344] bg-[#0c0e12]">
              <img
                src={featured.coverImage}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </section>
      )}

      {/* Remaining Guides Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            All Published Guides &amp; Breakdowns
          </h2>
          <span className="text-xs font-mono text-[#5e6b82]">
            {EDITORIAL_GUIDES.length} Original Articles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remaining.map((guide) => (
            <article
              key={guide.slug}
              className="surface-card rounded-2xl border border-[#2a3344] hover:border-blue-500/40 p-5 flex flex-col justify-between transition-all duration-300 group shadow-lg"
            >
              <div className="space-y-3">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#0c0e12] border border-[#1e2430]">
                  <img
                    src={guide.coverImage}
                    alt={guide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white uppercase">
                    {guide.category}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#5e6b82] font-mono">
                  <span>{guide.publishedAt}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {guide.readTime}
                  </span>
                </div>

                <Link href={`/guides/${guide.slug}`} className="block">
                  <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {guide.title}
                  </h3>
                </Link>

                <p className="text-xs text-[#94a1b5] line-clamp-3 leading-relaxed">
                  {guide.summary}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#1e2430] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#5e6b82]">
                  By {guide.author}
                </span>
                <Link
                  href={`/guides/${guide.slug}`}
                  className="text-xs font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Editorial Mission Statement Box */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>MangaPulse Editorial Transparency &amp; Zero Piracy Policy</span>
        </div>
        <p className="text-xs text-[#94a1b5] leading-relaxed">
          All editorial articles and guides published on MangaPulse are original works created by human editors. We do not host, rip, or display copyrighted manga pages. Every outbound button links exclusively to verified licensed distributors (MANGA Plus by Shueisha, Viz Media, Kodansha K Manga, WEBTOON, and authorized retailers) to champion the legal manga and manhwa ecosystem.
        </p>
      </section>
    </div>
  );
}
