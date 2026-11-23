"use client";

import React from "react";
import { OfficialLink } from "@/types/manga";
import { ExternalLink, BookOpen, ShoppingCart, Check } from "lucide-react";

interface OfficialActionsProps {
  links?: OfficialLink[];
  mangaTitle: string;
}

export default function OfficialActions({ links = [], mangaTitle }: OfficialActionsProps) {
  if (!links || links.length === 0) return null;

  const handleTrackClick = (publisher: string, url: string) => {
    try {
      const payload = JSON.stringify({ publisher, mangaTitle, targetUrl: url });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", payload);
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking
    }
  };

  return (
    <div className="surface-card rounded-xl p-5 border border-[#2a3344] space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-[#1e2430]">
        <div>
          <h3 className="font-bold text-white text-sm">
            Official Reading & Purchasing Directory
          </h3>
          <p className="text-xs text-[#94a1b5] mt-0.5">
            Licensed digital simulpubs and authorized volume retailers.
          </p>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Licensed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {links.map((link) => {
          const isFree = link.type === "free";
          const isPurchase = link.type === "purchase";

          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => handleTrackClick(link.name, link.url)}
              className="flex items-center justify-between p-3 rounded-lg bg-[#0c0e12] border border-[#1e2430] hover:border-[#3d4960] hover:bg-[#1a1f2a] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#13171f] border border-[#2a3344] flex items-center justify-center text-[#94a1b5] group-hover:text-white">
                  {isPurchase ? <ShoppingCart className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                </div>

                <div>
                  <div className="font-semibold text-xs text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                    {link.name}
                  </div>
                  <div className="text-[11px] text-[#94a1b5]">{link.badge}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isFree
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : isPurchase
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}>
                  {isFree ? "Free Read" : isPurchase ? "Buy Volume" : "Simulpub"}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-[#5e6b82] group-hover:text-white transition-colors" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
