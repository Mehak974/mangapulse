"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PageVisitTracker() {
  const pathname = usePathname();
  const visitedPathsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!pathname) return;

    // Filter out internal and non-content paths
    if (
      pathname === "/" ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/_not-found") ||
      /\.(ico|png|jpg|jpeg|svg|webp|json|txt|xml|css|js|map)$/i.test(pathname)
    ) {
      return;
    }

    // Deduplicate within the same client session
    if (visitedPathsRef.current.has(pathname)) return;
    visitedPathsRef.current.add(pathname);

    try {
      const sessionKey = `mp_v_${pathname}`;
      const lastSent = sessionStorage.getItem(sessionKey);
      const now = Date.now();
      // If already tracked in this session within last 10 minutes, skip
      if (lastSent && now - Number(lastSent) < 600000) {
        return;
      }
      sessionStorage.setItem(sessionKey, String(now));
    } catch {
      // sessionStorage might be restricted in some privacy modes
    }

    const payload = JSON.stringify({
      path: pathname,
      title: typeof document !== "undefined" ? document.title : undefined,
    });

    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/track-visit", blob);
      } else {
        fetch("/api/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Non-fatal fire-and-forget
    }
  }, [pathname]);

  return null;
}
