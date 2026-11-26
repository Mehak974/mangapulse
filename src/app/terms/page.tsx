import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description: "MangaPulse Terms of Service, Acceptable Use, and Directory Standards.",
  path: "/terms",
});

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-[#94a1b5] space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 hover:text-blue-300">
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>

      <div className="border-b border-[#1e2430] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
          <FileText className="w-3.5 h-3.5" /> Legal Agreement
        </div>
        <h1 className="text-3xl font-black text-white">Terms of Service</h1>
        <p className="text-xs text-[#5e6b82]">Last Updated: November 24, 2026</p>
      </div>

      {/* Payment Security Notice Callout */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white text-sm block">Zero Payment Card Data Collected on MangaPulse</strong>
          <p className="leading-relaxed text-[#c4cfde]">
            MangaPulse <strong>never</strong> asks for, handles, or stores credit cards, debit cards, or banking information on our website. All voluntary memberships and supporter donations are conducted securely off-site via <strong>Ko-fi</strong> (powered by Stripe &amp; PayPal), ensuring zero risk of payment fraud or credential theft.
          </p>
        </div>
      </div>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. Nature of the Service (Release Tracker & Official Directory)</h2>
        <p>
          MangaPulse is an online publication and reading directory operated by <strong>MangaPulse Media</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). MangaPulse operates strictly as an informational index, release schedule tracker, and curated legal directory. MangaPulse <strong>does not host, store, translate, scan, or distribute copyrighted comic images, raw manga files, or scanlations</strong> on its servers.
        </p>

        <h2 className="text-lg font-bold text-white">2. User Accounts &amp; Responsibilities</h2>
        <p>
          When creating an account, you agree to provide accurate information and maintain the security of your login credentials. You are responsible for all activities that occur under your account.
        </p>

        <h2 className="text-lg font-bold text-white">3. Acceptable Community Conduct</h2>
        <p>
          In community reviews and forum discussions, you agree not to:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Post links to illegal scanlation sites, piracy distributors, torrents, or direct-download pirate aggregators.</li>
          <li>Post abusive, harassing, defamatory, or unlawful content.</li>
          <li>Spam commercial advertisements or automated bot submissions.</li>
        </ul>

        <h2 className="text-lg font-bold text-white">4. Publisher Intellectual Property</h2>
        <p>
          All manga, manhwa, and manhua titles, character names, cover artworks, and trademarks displayed on this site belong exclusively to their respective authors, artists, and licensed publishing corporations (including Shueisha, Kodansha, Kadokawa, Square Enix, Viz Media, and Naver). Their use on MangaPulse is for informational, news, and indexing purposes under fair use doctrine.
        </p>

        <h2 className="text-lg font-bold text-white">5. Disclaimer of Warranties</h2>
        <p>
          MangaPulse provides release countdowns and schedules on an &quot;as is&quot; and &quot;as available&quot; basis. While we strive for 100% accuracy via verified publication calendars, publisher schedules may occasionally shift due to sudden creator hiatuses, editorial holiday breaks, or natural disasters.
        </p>

        <h2 className="text-lg font-bold text-white">6. Voluntary Contributions &amp; Payment Security (100% Ko-fi Processed)</h2>
        <p>
          MangaPulse is a community-funded project supported by reader tips. To safeguard our users and maintain the highest security standards:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-white">Zero Financial Information Stored on MangaPulse:</strong> We do not collect, process, or store credit cards, debit cards, bank details, or CVVs on our website or database. No payment forms exist on MangaPulse.
          </li>
          <li>
            <strong className="text-white">100% Handled Through Ko-fi:</strong> All transactions (Coffee tips, Pro Supporter memberships, and Manga Patron subscriptions) are executed exclusively through official <strong>Ko-fi</strong> checkout pages, backed by PCI-DSS compliant global processors (PayPal and Stripe).
          </li>
          <li>
            <strong className="text-white">Zero Scam or Fraud Exposure:</strong> Because your financial details are never entered on or transmitted through MangaPulse, there is zero risk of card skimming, scamming, or financial data leaks from our platform.
          </li>
          <li>
            <strong className="text-white">Webhook Syncing &amp; Perks:</strong> Supporter badges and profile perks are synchronized automatically via Ko-fi webhooks to verified accounts based on your linked Ko-fi payer email.
          </li>
        </ul>
      </section>
    </div>
  );
}
