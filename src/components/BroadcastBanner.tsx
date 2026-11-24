"use client";

import React, { useEffect, useState } from "react";
import { Info, AlertTriangle, AlertCircle, X } from "lucide-react";

interface BroadcastData {
  id: string;
  message: string;
  level: "info" | "warning" | "critical";
  is_active: boolean;
}

export default function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<BroadcastData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadBroadcast() {
      try {
        const res = await fetch("/api/admin/broadcast");
        if (res.ok) {
          const data = await res.json();
          if (data.broadcast && data.broadcast.is_active) {
            // Check if user previously dismissed this exact broadcast ID in this session
            const dismissedId = sessionStorage.getItem("mp_dismissed_broadcast_id");
            if (dismissedId !== data.broadcast.id) {
              setBroadcast(data.broadcast);
            }
          }
        }
      } catch {
        // Silently fail if offline
      }
    }
    loadBroadcast();
  }, []);

  if (!broadcast || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("mp_dismissed_broadcast_id", broadcast.id);
    } catch {}
  };

  const isCritical = broadcast.level === "critical";
  const isWarning = broadcast.level === "warning";

  return (
    <div
      role="alert"
      className={`relative z-40 px-4 py-2 text-xs font-medium transition-colors ${
        isCritical
          ? "bg-red-600 text-white"
          : isWarning
          ? "bg-amber-500 text-slate-950 font-semibold"
          : "bg-blue-600 text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-center text-center">
          {isCritical ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-slate-950" />
          ) : (
            <Info className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{broadcast.message}</span>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-black/20 transition-colors flex-shrink-0 cursor-pointer"
          title="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
