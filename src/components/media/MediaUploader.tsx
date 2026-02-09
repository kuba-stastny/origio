"use client";

import { useState } from "react";
import { BsPlus, BsX } from "react-icons/bs";
import MediaManager from "./MediaManager";

const DEFAULT_IMAGE = "/images/placeholder.jpg";

type Props = {
  multiple?: boolean;
  value?: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  folder?: string;
  className?: string;
};

export default function MediaUploader({
  multiple = false,
  value = [],
  onChange,
  bucket = "files",
  folder = "media",
  className,
}: Props) {
  const [showManager, setShowManager] = useState(false);

  const first = value?.[0] || "";

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

  const tileBase =
    "relative overflow-hidden rounded-2xl bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,0.55)] transition hover:bg-white/8";

  return (
    <div className={className}>
      {!multiple ? (
        <button
          type="button"
          onClick={() => setShowManager(true)}
          className={[
            tileBase,
            "flex h-32 w-32 items-center justify-center text-zinc-300",
          ].join(" ")}
          aria-label="Vybrat obrázek"
        >
          {value && value.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={first} alt="" className="h-full w-full object-cover" />

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
          {(value || []).map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className={[tileBase, "h-24 w-24 bg-white/6"].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/70 transition"
                aria-label="Odstranit"
              >
                <BsX size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setShowManager(true)}
            className={[
              tileBase,
              "flex h-24 w-24 items-center justify-center text-zinc-300 hover:text-white",
            ].join(" ")}
            aria-label="Přidat obrázek"
          >
            <BsPlus size={22} />
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-zinc-400">
        Podporujeme pouze obrázky.
      </p>

      {showManager && (
        <MediaManager
          open={showManager}
          onClose={() => setShowManager(false)}
          onSelect={(url) => handleSelect(url)}
          bucket={bucket}
          folder={folder}
        />
      )}
    </div>
  );
}
