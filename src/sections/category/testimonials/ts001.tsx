// src/sections/testimonials.tsx
"use client";

import React, { useMemo } from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

// ✅ cinematic
import {
  CinematicSplitWords,
  CinematicBlurUp,
} from "../../motion/cinematic";

import { SectionShell } from "@/sections/ui/SectionShell";
import type { DesignSystem } from "@/types/design-system";
import { resolveSectionTheme, mapThemeJson } from "@/lib/design-system";
import { Heading, Text } from "@/sections/ui/Typography";
import PreviewImage from "../../previews/ts001.png";

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

/* =========================
   Renderer
========================= */
type TestimonialsRendererProps = {
  block: BlockInstance;
};

function TestimonialsRenderer({ block }: TestimonialsRendererProps) {
  const d: any = block.data || {};
  const heading: string = d.heading || "What others have to say";
  const items: any[] =
    Array.isArray(d.items) && d.items.length ? d.items : DEFAULT_ITEMS;

  const list = useMemo(
    () =>
      items.map((it) => ({
        rating: clampStars(it.rating),
        quote: it.quote ?? "",
        author: {
          name: it.author?.name ?? "",
          role: it.author?.role ?? "",
          avatar: it.author?.avatar ?? null, // {src, alt} | null
        },
      })),
    [items]
  );

  // design-system theme
  const theme: DesignSystem = useMemo(() => {
    const mapped = mapThemeJson(d?.theme);
    return resolveSectionTheme(mapped);
  }, [d?.theme]);

  return (
    <SectionShell theme={theme}>
      <div className="mx-auto flex w-full flex-col items-stretch gap-20">
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

        {/* Cards row */}
        <div className="flex flex-col gap-10 md:flex-row md:items-stretch md:gap-10">
          {list.map((it, i) => {
            const cardStyle = {
              "--ds-border":
                "color-mix(in oklab, var(--ds-on-bg, #fff) 18%, transparent)",
              "--t-card-shadow":
                "0 0 0 1px color-mix(in oklab, var(--ds-on-bg, #fff) 7%, transparent) inset",
            } as React.CSSProperties;

            return (
              <CinematicBlurUp
                key={i}
                amount={0.3}
                margin="-120px"
                y={10}
                blur={18}
                duration={1.05}
                delay={i * 0.06}
                className={[
                  "flex-1 min-w-[356px] p-6 overflow-hidden",
                  "rounded-[calc(var(--ds-radius,16px))]",
                  "outline outline-1 outline-offset-[-1px] outline-[var(--ds-border)]",
                  "shadow-[var(--t-card-shadow)]",
"bg-[color:color-mix(in_oklab,var(--ds-surface)_5%,transparent)]",
                  "flex flex-col gap-8",
                ].join(" ")}
                style={cardStyle}
              >
                <div className="flex flex-col gap-6 overflow-hidden">
                  <StarRow value={it.rating} />

                  <Text size="lg" weight="light" tone="body">
                    “{it.quote}”
                  </Text>
                </div>

                <div className="flex items-center gap-3">
                  {it.author.avatar?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.author.avatar.src}
                      alt={it.author.avatar.alt || it.author.name || "Avatar"}
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
                      {initials(it.author.name || "—")}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <Text
                      as="div"
                      size="md"
                      tone="heading"
                      weight="medium"
                      className="truncate"
                    >
                      {it.author.name || "John Doe"}
                    </Text>
                    <Text
                      as="div"
                      size="xs"
                      tone="muted"
                      weight="light"
                      className="truncate"
                    >
                      {it.author.role || "Customer"}
                    </Text>
                  </div>
                </div>
              </CinematicBlurUp>
            );
          })}
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
          {
            type: "text",
            path: "author.name",
            label: "Jméno",
            maxLength: 60,
          },
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
const ts001: SectionModule = {
  id: "ts001",
  definition: {
    type: "testimonials",
    title: "Testimoniály",
    version: 3,
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

export default ts001;