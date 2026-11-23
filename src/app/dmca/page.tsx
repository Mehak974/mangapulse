import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Mail } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "DMCA & Copyright Compliance",
  description: "MangaPulse DMCA copyright compliance, zero-image-hosting policy, and publisher contact.",
  path: "/dmca",
});

export default function DmcaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-[#94a1b5] space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 hover:text-blue-300">
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>

      <div className="border-b border-[#1e2430] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Legal Aggregator Compliance
        </div>
        <h1 className="text-3xl font-black text-white">DMCA & Copyright Policy</h1>
        <p className="text-xs text-[#5e6b82]">Last Updated: November 24, 2026</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed">
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed space-y-1">
          <p className="font-bold text-sm text-emerald-200">Zero Image Hosting Notice</p>
          <p>
            MangaPulse <strong>does NOT host, scan, rip, store, or distribute any copyrighted manga pages or digital files</strong> on its servers. All outbound reading buttons link exclusively to official licensed digital platforms (MANGA Plus by Shueisha, Viz Media, Kodansha K Manga, BookWalker, Amazon).
          </p>
        </div>

        <h2 className="text-lg font-bold text-white">1. Compliance Commitment</h2>
        <p>
          MangaPulse complies fully with the Digital Millennium Copyright Act (17 U.S.C. § 512) and international copyright legislation. We respect the intellectual property rights of mangaka, authors, illustrators, and publishing companies worldwide.
        </p>

        <h2 className="text-lg font-bold text-white">2. Purpose of MangaPulse</h2>
        <p>
          MangaPulse acts as a digital index, live countdown calendar, and official reading directory designed to <strong>promote and channel readers toward legal, paying, and official ad-supported platforms</strong>, actively discouraging engagement with unauthorized scanlation websites.
        </p>

        <h2 className="text-lg font-bold text-white">3. Takedown Notice Protocol</h2>
        <p>
          If you are a copyright owner or authorized representative and believe that any metadata, link, or user-submitted content on MangaPulse infringes upon your copyright, please submit a written notification containing:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>Identification of the specific URL on MangaPulse containing the material to be removed or disabled.</li>
          <li>Your contact information (name, address, telephone number, and email address).</li>
          <li>A statement that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
          <li>A statement made under penalty of perjury that the information provided in your notice is accurate and that you are authorized to act on behalf of the owner.</li>
          <li>An electronic or physical signature of the authorized person.</li>
        </ul>

        <div className="p-4 rounded-lg bg-[#141820] border border-[#1e2430] flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <p className="text-xs font-mono uppercase text-[#5e6b82]">Designated DMCA Agent Email</p>
            <p className="text-sm font-bold text-white">legal@mangapulse.com</p>
          </div>
        </div>
      </section>
    </div>
  );
}
