// src/sections/testimonials.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";
import { motion, AnimatePresence } from "framer-motion";

// ✅ cinematic
import { CinematicSplitWords, CinematicBlurUp } from "../../motion/cinematic";

import { SectionShell } from "@/sections/ui/SectionShell";
import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";
import { Heading, Text } from "@/sections/ui/Typography";
import PreviewImage from "../../previews/ts002.png";

/* =========================
   Defaults
========================= */
const DEFAULT_ITEMS = [
  {
    rating: 5,
    quote:
      "Loved working with Catora. They did everything exactly how I wished for and the results couldn’t’ve been better.",
    author: {
      name: "Alex James",
      role: "Marketing Director @ ABC",
      avatar: {
        src: "https://app.origio.site/images/person.png",
        alt: "Alex James",
      },
    },
  },
  {
    rating: 5,
    quote:
      "Great communication and flawless delivery. The team was proactive and the output exceeded expectations.",
    author: {
      name: "Sofia Carter",
      role: "Head of Growth @ Nimbus",
      avatar: {
        src: "https://app.origio.site/images/person.png",
        alt: "Sofia Carter",
      },
    },
  },
  {
    rating: 4,
    quote:
      "Solid partner for long-term collaboration. Clear processes, fast iterations and measurable results.",
    author: {
      name: "Martin Havel",
      role: "Product Lead @ Vela",
      avatar: {
        src: "https://app.origio.site/images/person.png",
        alt: "Martin Havel",
      },
    },
  },
];

/* =========================
   Utils
========================= */
function clampStars(n: any) {
  const v = Number(n);
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(5, Math.round(v)));
}
function initials(name: string) {
  return (name || "")
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StarRow({ value }: { value: number }) {
  const n = clampStars(value);
  return (
    <div className="flex items-center text-[color:color-mix(in_oklab,var(--ds-body,var(--ds-on-bg))_75%,transparent)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="18"
          height="18"
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={i < n ? "opacity-100" : "opacity-30"}
          fill="currentColor"
        >
          <path d="M12 2.5l2.88 6.16 6.77.58-5.14 4.45 1.55 6.62L12 17.98 5.94 20.31l1.55-6.62L2.35 9.24l6.77-.58L12 2.5z" />
        </svg>
      ))}
      <span className="sr-only">{n} out of 5 stars</span>
    </div>
  );
}

function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M15.4 5.4a1 1 0 0 1 0 1.4L10.2 12l5.2 5.2a1 1 0 1 1-1.4 1.4l-5.9-5.9a1 1 0 0 1 0-1.4l5.9-5.9a1 1 0 0 1 1.4 0z"
      />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M8.6 18.6a1 1 0 0 1 0-1.4L13.8 12 8.6 6.8a1 1 0 1 1 1.4-1.4l5.9 5.9a1 1 0 0 1 0 1.4l-5.9 5.9a1 1 0 0 1-1.4 0z"
      />
    </svg>
  );
}

/* =========================
   Types
========================= */
type TestimonialItem = {
  rating?: number;
  quote?: string;
  author?: {
    name?: string;
    role?: string;
    avatar?: { src?: string; alt?: string } | null;
  };
};

type TestimonialsRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

