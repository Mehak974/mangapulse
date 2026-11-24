"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, LogOut, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Wait for auth to initialize
    const timer = setTimeout(() => {
      if (!isLoggedIn || user?.role !== "ADMIN") {
        router.replace("/");
      } else {
        setIsVerifying(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isLoggedIn, user?.role, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#13171f] border border-[#2a3344] max-w-sm text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Verifying Admin Access</h2>
            <p className="text-xs text-[#94a1b5] mt-1">Checking MangaPulse staff role credentials...</p>
          </div>
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#13171f] border border-red-500/30 max-w-sm text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Access Restricted</h2>
            <p className="text-xs text-[#94a1b5] mt-1">
              You must have the ADMIN staff role to view this command center.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white flex flex-col">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 bg-[#0c0e12]/90 backdrop-blur-md border-b border-[#2a3344] px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#13171f] hover:bg-[#1e2430] border border-[#2a3344] text-xs text-[#94a1b5] hover:text-white transition-colors"
              title="Return to Public Site"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Site</span>
            </Link>

            <div className="h-4 w-px bg-[#2a3344]" />

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded tracking-wide">
                MP
              </span>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>MangaPulse Admin</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  STAFF v2.4
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#13171f] border border-[#2a3344] text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#94a1b5]">Signed in as:</span>
              <span className="text-white font-mono font-semibold">@{user?.username}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40">
                👑 ADMIN
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
