// src/sections/showroom.tsx
"use client";

import React from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";
import { SectionShell } from "@/sections/ui/SectionShell";
import { Text } from "@/sections/ui/Typography";

// ✅ cinematic
import { CinematicBlurUp } from "../../motion/cinematic";
import PreviewImage from "../../previews/sh001.png";

/* =========================================================
   Types (for renderer)
========================================================= */
type MediaType = "image" | "video";
type MediaObj = { type?: MediaType; src?: string; alt?: string } | string | undefined;

function normalizeMedia(value: MediaObj): { type: MediaType; src: string; alt: string } {
  if (typeof value === "string") return { type: "image", src: value, alt: "" };
  const v = (value || {}) as any;
  const type: MediaType = v.type === "video" ? "video" : "image";
  const src = typeof v.src === "string" ? v.src : "";
  const alt = typeof v.alt === "string" ? v.alt : "";
  return { type, src, alt };
}

/* =========================================================
   Výchozí data
   - item 1: image only (type:image)
   - item 2: video only (type:video)
   - item 3: both allowed (we default to image, user can switch)
========================================================= */
export const SHOWROOM_DEFAULT_ITEMS = [
  {
    media: {
      type: "image",
      src: "https://app.origio.site/images/mockup.png",
      alt: "Case study – 1",
    },
    title: "Increase of +45% conversion rate after rewriting the landing page",
    tags: ["Technical SEO", "Business strategy", "Optimization"],
  },
  {
    media: {
      type: "video",
      // dej sem reálné video url až budeš mít, zatím placeholder prázdný
      src: "",
    },
    title: "Rebrand + design system: faster shipping of features",
    tags: ["Design system", "UI audit", "Figma tokens"],
  },
  {
    media: {
      type: "image",
      src: "https://app.origio.site/images/mockup.png",
      alt: "Case study – 3",
    },
    title: "AI-driven content pipeline reduced manual work by 70%",
    tags: ["Automation", "LLM tooling", "Workflows"],
  },
] as const;

type ShowroomRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

function ShowroomRenderer({ block, theme }: ShowroomRendererProps) {
  const d: any = block.data || {};
  const items: any[] =
    Array.isArray(d.items) && d.items.length ? d.items : [...SHOWROOM_DEFAULT_ITEMS];

  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme} className="p-0">
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            {items.map((it, i) => {
              const isThird = i === 2;

              const m = normalizeMedia(it.media);
              const hasSrc = !!m.src?.trim();

              return (
                <CinematicBlurUp
                  key={i}
                  amount={0.25}
                  margin="-120px"
                  y={10}
                  blur={18}
                  duration={1.1}
                  delay={i * 0.06}
                  className={[
                    "group relative w-full overflow-hidden rounded-[16px]",
                    isThird ? "h-[560px] md:col-span-2" : "h-[560px]",
                    "[contain:paint] will-change-transform",
                    "bg-black/20", // fallback background
                  ].join(" ")}
                >
                  {/* MEDIA */}
                  {m.type === "video" ? (
                    <video
                      src={hasSrc ? m.src : undefined}
                      className="absolute inset-0 h-full w-full object-cover"
                      muted
                      playsInline
                      loop
                      autoPlay
                      controls={false}
                      preload="metadata"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hasSrc ? m.src : "data:image/gif;base64,R0lGODlhAQABAAD/ACw="}
                      alt={m.alt || ""}
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                    />
                  )}

                  {/* overlay */}
                  <div className="pointer-events-none absolute inset-0 rounded-[16px] bg-[linear-gradient(180deg,rgba(0,0,0,0.40)_0%,rgba(0,0,0,0)_100%),rgba(0,0,0,0.24)]" />

                  {/* content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6">
                    <Text as="div" tone="inherit" size="xl" weight="medium" className="max-w-[400px]">
                      {it.title}
                    </Text>

                    <div className="flex flex-wrap items-center gap-2">
                      {(it.tags || []).map((t: string, idx: number) => (
                        <span
                          key={idx}
                          className={[
                            "flex items-center justify-center rounded-full px-3 py-1",
                            "bg-black/40",
                          ].join(" ")}
                        >
                          <Text as="span" tone="inherit" size="sm" weight="light">
                            {t}
                          </Text>
                        </span>
                      ))}
                    </div>
                  </div>
                </CinematicBlurUp>
              );
            })}
          </div>
        </div>
      </section>
    </SectionShell>
  );
}

/* =========================================================
   Schema
   - item 1: only image
   - item 2: only video
   - item 3: both image + video
========================================================= */
export const SHOWROOM_SCHEMA = [
  {
    type: "repeater",
    label: "Karty showroomu",
    path: "items",
    emptyHint: "Přidej první kartu",
    children: [
      // ✅ Media: vždy povoleno image + video
      {
        type: "media",
        path: "media",
        label: "Média (obrázek / video)",
        allowed: ["image", "video"],
      },

      {
        type: "text",
        path: "title",
        label: "Titulek",
        multiline: true,
        rows: 2,
        maxLength: 140,
      },

      {
        type: "repeater",
        path: "tags",
        label: "Tagy",
        emptyHint: "Přidej první tag",
        children: [{ type: "text", path: "", label: "Tag", maxLength: 28 }],
      },
    ],
  },
] as const;


function ShowroomEditor() {
  return (
    <div className="p-3 text-xs text-zinc-400">
      (Použij horní akci „Upravit sekci“ pro úpravu všech karet.)
    </div>
  );
}

const sh001: SectionModule = {
  id: "sh001",
  definition: {
    type: "showroom",
    title: "Ukázka práce",
    version: 4,
    defaultData: { items: SHOWROOM_DEFAULT_ITEMS },
    Renderer: ShowroomRenderer,
    editor: {
      schema: SHOWROOM_SCHEMA,
      title: "Upravit Showroom",
      modelPath: "data",
    },
  },
  Editor: ShowroomEditor,
  meta: {
    category: "showroom",
    previewImage: PreviewImage,
  },
};

export default sh001;
