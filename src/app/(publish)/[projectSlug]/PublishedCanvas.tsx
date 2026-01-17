"use client";

import { useEffect } from "react";
import { useBuilderStore } from "@/store/builder-store";
import type { PageDocument } from "@/types/builder";
import { migrateDocumentToLatest } from "@/lib/migrations";
import BuilderCanvasViewOnly from "@/components/builder/BuilderCanvasViewOnly";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import type { DesignSystem } from "@/types/design-system";

type Props = {
  workspaceId: string;
  projectId: string;
  pageId: string;
  initialDoc: PageDocument;
  theme: DesignSystem;
};

export default function PublishedCanvas({
  workspaceId,
  projectId,
  pageId,
  initialDoc,
  theme,
}: Props) {
  const loadInitial = useBuilderStore((s) => s.loadInitial);
  const setSections = useBuilderStore((s) => s.setSections);
  const setPageGenerating = useBuilderStore((s) => s.setPageGenerating);

  useEffect(() => {
    const { doc } = migrateDocumentToLatest(initialDoc);
    const sections = Array.isArray(doc.sections) ? doc.sections : [];

    if (typeof loadInitial === "function") loadInitial(pageId, sections);
    else if (typeof setSections === "function") setSections(sections);

    if (typeof setPageGenerating === "function") setPageGenerating(false);
  }, [pageId, initialDoc, loadInitial, setSections, setPageGenerating]);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {/* analytics */}
      <AnalyticsTracker
        workspaceId={workspaceId}
        projectId={projectId}
        pageId={pageId}
      />

      {/* scroll root */}
      <div data-analytics-scroll-root id="public-canvas" className="relative max-h-[none] overflow-auto">
        <BuilderCanvasViewOnly theme={theme} />
      </div>
    </div>
  );
}
