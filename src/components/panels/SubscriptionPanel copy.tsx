// src/components/panels/SubscriptionPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SubscriptionClient from "@/components/billing/SubscriptionClient";

type ApiResponse = {
  workspaceId: string;
  subscription: any | null;
};

export default function SubscriptionPanel() {
  const pathname = usePathname();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // /workspaces/[workspaceId]/...
  useEffect(() => {
    // vytáhneme workspaceId z URL
    // př: /workspaces/123/subscription → ["", "workspaces", "123", "subscription"]
    const parts = pathname.split("/").filter(Boolean);
    const wsIndex = parts.indexOf("workspaces");
    const workspaceId =
      wsIndex !== -1 && parts[wsIndex + 1] ? parts[wsIndex + 1] : null;

    if (!workspaceId) {
      setErr("Nepodařilo se zjistit workspace.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `/api/v1/workspaces/${workspaceId}/subscription`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErr(body?.error || "Nepodařilo se načíst předplatné.");
          setData(null);
        } else {
          const body = (await res.json()) as ApiResponse;
          setData(body);
        }
      } catch (e: any) {
        setErr("Chyba při načítání předplatného.");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [pathname]);

  return (
    <div className="px-4 py-6">

      <div className="mt-6">
        {loading && (
          <div className="space-y-3">
            <div className="h-9 rounded-lg bg-zinc-900/40 animate-pulse" />
            <div className="h-9 rounded-lg bg-zinc-900/30 animate-pulse" />
            <div className="h-9 rounded-lg bg-zinc-900/20 animate-pulse" />
          </div>
        )}

        {!loading && err && (
          <p className="text-sm text-red-400">
            {err}
          </p>
        )}

        {!loading && !err && data && (
          <SubscriptionClient
            workspaceId={data.workspaceId}
            existingSubscription={data.subscription}
          />
        )}
      </div>
    </div>
  );
}
