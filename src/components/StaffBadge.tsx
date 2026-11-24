import React from "react";
import { Crown, Shield, Star } from "lucide-react";
import { UserRole } from "@/types/manga";

interface StaffBadgeProps {
  role?: UserRole | string | null;
  className?: string;
  showSupporter?: boolean;
}

export default function StaffBadge({
  role,
  className = "",
  showSupporter = true,
}: StaffBadgeProps) {
  if (!role || role === "USER") return null;

  if (role === "ADMIN") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm ${className}`}
        title="Official MangaPulse Staff Member"
      >
        <Crown className="w-3 h-3 text-blue-400" />
        <span>Staff</span>
      </span>
    );
  }

  if (role === "MODERATOR") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm ${className}`}
        title="Community Moderator"
      >
        <Shield className="w-3 h-3 text-emerald-400" />
        <span>Mod</span>
      </span>
    );
  }

  if (showSupporter && role === "SUPPORTER") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm ${className}`}
        title="MangaPulse Supporter"
      >
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span>Supporter</span>
      </span>
    );
  }

  return null;
}
