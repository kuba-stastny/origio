// src/sections/project-highlight.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";
import { motion } from "framer-motion";

import { SectionShell } from "@/sections/ui/SectionShell";
import type { DesignSystem } from "@/types/design-system";
import { resolveSectionTheme, mapThemeJson } from "@/lib/design-system";
import { Heading, Text } from "@/sections/ui/Typography";

// ✅ cinematic (relativní cesta dle tebe)
import { CinematicBlurUp } from "../../motion/cinematic";
import PreviewImage from "../../previews/sh002.png";
import { BsArrowRight } from "react-icons/bs";

/**
 * project-highlight (multi)
 * - Repeater: projects[]
 * - Alternating layout by index:
 *    even -> image left, text right
 *    odd  -> image right, text left
 * - Each project:
 *    image + title + body + rows (icon + label) with separators
 * - Icon supports:
 *    - legacy: "link" | "time" | "metric"
 *    - NEW: react-icons string: "packId:ExportName" (e.g. "md:MdHome")
 */

type RowItem = {
  icon?: string; // "link" | "time" | "metric" | "md:MdHome" ...
  label?: string;
  href?: string;
  showArrow?: boolean;
};

type ProjectItem = {
  image?: { src?: string; alt?: string };
  title?: string;
  body?: string;
  rows?: RowItem[];
};

type ProjectHighlightData = {
  theme?: any;
  heading?: string; // section heading optional
  projects?: ProjectItem[];
};

const DEFAULT_PROJECT: ProjectItem = {
  title: "Kreativy",
  body:
    "In this web design project, we aimed for a seamless user experience that blends aesthetics with functionality.",
  image: { src: "https://app.origio.site/images/mockup.png", alt: "Project preview" },
  rows: [
    { icon: "link", label: "Live link", href: "#", showArrow: true },
    { icon: "time", label: "4 weeks" },
    { icon: "metric", label: "160% boost in leads" },
  ],
};

const DEFAULT_DATA: ProjectHighlightData = {
  heading: "",
  projects: [
    DEFAULT_PROJECT,
    {
      title: "Nimbus",
      body:
        "We shipped a clean, scalable landing with improved conversions and a faster editorial workflow.",
      image: { src: "https://app.origio.site/images/mockup.png", alt: "Nimbus preview" },
      rows: [
        { icon: "md:MdLink", label: "Live link", href: "#", showArrow: true },
        { icon: "md:MdSchedule", label: "3 weeks" },
        { icon: "md:MdTrendingUp", label: "+42% signups" },
      ],
    },
  ],
};

/* =========================
   Inline fallback icons (DS-colored via currentColor)
========================= */
function IconLink(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M10.59 13.41a1 1 0 0 1 0-1.41l2.83-2.83a1 1 0 1 1 1.41 1.41l-2.83 2.83a1 1 0 0 1-1.41 0z"
      />
      <path
        fill="currentColor"
        d="M8.46 15.54a4 4 0 0 1 0-5.66l1.41-1.41a4 4 0 0 1 5.66 0 1 1 0 1 1-1.41 1.41 2 2 0 0 0-2.83 0L9.88 11.7a2 2 0 1 0 2.83 2.83l.35-.35a1 1 0 1 1 1.41 1.41l-.35.35a4 4 0 0 1-5.66 0z"
      />
    </svg>
  );
}

function IconArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M13.5 6a1 1 0 0 1 1 1v3h-6a1 1 0 0 0 0 2h6v3a1 1 0 0 1-1.7.7l6.2-6.2a1 1 0 0 0 0-1.4l-6.2-6.2A1 1 0 0 1 13.5 6z"
      />
    </svg>
  );
}

function IconTime(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h10V4H7zm2 2h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2z"
      />
    </svg>
  );
}

function IconMetric(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M4 20a1 1 0 0 1-1-1V5a1 1 0 0 1 2 0v13h16a1 1 0 1 1 0 2H4z"
      />
      <path
        fill="currentColor"
        d="M8 16a1 1 0 0 1-1-1v-4a1 1 0 1 1 2 0v4a1 1 0 0 1-1 1zm4 0a1 1 0 0 1-1-1V8a1 1 0 1 1 2 0v7a1 1 0 0 1-1 1zm4 0a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1z"
      />
    </svg>
  );
}

