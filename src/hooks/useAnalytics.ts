// src/hooks/useAnalytics.ts
"use client";

import { useEffect } from "react";

type AnalyticsOptions = {
  workspaceId: string;
  projectId: string;
  sessionId: string;
  visitorId: string;
  path?: string;
};

function getDeviceCategory() {
  if (typeof window === "undefined") return null;
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function useAnalytics({
  workspaceId,
  projectId,
  sessionId,
  visitorId,
  path,
}: AnalyticsOptions) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function run() {
      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        const geo = await geoRes.json();

        await fetch("/api/v1/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            project_id: projectId,
            path: path ?? window.location.pathname,
            session_id: sessionId,
            visitor_id: visitorId,
            referrer: document.referrer || null,

            country: geo.country || null,
            region: geo.region || null,
            city: geo.city || null,
            ip: geo.ip || null,

            device_category: getDeviceCategory(),
            os: navigator.platform,
            user_agent: navigator.userAgent,
          }),
        });
      } catch (err) {
        console.error("analytics send failed:", err);
        await fetch("/api/v1/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            project_id: projectId,
            path: path ?? window.location.pathname,
            session_id: sessionId,
            visitor_id: visitorId,
            referrer: document.referrer || null,
          }),
        });
      }
    }

    run();
  }, [workspaceId, projectId, sessionId, visitorId, path]);
}
