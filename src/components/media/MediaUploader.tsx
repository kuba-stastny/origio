"use client";

import { useMemo, useState } from "react";
import { BsPlus, BsX, BsCardImage } from "react-icons/bs";
import { FiVideo } from "react-icons/fi";
import MediaManager, { type MediaFilter } from "./MediaManager";

const DEFAULT_IMAGE = "/images/placeholder.jpg";

type Props = {
  multiple?: boolean;
  value?: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  folder?: string;
  className?: string;
  initialFilter?: MediaFilter; // ✅ filter only
};

function inferKindFromUrl(url?: string): "image" | "video" {
  const u = (url || "").toLowerCase();
  if (u.match(/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/)) return "video";
  return "image";
}

export default function MediaUploader({
  multiple = false,
  value = [],
  onChange,
  bucket = "files",
  folder = "media",
  className,
  initialFilter = "all",
}: Props) {
  const [showManager, setShowManager] = useState(false);
  const [filter, setFilter] = useState<MediaFilter>(initialFilter);

  const first = value?.[0] || "";
  const firstKind = useMemo(() => inferKindFromUrl(first), [first]);

  const handleSelect = (url: string) => {
    if (multiple) onChange([...(value || []), url]);
    else onChange([url]);
    setShowManager(false);
  };

  const handleRemove = (index: number) => {
    const updated = (value || []).filter((_, i) => i !== index);
    if (!multiple) onChange(updated.length === 0 ? [DEFAULT_IMAGE] : updated);
    else onChange(updated);
  };

  const toggleBase =
    "mb-2 inline-flex w-fit rounded-full bg-zinc-950/40 p-1 shadow-[0_20px_70px_rgba(0,0,0,0.55)]";
  const toggleBtn =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition";
  const tileBase =
    "relative overflow-hidden rounded-2xl bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition hover:bg-white/8";

  return (
    <div className={className}>
      {/* Filter (All / Images / Videos) */}
      <div className={toggleBase}>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={[
            toggleBtn,
            filter === "all"
              ? "bg-white/12 text-white"
              : "text-zinc-300 hover:bg-white/8",
          ].join(" ")}
          aria-pressed={filter === "all"}
        >
          Vše
        </button>

        <button
          type="button"
          onClick={() => setFilter("image")}
          className={[
            toggleBtn,
            filter === "image"
              ? "bg-white/12 text-white"
              : "text-zinc-300 hover:bg-white/8",
          ].join(" ")}
          aria-pressed={filter === "image"}
        >
          <BsCardImage className="h-4 w-4" />
          Obrázky
        </button>

        <button
          type="button"
          onClick={() => setFilter("video")}
          className={[
            toggleBtn,
            filter === "video"
              ? "bg-white/12 text-white"
              : "text-zinc-300 hover:bg-white/8",
          ].join(" ")}
          aria-pressed={filter === "video"}
        >
          <FiVideo className="h-4 w-4" />
          Videa
        </button>
      </div>

      {!multiple ? (
        <button
          type="button"
          onClick={() => setShowManager(true)}
          className={[
            tileBase,
            "flex h-32 w-32 items-center justify-center text-zinc-300",
          ].join(" ")}
          aria-label="Vybrat médium"
        >
          {value && value.length > 0 ? (
            <>
              {firstKind === "video" ? (
                <div className="relative h-full w-full bg-black">
                  <video
                    src={first}
                    className="h-full w-full object-cover opacity-90"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-zinc-900">
                      VIDEO
                    </div>
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={first} alt="" className="h-full w-full object-cover" />
              )}

              <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                Změnit
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(0);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/70 transition"
                aria-label="Odstranit"
              >
                <BsX size={16} />
              </button>
            </>
          ) : (
            <BsPlus size={28} />
          )}
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {(value || []).map((src, idx) => {
            const k = inferKindFromUrl(src);
            return (
              <div
                key={`${src}-${idx}`}
                className={[tileBase, "h-24 w-24 bg-white/6"].join(" ")}
              >
                {k === "video" ? (
                  <div className="relative h-full w-full bg-black">
                    <video
                      src={src}
                      className="h-full w-full object-cover opacity-90"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute left-1 bottom-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                      VIDEO
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-full w-full object-cover" />
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/70 transition"
                  aria-label="Odstranit"
                >
                  <BsX size={16} />
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setShowManager(true)}
            className={[
              tileBase,
              "flex h-24 w-24 items-center justify-center text-zinc-300 hover:text-white",
            ].join(" ")}
            aria-label="Přidat médium"
          >
            <BsPlus size={22} />
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-zinc-400">
        Přepínač nahoře je jen filtr zobrazení. Nahrát můžeš obrázek i video.
      </p>

      {showManager && (
        <MediaManager
          open={showManager}
          onClose={() => setShowManager(false)}
          onSelect={(url) => handleSelect(url)}
          bucket={bucket}
          folder={folder}
          filter={filter}
          onFilterChange={setFilter}
        />
      )}
    </div>
  );
}
