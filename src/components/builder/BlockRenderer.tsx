// src/components/builder/BlockRenderer.tsx
"use client";

import * as React from "react";
import type { BlockInstance } from "@/types/builder";
import { BlockRegistry, getModuleByType } from "./BlockRegistry";
import type { DesignSystem } from "@/types/design-system";

type BlockRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

export function BlockRenderer({ block, theme }: BlockRendererProps) {
  const reg: any = (BlockRegistry as any)?.[block.type];
  const modFallback = !reg ? getModuleByType?.(block.type) : null;

  // ✅ podporuj obě struktury:
  // - registry může být { Renderer } nebo { definition: { Renderer } }
  const def = reg ?? modFallback;
  const Renderer =
    (def?.Renderer as React.ComponentType<any> | undefined) ??
    (def?.definition?.Renderer as React.ComponentType<any> | undefined);

  if (!Renderer) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Neznámý blok: <b>{block.type}</b>
      </div>
    );
  }

  // DEBUG – uvidíš jestli theme fakt přichází
  // eslint-disable-next-line no-console
  console.log("[BlockRenderer]", { blockType: block.type, blockId: block.id, theme });

  try {
    return <Renderer block={block} theme={theme} />;
  } catch (e: any) {
    console.error("BlockRenderer error:", e);
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Chyba při renderu bloku <b>{block.type}</b>.
      </div>
    );
  }
}

export default BlockRenderer;
