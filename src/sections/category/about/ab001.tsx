// src/sections/about-me.tsx
"use client";

import React from "react";

import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";
import { SectionShell } from "@/sections/ui/SectionShell";
import { Heading, Text } from "@/sections/ui/Typography";

// ✅ cinematic
import {
  CinematicSplitWords,
  CinematicFade,
  CinematicBlurUp,
} from "../../motion/cinematic";
import PreviewImage from "../../previews/ab001.png";

/* =========================
   Default data
========================= */

export const ABOUT_ME_DEFAULT_DATA = {
  title: "About me",
  body: `I help businesses rank higher on Google, attract qualified traffic, and turn visitors into paying customers — through data-driven optimization and smart marketing strategies.`,
  image: {
    src: "https://app.origio.site/images/person.png",
    alt: "Portrait",
  },
};

/* =========================
   Renderer
========================= */

type AboutMeRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

function AboutMeRenderer({ block, theme }: AboutMeRendererProps) {
  const d: any = block.data || {};

  const title = d.title ?? ABOUT_ME_DEFAULT_DATA.title;
  const body = d.body ?? ABOUT_ME_DEFAULT_DATA.body;
  const image = d.image ?? ABOUT_ME_DEFAULT_DATA.image;

  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme} className="p-0">
      <section className="relative">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
          <div className="flex w-full flex-col items-start justify-start gap-10 md:flex-row md:items-center md:gap-[200px]">
            {/* Left */}
            <div className="flex w-full flex-1 flex-col items-start gap-8">
              {/* Title (word blur) */}
              <Heading level="h2" weight="medium" tone="heading">
                <CinematicSplitWords
                  text={title}
                  className="inline"
                  amount={0.35}
                  margin="-120px"
                  stagger={0.06}
                  y={14}
                  blur={14}
                  duration={0.75}
                  delayChildren={0}
                />
              </Heading>

              {/* Body (fade only) */}
              <div className="w-full max-w-[640px]">
                <CinematicFade amount={0.35} margin="-110px" duration={0.55} delay={0.05}>
                  <Text tone="muted" size="lg" weight="light">
                    {body}
                  </Text>
                </CinematicFade>
              </div>
            </div>

            {/* Right (image blur+fade) */}
            <div className="w-full h-full flex-1">
              <CinematicBlurUp amount={0.35} margin="-110px" y={10} blur={12} duration={0.6} delay={0.08}>
                <div
                  className={[
                    "relative w-full overflow-hidden rounded-[16px]",
                    "h-[480px]",
                    "bg-[color:var(--ds-surface,var(--ds-bg))]",
                    "outline outline-1 -outline-offset-1 outline-[color:var(--ds-border,rgba(255,255,255,0.12))]",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image?.src || ""}
                    alt={image?.alt || "Portrait"}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </div>
              </CinematicBlurUp>
            </div>
          </div>
        </div>
      </section>
    </SectionShell>
  );
}

/* =========================
   Schema
========================= */

export const ABOUT_ME_SCHEMA = [
  {
    type: "group",
    label: "Text",
    children: [
      {
        type: "text",
        path: "title",
        label: "Title",
        placeholder: "About me",
        maxLength: 80,
      },
      {
        type: "text",
        path: "body",
        label: "Body",
        multiline: true,
        rows: 4,
        maxLength: 800,
      },
    ],
  },
  {
    type: "group",
    label: "Image",
    children: [
      {
        type: "image",
        path: "image",
        label: "Portrait image",
      },
    ],
  },
] as const;

/* =========================
   Editor komponenta
========================= */

function AboutMeEditor() {
  return (
    <div className="p-3 text-xs text-zinc-400">
      (Use the right panel to edit content.)
    </div>
  );
}

/* =========================
   SectionModule registrace
========================= */

const ab001: SectionModule = {
  id: "ab001",
  definition: {
    type: "about-me",
    title: "About me",
    version: 2,
    defaultData: ABOUT_ME_DEFAULT_DATA,
    Renderer: AboutMeRenderer,
    editor: {
      schema: ABOUT_ME_SCHEMA,
      title: "Edit About me",
      modelPath: "data",
    },
  },
  Editor: AboutMeEditor,
  meta: {
    category: "about",
    previewImage: PreviewImage,
  },
};

export default ab001;
