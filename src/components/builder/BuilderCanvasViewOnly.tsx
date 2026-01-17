// src/components/builder/BuilderCanvasViewOnly.tsx
"use client";

import { useMemo } from "react";
import { useBuilderStore } from "@/store/builder-store";
import BlockRenderer from "./BlockRenderer";
import type { BlockInstance } from "@/types/builder";
import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";

type Props = {
  /** Volitelné: když předáš, renderuje se tohle (např. pages.published_json.sections) */
  sections?: BlockInstance[];
  /** Theme (paleta) pro render */
  theme?: DesignSystem | null;
};

export default function BuilderCanvasViewOnly({
  sections: propSections,
  theme,
}: Props) {
  const storeSections = useBuilderStore((s) => s.sections);

  const list = useMemo<BlockInstance[]>(
    () =>
      Array.isArray(propSections)
        ? propSections
        : Array.isArray(storeSections)
        ? storeSections
        : [],
    [propSections, storeSections]
  );

  const resolvedTheme = theme ?? mapThemeJson(null);

  // Loader (jen když není co renderovat)
  if (list.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1500px]">
        <div className="min-h-[100vh] w-full flex items-center justify-center">
            <img
              src="https://app.origio.site/images/logo2.png"
              alt="Loading"
              className="h-14 w-14 animate-spin"
              loading="eager"
              draggable={false}
            />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {list.map((block) => (
        <div id={`section-${block.id}`} key={block.id} className="relative">
          <BlockRenderer block={block} theme={resolvedTheme} />
        </div>
      ))}
    </div>
  );
}
