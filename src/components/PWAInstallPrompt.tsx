"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Don't show if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Don't show if user dismissed it recently (within 7 days)
    const dismissedAt = localStorage.getItem("mangapulse_pwa_dismissed");
    if (dismissedAt) {
      const timeDiff = Date.now() - parseInt(dismissedAt, 10);
      if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Capture standard beforeinstallprompt event (Chromium, Android, Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 5. Hide if app is successfully installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.removeItem("mangapulse_pwa_dismissed");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // If on iOS or standalone capable browser after a short delay, show prompt
    const timer = setTimeout(() => {
      if (!isStandalone) {
        setIsVisible(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      // Fallback: browser install instruction
      alert("To install MangaPulse, click your browser menu (⋮ or Share) and select 'Install app' or 'Add to Home screen'.");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("mangapulse_pwa_dismissed", Date.now().toString());
  };

  if (!isVisible || isInstalled) return null;

  return (
    <aside
      aria-label="Install App"
      className="fixed bottom-20 sm:bottom-5 right-4 sm:right-5 z-50 max-w-[320px] w-full bg-[#10141c]/95 backdrop-blur-md border border-[#2a3344] rounded-2xl p-4 shadow-2xl text-white animate-in slide-in-from-bottom-5 duration-300"
    >
      {/* Close Cross Button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Close installation prompt"
        className="absolute top-3 right-3 p-1 rounded-lg text-[#94a1b5] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-5">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-xs text-white">Install MangaPulse</h4>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              PWA
            </span>
          </div>
          <p className="text-[11px] text-[#94a1b5] mt-0.5 leading-snug">
            Fast countdowns, reading tracker, and home screen access.
          </p>
        </div>
      </div>

      {showIOSInstructions ? (
        <div className="mt-3 p-2.5 rounded-xl bg-[#0c0e12] border border-[#1e2430] text-[11px] text-[#cbd5e1] space-y-1">
          <div className="font-semibold text-white">To install on iOS:</div>
          <p>1. Tap the <span className="font-bold text-blue-400">Share</span> button at the bottom.</p>
          <p>2. Scroll down and tap <span className="font-bold text-white">"Add to Home Screen"</span>.</p>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl bg-[#161a22] hover:bg-[#1e2430] border border-[#2a3344] text-[#94a1b5] hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Not now
          </button>
        </div>
      )}
    </aside>
  );
}
