// src/components/billing/SubscriptionClient.tsx
"use client";

import { useState } from "react";

type SubscriptionClientProps = {
  workspaceId: string;
  existingSubscription: any | null;
};

export default function SubscriptionClient({
  workspaceId,
  existingSubscription,
}: SubscriptionClientProps) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);

  const now = Date.now();
  const subStatus = existingSubscription?.status as string | undefined;
  const subEnd = existingSubscription?.current_period_end
    ? new Date(existingSubscription.current_period_end).getTime()
    : null;
  const cancelAtPeriodEnd = existingSubscription?.cancel_at_period_end === true;

  // ještě jsme v zaplaceném období?
  const isStillValid = subEnd ? subEnd > now : false;

  // běžně aktivní
  const isActive =
    existingSubscription &&
    ["active", "trialing"].includes(subStatus ?? "") &&
    !cancelAtPeriodEnd;

  // zrušené, ale doběhne do konce období
  const isActiveUntil =
    existingSubscription &&
    ["active", "trialing"].includes(subStatus ?? "") &&
    cancelAtPeriodEnd &&
    isStillValid;

  // úplně neaktivní
  const isInactive = !isActive && !isActiveUntil;

  async function createCheckout() {
    setLoading("checkout");
    try {
      const res = await fetch("/api/v1/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });

      if (!res.ok) {
        console.error("create-checkout-session failed", res.status);
        return;
      }

      const data = await res.json().catch(() => null);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("No url from checkout API", data);
      }
    } finally {
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/v1/billing/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });

      if (!res.ok) {
        console.error("create-portal failed", res.status);
        return;
      }

      const text = await res.text();
      if (!text) {
        console.error("create-portal returned empty body");
        return;
      }

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("create-portal: invalid JSON", text);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("create-portal: no url in response", data);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-xl rounded-3xl bg-zinc-900/50 p-6">
      <div className="flex flex-col items-center justify-center gap-4 mb-4">
        <div className="text-center">

          <h2 className="text-lg font-semibold text-white">
            {isActive
              ? "Origio Pro (aktivní)"
              : isActiveUntil
              ? "Origio Pro (zrušeno – doběhne)"
              : "Žádné aktivní předplatné"}
          </h2>

          {(isActive || isActiveUntil) && existingSubscription?.current_period_end ? (
            <p className="text-xs text-zinc-500 mt-1">
              {isActiveUntil ? "Platné do: " : "Aktivní do: "}
              {new Date(
                existingSubscription.current_period_end
              ).toLocaleString("cs-CZ")}
            </p>
          ) : null}
        </div>

        {/* stavová badge */}
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${
            isActive
              ? "bg-emerald-500/10 text-emerald-100 border-emerald-500/30"
              : isActiveUntil
              ? "bg-amber-500/10 text-amber-100 border-amber-500/30"
              : "bg-zinc-800 text-zinc-200 border-zinc-700"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isActive
                ? "bg-emerald-400"
                : isActiveUntil
                ? "bg-amber-400"
                : "bg-zinc-400"
            }`}
          />
          {isActive
            ? "Aktivní"
            : isActiveUntil
            ? "Zrušeno – doběhne"
            : "Neaktivní"}
        </span>
      </div>

      <p className="text-sm text-zinc-400 mb-4">
        Předplatné je navázané na tento workspace. Tady ho můžete aktivovat nebo
        spravovat své platební údaje.
      </p>

      <div className="flex text-center w-full gap-3">
        {isInactive ? (
          <button
            onClick={createCheckout}
            disabled={loading !== null}
            className="inline-flex mx-auto items-center gap-2 rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-100 transition"
          >
            {loading === "checkout" ? "Přesměrovávám…" : "Aktivovat předplatné"}
          </button>
        ) : null}

        <button
          onClick={openPortal}
          disabled={loading !== null}
          className="inline-flex mx-auto  items-center gap-2 rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm border border-zinc-700 hover:bg-zinc-800 transition"
        >
          {loading === "portal" ? "Otevírám…" : "Spravovat fakturaci"}
        </button>
      </div>
    </div>
  );
}
