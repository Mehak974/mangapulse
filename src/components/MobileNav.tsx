"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Flame, Bookmark, Sparkles, User } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "Home", href: "/", icon: Home },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Trending", href: "/trending", icon: Flame },
    { label: "Library", href: "/library", icon: Bookmark },
    { label: "Upgrade", href: "/donate", icon: Sparkles, isDonate: true },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0e12]/95 backdrop-blur-md border-t border-[#1e2430] px-2 py-1.5">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isDonate = tab.isDonate;
          const isActive =
            !isDonate &&
            (pathname === tab.href ||
              (tab.href !== "/" && pathname.startsWith(tab.href)));

          let colorClass = "text-white hover:text-blue-300 font-medium";
          if (isDonate) {
            colorClass = "text-red-500 font-bold";
          } else if (isActive) {
            colorClass = "text-blue-400 font-bold";
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2 min-h-[44px] min-w-[44px] rounded-lg transition-colors ${colorClass}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