function resolveLegacyIcon(kind?: string) {
  if (kind === "link") return IconLink;
  if (kind === "time") return IconTime;
  if (kind === "metric") return IconMetric;
  return null;
}

/* =========================
   react-icons dynamic rendering (packId:ExportName)
========================= */
function parseIconValue(v?: string | null) {
  if (!v) return null;
  const s = String(v);
  const idx = s.indexOf(":");
  if (idx === -1) return null;
  const pack = s.slice(0, idx);
  const name = s.slice(idx + 1);
  if (!pack || !name) return null;
  return { pack, name };
}

async function loadReactIcon(pack: string, name: string) {
  switch (pack) {
    case "fa": {
      const mod: any = await import("react-icons/fa");
      return mod?.[name] ?? null;
    }
    case "fa6": {
      const mod: any = await import("react-icons/fa6");
      return mod?.[name] ?? null;
    }
    case "md": {
      const mod: any = await import("react-icons/md");
      return mod?.[name] ?? null;
    }
    case "io": {
      const mod: any = await import("react-icons/io");
      return mod?.[name] ?? null;
    }
    case "io5": {
      const mod: any = await import("react-icons/io5");
      return mod?.[name] ?? null;
    }
    case "fi": {
      const mod: any = await import("react-icons/fi");
      return mod?.[name] ?? null;
    }
    case "hi": {
      const mod: any = await import("react-icons/hi");
      return mod?.[name] ?? null;
    }
    case "hi2": {
      const mod: any = await import("react-icons/hi2");
      return mod?.[name] ?? null;
    }
    case "ri": {
      const mod: any = await import("react-icons/ri");
      return mod?.[name] ?? null;
    }
    case "bs": {
      const mod: any = await import("react-icons/bs");
      return mod?.[name] ?? null;
    }
    case "tb": {
      const mod: any = await import("react-icons/tb");
      return mod?.[name] ?? null;
    }
    case "si": {
      const mod: any = await import("react-icons/si");
      return mod?.[name] ?? null;
    }
    case "bi": {
      const mod: any = await import("react-icons/bi");
      return mod?.[name] ?? null;
    }
    case "cg": {
      const mod: any = await import("react-icons/cg");
      return mod?.[name] ?? null;
    }
    case "ci": {
      const mod: any = await import("react-icons/ci");
      return mod?.[name] ?? null;
    }
    case "di": {
      const mod: any = await import("react-icons/di");
      return mod?.[name] ?? null;
    }
    case "gi": {
      const mod: any = await import("react-icons/gi");
      return mod?.[name] ?? null;
    }
    case "go": {
      const mod: any = await import("react-icons/go");
      return mod?.[name] ?? null;
    }
    case "gr": {
      const mod: any = await import("react-icons/gr");
      return mod?.[name] ?? null;
    }
    case "im": {
      const mod: any = await import("react-icons/im");
      return mod?.[name] ?? null;
    }
    case "lia": {
      const mod: any = await import("react-icons/lia");
      return mod?.[name] ?? null;
    }
    case "lu": {
      const mod: any = await import("react-icons/lu");
      return mod?.[name] ?? null;
    }
    case "pi": {
      const mod: any = await import("react-icons/pi");
      return mod?.[name] ?? null;
    }
    case "rx": {
      const mod: any = await import("react-icons/rx");
      return mod?.[name] ?? null;
    }
    case "sl": {
      const mod: any = await import("react-icons/sl");
      return mod?.[name] ?? null;
    }
    case "tfi": {
      const mod: any = await import("react-icons/tfi");
      return mod?.[name] ?? null;
    }
    case "ti": {
      const mod: any = await import("react-icons/ti");
      return mod?.[name] ?? null;
    }
    case "vsc": {
      const mod: any = await import("react-icons/vsc");
      return mod?.[name] ?? null;
    }
    case "wi": {
      const mod: any = await import("react-icons/wi");
      return mod?.[name] ?? null;
    }
    case "ai": {
      const mod: any = await import("react-icons/ai");
      return mod?.[name] ?? null;
    }
    case "fc": {
      const mod: any = await import("react-icons/fc");
      return mod?.[name] ?? null;
    }
    default:
      return null;
  }
}

