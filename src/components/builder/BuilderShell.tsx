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
  canPublish: boolean;
  theme: DesignSystem;
};

function isThemeComplete(t: any): t is DesignSystem {
  // ✅ minimální kontrola podle toho, co ti padalo (primaryHover)
  return !!t && typeof t.primaryHover === "string" && t.primaryHover.trim() !== "";
}

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

  const setProjectId = useBuilderStore((s) => s.setProjectId);
  const setPageId = useBuilderStore((s) => s.setPageId);
  const setPublishedSnapshot = useBuilderStore((s) => s.setPublishedSnapshot);

  useEffect(() => {
    // 1) ids
    setProjectId(projectId ?? null);
    setPageId(pageId ?? null);

    // 2) draft
    const draftSections = Array.isArray((initialDoc as any)?.sections)
      ? (initialDoc as any).sections
      : [];

    // 3) published snapshot
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

    setPublishedSnapshot(publishedSectionsOrNull);

    // 4) load draft
    if (pageId) loadInitial(pageId, draftSections);

    // 5) ✅ theme do store – ale jen když je kompletní (abychom nepřepsali dobrý theme rozbitým)
    if (isThemeComplete(theme)) {
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
        <DevicePreview projectSlug={projectSlug} />
      </div>

      <LeftSlideOverHost />
      <RightSlideOverHost />
    </div>
  );
}
