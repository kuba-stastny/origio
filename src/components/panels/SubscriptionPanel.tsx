// src/components/panels/SubscriptionPanel.tsx
"use client";

import React from "react";
import { useUiPanel } from "@/store/ui-panel";
import {
  BsStars,
  BsBugFill,
  BsLightningChargeFill,
  BsChatDotsFill,
  BsClockHistory,
  BsShieldCheck,
} from "react-icons/bs";

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-950/60 ring-1 ring-white/5">
          {icon}
        </div>
        <div className="text-sm font-semibold text-zinc-100">{title}</div>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-zinc-300">
        {children}
      </div>
    </div>
  );
}

export default function SubscriptionPanel() {
  const { openLeft } = useUiPanel();

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-5">
        {/* glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-16 h-44 w-72 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute -right-24 -top-20 h-48 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-52 w-96 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-black/[0.35]" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-xs font-semibold text-zinc-200">
            <BsStars className="h-4 w-4 text-blue-300" />
            Origio Beta
          </div>

          <h2 className="mt-3 text-lg font-semibold text-zinc-50">
            Origio je aktuálně v beta testování
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Beta je <span className="font-semibold text-zinc-100">zatím zdarma</span>.
            Sbíráme zpětnou vazbu, ladíme stabilitu a připravujeme finální pricing.
            Některé věci se můžou ještě měnit nebo občas “zlobit”.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => openLeft("feedback")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
            >
              <BsChatDotsFill className="h-4 w-4" />
              Poslat feedback / nahlásit bug
            </button>

            <button
              onClick={() => openLeft("whats-new")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/15"
            >
              <BsClockHistory className="h-4 w-4" />
              Co je nového (changelog)
            </button>
          </div>
        </div>
      </div>

      {/* Body cards */}
      <div className="mt-5 grid gap-3">
        <Card
          title="Co je v betě dostupné"
          icon={<BsLightningChargeFill className="h-4 w-4 text-zinc-100" />}
        >
          Editor, sekce, publikování, subdomény a základní nastavení projektu.
          Cíl: aby šlo reálně tvořit a vydávat stránky bez omezení.
        </Card>

        <Card
          title="Na co se připravit"
          icon={<BsBugFill className="h-4 w-4 text-zinc-100" />}
        >
          Občasné bugy, drobné UI nedotaženosti a změny v chování editoru.
          Když něco narazíš, nejvíc pomůže krátký popis + screenshot.
        </Card>

        <Card
          title="Co bude po betě"
          icon={<BsShieldCheck className="h-4 w-4 text-zinc-100" />}
        >
          Jakmile bude vše stabilní, přejdeme na placený režim.
          Beta uživatelé budou mít férové podmínky (např. zvýhodnění / early access).
        </Card>
      </div>

      {/* Footer note */}
      <div className="mt-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-4 text-xs leading-relaxed text-zinc-400">
        Tip: Když posíláš feedback, napiš prosím i{" "}
        <span className="text-zinc-200">konkrétní krok</span> (co jsi udělal předtím),
        a ideálně{" "}
        <span className="text-zinc-200">URL projektu</span>.
      </div>
    </div>
  );
}
