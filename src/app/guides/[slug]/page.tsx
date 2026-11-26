import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, Tag, Share2, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { EDITORIAL_GUIDES, GuideArticle } from "@/data/guidesData";

export async function generateStaticParams() {
  return EDITORIAL_GUIDES.map((g) => ({
    slug: g.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = EDITORIAL_GUIDES.find((g) => g.slug === slug);
  if (!guide) return notFound();

  return buildMetadata({
    title: `${guide.title} — MangaPulse Editorial`,
    description: guide.summary,
    path: `/guides/${guide.slug}`,
    image: guide.coverImage,
  });
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = EDITORIAL_GUIDES.find((g) => g.slug === slug);
  if (!guide) notFound();

  // Related guides excluding current
  const related = EDITORIAL_GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.summary,
    "image": guide.coverImage,
    "datePublished": "2026-11-20T08:00:00+00:00",
    "dateModified": "2026-11-26T12:00:00+00:00",
    "author": {
      "@type": "Organization",
      "name": "MangaPulse Media",
      "url": SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": "MangaPulse",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/icon.png`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/guides/${guide.slug}`,
    },
  };

  return (
    <article className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-10 text-[#94a1b5]">
      {/* Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-[#5e6b82]">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/guides" className="text-blue-400 hover:text-blue-300 transition-colors">
          Guides
        </Link>
        <span>/</span>
        <span className="text-[#94a1b5] truncate max-w-xs">{guide.category}</span>
      </div>

      {/* Header Block */}
      <header className="space-y-4 pb-6 border-b border-[#1e2430]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
            {guide.category}
          </span>
          <span className="text-xs font-mono text-[#5e6b82] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {guide.readTime}
          </span>
          <span className="text-[#5e6b82]">•</span>
          <span className="text-xs font-mono text-[#5e6b82] flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {guide.publishedAt}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
          {guide.title}
        </h1>

        <p className="text-sm sm:text-base text-[#94a1b5] leading-relaxed">
          {guide.summary}
        </p>

        <div className="flex items-center gap-3 pt-2 text-xs font-mono text-[#5e6b82]">
          <div className="w-8 h-8 rounded-full bg-[#13171f] border border-[#2a3344] flex items-center justify-center text-white font-bold text-xs">
            MP
          </div>
          <div>
            <div className="text-white font-semibold">{guide.author}</div>
            <div className="text-[11px] text-[#5e6b82]">MangaPulse Media Editorial Department</div>
          </div>
        </div>
      </header>

      {/* Featured Banner Image */}
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#2a3344] bg-[#0c0e12] shadow-2xl">
        <img
          src={guide.coverImage}
          alt={guide.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Body Content */}
      <div className="space-y-10 leading-relaxed text-sm sm:text-base text-[#c4cfde]">
        {guide.sections.map((section, idx) => (
          <section key={idx} className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-2">
              {section.heading}
            </h2>

            {section.body.map((p, pIdx) => (
              <p key={pIdx} className="leading-relaxed text-[#94a1b5]">
                {p}
              </p>
            ))}

            {/* Custom Callout Box */}
            {section.callout && (
              <div className="p-4 sm:p-5 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs sm:text-sm space-y-1 my-4">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>{section.callout.title}</span>
                </div>
                <p className="text-[#94a1b5] leading-relaxed">
                  {section.callout.text}
                </p>
              </div>
            )}

            {/* Comparison Table */}
            {section.table && (
              <div className="overflow-x-auto my-6 rounded-xl border border-[#2a3344] bg-[#0c0e12]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#13171f] border-b border-[#2a3344] text-white font-mono uppercase text-[11px]">
                      {section.table.headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-3 font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2430]">
                    {section.table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#1a1f2a]/40 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 text-[#94a1b5] align-top leading-relaxed">
                            {cIdx === 0 ? <strong className="text-white block">{cell}</strong> : cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Article Tags */}
      <div className="pt-6 border-t border-[#1e2430] flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-[#5e6b82] flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" /> Topics:
        </span>
        {guide.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#13171f] border border-[#2a3344] text-[#94a1b5]"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Official Directory Outbound Banner */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/30 to-[#13171f] border border-blue-500/30 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Track Official Chapter Drops in Real Time</span>
        </div>
        <p className="text-xs text-[#94a1b5] leading-relaxed">
          MangaPulse provides live countdown clocks syncing to weekly Sunday and Tuesday simulpubs on MANGA Plus, Viz Media, and K Manga. All reading links point strictly to authorized publishers.
        </p>
        <div className="pt-1">
          <Link
            href="/#schedule"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300"
          >
            <span>View Weekly Worldwide Release Schedule &rarr;</span>
          </Link>
        </div>
      </section>

      {/* Related Guides Section */}
      <section className="space-y-4 pt-6 border-t border-[#1e2430]">
        <h3 className="font-bold text-lg text-white">More Editorial Guides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/guides/${item.slug}`}
              className="p-4 rounded-xl bg-[#13171f] border border-[#2a3344] hover:border-blue-500/40 transition-colors space-y-2 block group"
            >
              <div className="text-[10px] font-mono text-blue-400 uppercase font-semibold">
                {item.category}
              </div>
              <h4 className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                {item.title}
              </h4>
              <p className="text-[11px] text-[#5e6b82] font-mono">
                {item.readTime}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Back navigation */}
      <div className="pt-4">
        <Link
          href="/guides"
          className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Editorial Guides
        </Link>
      </div>
    </article>
  );
}
