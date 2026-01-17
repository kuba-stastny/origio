// src/components/billing/TrialBar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useUiPanel } from "@/store/ui-panel";

type TrialBarProps = {
  userCreatedAt: string | null;
  hasAnyBilling: boolean;
};

const TRIAL_DAYS = 7; // ✅ pokud máš trial 7 dní

function formatCzDays(n: number) {
  if (n === 1) return "den";
  if (n >= 2 && n <= 4) return "dny";
  return "dní";
}

export default function TrialBar({ userCreatedAt, hasAnyBilling }: TrialBarProps) {
  const { openLeft } = useUiPanel();

  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!userCreatedAt) {
      setDaysLeft(null);
      return;
    }

    const created = new Date(userCreatedAt);

    // fallback: pokud by bylo datum nevalidní
    if (Number.isNaN(created.getTime())) {
      setDaysLeft(null);
      return;
    }

    const trialEndMs = created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const diffMs = trialEndMs - Date.now();

    // když je diff <= 0 => trial skončil (daysLeft = 0)
    const nextDaysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    setDaysLeft(nextDaysLeft);
  }, [userCreatedAt]);

  // už má nějaký billing ZÁZNAM → neukazovat
  if (hasAnyBilling || !userCreatedAt || daysLeft === null) return null;

  const trialExpired = daysLeft <= 0;

  return (
    <div className="fixed bottom-3 left-1/2 z-[999] w-full max-w-xl -translate-x-1/2 px-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-900/90 px-4 py-3 text-sm text-white shadow-lg ring-1 ring-zinc-700/60 backdrop-blur">
        <div className="flex flex-col">
          {!trialExpired ? (
            <>
              <span className="font-medium">
                Zbývá ti {daysLeft} {formatCzDays(daysLeft)} zdarma
              </span>
              <span className="text-xs text-zinc-300">
                Po skončení trialu se ti zablokuje publikování stránek.
              </span>
            </>
          ) : (
            <>
              <span className="font-medium">
                Free trial ti skončil. Upgraduj.
              </span>
              <span className="text-xs text-zinc-300">
                Pro pokračování a publikování stránek si aktivuj předplatné.
              </span>
            </>
          )}
        </div>

        <button
          onClick={() => openLeft("subscription")}
          className="rounded-lg bg-white/90 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-white"
        >
          Upgradovat
        </button>
      </div>
    </div>
  );
}
