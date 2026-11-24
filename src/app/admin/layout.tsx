"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  LogOut,
  Loader2,
  Lock,
  Mail,
  Key,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoggedIn, login, signInWithGoogle, logout, updateProfile, refreshProfile } = useAuth();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [liveRole, setLiveRole] = useState<string | null>(null);

  // In-place Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Verify Role against Live Database ──
  const verifyLiveAdminRole = useCallback(async (userId?: string) => {
    let targetId = userId || user?.id;
    let targetEmail = user?.email?.toLowerCase();

    // If targetId or email not yet hydrated from context, check active Supabase session
    if (supabase && (!targetId || !targetEmail)) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          targetId = targetId || session.user.id;
          targetEmail = targetEmail || session.user.email?.toLowerCase();
        }
      } catch (err) {
        console.warn("Could not retrieve session:", err);
      }
    }

    if (!targetId) {
      setCheckingAuth(false);
      setIsAdmin(false);
      return;
    }

    // Owner emails always have master ADMIN privileges
    const isOwner =
      targetEmail === "mehakiqbal974@gmail.com" ||
      targetEmail === "mehakiqbal978@gmail.com";
    if (user?.role === "ADMIN" || isOwner) {
      setIsAdmin(true);
      setLiveRole("ADMIN");
      setCheckingAuth(false);
      refreshProfile?.();
      return;
    }

    // Double-check with live Supabase database
    if (supabase && targetId) {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", targetId)
          .single();

        if (!error && profile) {
          setLiveRole(profile.role);
          if (profile.role === "ADMIN") {
            setIsAdmin(true);
            setCheckingAuth(false);
            refreshProfile?.();
            return;
          }
        }
      } catch (err) {
        console.warn("Could not verify live admin profile:", err);
      }
    }

    setIsAdmin(false);
    setCheckingAuth(false);
  }, [user, refreshProfile]);

  useEffect(() => {
    // Initial check on load
    const timer = setTimeout(() => {
      verifyLiveAdminRole();
    }, 200);
    return () => clearTimeout(timer);
  }, [verifyLiveAdminRole]);

  // ── Handle In-Place Admin Login ──
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const res = await login(loginEmail.trim(), loginPassword);
    if (!res.success) {
      setLoginError(res.error || "Invalid email or password.");
      setLoginLoading(false);
      return;
    }

    // Login successful — verify role
    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .single();

        const isOwner =
          authUser.email?.toLowerCase() === "mehakiqbal974@gmail.com" ||
          authUser.email?.toLowerCase() === "mehakiqbal978@gmail.com";
        if (profile?.role === "ADMIN" || isOwner) {
          setIsAdmin(true);
          setLiveRole("ADMIN");
          setCheckingAuth(false);
          setLoginLoading(false);
          refreshProfile?.();
          return;
        } else {
          setLoginError(`Account signed in, but role is "${profile?.role || "USER"}". Administrator privileges required.`);
          setLoginLoading(false);
          return;
        }
      }
    }
    setLoginLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoginLoading(true);
    setLoginError(null);
    const res = await signInWithGoogle();
    if (!res.success) {
      setLoginError(res.error || "Failed to initiate Google sign-in.");
      setLoginLoading(false);
    }
  };

  // ── 1. LOADING / CHECKING STATE ──
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#13171f] border border-[#2a3344] max-w-sm text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-pulse">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Verifying Admin Credentials</h2>
            <p className="text-xs text-[#94a1b5] mt-1">Connecting to MangaPulse staff security gateway...</p>
          </div>
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  // ── 2. NOT LOGGED IN: IN-PLACE ADMIN LOGIN GATE ──
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#13171f] border border-[#2a3344] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              MangaPulse Staff Portal
            </h1>
            <p className="text-xs text-[#94a1b5]">
              Sign in with your authorized administrator account to access the command center.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loginLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#2a3344] text-white text-xs font-semibold flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a3344]" />
            </div>
            <span className="relative px-3 bg-[#13171f] text-[11px] font-mono text-[#5e6b82] uppercase">
              Or with Email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Staff Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6b82]" />
                <input
                  type="email"
                  required
                  placeholder="admin@mangapulse.co"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white">Password</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6b82]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0c0e12] border border-[#2a3344] text-xs text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Access Admin Command Center</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-[#2a3344]">
            <Link
              href="/"
              className="text-xs text-[#94a1b5] hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to MangaPulse Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. LOGGED IN, BUT ROLE IS NOT ADMIN ──
  if (!isAdmin && user?.role !== "ADMIN" && liveRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#13171f] border border-amber-500/30 max-w-md text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Administrator Privileges Required</h2>
            <p className="text-xs text-[#94a1b5]">
              You are currently signed in as <strong className="text-white">@{user?.username}</strong> ({user?.email}) with role{" "}
              <span className="font-mono text-amber-400 font-bold uppercase">{user?.role || liveRole || "USER"}</span>.
            </p>
            <p className="text-xs text-[#5e6b82] pt-2">
              The MangaPulse Admin Panel is restricted exclusively to verified staff members.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
            <button
              onClick={async () => {
                setCheckingAuth(true);
                await refreshProfile?.();
                await verifyLiveAdminRole();
              }}
              className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-check Permissions</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-[#0c0e12] hover:bg-[#1a1f2a] border border-[#2a3344] text-[#94a1b5] hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
          </div>

          <Link
            href="/"
            className="text-xs text-[#5e6b82] hover:text-white transition-colors mt-2"
          >
            &larr; Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // ── 4. AUTHORIZED: RENDER ADMIN DASHBOARD ──
  return (
    <div className="min-h-screen bg-[#0c0e12] text-white flex flex-col">
      {/* Top Bar */}
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
                  STAFF COMMAND
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#13171f] border border-[#2a3344] text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[#94a1b5]">Staff:</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