/* =========================
   Renderer (Variant 2 – centered slider)
========================= */
function TestimonialsRenderer({ block, theme }: TestimonialsRendererProps) {
  const d: any = block.data || {};
  const heading: string = d.heading || "What others have to say";

  const rawItems: any[] =
    Array.isArray(d.items) && d.items.length ? d.items : DEFAULT_ITEMS;

  const list = useMemo<TestimonialItem[]>(
    () =>
      rawItems.map((it) => ({
        rating: clampStars(it.rating),
        quote: it.quote ?? "",
        author: {
          name: it.author?.name ?? "",
          role: it.author?.role ?? "",
          avatar: it.author?.avatar ?? null,
        },
      })),
    [rawItems]
  );

  const count = list.length;
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const safeIdx =
    ((idx % Math.max(1, count)) + Math.max(1, count)) % Math.max(1, count);
  const active = list[safeIdx];

  const go = (next: number) => {
    if (count <= 1) return;
    const nextSafe =
      ((next % Math.max(1, count)) + Math.max(1, count)) % Math.max(1, count);
    setDir(nextSafe > safeIdx ? 1 : -1);
    setIdx(nextSafe);
  };

  const next = () => go(safeIdx + 1);
  const prev = () => go(safeIdx - 1);



  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme}>
      <div className="mx-auto flex w-full flex-col items-stretch gap-14">
        {/* Title (words blur) */}
        <Heading level="h2" align="center" tone="heading" weight="medium">
          <CinematicSplitWords
            text={heading}
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

        {/* Row: desktop arrows outside, card center */}
        <div className="flex w-full items-center justify-center gap-10">
          {/* Left arrow (desktop) */}
          <div className="hidden md:flex">
            <button
              type="button"
              onClick={prev}
              disabled={count <= 1}
              aria-label="Previous testimonial"
              className={[
                "h-10 w-10 rounded-full",
                "flex items-center justify-center",
                "border border-[color:color-mix(in_oklab,var(--ds-on-bg)_20%,transparent)]",
                "bg-[color:color-mix(in_oklab,var(--ds-bg)_60%,transparent)]",
                "text-[color:var(--ds-on-bg)]",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "hover:bg-[color:color-mix(in_oklab,var(--ds-bg)_45%,transparent)]",
              ].join(" ")}
            >
              <ChevronLeft />
            </button>
          </div>

          {/* Slider / Card */}
          <div className="w-full max-w-[980px]">
            <div className="relative">
              {/* ✅ reserve height so it never jumps */}
              <div className="min-h-[420px] md:min-h-[360px]" />

              {/* AnimatePresence only for X-slide; blur/fade handled by Cinematic */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={safeIdx}
                  className="absolute inset-0"
                  initial={{ opacity: 1, x: dir * 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 1, x: dir * -18 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CinematicBlurUp
                    // slider = not viewport-triggered; we want it every change
                    // CinematicBlurUp by default might use whileInView; so we force it to act as plain motion:
                    // -> your component should respect `once={false}` or `inView={false}`; pokud nemá, tak to i tak funguje,
                    // protože wrapper se remountuje na key.
                    amount={0} // irrelevant here
                    margin="0px"
                    y={10}
                    blur={12}
                    duration={0.35}
                    delay={0}
                    className={[
                      "w-full px-6 py-10 md:px-6 md:py-10",
                      "overflow-hidden",
                      "rounded-[calc(var(--ds-radius,16px))]",
                      "outline outline-1 outline-offset-[-1px] outline-[var(--ds-border)]",
                      "bg-[color:color-mix(in_oklab,var(--ds-surface)_5%,transparent)]",
                      "shadow-[var(--t-card-shadow)]",
                      "flex flex-col items-center justify-center gap-10",
                    ].join(" ")}
                  >
                    <div className="flex w-full flex-col items-center gap-6">
                      <StarRow value={active?.rating ?? 0} />

                      <div className="w-full max-w-[640px] text-center">
                        <Text size="lg" weight="light" tone="body" className="!text-center">
                          “{active?.quote || ""}”
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      {active?.author?.avatar?.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={active.author.avatar.src}
                          alt={
                            active.author.avatar.alt ||
                            active.author.name ||
                            "Avatar"
                          }
                          className="h-[54px] w-[54px] rounded-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div
                          className={[
                            "h-[54px] w-[54px] rounded-full",
                            "flex items-center justify-center",
                            "bg-[color:color-mix(in_oklab,var(--ds-on-bg,#fff)_14%,transparent)]",
                            "text-[color:var(--ds-on-bg)]",
                            "font-medium text-[14px]",
                          ].join(" ")}
                        >
                          {initials(active?.author?.name || "—")}
                        </div>
                      )}

                      <div className="flex flex-col items-start">
                        <Text as="div" size="md" tone="heading" weight="medium">
                          {active?.author?.name || "John Doe"}
                        </Text>
                        <Text as="div" size="xs" tone="body" weight="light">
                          {active?.author?.role || "Customer"}
                        </Text>
                      </div>
                    </div>
                  </CinematicBlurUp>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mobile arrows UNDER */}
            <div className="mt-6 flex items-center justify-center gap-3 md:hidden">
              <button
                type="button"
                onClick={prev}
                disabled={count <= 1}
                aria-label="Previous testimonial"
                className={[
                  "h-10 w-10 rounded-full",
                  "flex items-center justify-center",
                  "border border-[color:color-mix(in_oklab,var(--ds-on-bg)_20%,transparent)]",
                  "bg-[color:color-mix(in_oklab,var(--ds-bg)_60%,transparent)]",
                  "text-[color:var(--ds-on-bg)]",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                onClick={next}
                disabled={count <= 1}
                aria-label="Next testimonial"
                className={[
                  "h-10 w-10 rounded-full",
                  "flex items-center justify-center",
                  "border border-[color:color-mix(in_oklab,var(--ds-on-bg)_20%,transparent)]",
                  "bg-[color:color-mix(in_oklab,var(--ds-bg)_60%,transparent)]",
                  "text-[color:var(--ds-on-bg)]",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                <ChevronRight />
              </button>
            </div>
          </div>

          {/* Right arrow (desktop) */}
          <div className="hidden md:flex">
            <button
              type="button"
              onClick={next}
              disabled={count <= 1}
              aria-label="Next testimonial"
              className={[
                "h-10 w-10 rounded-full",
                "flex items-center justify-center",
                "border border-[color:color-mix(in_oklab,var(--ds-on-bg)_20%,transparent)]",
                "bg-[color:color-mix(in_oklab,var(--ds-bg)_60%,transparent)]",
                "text-[color:var(--ds-on-bg)]",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "hover:bg-[color:color-mix(in_oklab,var(--ds-bg)_45%,transparent)]",
              ].join(" ")}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

/* =========================
   Universal editor schema
========================= */
export const TESTIMONIALS_SCHEMA = [
  {
    type: "group",
    label: "Nastavení sekce",
    children: [
      {
        type: "text",
        path: "heading",
        label: "Nadpis sekce",
        placeholder: "What others have to say",
        maxLength: 80,
      },
    ],
  },
  {
    type: "repeater",
    label: "Reference",
    path: "items",
    emptyHint: "Přidej první referenci",
    children: [
      {
        type: "number",
        path: "rating",
        label: "Počet hvězd (0–5)",
      },
      {
        type: "text",
        path: "quote",
        label: "Text recenze",
        multiline: true,
        rows: 4,
        placeholder: "Krátká citace/feedback…",
        maxLength: 320,
      },
      {
        type: "group",
        label: "Autor",
        children: [
          { type: "text", path: "author.name", label: "Jméno", maxLength: 60 },
          {
            type: "text",
            path: "author.role",
            label: "Role / společnost",
            maxLength: 80,
          },
          {
            type: "image",
            path: "author.avatar",
            label: "Profilová fotka (volitelné)",
          },
        ],
      },
    ],
  },
] as const;

/* =========================
   Registrace sekce
========================= */
const ts002: SectionModule = {
  id: "ts002",
  definition: {
    type: "testimonials2",
    title: "Testimoniály",
    version: 4,
    defaultData: {
      heading: "What others have to say",
      items: DEFAULT_ITEMS,
    },
    Renderer: TestimonialsRenderer,
    editor: {
      schema: TESTIMONIALS_SCHEMA,
      title: "Upravit reference",
      modelPath: "data",
    },
  },
  Editor: function TestimonialsEditor() {
    return (
      <div className="p-3 text-xs text-[color:color-mix(in_oklab,var(--ds-body,var(--ds-on-bg))_65%,transparent)]">
        (Použij horní akci „Upravit sekci“ pro úpravu nadpisu a referencí.)
      </div>
    );
  },
  meta: {
    category: "hero",
    previewImage: PreviewImage,
  },
};

export default ts002;
