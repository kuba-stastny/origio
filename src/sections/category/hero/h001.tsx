// src/sections/hero-gallery.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import { SectionShell } from "@/sections/ui/SectionShell";
import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";

import { Display, Text } from "@/sections/ui/Typography";
import { Button } from "@/sections/ui/Button";

// ✅ cinematic (relativní cesta dle tebe)
import {
  CinematicSplitWords,
  CinematicBlurUp,
} from "../../motion/cinematic";
import PreviewImage from "../../previews/h001.png";

/* =========================
   Link typ & helper (stejné jako hero.tsx)
========================= */

export type LinkObject = {
  mode: "external" | "phone" | "email" | "section";
  value: string;
};

function toHref(raw: string | LinkObject | undefined): string {
  if (!raw) return "#";

  if (typeof raw === "string") return raw || "#";

  if (raw.mode === "section") return raw.value ? `#${raw.value}` : "#";
  if (raw.mode === "phone")
    return raw.value ? `tel:${raw.value.replace(/\s+/g, "")}` : "#";
  if (raw.mode === "email") return raw.value ? `mailto:${raw.value}` : "#";

  return raw.value || "#";
}

/* =========================
   Types
========================= */

type HeroGalleryVariant = "left";

type GalleryItem = {
  image?: { src?: string; alt?: string };
};

type HeroGalleryData = {
  variant?: HeroGalleryVariant;

  heading?: string;
  subheading?: string;

  ctaPrimary?: { label?: string; href?: string | LinkObject };
  ctaSecondary?: { label?: string; href?: string | LinkObject };

  gallery?: GalleryItem[];

  /** autoplay interval ms */
  autoplayMs?: number;
};

/* =========================
   Default data
========================= */

export const HERO_GALLERY_DEFAULT_DATA: HeroGalleryData = {
  variant: "left",
  heading:
    "Boost your online visibility with a tailored SEO strategy that drives real results.",
  subheading:
    "I help businesses rank higher on Google, attract qualified traffic, and turn visitors into paying customers — through data-driven optimization and smart marketing strategies.",
  ctaPrimary: {
    label: "Let's connect",
    href: { mode: "section", value: "contact" },
  },
  ctaSecondary: {
    label: "My work",
    href: { mode: "section", value: "projects" },
  },
  autoplayMs: 4200,
  gallery: [
    {
      image: {
        src: "https://app.origio.site/images/mockup.png",
        alt: "Project preview 1",
      },
    },
    {
      image: {
        src: "https://app.origio.site/images/mockup.png",
        alt: "Project preview 2",
      },
    },
    {
      image: {
        src: "https://app.origio.site/images/mockup.png",
        alt: "Project preview 3",
      },
    },
    {
      image: {
        src: "https://app.origio.site/images/mockup.png",
        alt: "Project preview 4",
      },
    },
  ],
};

/* =========================
   Renderer
========================= */

type HeroGalleryRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

