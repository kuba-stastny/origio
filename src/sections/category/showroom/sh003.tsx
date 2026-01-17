// src/sections/showroom-v2.tsx
"use client";

import React from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";
import { SectionShell } from "@/sections/ui/SectionShell";
import { Text } from "@/sections/ui/Typography";

// ✅ cinematic (relativní cesta dle tebe)
import { CinematicBlurUp } from "../../motion/cinematic";
import PreviewImage from "../../previews/sh003.png";

/* =========================================================
   Výchozí data (variant 2: image + title + description)
========================================================= */
export const SHOWROOM_V2_DEFAULT_ITEMS = [
  {
    image: {
      src: "https://app.origio.site/images/mockup.png",
      alt: "Case study – 1",
    },
    title: "Increase of +45% conversion rate after rewriting the landing page",
    description: "Kalendář plný schůzek na 2 měsíce dopředu",
  },
  {
    image: {
      src: "https://app.origio.site/images/mockup.png",
      alt: "Case study – 2",
    },
    title: "Rebrand + design system: faster shipping of features",
    description: "Design systém, který zrychlil vývoj a udržel konzistenci napříč UI",
  },
  {
    image: {
      src: "https://app.origio.site/images/mockup.png",
      alt: "Case study – 3",
    },
    title: "AI-driven content pipeline reduced manual work by 70%",
    description: "Automatizace obsahu a workflow, které výrazně snížily ruční práci týmu",
  },
] as const;

type ShowroomV2RendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

function ShowroomV2Renderer({ block, theme }: ShowroomV2RendererProps) {
  const d: any = block.data || {};
  const items: any[] =
    Array.isArray(d.items) && d.items.length
      ? d.items
      : [...SHOWROOM_V2_DEFAULT_ITEMS];

  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme} className="p-0">
      <section className="relative overflow-hidden">
        <div className="mx-auto w-full">
          {/* Layout jako v HTML:
              1) první karta full width (md: col-span-2)
              2) druhá + třetí vedle sebe (md: 2 sloupce)
          */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
            {items.map((it, i) => {
              const isFirst = i === 0;

              return (
                <CinematicBlurUp
                  key={i}
                  // ✅ každá karta vlastní viewport once animace
                  amount={0.25}
                  margin="-120px"
                  y={10}
                  blur={18}
                  duration={1.1}
                  delay={i * 0.06}
                  className={[
                    "group relative w-full overflow-hidden rounded-[16px]",
                    isFirst ? "md:col-span-2" : "",
                    "[contain:paint] will-change-transform",
                  ].join(" ")}
                >
                  {/* Image area (s vnitřním paddingem 24px jako ve tvém HTML) */}
                  <div className="relative w-full p-6">
                    <div className="relative overflow-hidden rounded-[16px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.image?.src}
                        alt={it.image?.alt || ""}
                        className={[
                          "w-full object-cover",
                          isFirst ? "h-[485px]" : "h-[453px]",
                        ].join(" ")}
                        draggable={false}
                      />

                      {/* jemný overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0)_55%)]" />
                    </div>
                  </div>

                  {/* Text block (title + description) */}
                  <div className="flex flex-col gap-2 px-6 pb-6">
                    <Text
                      as="div"
                      tone="inherit"
                      size="xl"
                      weight="medium"
                      className="max-w-[980px]"
                    >
                      {it.title}
                    </Text>

                    {it.description ? (
                      <Text
                        as="div"
                        tone="muted"
                        size="lg"
                        weight="light"
                        className="max-w-[980px]"
                      >
                        {it.description}
                      </Text>
                    ) : null}
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
   Schema (variant 2: image + title + description)
========================================================= */
export const SHOWROOM_V2_SCHEMA = [
  {
    type: "repeater",
    label: "Karty showroomu",
    path: "items",
    emptyHint: "Přidej první kartu",
    children: [
      { type: "image", path: "image", label: "Obrázek" },
      {
        type: "text",
        path: "title",
        label: "Titulek",
        multiline: true,
        rows: 2,
        maxLength: 140,
      },
      {
        type: "text",
        path: "description",
        label: "Popisek",
        multiline: true,
        rows: 2,
        maxLength: 180,
      },
    ],
  },
] as const;

function ShowroomV2Editor() {
  return (
    <div className="p-3 text-xs text-zinc-400">
      (Použij horní akci „Upravit sekci“ pro úpravu všech karet.)
    </div>
  );
}

const sh003: SectionModule = {
  id: "sh003",
  definition: {
    type: "showroom_v2",
    title: "Ukázka práce – v2",
    version: 1,
    defaultData: { items: SHOWROOM_V2_DEFAULT_ITEMS },
    Renderer: ShowroomV2Renderer,
    editor: {
      schema: SHOWROOM_V2_SCHEMA,
      title: "Upravit Showroom (v2)",
      modelPath: "data",
    },
  },
  Editor: ShowroomV2Editor,
  meta: {
    category: "showroom",
    previewImage: PreviewImage,
  },
};

export default sh003;
