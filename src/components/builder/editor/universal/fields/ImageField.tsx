"use client";

import React, { useMemo } from "react";
import { BsCardImage } from "react-icons/bs";

export type MediaValue =
  | { src?: string; alt?: string } // object
  | string // legacy string (src)
  | undefined;

function normalize(value: MediaValue): { src: string; alt: string } {
  if (typeof value === "string") return { src: value, alt: "" };
  const v = (value || {}) as any;

  const src = typeof v.src === "string" ? v.src : "";
  const alt = typeof v.alt === "string" ? v.alt : "";
  return { src, alt };
}

export default function MediaField({
  value,
  onChange,
  onPick,
}: {
  value: MediaValue;
  onChange: (v: { src?: string; alt?: string }) => void;
  onPick: () => void;
}) {
  const v = useMemo(() => normalize(value), [value]);
  const hasImage = !!v.src?.trim();

  const clear = () => onChange({ src: "", alt: "" });

  // ✅ PURE DARK — no border / outline / ring / bg-white
  const input =
    "w-full rounded-2xl bg-zinc-900/55 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-400 " +
    "shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition focus:bg-zinc-900/75";

  const card =
    "relative my-2 overflow-hidden rounded-3xl bg-zinc-900/55 shadow-[0_30px_120px_rgba(0,0,0,0.70)]";

  const overlayBtn =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] leading-none backdrop-blur transition " +
    "bg-zinc-950/55 text-zinc-100 hover:bg-zinc-950/70 shadow-[0_18px_60px_rgba(0,0,0,0.55)]";

  const clearBtn =
    "absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full transition " +
    "bg-zinc-950/55 text-zinc-200 hover:bg-zinc-950/70 hover:text-white " +
    "shadow-[0_18px_60px_rgba(0,0,0,0.55)]";

  return (
    <div className="grid gap-2">
      {/* Preview + overlay actions */}
      <div className={card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={v.src || "data:image/gif;base64,R0lGODlhAQABAAD/ACw="}
          alt={v.alt || ""}
          className="block h-36 w-full bg-zinc-950/35 object-contain"
          draggable={false}
        />

        {/* top-right: Clear */}
        {hasImage && (
          <button type="button" title="Vyčistit" onClick={clear} className={clearBtn}>
            <span className="text-base leading-none">×</span>
          </button>
        )}

        {/* bottom gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />

        {/* bottom-right: Library */}
        <button
          type="button"
          onClick={onPick}
          className={`absolute right-2 bottom-2 ${overlayBtn}`}
        >
          <BsCardImage className="h-4 w-4" />
          {hasImage ? "Změnit" : "Vybrat"}
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr]">
        <input
          type="text"
          className={input}
          placeholder="https://… / relativní / data:image;base64,…"
          value={v.src ?? ""}
          onChange={(e) => onChange({ src: e.target.value, alt: v.alt })}
          spellCheck={false}
        />
        <input
          type="text"
          className={input}
          placeholder="Alt text"
          value={v.alt ?? ""}
          onChange={(e) => onChange({ src: v.src, alt: e.target.value })}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
