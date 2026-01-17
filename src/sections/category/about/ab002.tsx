// src/sections/story-text.tsx
"use client";

import React from "react";

import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";

import { SectionShell } from "@/sections/ui/SectionShell";
import { Heading } from "@/sections/ui/Typography";

// ✅ cinematic
import { CinematicSplitLetters } from "../../motion/cinematic";
import PreviewImage from "../../previews/ab002.png";

/* =========================
   Default data
========================= */

export const STORY_TEXT_DEFAULT_DATA = {
  text: "I love coming up with solutions that look amazing and work great too. Every number has its own story, and I can’t wait to share that passion!",
};

/* =========================
   Renderer
========================= */

type StoryTextRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

function StoryTextRenderer({ block, theme }: StoryTextRendererProps) {
  const d: any = block.data || {};
  const text = d.text ?? STORY_TEXT_DEFAULT_DATA.text;

  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme} className="p-0">
      <section className="relative">
        <div className="mx-auto w-full max-w-[1280px]">
          {/* Story telling: letters blur-up */}
          <Heading
            as="p"
            level="h1"
            weight="medium"
            tone="heading"
            className="text-[var(--ds-on-bg)]"
          >
            <CinematicSplitLetters
              text={text}
              className="inline"
              amount={0.35}
              margin="-140px"
              stagger={0.012}
              y={10}
              blur={14}
              duration={0.55}
              delayChildren={0}
            />
          </Heading>
        </div>
      </section>
    </SectionShell>
  );
}

/* =========================
   Schema
========================= */

export const STORY_TEXT_SCHEMA = [
  {
    type: "text",
    path: "text",
    label: "Text",
    multiline: true,
    rows: 4,
    maxLength: 600,
    placeholder:
      "I love coming up with solutions that look amazing and work great too…",
  },
] as const;

/* =========================
   Editor komponenta
========================= */

function StoryTextEditor() {
  return (
    <div className="p-3 text-xs text-zinc-400">
      (Use the right panel to edit the text.)
    </div>
  );
}

/* =========================
   SectionModule registrace
========================= */

const ab001: SectionModule = {
  id: "ab002",
  definition: {
    type: "story-text",
    title: "Story text",
    version: 2,
    defaultData: STORY_TEXT_DEFAULT_DATA,
    Renderer: StoryTextRenderer,
    editor: {
      schema: STORY_TEXT_SCHEMA,
      title: "Edit Story text",
      modelPath: "data",
    },
  },
  Editor: StoryTextEditor,
  meta: {
    category: "about",
    previewImage: PreviewImage,
  },
};

export default ab001;