function HeroGalleryRenderer({ block, theme }: HeroGalleryRendererProps) {
  const runtime = (block.data || {}) as any;

  const data: HeroGalleryData = useMemo(
    () => ({
      ...HERO_GALLERY_DEFAULT_DATA,
      ...runtime,
      ctaPrimary: {
        ...HERO_GALLERY_DEFAULT_DATA.ctaPrimary,
        ...(runtime?.ctaPrimary || {}),
      },
      ctaSecondary: {
        ...HERO_GALLERY_DEFAULT_DATA.ctaSecondary,
        ...(runtime?.ctaSecondary || {}),
      },
    }),
    [runtime]
  );

  const resolvedTheme = theme ?? mapThemeJson(null);

  const variant: HeroGalleryVariant = data.variant ?? "left";

  const gallery: GalleryItem[] = Array.isArray(data.gallery) ? data.gallery : [];
  const len = gallery.length;

  const autoplayMs =
    typeof data.autoplayMs === "number" && data.autoplayMs >= 1500
      ? data.autoplayMs
      : 4200;

  // center index
  const [index, setIndex] = useState(0);

  // keep index in range if gallery changes
  useEffect(() => {
    if (!len) return;
    setIndex((i) => Math.min(Math.max(i, 0), len - 1));
  }, [len]);

  useEffect(() => {
    if (!len || len < 2) return;

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % len);
    }, autoplayMs);

    return () => window.clearInterval(id);
  }, [autoplayMs, len]);

  const prevIndex = useMemo(
    () => (len ? (index - 1 + len) % len : 0),
    [index, len]
  );
  const nextIndex = useMemo(
    () => (len ? (index + 1) % len : 0),
    [index, len]
  );

  const showPrimary = !!data.ctaPrimary?.label && !!data.ctaPrimary?.href;
  const showSecondary = !!data.ctaSecondary?.label && !!data.ctaSecondary?.href;

  return (
    <SectionShell theme={resolvedTheme} className="relative overflow-hidden">
      <div className="relative mx-auto pt-10">
          <>
            {/* ✅ TITLE: split words + translateY blur fade (viewport once) */}
            <div className="max-w-7xl mx-auto">
              <Display className="!text-center">
                <CinematicSplitWords
                  text={data.heading ?? ""}
                  amount={0.6}
                  margin="-120px"
                />
              </Display>
            </div>

            {/* ✅ DESCRIPTION: blur+up+fade (viewport once) */}
            <CinematicBlurUp
              className="mt-7 max-w-2xl mx-auto"
              amount={0.55}
              margin="-120px"
              y={12}
              blur={10}
              duration={0.7}
              delay={0.02}
            >
              <Text size="lg" tone="muted" className="!text-center">
                {data.subheading}
              </Text>
            </CinematicBlurUp>

            {/* ✅ CTA: blur+up+fade (viewport once) */}
            {(showPrimary || showSecondary) && (
              <CinematicBlurUp
                className="mt-10 text-center flex flex-col gap-4 sm:flex-row sm:items-center justify-center items-center"
                amount={0.6}
                margin="-120px"
                y={10}
                blur={10}
                duration={0.7}
                delay={0.06}
              >
                {showPrimary && (
                  <a href={toHref(data.ctaPrimary?.href)} className="inline-flex w-full md:w-auto">
                    <Button variant="primary">{data.ctaPrimary?.label}</Button>
                  </a>
                )}

                {showSecondary && (
                  <a href={toHref(data.ctaSecondary?.href)} className="inline-flex w-full md:w-auto">
                    <Button
                      variant="secondary"
                      className="border border-[--ds-primary]"
                    >
                      {data.ctaSecondary?.label}
                    </Button>
                  </a>
                )}
              </CinematicBlurUp>
            )}

            {/* ✅ GALLERY: blok blur+up+fade (viewport once) */}
            {len > 0 && (
              <CinematicBlurUp
                className="mt-30 w-full"
                amount={0.45}
                margin="-140px"
                y={14}
                blur={12}
                duration={0.8}
                delay={0.08}
              >
                <div className="mx-auto w-full max-w-[1100px]">
                  <div className="flex items-center justify-center gap-8 md:gap-20">
                    {/* left preview */}
                    {len > 1 ? (
                      <div className="relative hidden md:block" style={{ width: 400, height: 299 }}>
                        <div className="relative h-full w-full overflow-hidden rounded-[8px] shadow-[0_17px_33px_-2px_rgba(28,39,49,0.05)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={gallery[prevIndex]?.image?.src || ""}
                            alt={gallery[prevIndex]?.image?.alt || "Preview"}
                            className="h-full w-full object-cover opacity-20"
                            draggable={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="hidden md:block" style={{ width: 400, height: 299 }} />
                    )}

                    {/* center */}
                    <div className="relative">
                      <div
                        className="relative overflow-hidden rounded-[16px] shadow-[0_25px_60px_-10px_rgba(28,39,49,0.12)]"
                        style={{
                          width: "min(855px, 92vw)",
                          height: "auto",
                          aspectRatio: "855/640",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={gallery[index]?.image?.src || ""}
                          alt={gallery[index]?.image?.alt || "Slide"}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </div>
                    </div>

                    {/* right preview */}
                    {len > 2 ? (
                      <div className="relative hidden md:block" style={{ width: 400, height: 299 }}>
                        <div className="relative h-full w-full overflow-hidden rounded-[8px] shadow-[0_17px_33px_-2px_rgba(28,39,49,0.05)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={gallery[nextIndex]?.image?.src || ""}
                            alt={gallery[nextIndex]?.image?.alt || "Preview"}
                            className="h-full w-full object-cover opacity-20"
                            draggable={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="hidden md:block" style={{ width: 400, height: 299 }} />
                    )}
                  </div>

                  {/* mobile dots */}
                  {len > 1 ? (
                    <div className="mt-5 flex items-center justify-center gap-2 md:hidden">
                      {gallery.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIndex(i)}
                          className={[
                            "h-2.5 w-2.5 rounded-full transition-opacity",
                            i === index ? "bg-black/50" : "bg-black/20",
                          ].join(" ")}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </CinematicBlurUp>
            )}
          </>
      </div>
    </SectionShell>
  );
}

/* =========================
   Schema
========================= */

export const HERO_GALLERY_SCHEMA = [
  {
    type: "group",
    label: "Layout",
    children: [
      {
        type: "select",
        path: "variant",
        label: "Variant",
        options: [{ label: "Left", value: "left" }],
      },
    ],
  },
  {
    type: "group",
    label: "Texty",
    children: [
      {
        type: "text",
        path: "heading",
        label: "Heading",
        placeholder: "Strong value proposition…",
        maxLength: 160,
      },
      {
        type: "text",
        path: "subheading",
        label: "Subheading",
        placeholder: "One–two sentences that explain the benefit…",
        multiline: true,
        rows: 4,
        maxLength: 420,
      },
    ],
  },
  {
    type: "group",
    label: "Primary CTA",
    children: [
      {
        type: "text",
        path: "ctaPrimary.label",
        label: "Label",
        placeholder: "Let's connect",
        maxLength: 60,
      },
      {
        type: "link",
        path: "ctaPrimary.href",
        label: "Link",
        placeholder: "#contact, https://…, tel:+420…, mailto:…",
      },
    ],
  },
  {
    type: "group",
    label: "Secondary CTA",
    children: [
      {
        type: "text",
        path: "ctaSecondary.label",
        label: "Label",
        placeholder: "My work",
        maxLength: 60,
      },
      {
        type: "link",
        path: "ctaSecondary.href",
        label: "Link",
        placeholder: "#projects, https://…, tel:+420…, mailto:…",
      },
    ],
  },
  {
    type: "group",
    label: "Slider",
    children: [
      {
        type: "number",
        path: "autoplayMs",
        label: "Autoplay (ms)",
        min: 1500,
        max: 20000,
        step: 100,
      },
    ],
  },
  {
    type: "repeater",
    label: "Gallery (obrázky)",
    path: "gallery",
    emptyHint: "Přidej alespoň 3 obrázky",
    children: [{ type: "image", path: "image", label: "Obrázek" }],
  },
] as const;

/* =========================
   Editor
========================= */

function HeroGalleryEditor() {
  return (
    <div className="p-3 text-xs text-zinc-400">
      (Použij horní toolbar sekce.)
    </div>
  );
}

/* =========================
   SectionModule
========================= */

const h001: SectionModule = {
  id: "h001",
  definition: {
    type: "hero-gallery",
    title: "Hero + Gallery",
    version: 2,
    defaultData: HERO_GALLERY_DEFAULT_DATA,
    Renderer: HeroGalleryRenderer,
    editor: {
      schema: HERO_GALLERY_SCHEMA,
      title: "Edit Hero + Gallery",
      modelPath: "data",
    },
  },
  Editor: HeroGalleryEditor,
  meta: {
    category: "hero",
    previewImage: PreviewImage,
  },
};

export default h001;
