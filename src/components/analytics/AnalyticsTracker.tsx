// src/components/analytics/AnalyticsTracker.tsx
"use client";

import { useEffect, useRef } from "react";

type AnalyticsTrackerProps = {
  workspaceId: string; // UUID
  projectId: string; // UUID
  pageId?: string; // UUID (optional)
  apiUrl?: string; // default: /api/v1/analytics
};

/** Enable logs with ?debug=1 or ?analytics=1 */
function isDebugEnabled() {
  if (typeof window === "undefined") return false;
  const sp = new URLSearchParams(window.location.search);
  return sp.get("debug") === "1" || sp.get("analytics") === "1";
}

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "";
  const KEY = "origio_visitor_id";
  let v = localStorage.getItem(KEY);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(KEY, v);
  }
  return v;
}

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";
  const KEY = "origio_session_id";
  let s = sessionStorage.getItem(KEY);
  if (!s) {
    s = crypto.randomUUID();
    sessionStorage.setItem(KEY, s);
  }
  return s;
}

function detectDeviceCategory(
  ua: string
): "desktop" | "mobile" | "tablet" | "other" {
  const l = ua.toLowerCase();
  if (/mobile|iphone|android(?!.*tablet)/.test(l)) return "mobile";
  if (/ipad|tablet/.test(l)) return "tablet";
  if (/mac|win|linux/.test(l)) return "desktop";
  return "other";
}

function detectOS(ua: string): string {
  const l = ua.toLowerCase();
  if (l.includes("windows")) return "Windows";
  if (l.includes("mac os") || l.includes("macintosh")) return "macOS";
  if (l.includes("android")) return "Android";
  if (l.includes("iphone") || l.includes("ipad") || l.includes("ios"))
    return "iOS";
  if (l.includes("linux")) return "Linux";
  return "Other";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function AnalyticsTracker({
  workspaceId,
  projectId,
  pageId,
  apiUrl = "/api/v1/analytics",
}: AnalyticsTrackerProps) {
  const startTimeRef = useRef<number>(0);
  const maxScrollRef = useRef<number>(0);
  const didMountPingRef = useRef(false);
  const didSendLeaveRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const debug = isDebugEnabled();
    const ua = navigator.userAgent;

    const device_category = detectDeviceCategory(ua);
    const os = detectOS(ua);

    const visitor_id = getOrCreateVisitorId();
    const session_id = getOrCreateSessionId();

    const path = window.location.pathname || "/";
    const referrer = document.referrer || null;

    startTimeRef.current = performance.now();
    maxScrollRef.current = 0;
    didSendLeaveRef.current = false;

    // ✅ Use a scroll root ONLY if it truly scrolls. Otherwise fall back to window.
    const rootCandidate =
      (document.querySelector(
        "[data-analytics-scroll-root]"
      ) as HTMLElement | null) ?? null;

    const scrollRoot =
      rootCandidate &&
      rootCandidate.scrollHeight > rootCandidate.clientHeight &&
      getComputedStyle(rootCandidate).overflowY !== "visible"
        ? rootCandidate
        : null;

    if (debug) {
      console.log("[analytics] apiUrl:", apiUrl);
      console.log("[analytics] ids:", { workspaceId, projectId, pageId });
      console.log("[analytics] scrollRoot:", scrollRoot ? "element" : "window");
    }

    const getScrollPercent = () => {
      // If the scroll root doesn't actually scroll, always use window measurement.
      if (scrollRoot) {
        const scrollTop = scrollRoot.scrollTop;
        const docHeight = scrollRoot.scrollHeight - scrollRoot.clientHeight;

        // ✅ If no scroll possible, depth should be 0 (not 100).
        if (docHeight <= 0) return 0;

        return clamp(Math.round((scrollTop / docHeight) * 100), 0, 100);
      } else {
        const scrollTop = window.scrollY || 0;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;

        if (docHeight <= 0) return 0;

        return clamp(Math.round((scrollTop / docHeight) * 100), 0, 100);
      }
    };

    const onScroll = () => {
      const p = getScrollPercent();
      if (p > maxScrollRef.current) maxScrollRef.current = p;
    };

    // Initial sample (avoid weird "100" on mount)
    onScroll();

    if (scrollRoot) {
      scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    const buildPayload = (kind: "mount" | "leave") => {
      const duration_ms =
        kind === "mount"
          ? 0
          : Math.round(performance.now() - startTimeRef.current);

      return {
        workspace_id: workspaceId,
        project_id: projectId,
        page_id: pageId ?? null, // server may ignore if column doesn't exist
        path,
        session_id,
        visitor_id,
        referrer,
        country: null,
        device_category,
        os,
        user_agent: ua,
        duration_ms,
        scroll_depth: clamp(maxScrollRef.current, 0, 100),
        occurred_at: new Date().toISOString(),
        kind, // server may ignore
      };
    };

    const postJson = async (payload: any) => {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (debug) {
        let json: any = null;
        try {
          json = await res.json();
        } catch {}
        console.log("[analytics] POST status:", res.status);
        console.log("[analytics] POST response:", json);
      }
    };

    // ✅ Immediate ping on mount (for fast testing)
    if (!didMountPingRef.current) {
      didMountPingRef.current = true;
      postJson(buildPayload("mount")).catch((e) => {
        if (debug) console.warn("[analytics] mount ping failed", e);
      });
    }

    const sendOnLeave = () => {
      if (didSendLeaveRef.current) return;
      didSendLeaveRef.current = true;

      // one last scroll sample
      onScroll();

      const payload = buildPayload("leave");
      const body = JSON.stringify(payload);

      if (debug) console.log("[analytics] sending leave payload:", payload);

      try {
        // ✅ most reliable on tab close
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon(apiUrl, blob);
          return;
        }
      } catch {}

      // fallback
      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        credentials: "include",
      }).catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") sendOnLeave();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", sendOnLeave);

    return () => {
      if (scrollRoot) scrollRoot.removeEventListener("scroll", onScroll);
      else window.removeEventListener("scroll", onScroll);

      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", sendOnLeave);
    };
  }, [workspaceId, projectId, pageId, apiUrl]);

  return null;
}
