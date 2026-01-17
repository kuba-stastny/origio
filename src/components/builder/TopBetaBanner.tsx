"use client";

import React, { useEffect, useState } from "react";
import { useUiPanel } from "@/store/ui-panel";
import { X } from "lucide-react";

const STORAGE_KEY = "origio:betaBarHidden";

export default function TopBetaBanner() {
  const { openLeft } = useUiPanel();
  const [hidden, setHidden] = useState(true); // default true, odhalíme po mountu

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setHidden(v === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  return (
    <div className="w-full fixed bottom-0 left-0 z-[999] bg-black text-white">
      <div className="mx-auto flex w-full items-center justify-center gap-3 px-5 py-2">
        <div className="min-w-0 truncate text-[12px] text-zinc-200">
          <span className="font-medium text-white">Origio je v beta testování</span>
          <span className="text-zinc-400"> — zatím zdarma, později zpoplatněno.</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openLeft("subscription")}
            className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white hover:bg-white/15 transition"
          >
            Více info
          </button>

          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem(STORAGE_KEY, "1");
              } catch {}
              setHidden(true);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-zinc-200 hover:bg-white/15 hover:text-white transition"
            title="Nezobrazovat"
          >
            <X className="h-3.5 w-3.5" />
            Nezobrazovat
          </button>
        </div>
      </div>
    </div>
  );
}
