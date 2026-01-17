// src/components/builder/BuilderShell.tsx
"use client";

import { useEffect } from "react";
import { useBuilderStore } from "@/store/builder-store";
import DevicePreview from "./DevicePreview";
import type { PageDocument } from "@/types/builder";
import LeftSlideOverHost from "@/components/layout/LeftSlideOverHost";
import RightSlideOverHost from "@/components/layout/RightSlideOverHost";
import type { DesignSystem } from "@/types/design-system";

type BuilderShellProps = {
  workspaceId: string;
  projectId: string;
  projectSlug: string;
  pageId: string;
  initialDoc: PageDocument;
  canPublish: boolean; // může zůstat, ale v beta už publish neblokujeme
  theme: DesignSystem;
};

export default function BuilderShell({
  workspaceId,
  projectId,
  projectSlug,
  pageId,
  initialDoc,
  canPublish,
  theme,
}: BuilderShellProps) {
  const loadInitial = useBuilderStore((s) => s.loadInitial);
  const setTheme = useBuilderStore((s) => s.setTheme);

  // ✅ nově
  const setProjectId = useBuilderStore((s) => s.setProjectId);
  const setPageId = useBuilderStore((s) => s.setPageId);
  const setPublishedSnapshot = useBuilderStore((s) => s.setPublishedSnapshot);

  // live theme z builder storu
  const liveTheme = useBuilderStore((s) => s.theme);
  const effectiveTheme = liveTheme ?? theme;

  useEffect(() => {
    // ✅ 1) vždy nastav projectId + pageId do store (kvůli autosave)
    setProjectId(projectId ?? null);
    setPageId(pageId ?? null);

    // ✅ 2) draft sekce (to už máš)
    const draftSections = Array.isArray((initialDoc as any)?.sections)
      ? (initialDoc as any).sections
      : [];

    // ✅ 3) published sekce (musí přijít ze serveru; může být null)
    // UPRAV klíč podle toho, jak to máš ve `initialDoc`:
    const publishedSectionsOrNull =
      Array.isArray((initialDoc as any)?.publishedSections)
        ? (initialDoc as any).publishedSections
        : (initialDoc as any)?.publishedSections === null
        ? null
        : Array.isArray((initialDoc as any)?.published_json)
        ? (initialDoc as any).published_json
        : (initialDoc as any)?.published_json === null
        ? null
        : null;

    // ✅ 4) nastav published snapshot dřív, než loadneš draft (aby publishMode seděl hned)
    setPublishedSnapshot(publishedSectionsOrNull);

    // ✅ 5) load draft
    if (pageId) {
      loadInitial(pageId, draftSections);
    }

    // ✅ 6) theme do store
    if (theme) {
      setTheme(theme);
    }
  }, [
    projectId,
    pageId,
    initialDoc,
    loadInitial,
    theme,
    setTheme,
    setProjectId,
    setPageId,
    setPublishedSnapshot,
  ]);

  return (
    <div className="relative h-[100vh] overflow-hidden text-zinc-950">
      <div className="h-full w-full transition-[margin] duration-200 ease-out">

        <DevicePreview
          projectSlug={projectSlug}
          // canPublish={canPublish} // beta: klidně pryč, když už neblokuješ
          theme={effectiveTheme}
        />
      </div>

      <LeftSlideOverHost />
      <RightSlideOverHost />
    </div>
  );
}
