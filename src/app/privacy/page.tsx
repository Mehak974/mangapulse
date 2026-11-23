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
        <h2 className="text-lg font-bold text-white">1. Core Philosophy: Zero Invasive Tracking</h2>
        <p>
          MangaPulse is designed to respect user privacy. We do not sell, rent, or monetize your personal data. We do not run third-party behavioral advertising trackers, cryptocurrency miners, or fingerprinting scripts.
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
        </ul>

        <h2 className="text-lg font-bold text-white">3. Third-Party Services & APIs</h2>
        <p>
          MangaPulse communicates with official and public index providers:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">AniList GraphQL API:</strong> Used to fetch public catalog metadata (titles, synopsis, genres). No user personal data is sent to AniList.</li>
          <li><strong className="text-white">Supabase:</strong> Provides encrypted database hosting and authentication services compliant with SOC 2 Type II standards.</li>
          <li><strong className="text-white">Outbound Links:</strong> Our directory links directly to official publishers (MANGA Plus by Shueisha, Viz Media, Kodansha, BookWalker). Once you click an outbound link, you are governed by the respective publisher's privacy policy.</li>
        </ul>

        <h2 className="text-lg font-bold text-white">4. Cookies and Local Storage</h2>
        <p>
          We use strictly necessary functional session cookies and local storage tokens to keep you logged in and preserve your tracker filters. We do not use third-party tracking or advertising cookies.
        </p>

        <h2 className="text-lg font-bold text-white">5. Your Data Rights (GDPR & CCPA)</h2>
        <p>
          You have the right to access, export, or permanently delete your account and all associated reading history at any time through your Profile Settings or by contacting us.
        </p>
      </section>
    </div>
  );
}
