"use client";

import React from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";
import { SectionShell } from "@/sections/ui/SectionShell";
import { Text } from "@/sections/ui/Typography";
import PreviewImage from "../../previews/st002.png";

/* =========================================
   Výchozí položky (Figma má 4)
========================================= */
const DEFAULT_ITEMS = [
  { value: "7+", label: "years of experience" },
  { value: "23+", label: "projects completed" },
  { value: "14", label: "happy clients" },
  { value: "23+", label: "projects completed" },
];

/* =========================================
   Typy
========================================= */
type StatsRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

type StatItem = { value: string; label: string };

/* =========================================
   Renderer
========================================= */
function StatsRenderer({ block, theme }: StatsRendererProps) {
  const d: any = block.data || {};
  const items: StatItem[] =
    Array.isArray(d.items) && d.items.length ? d.items : DEFAULT_ITEMS;

  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme} className="p-0">
      <section className="relative">
        <div className="mx-auto w-full">
          {/* mobile: 2 cols + gap 24 | desktop: 4 cols + gap 40 */}
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-10">
            {items.map((it, i) => (
              <div
                key={i}
                className={[
                  "min-w-0",
                  "rounded-[16px]",
                  "p-6",
                  // Figma: outline 1px Grey-700
                  "outline outline-1 -outline-offset-1",
                  // jen DS proměnné (žádný zinc)
                  "bg-transparent",
                  "outline-[color:var(--ds-border,rgba(255,255,255,0.12))]",
                ].join(" ")}
              >
                {/* Value: 64px / 120%, Medium (ve Figmě) */}
                {/* V našem Typography: odpovídá H1 (64/44, 120%) + medium */}
                <Text as="div" tone="inherit" className="w-full">
                  {/* Použijeme Heading scale přes Text? Ne — typografii řešíme přes komponenty.
                      Máš Heading komponentu, ale value není "Heading" semanticky.
                      Takže použijeme Text s explicitní velikostí? To nechceš.
                      Nejčistší: použít Heading s as="div". */}
                </Text>

                <StatValue>{it.value || "—"}</StatValue>

                {/* Label: 20px / 132%, Light */}
                {/* V Typography: Text lg = 20/18 + 132% → sedí desktop 20px, mobile 18px (Figma label je 20px desktop).
                    Pokud chceš label i na mobile 20px, řekni a upravím mapping.
                */}
                <Text as="div" tone="muted" size="lg" weight="light">
                  {it.label || "\u00A0"}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SectionShell>
  );
}

/**
 * Value v kartě:
 * Figma: 64px / 120% / Medium
 * Použijeme Heading (h1 scale) s as="div" aby to bylo typograficky 1:1 a bez dalších tříd.
 */
function StatValue({ children }: { children: React.ReactNode }) {
  // Lokálně importovat Heading by bylo ok, ale držíme importy nahoře čisté.
  // Importneme tady inline (TS/Next to zvládne).
  const { Heading } = require("@/sections/ui/Typography") as typeof import("@/sections/ui/Typography");
  return (
    <Heading as="div" level="h1" tone="inherit" weight="medium">
      {children}
    </Heading>
  );
}

/* =========================================
   Universal editor – schéma
========================================= */
export const STATS_SCHEMA = [
  {
    type: "repeater",
    label: "Statistiky",
    path: "items",
    emptyHint: "Přidej první statistiku",
    children: [
      {
        type: "text",
        path: "value",
        label: "Hodnota",
        placeholder: "např. 7+, 23+, 14",
        maxLength: 24,
      },
      {
        type: "text",
        path: "label",
        label: "Popisek",
        placeholder: "Krátký popisek statistiky",
        maxLength: 100,
      },
    ],
  },
] as const;

/* =========================================
   Registrace sekce
========================================= */
const st002: SectionModule = {
  id: "st002",
  definition: {
    type: "stats",
    title: "Statistiky",
    version: 2,
    defaultData: { items: DEFAULT_ITEMS },
    Renderer: StatsRenderer,
    editor: {
      schema: STATS_SCHEMA,
      title: "Upravit statistiky",
      modelPath: "data",
    },
  },
  Editor: function StatsEditor() {
    return (
      <div className="p-3 text-xs text-zinc-400">
        (Použij horní akci „Upravit sekci“ pro úpravu statistik.)
      </div>
    );
  },
  meta: {
    category: "stats",
    previewImage: PreviewImage,
  },
};

export default st002;
