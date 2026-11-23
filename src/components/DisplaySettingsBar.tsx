"use client";

import React, { useState, useEffect } from "react";
import { MangaDisplaySettings } from "@/types/manga";
import { getDisplaySettings, saveDisplaySettings } from "@/lib/chapterStore";
import { SlidersHorizontal, Check } from "lucide-react";

export default function DisplaySettingsBar() {
  const [settings, setSettings] = useState<MangaDisplaySettings>({
    showCover: true,
    showTitle: true,
    showRating: true,
    showLatestChapter: true,
    showUnreadCount: true,
  });

  useEffect(() => {
    setSettings(getDisplaySettings());

    const handler = () => {
      setSettings(getDisplaySettings());
    };
    window.addEventListener("mangapulse-display-settings-changed", handler);
    return () => window.removeEventListener("mangapulse-display-settings-changed", handler);
  }, []);

  const handleToggle = (key: keyof MangaDisplaySettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    saveDisplaySettings(updated);
  };

  const options: { key: keyof MangaDisplaySettings; label: string }[] = [
    { key: "showCover", label: "Cover" },
    { key: "showTitle", label: "Title" },
    { key: "showRating", label: "Rating" },
    { key: "showLatestChapter", label: "Latest Chapter" },
    { key: "showUnreadCount", label: "Unread Count" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#0c0e12] border border-[#1e2430] rounded-lg text-xs">
      <div className="flex items-center gap-1.5 text-[#94a1b5] font-mono text-[11px] uppercase mr-2">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Display Options:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => {
          const checked = settings[opt.key];

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleToggle(opt.key)}
              className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                checked
                  ? "bg-[#1a1f2a] border-[#2a3344] text-white"
                  : "bg-transparent border-[#1e2430] text-[#5e6b82] hover:text-[#94a1b5]"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                  checked ? "bg-blue-600 border-blue-500 text-white" : "border-[#2a3344] bg-[#0c0e12]"
                }`}
              >
                {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

