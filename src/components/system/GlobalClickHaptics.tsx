"use client";

import { useEffect, useRef, useState } from "react";
import { sfx } from "@/lib/sfx";

/**
 * Global provider, který přehrává krátký „click“ zvuk na KAŽDÉM kliknutí (pointerdown).
 * - má globální mute toggle (ukrytý, nechal jsem ho pro debug),
 * - snaží se „odemknout“ audio co nejdřív (autoplay policy),
 * - volitelný jemný hint k odemčení (schovaný).
 *
 * Přidej jednou do root layoutu (např. app/layout.tsx).
 */
export default function SfxProvider() {
  const [muted, setMuted] = useState<boolean>(sfx.isMuted());
  const [unlocked, setUnlocked] = useState<boolean>(() => sfx.isUnlocked());
  const [showHint, setShowHint] = useState(false);
  const downInsideRef = useRef(false);

  // Pokus o explicitní unlock (když už máme ctx)
  const tryUnlock = async () => {
    try {
      await sfx.unlock();
    } catch {}
    setUnlocked(sfx.isUnlocked());
    if (sfx.isUnlocked()) setShowHint(false);
  };

  // Po 1200 ms ukaž jemný hint, pokud stále zamknuté
  useEffect(() => {
    if (unlocked) return;
    const id = setTimeout(() => setShowHint(true), 1200);
    return () => clearTimeout(id);
  }, [unlocked]);

  // 1) Spolehlivý unlock na reálná gesta
  useEffect(() => {
    if (unlocked) return;
    const onGesture = () => void tryUnlock();
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("touchstart", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [unlocked]);

  // 2) Nenápadný pokus i na mousemove
  useEffect(() => {
    if (unlocked) return;
    let tried = false;
    const onMove = () => {
      if (!tried) {
        tried = true;
        void tryUnlock();
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true, once: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [unlocked]);

  // 3) Při návratu do tabu zkus znovu
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && !unlocked) void tryUnlock();
    };
    document.addEventListener("visibilitychange", onVis, true);
    return () => document.removeEventListener("visibilitychange", onVis, true);
  }, [unlocked]);

  // === HLAVNÍ: přehrát zvuk na KAŽDÉM kliknutí ===
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      // jen levé tlačítko (na touch je button 0 ok)
      if (e.button !== 0) return;

      // možnost lokálně vypnout na elementu/ancestoru: data-sfx="off"
      let node = e.target as HTMLElement | null;
      while (node) {
        if (node.getAttribute?.("data-sfx") === "off") return;
        node = node.parentElement;
      }

      // nehrát na „čisté“ drag starty (volitelně)
      downInsideRef.current = true;

      // necháme nejdřív doběhnout interní unlock listener (je také na pointerdown)
      // a následně přehrajeme (microtask/timeout 0)
      setTimeout(() => {
        try { sfx.playClick(); } catch {}
        setUnlocked(sfx.isUnlocked());
      }, 0);
    };

    const onUp = () => {
      downInsideRef.current = false;
    };

    // Enter/Space jako „aktivace“ – pro klávesovou navigaci
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      setTimeout(() => {
        try { sfx.playClick(); } catch {}
        setUnlocked(sfx.isUnlocked());
      }, 0);
    };

    // DŮLEŽITÉ: bez capture → náš handler je v bubble fázi (unlock proběhne dřív)
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", onDown as any);
      window.removeEventListener("pointerup", onUp as any);
      window.removeEventListener("keydown", onKey as any);
    };
  }, []);

  return (
    <>
      {/* Toggle btn (schovaný – nech pro debug) */}
      <div className="hidden pointer-events-none fixed bottom-3 right-3 z-[1000]">
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            sfx.setMuted(next);
            setMuted(next);
          }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300 backdrop-blur hover:bg-zinc-800/70"
          aria-pressed={muted}
          aria-label={muted ? "Zapnout zvuky" : "Vypnout zvuky"}
          title={muted ? "Sound: Off" : "Sound: On"}
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${muted ? "bg-zinc-600" : "bg-emerald-400"}`} />
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>

      {/* Hint pro odemknutí (schovaný – nechávám pro jistotu) */}
      {!unlocked && showHint && (
        <div className="hidden fixed bottom-16 right-3 z-[1000]">
          <button
            type="button"
            onClick={() => void tryUnlock()}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-stone-900 shadow ring-1 ring-black/10 hover:bg-white/90"
          >
            🔊 Povolit zvuky
          </button>
        </div>
      )}
    </>
  );
}
