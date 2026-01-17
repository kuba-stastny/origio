"use client";

import React from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";
import { SectionShell } from "@/sections/ui/SectionShell";
import PreviewImage from "../../previews/ga001.png";

/* =========================================================
   Default data
========================================================= */

type GalleryItem = {
  image?: { src?: string; alt?: string };
};

type GalleryGridData = {
  items?: GalleryItem[];
};

export const GALLERY_GRID_DEFAULT_DATA: GalleryGridData = {
  items: [
    { image: { src: "https://app.origio.site/images/mockup.png", alt: "Gallery 1" } }, // span 2
    { image: { src: "https://app.origio.site/images/mockup.png", alt: "Gallery 2" } }, // span 1
    { image: { src: "https://app.origio.site/images/mockup.png", alt: "Gallery 3" } }, // span 1
    { image: { src: "https://app.origio.site/images/mockup.png", alt: "Gallery 4" } }, // span 2
    { image: { src: "https://app.origio.site/images/mockup.png", alt: "Gallery 5" } }, // span 2
    { image: { src: "https://app.origio.site/images/mockup.png", alt: "Gallery 6" } }, // span 1
  ],
};

/**
 * Pattern:
 * 0 -> span 2
 * 1 -> span 1
 * 2 -> span 1
 * 3 -> span 2
 * 4 -> span 2
 * 5 -> span 1
 * ...repeat (length 6)
 */
function getSpanClass(i: number) {
  const mod = i % 6;
  if (mod === 0) return "md:col-span-2";
  if (mod === 1) return "md:col-span-1";
  if (mod === 2) return "md:col-span-1";
  if (mod === 3) return "md:col-span-2";
  if (mod === 4) return "md:col-span-2";
  return "md:col-span-1";
}

type GalleryGridRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

function GalleryGridRenderer({ block, theme }: GalleryGridRendererProps) {
  const d: any = block.data || {};
  const items: GalleryItem[] =
    Array.isArray(d.items) && d.items.length ? d.items : (GALLERY_GRID_DEFAULT_DATA.items as GalleryItem[]);

  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme} className="p-0">
      <section className="relative">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
            {items.map((it, i) => (
              <div
                key={i}
                className={[
                  "relative w-full overflow-hidden rounded-[16px]",
                  // mobile: vždy 1 sloupec
                  // desktop: pattern spanů
                  getSpanClass(i),
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image?.src}
                  alt={it.image?.alt || ""}
                  className="h-[480px] w-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </SectionShell>
  );
}

/* =========================================================
   Schema
========================================================= */

export const GALLERY_GRID_SCHEMA = [
  {
    type: "repeater",
    label: "Galerie",
    path: "items",
    emptyHint: "Přidej první obrázek",
    children: [{ type: "image", path: "image", label: "Obrázek" }],
  },
] as const;

function GalleryGridEditor() {
  return (
    <div className="p-3 text-xs text-zinc-400">
      (Použij horní akci „Upravit sekci“ pro úpravu všech obrázků.)
    </div>
  );
}

const ga001: SectionModule = {
  id: "ga001",
  definition: {
    type: "gallery_grid",
    title: "Galerie (Grid 3)",
    version: 1,
    defaultData: GALLERY_GRID_DEFAULT_DATA,
    Renderer: GalleryGridRenderer,
    editor: {
      schema: GALLERY_GRID_SCHEMA,
      title: "Upravit galerii",
      modelPath: "data",
    },
  },
  Editor: GalleryGridEditor,
  meta: {
    category: "gallery",
    previewImage: PreviewImage,
  },
};

export default ga001;
