// src/sections/hero.tsx
"use client";

import React, { useMemo } from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import { SectionShell } from "@/sections/ui/SectionShell";
import type { DesignSystem } from "@/types/design-system";

import { Display, Text } from "@/sections/ui/Typography";
import { Button } from "@/sections/ui/Button";
import { mapThemeJson } from "@/lib/design-system";
import { linkProps, type LinkObject } from "@/lib/links";

// ✅ cinematic motion helpers (words/letters/fade/wrappers)
import {
  CinematicSplitWords,
  CinematicBlurUp,
} from "../../motion/cinematic";

import PreviewImage from "../../previews/h002.png";

/* =========================
   Types
========================= */

type HeroVariant = "left";

type HeroData = {
  variant?: HeroVariant;

  heading?: string;
  subheading?: string;

  ctaPrimary?: {
    label?: string;
    href?: string | LinkObject;
  };

  ctaSecondary?: {
    label?: string;
    href?: string | LinkObject;
  };
};

/* =========================
   Default data
========================= */

export const HERO_DEFAULT_DATA: HeroData = {
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
};

/* =========================
   Renderer
========================= */

type HeroRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem; // from DevicePreview: <Renderer block={blk} theme={theme} />
};

function HeroRenderer({ block, theme }: HeroRendererProps) {
  const runtime = (block.data || {}) as any;

  const data: HeroData = useMemo(
    () => ({
      ...HERO_DEFAULT_DATA,
      ...runtime,
      ctaPrimary: {
        ...HERO_DEFAULT_DATA.ctaPrimary,
        ...(runtime?.ctaPrimary || {}),
      },
      ctaSecondary: {
        ...HERO_DEFAULT_DATA.ctaSecondary,
        ...(runtime?.ctaSecondary || {}),
      },
    }),
    [runtime]
  );

  const resolvedTheme = theme ?? mapThemeJson(null);

  const variant: HeroVariant = data.variant ?? "left";

  const showPrimary = !!data.ctaPrimary?.label && !!data.ctaPrimary?.href;
  const showSecondary = !!data.ctaSecondary?.label && !!data.ctaSecondary?.href;

  return (
    <SectionShell theme={resolvedTheme} className="relative overflow-hidden">
      <div className="relative mx-auto pt-10">
        {variant === "left" && (
          <>
            {/* ✅ TITLE: split words + translateY blur fade (viewport once) */}
            <div className="max-w-7xl">
              <Display className="tracking-[-0.02em] text-[color:var(--ds-heading)]">
                <CinematicSplitWords
                  text={data.heading ?? ""}
                  // optional tuning (defaults are already good)
                  // stagger={0.045}
                  // y={14}
                  // blur={10}
                  // duration={0.55}
                  amount={0.6}
                  margin="-120px"
                />
              </Display>
            </div>

            {/* ✅ DESCRIPTION: wrapper blur+up+fade (viewport once) */}
            <CinematicBlurUp
              className="mt-7 max-w-2xl"
              amount={0.55}
              margin="-120px"
              y={12}
              blur={10}
              duration={0.7}
              delay={0.02}
            >
              <Text size="lg" tone="muted">
                {data.subheading}
              </Text>
            </CinematicBlurUp>

            {/* ✅ CTA: wrapper blur+up+fade (viewport once) */}
            {(showPrimary || showSecondary) && (
              <CinematicBlurUp
                className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
                amount={0.6}
                margin="-120px"
                y={10}
                blur={10}
                duration={0.7}
                delay={0.06}
              >
                {showPrimary && (
                  <a {...linkProps(data.ctaPrimary?.href)} className="inline-flex">
                    <Button variant="primary">{data.ctaPrimary?.label}</Button>
                  </a>
                )}

                {showSecondary && (
                  <a {...linkProps(data.ctaSecondary?.href)} className="inline-flex">
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
          </>
        )}
      </div>
    </SectionShell>
  );
}

/* =========================
   Schema
========================= */

export const HERO_SCHEMA = [
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
] as const;

/* =========================
   Editor komponenta
========================= */

function HeroEditor() {
  return (
    <div className="p-3 text-xs text-zinc-400">(Použij horní toolbar sekce.)</div>
  );
}

/* =========================
   SectionModule registrace
========================= */

const h002: SectionModule = {
  id: "h002",
  definition: {
    type: "hero",
    title: "Hero",
    version: 4,
    defaultData: HERO_DEFAULT_DATA,
    Renderer: HeroRenderer,
    editor: {
      schema: HERO_SCHEMA,
      title: "Edit Hero",
      modelPath: "data",
    },
  },
  Editor: HeroEditor,
  meta: {
    category: "hero",
    previewImage: PreviewImage,
  },
};

export default h002;
