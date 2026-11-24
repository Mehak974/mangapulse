"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Lock, Mail, User, ArrowRight, AlertCircle } from "lucide-react";

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    signup,
    signInWithGoogle,
    isSupabaseConfigured,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!authModalOpen) return null;

  const isLogin = authModalMode === "login";

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setErrorMsg(res.error || "Google sign-in could not be initiated.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || "Login failed");
        } else {
          setAuthModalOpen(false);
        }
      } else {
        if (!username.trim()) {
          setErrorMsg("Username is required");
          setLoading(false);
          return;
        }
        const res = await signup(email, password, username.trim());
        if (!res.success) {
          setErrorMsg(res.error || "Sign up failed");
        } else {
          setAuthModalOpen(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-sm bg-[#13171f] border border-[#2a3344] rounded-xl p-4 sm:p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto overflow-x-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white text-black font-black text-xs flex items-center justify-center">
              MP
            </div>
            <h2 className="font-bold text-sm">
              {isLogin ? "Sign In to MangaPulse" : "Create MangaPulse Account"}
            </h2>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1 rounded text-[#94a1b5] hover:text-white hover:bg-[#1a1f2a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google OAuth Button */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-3 rounded-lg bg-white hover:bg-neutral-100 text-black font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm disabled:opacity-75"
          >
            {/* Official Google G Logo SVG */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.675-5.17 3.675-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.22 0 10.06 0 12s.45 3.78 1.25 5.39l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          {!isSupabaseConfigured && (
            <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                To activate Google OAuth, configure your Supabase URL & Anon Key in <code className="font-mono text-white">.env.local</code>.
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1e2430]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono text-[#5e6b82]">
            <span className="bg-[#13171f] px-2">or email</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-[#0c0e12] p-1 border border-[#1e2430] mb-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode("login");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              isLogin ? "bg-[#1a1f2a] text-white" : "text-[#94a1b5] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode("signup");
              setErrorMsg("");
            }}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              !isLogin ? "bg-[#1a1f2a] text-white" : "text-[#94a1b5] hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#94a1b5] mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5e6b82]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. luffy_reader"
                  className="w-full bg-[#0c0e12] border border-[#2a3344] rounded-lg pl-9 pr-3 py-2 text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase text-[#94a1b5] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5e6b82]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0c0e12] border border-[#2a3344] rounded-lg pl-9 pr-3 py-2 text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-[#94a1b5] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5e6b82]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0c0e12] border border-[#2a3344] rounded-lg pl-9 pr-3 py-2 text-white placeholder-[#5e6b82] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#1e2430] text-[11px] text-[#5e6b82] text-center">
          Reading library, chapter bookmarks & countdown alerts sync automatically.
        </div>
      </div>
    </div>
  );
}
