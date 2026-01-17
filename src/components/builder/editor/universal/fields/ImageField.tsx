"use client";

import React, { useMemo } from "react";
import { BsCardImage } from "react-icons/bs";
import { FiVideo } from "react-icons/fi";

type MediaType = "image" | "video";

export type MediaValue =
  | {
      type?: MediaType;
      src?: string;
      alt?: string; // jen pro image (u videa ignorujeme)
    }
  | { src?: string; alt?: string } // legacy object (image)
  | string
  | undefined;

function normalize(value: MediaValue): { type: MediaType; src: string; alt: string } {
  if (typeof value === "string") return { type: "image", src: value, alt: "" };
  const v = (value || {}) as any;

  const type: MediaType = v.type === "video" ? "video" : "image";
  const src = typeof v.src === "string" ? v.src : "";
  const alt = typeof v.alt === "string" ? v.alt : "";

  return { type, src, alt };
}

export default function MediaField({
  value,
  onChange,
  onPick,
}: {
  value: MediaValue;
  onChange: (v: { type: MediaType; src?: string; alt?: string }) => void;
  onPick: (type: MediaType) => void; // picker ví, co se vybírá
}) {
  const v = useMemo(() => normalize(value), [value]);
  const hasMedia = !!v.src?.trim();

  const setType = (type: MediaType) => {
    onChange({
      type,
      src: v.src || "",
      ...(type === "image" ? { alt: v.alt || "" } : {}),
    });
  };

  const clear = () => {
    onChange({
      type: v.type,
      src: "",
      ...(v.type === "image" ? { alt: "" } : {}),
    });
  };

  // ✅ PURE DARK — no border / outline / ring / bg-white
  const pillWrap = "inline-flex w-fit rounded-full bg-zinc-900/60 p-1 shadow-[0_18px_60px_rgba(0,0,0,0.55)]";
  const pillBtn = "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition";

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
      {/* Toggle */}
      <div className={pillWrap}>
        <button
          type="button"
          onClick={() => setType("image")}
          className={[
            pillBtn,
            v.type === "image"
              ? "bg-zinc-950/70 text-white"
              : "text-zinc-300 hover:bg-zinc-950/40",
          ].join(" ")}
          aria-pressed={v.type === "image"}
        >
          <BsCardImage className="h-4 w-4" />
          Obrázek
        </button>

        <button
          type="button"
          onClick={() => setType("video")}
          className={[
            pillBtn,
            v.type === "video"
              ? "bg-zinc-950/70 text-white"
              : "text-zinc-300 hover:bg-zinc-950/40",
          ].join(" ")}
          aria-pressed={v.type === "video"}
        >
          <FiVideo className="h-4 w-4" />
          Video
        </button>
      </div>

      {/* Preview + overlay actions */}
      <div className={card}>
        {v.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.src || "data:image/gif;base64,R0lGODlhAQABAAD/ACw="}
            alt={v.alt || ""}
            className="block h-36 w-full bg-zinc-950/35 object-contain"
            draggable={false}
          />
        ) : (
          <video
            src={v.src || undefined}
            className="block h-36 w-full bg-zinc-950/35 object-contain"
            controls={hasMedia}
            playsInline
            preload="metadata"
          />
        )}

        {/* top-right: Clear */}
        {hasMedia && (
          <button type="button" title="Vyčistit" onClick={clear} className={clearBtn}>
            <span className="text-base leading-none">×</span>
          </button>
        )}

        {/* bottom gradient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />

        {/* bottom-right: Library */}
        <button type="button" onClick={() => onPick(v.type)} className={`absolute right-2 bottom-2 ${overlayBtn}`}>
          {v.type === "image" ? <BsCardImage className="h-4 w-4" /> : <FiVideo className="h-4 w-4" />}
          Změnit
        </button>
      </div>

      {/* Inputs */}
      {v.type === "image" ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr]">
          <input
            type="text"
            className={input}
            placeholder="https://… / relativní / data:image;base64,…"
            value={v.src ?? ""}
            onChange={(e) => onChange({ type: "image", src: e.target.value, alt: v.alt })}
            spellCheck={false}
          />
          <input
            type="text"
            className={input}
            placeholder="Alt text"
            value={v.alt ?? ""}
            onChange={(e) => onChange({ type: "image", src: v.src, alt: e.target.value })}
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            className={input}
            placeholder="https://… / relativní / .mp4 / .webm"
            value={v.src ?? ""}
            onChange={(e) => onChange({ type: "video", src: e.target.value })}
            spellCheck={false}
          />
          <div className="text-[11px] text-zinc-400">
            Tip: nejbezpečnější je <b>.mp4 (H.264)</b> nebo <b>.webm</b>. U videa alt text nepoužíváme.
          </div>
        </div>
      )}
    </div>
  );
}