function ReactIcon({
  value,
  className,
  size = 24,
}: {
  value?: string | null;
  className?: string;
  size?: number;
}) {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      const parsed = parseIconValue(value || "");
      if (!parsed) {
        setComp(null);
        return;
      }
      try {
        const c = await loadReactIcon(parsed.pack, parsed.name);
        if (!alive) return;
        setComp(() => (c ? c : null));
      } catch {
        if (!alive) return;
        setComp(null);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [value]);

  if (!Comp) return null;
  const C: any = Comp;
  return <C className={className} size={size} />;
}

/* =========================
   One project block
========================= */
function ProjectBlock({
  item,
  index,
}: {
  item: ProjectItem;
  index: number;
}) {
  const even = index % 2 === 0;

  const image = item.image?.src ? item.image : DEFAULT_PROJECT.image!;
  const title = item.title ?? DEFAULT_PROJECT.title!;
  const body = item.body ?? DEFAULT_PROJECT.body!;
  const rows =
    Array.isArray(item.rows) && item.rows.length
      ? (item.rows as RowItem[])
      : (DEFAULT_PROJECT.rows as RowItem[]);

  const media = (
    // ✅ replace motion.div with CinematicBlurUp
    <CinematicBlurUp
      className="w-full md:w-[702px]"
      amount={0.35}
      margin="-120px"
      y={10}
      blur={10}
      duration={0.45}
      delay={0}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image?.src || DEFAULT_PROJECT.image!.src}
        alt={image?.alt || DEFAULT_PROJECT.image!.alt}
        className={[
          "h-auto w-full aspect-[4/3]",
          "rounded-[var(--ds-radius)]",
          "shadow-[0_25px_60px_-10px_color-mix(in_oklab,var(--ds-on-bg)_12%,transparent)]",
        ].join(" ")}
        draggable={false}
      />
    </CinematicBlurUp>
  );

  const content = (
    <div className="flex-1">
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-4">
          <Heading level="h3" tone="heading" weight="medium">
            {title}
          </Heading>
          <Text size="md" tone="body" weight="regular">
            {body}
          </Text>
        </div>

        <div className="flex flex-col gap-4">
          {rows.map((r, idx) => {
            const Legacy = resolveLegacyIcon(r.icon);

            const isLink =
              (!!r.href && String(r.href).length > 0) || r.icon === "link";

            const showArrow =
              (r.showArrow ?? false) || (!!r.href && r.icon === "link");

            const RowComp: any = isLink ? "a" : "div";
            const rowProps = isLink
              ? {
                  href: r.href || "#",
                  target: "_blank",
                  rel: "noreferrer",
                }
              : {};

            return (
              <React.Fragment key={idx}>
                <RowComp
                  {...rowProps}
                  className={[
                    "flex items-center justify-between",
                    isLink ? "cursor-pointer" : "",
                    "select-none",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    {Legacy ? (
                      <Legacy className="text-[color:var(--ds-body,var(--ds-on-bg))]" />
                    ) : (
                      <ReactIcon
                        value={r.icon}
                        size={24}
                        className="text-[color:var(--ds-body,var(--ds-on-bg))]"
                      />
                    )}

                    <Text size="md" tone="body" weight="regular">
                      {r.label || ""}
                    </Text>
                  </div>

                  {showArrow ? (
                    <BsArrowRight className="text-[color:var(--ds-body,var(--ds-on-bg))]" />
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </RowComp>

                {idx !== rows.length - 1 && (
                  <div
                    className="h-px w-full"
                    style={{
                      background:
                        "color-mix(in oklab, var(--ds-body,var(--ds-on-bg)) 25%, transparent)",
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    // ✅ wrap whole project block with the same cinematic animation
    <CinematicBlurUp
      amount={0.25}
      margin="-120px"
      y={10}
      blur={18}
      duration={1.1}
      delay={index * 0.06}
      className="flex flex-col items-stretch gap-10 md:flex-row md:items-center md:gap-14"
    >
      {even ? (
        <>
          {media}
          {content}
        </>
      ) : (
        <>
          {content}
          {media}
        </>
      )}
    </CinematicBlurUp>
  );
}

/* =========================
   Renderer
========================= */
type Props = { block: BlockInstance; theme?: DesignSystem };

function ProjectHighlightRenderer({ block, theme }: Props) {
  const d: ProjectHighlightData = (block.data || {}) as any;

  const resolvedTheme = theme ?? mapThemeJson(null);

  const heading = d.heading ?? DEFAULT_DATA.heading ?? "";
  const projects =
    Array.isArray(d.projects) && d.projects.length
      ? (d.projects as ProjectItem[])
      : (DEFAULT_DATA.projects as ProjectItem[]);

  return (
    <SectionShell theme={resolvedTheme}>
      <div className="mx-auto w-full">
        <div className="grid gap-20">
          {heading ? (
            <div className="flex justify-center">
              <Heading level="h2" tone="heading" weight="medium" align="center">
                {heading}
              </Heading>
            </div>
          ) : null}

          <div className="grid gap-20">
            {projects.map((p, i) => (
              <ProjectBlock key={i} item={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

/* =========================
   Universal editor schema
========================= */
export const PROJECT_HIGHLIGHT_SCHEMA = [
  {
    type: "group",
    label: "Nastavení sekce",
    children: [
      {
        type: "text",
        path: "heading",
        label: "Nadpis (volitelné)",
        placeholder: "Selected projects",
        maxLength: 80,
      },
    ],
  },
  {
    type: "repeater",
    label: "Projekty",
    path: "projects",
    emptyHint: "Přidej první projekt",
    itemFactory: () => ({
      title: "New project",
      body: "Short description…",
      image: {
        src: "https://app.origio.site/images/mockup.png",
        alt: "Project preview",
      },
      rows: [
        { icon: "link", label: "Live link", href: "#", showArrow: true },
        { icon: "time", label: "4 weeks" },
        { icon: "metric", label: "160% boost in leads" },
      ],
    }),
    children: [
      {
        type: "group",
        label: "Obsah projektu",
        children: [
          { type: "image", path: "image", label: "Obrázek" },
          {
            type: "text",
            path: "title",
            label: "Titulek",
            placeholder: "Kreativy",
            maxLength: 80,
          },
          {
            type: "text",
            path: "body",
            label: "Popis",
            multiline: true,
            rows: 4,
            placeholder: "Project description…",
            maxLength: 320,
          },
        ],
      },
      {
        type: "repeater",
        label: "Řádky",
        path: "rows",
        emptyHint: "Přidej první řádek",
        itemFactory: () => ({
          icon: "md:MdBolt",
          label: "New row",
          href: "",
          showArrow: false,
        }),
        children: [
          {
            type: "icon",
            path: "icon",
            label: "Ikona",
            help:
              'Ukládá se jako "pack:name" (např. md:MdHome). Legacy: link/time/metric.',
            placeholder: "Select icon…",
          },
          {
            type: "text",
            path: "label",
            label: "Text",
            placeholder: "Row label…",
            maxLength: 80,
          },
          {
            type: "text",
            path: "href",
            label: "URL (volitelné)",
            placeholder: "https://example.com",
            maxLength: 200,
          },
          {
            type: "switch",
            path: "showArrow",
            label: "Zobrazit šipku",
            help: "Typicky jen když je řádek odkaz.",
          },
        ],
      },
    ],
  },
] as const;

/* =========================
   Section module
========================= */
const sh002: SectionModule = {
  id: "sh002",
  definition: {
    type: "project-highlight",
    title: "Project Highlight",
    version: 2,
    defaultData: DEFAULT_DATA,
    Renderer: ProjectHighlightRenderer,
    editor: {
      schema: PROJECT_HIGHLIGHT_SCHEMA,
      title: "Upravit Project Highlight",
      modelPath: "data",
    },
  },
  Editor: function ProjectHighlightEditor() {
    return (
      <div className="p-3 text-xs text-[color:color-mix(in_oklab,var(--ds-body,var(--ds-on-bg))_65%,transparent)]">
        (Použij horní akci „Upravit sekci“ pro úpravu obsahu.)
      </div>
    );
  },
  meta: {
    category: "showroom",
    previewImage: PreviewImage,
  },
};

export default sh002;
