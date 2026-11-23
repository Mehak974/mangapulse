"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Bell, Check, Clock, ExternalLink, BellRing } from "lucide-react";

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestNotificationPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg bg-[#1a1f2a] hover:bg-[#222938] border border-[#2a3344] text-[#94a1b5] hover:text-white transition-colors"
        title="Chapter release notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#13171f] border border-[#2a3344] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#1e2430] text-xs">
          {/* Header */}
          <div className="p-3 bg-[#0c0e12] flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              <span>Chapter Release Alerts</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-[#94a1b5] hover:text-white flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Web notification permission toggle */}
          <div className="p-2.5 bg-[#181d28] flex items-center justify-between text-[11px]">
            <span className="text-[#94a1b5]">Desktop/Browser Alerts</span>
            <button
              onClick={requestNotificationPermission}
              className="px-2 py-1 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold flex items-center gap-1"
            >
              <BellRing className="w-3 h-3" />
              Enable
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1e2430]">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3 transition-colors hover:bg-[#1a1f2a] flex items-start gap-2.5 cursor-pointer ${
                    !item.is_read ? "bg-blue-950/15" : ""
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    !item.is_read ? "bg-blue-400" : "bg-transparent"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-semibold text-white truncate text-xs">
                        {item.title}
                      </div>
                      <span className="text-[10px] font-mono text-[#5e6b82] flex-shrink-0">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#94a1b5] mt-0.5 leading-relaxed">
                      {item.message}
                    </p>

                    {item.url && (
                      <Link
                        href={item.url}
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-1 font-mono"
                      >
                        <span>View Countdown</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-[#5e6b82]">
                No release notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

