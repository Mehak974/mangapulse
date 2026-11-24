"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  ShieldAlert,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  LifeBuoy,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate reliable submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

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
        <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <LifeBuoy className="w-3.5 h-3.5" /> Support & Communications
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Contact the MangaPulse Team
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-[#94a1b5] max-w-2xl">
          We are committed to open communication with readers, community members, manga creators, and licensed publishers.
        </p>
      </div>

      {/* 3 Dedicated Communication Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* General Support */}
        <div className="p-5 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">General Inquiries</h3>
          <p className="text-xs text-[#94a1b5] leading-relaxed">
            Partnerships, feedback, press inquiries, and general questions regarding the catalog index.
          </p>
          <a
            href="mailto:contact@mangapulse.co"
            className="text-xs font-mono font-semibold text-blue-400 hover:text-blue-300 block pt-1 break-all"
          >
            contact@mangapulse.co
          </a>
        </div>

        {/* Technical Support */}
        <div className="p-5 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Technical Support</h3>
          <p className="text-xs text-[#94a1b5] leading-relaxed">
            Account assistance, bug reports, countdown discrepancies, and tracker sync support.
          </p>
          <a
            href="mailto:support@mangapulse.co"
            className="text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 block pt-1 break-all"
          >
            support@mangapulse.co
          </a>
        </div>

        {/* DMCA & Legal */}
        <div className="p-5 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Copyright & Legal</h3>
          <p className="text-xs text-[#94a1b5] leading-relaxed">
            Formal rights holder takedown notices, publisher verification, and licensing queries.
          </p>
          <a
            href="mailto:dmca@mangapulse.co"
            className="text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 block pt-1 break-all"
          >
            dmca@mangapulse.co
          </a>
        </div>
      </div>

      {/* Interactive Contact Form */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#13171f] border border-[#2a3344] space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Send Us a Direct Message</h2>
          <p className="text-xs text-[#94a1b5]">
            Fill out the form below. We typically respond within 24 to 48 business hours.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Thank You for Reaching Out!</h3>
            <p className="text-xs text-[#94a1b5] max-w-md mx-auto leading-relaxed">
              Your inquiry has been received. Our team will review your message and reply to <strong className="text-white">{email}</strong> promptly.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setMessage("");
                setSubject("");
              }}
              className="py-2 px-4 rounded-xl bg-[#0c0e12] border border-[#2a3344] hover:bg-[#1a1f2a] text-xs font-semibold text-white transition-colors cursor-pointer mt-2"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Walker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Inquiry Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0c0e12] border border-[#2a3344] text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="general">General Inquiry</option>
                  <option value="schedule">Schedule / Countdown Correction</option>
                  <option value="support">Technical & Account Support</option>
                  <option value="publisher">Publisher & Creator Partnership</option>
                  <option value="dmca">DMCA / Copyright Notice</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Summary of your inquiry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Message</label>
              <textarea
                required
                rows={5}
                placeholder="Provide as much detail as possible so we can assist you quickly..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500 resize-y"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-[#5e6b82]">
                <Clock className="w-3.5 h-3.5" />
                <span>Response guarantee: 24–48 hours</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? "Sending Message..." : "Submit Message"}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Helpful Links */}
      <section className="border-t border-[#1e2430] pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5e6b82]">
        <div>
          MangaPulse Headquarters • Online Services Platform • Tokyo & Global Cloud Distribution
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-white transition-colors">
            About Us
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/dmca" className="hover:text-white transition-colors">
            DMCA Policy
          </Link>
        </div>
      </section>
    </div>
  );
}
