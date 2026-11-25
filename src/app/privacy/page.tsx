import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "MangaPulse Privacy Policy and data protection standards.",
  path: "/privacy",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-[#94a1b5] space-y-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 hover:text-blue-300">
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>

      <div className="border-b border-[#1e2430] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
          <Shield className="w-3.5 h-3.5" /> Privacy & Data Transparency
        </div>
        <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
        <p className="text-xs text-[#5e6b82]">Effective Date: November 24, 2026 • Version 1.2</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. Core Philosophy: Privacy First & Transparency</h2>
        <p>
          MangaPulse is designed to respect user privacy. We do not sell or rent your personal reading data. We do not host cryptocurrency miners or invasive fingerprinting scripts. We operate a legal manga release index and library tracker with full transparency regarding data storage, cookies, and partner services.
        </p>

        <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-white">Account Information:</strong> When you create an account, we store your email address, username, and encrypted credentials securely through Supabase Auth. If you use Google OAuth, we receive only your public profile name and verified email.
          </li>
          <li>
            <strong className="text-white">Reading Library & Tracker Data:</strong> Your tracked manga entries, chapter reading progress, custom collections, and personal notes are stored to synchronize your reading list across your devices.
          </li>
          <li>
            <strong className="text-white">Local / Guest Storage:</strong> If you use MangaPulse as a guest without creating an account, your library data and preferences remain strictly on your local device via browser <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded">localStorage</code> and are never transmitted to our servers.
          </li>
          <li>
            <strong className="text-white">Account Security & Telemetry:</strong> To prevent brute-force attacks, abuse, and fraudulent activity, we record standard connection telemetry (IP address and browser user-agent) during account authentication. This data is stored in a private administrative table inaccessible to public profile queries and is retained solely for account protection and security auditing.
          </li>
        </ul>

        <h2 className="text-lg font-bold text-white">3. Third-Party Services & APIs</h2>
        <p>
          MangaPulse communicates with official and public index providers:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">AniList GraphQL API:</strong> Used to fetch public catalog metadata (titles, synopsis, genres). No user personal data is sent to AniList.</li>
          <li><strong className="text-white">Supabase:</strong> Provides encrypted database hosting and authentication services compliant with SOC 2 Type II standards.</li>
          <li><strong className="text-white">Ko-fi (Payment Processing):</strong> All donations and memberships are processed off-site by Ko-fi. MangaPulse never collects, sees, or stores your credit card or financial credentials. Only non-sensitive webhook confirmation metadata (such as supporter tier and payer email for badge matching) is received.</li>
          <li><strong className="text-white">Outbound Links:</strong> Our directory links directly to official publishers (MANGA Plus by Shueisha, Viz Media, Kodansha). Once you click an outbound link, you are governed by the respective publisher's privacy policy.</li>
        </ul>

        <h2 className="text-lg font-bold text-white">4. Cookies and Advertising Partners</h2>
        <p>
          We use strictly necessary functional session cookies and local storage tokens to keep you logged in and preserve your tracker filters and theme preferences.
        </p>
        <p>
          <strong className="text-white">Google Advertising & Third-Party Cookies:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to MangaPulse and/or other sites on the Internet.
        </p>
        <p>
          Users may opt out of personalized advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline font-medium"
          >
            Google Ads Settings
          </a>
          . Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting{" "}
          <a
            href="https://www.aboutads.info/choices/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline font-medium"
          >
            aboutads.info
          </a>
          .
        </p>

        <h2 className="text-lg font-bold text-white">5. Your Data Rights (GDPR & CCPA)</h2>
        <p>
          You have the right to access, export, or permanently delete your account and all associated reading history at any time through your Profile Settings or by contacting us at{" "}
          <a href="mailto:support@mangapulse.co" className="text-blue-400 hover:text-blue-300 underline">
            support@mangapulse.co
          </a>
          .
        </p>

        <h2 className="text-lg font-bold text-white">6. Contacting Us</h2>
        <p>
          If you have any questions regarding this Privacy Policy or your personal data, you may contact our data protection team via our{" "}
          <Link href="/contact" className="text-blue-400 hover:text-blue-300 underline">
            Contact & Support Page
          </Link>{" "}
          or by emailing <strong className="text-white">contact@mangapulse.co</strong>.
        </p>
      </section>
    </div>
  );
}
