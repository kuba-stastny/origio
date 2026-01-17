// DevicePreview.tsx
"use client";

import BuilderOnboarding from "./BuilderOnboarding";
import ShinyText from "./ShinyText";
import ShinyIcon from "./ShinyIcon";
import { BsStars } from "react-icons/bs";
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useParams } from "next/navigation";
import { useBuilderStore } from "@/store/builder-store";
import {
  BlockRegistry,
  getModuleByType,
} from "@/components/builder/BlockRegistry";
import type { BlockInstance } from "@/types/builder";
import SectionFrame from "./SectionFrame";
import TopBar, { type DeviceKey } from "./TopBar";
import IframePortal from "./IframePortal";
import { useUiPanel } from "@/store/ui-panel";
import type { DesignSystem } from "@/types/design-system";

type BusyState = "idle" | "busy" | "success" | "error";

const DEVICES: Record<DeviceKey, { width: number | "full" }> = {
  desktop: { width: "full" },
  mobile: { width: 380 },
};

const EASE = [0.22, 1, 0.36, 1] as const;

type DevicePreviewProps = {
  className?: string;
  projectSlug?: string;
  theme: DesignSystem;
};

type PublishStateResponse = {
  publishedSections: BlockInstance[] | null;
  mode?: "publish" | "publish_changes" | "published";
  hasPublished?: boolean;
  same?: boolean;
  error?: string;
};

export default function DevicePreview({
  className = "",
  projectSlug = "projekt",
  theme,
}: DevicePreviewProps) {
  const params = useParams();
  const [projectId] = useState(() => String((params as any)?.projectId ?? ""));

  const { leftPanel, rightPanel } = useUiPanel();
  useReducedMotion(); // nechám, kdybys to někde používal jinde

  // ✅ FIX: nečíst window.innerWidth v renderu
  const [isLgUp, setIsLgUp] = useState(false);

  useEffect(() => {
    const calc = () => setIsLgUp(window.innerWidth >= 1024);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // panel shift
  const [panelShiftPx, setPanelShiftPx] = useState(600);
  useEffect(() => {
    const calc = () => {
      const max = 600;
      const w = Math.min(max, Math.max(420, Math.round(window.innerWidth * 0.42)));
      setPanelShiftPx(w);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const shouldShift = isLgUp;

  let offsetX = 0;
  if (shouldShift) {
    if (leftPanel && !rightPanel) offsetX = panelShiftPx;
    if (rightPanel && !leftPanel) offsetX = -panelShiftPx;
    if (leftPanel && rightPanel) offsetX = 0;
  }

  const generating = useBuilderStore((s) => s.pageGenerating);
  const progress = useBuilderStore((s) => s.pageProgress) ?? 0;
  const phase = useBuilderStore((s) => s.pagePhase) ?? "";
  const pageId = useBuilderStore((s) => s.pageId);
  const sections = useBuilderStore((s) => s.sections) as BlockInstance[];

  const setPublishedSnapshot = useBuilderStore((s) => s.setPublishedSnapshot);
  const setPublishStatusLoaded = useBuilderStore((s) => s.setPublishStatusLoaded);

  const hasContent = (sections?.length ?? 0) > 0;
  const list = useMemo(() => sections ?? [], [sections]);

  const [saveState, setSaveState] = useState<BusyState>("idle");
  const [publishState, setPublishState] = useState<BusyState>("idle");

  const [device, setDevice] = useState<DeviceKey>("desktop");
  const deviceWidth = DEVICES[device].width;
  const scaleToFit = device !== "desktop";

  // ✅ 1:1 jako CreatorPro – po refreshi načti published snapshot
  useEffect(() => {
    let alive = true;

    async function loadPublishState() {
      if (!projectId || !pageId) return;

      setPublishStatusLoaded(false);

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/publish-state?pageId=${encodeURIComponent(pageId)}`,
          { method: "GET", credentials: "include" }
        );

        const body = (await res.json().catch(() => ({}))) as PublishStateResponse;
        if (!alive) return;

        if (!res.ok) {
          setPublishedSnapshot(null);
          setPublishStatusLoaded(true);
          return;
        }

        setPublishedSnapshot(body?.publishedSections ?? null);
        setPublishStatusLoaded(true);
      } catch {
        if (!alive) return;
        setPublishedSnapshot(null);
        setPublishStatusLoaded(true);
      }
    }

    loadPublishState();
    return () => {
      alive = false;
    };
  }, [projectId, pageId, setPublishedSnapshot, setPublishStatusLoaded]);

  const bounceBack = (setter: (s: BusyState) => void, ok: boolean) => {
    setter(ok ? "success" : "error");
    setTimeout(() => setter("idle"), 1400);
  };

  const handleSave = async () => {
    if (!pageId) {
      setSaveState("error");
      alert("Chybí pageId – nejdřív prosím projdi onboarding a spusť generování.");
      bounceBack(setSaveState, false);
      return;
    }
    setSaveState("busy");
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/save-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, sections }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      bounceBack(setSaveState, true);
    } catch (e: any) {
      console.error(e);
      bounceBack(setSaveState, false);
      alert("❌ Chyba při ukládání: " + (e?.message || "Unknown error"));
    }
  };

  const handlePublish = async () => {
    if (!pageId) {
      setPublishState("error");
      alert("Chybí pageId – nejdřív prosím projdi onboarding a spusť generování.");
      bounceBack(setPublishState, false);
      return;
    }
    setPublishState("busy");
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      // ✅ realtime: published snapshot = current draft sections
      const st = useBuilderStore.getState();
      st.setPublishedSnapshot(st.sections);
      st.setPublishStatusLoaded(true);

      bounceBack(setPublishState, true);
    } catch (e: any) {
      console.error(e);
      bounceBack(setPublishState, false);
      alert("❌ Chyba při publikaci: " + (e?.message || "Unknown error"));
    }
  };

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center ${className}`}>
      <div
        className="mx-auto flex h-full w-full flex-col overflow-hidden rounded-3xl"
        style={{ width: "100%", height: "100vh" }}
      >
        {hasContent && (
          <TopBar
            projectId={String(projectId)}
            projectSlug={projectSlug!}
            onSave={handleSave}
            onPublish={handlePublish}
            saveState={saveState}
            publishState={publishState}
            device={device}
            onDeviceChange={setDevice}
          />
        )}

        <div className="h-full w-full">
          <AnimatePresence mode="wait">
            {generating && (
              <div
                key="generating"
                className="flex h-full flex-col items-center justify-center gap-3 text-center text-zinc-900"
              >
                <ShinyIcon speed={2.6} glow>
                  <BsStars className="h-14 w-14 text-zinc-500" />
                </ShinyIcon>

                {!!phase && (
                  <ShinyText text={phase} disabled={false} speed={3} className="custom-class" />
                )}

                <div className="relative h-2 w-[200px] overflow-hidden rounded-sm bg-zinc-200">
                  <div
                    className="h-2 rounded-sm bg-zinc-900"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {!generating && !hasContent && (
              <div key="onboarding" className="flex h-full w-full">
                <div className="w-full">
                  <BuilderOnboarding />
                </div>
              </div>
            )}

            {!generating && hasContent && (
              <div
                key="content"
                className="h-full w-full overflow-hidden pt-4 px-6 text-zinc-900"
                style={{
                  transform: shouldShift ? `translateX(${offsetX}px)` : undefined,
                  transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <IframePortal
                  width={deviceWidth}
                  scaleToFit={scaleToFit}
                  viewportHeight={device === "desktop" ? 800 : 720}
                  className="h-full w-full"
                >
                  <div id="builder-canvas" data-builder-canvas className="mx-auto pt-0">
                    {list.map((blk: BlockInstance, index: number) => {
                      const def: any = (BlockRegistry as any)?.[blk.type];
                      const modFallback = !def ? getModuleByType(blk.type) : null;
                      const finalDef: any = def ?? modFallback?.definition;
                      const Renderer = finalDef?.Renderer as React.ComponentType<any> | undefined;

                      if (!Renderer) {
                        return (
                          <div
                            key={blk.id}
                            className="rounded-xl border border-zinc-300/50 p-4 text-sm text-zinc-700"
                          >
                            Neznámá sekce: <b>{blk.type}</b>.
                          </div>
                        );
                      }

                      const editorCfg = finalDef?.editor;

                      return (
                        <SectionFrame
                          key={blk.id}
                          id={blk.id}
                          index={index}
                          total={list.length}
                          className="bg-white"
                          editor={editorCfg}
                        >
                          <Renderer block={blk} theme={theme} />
                        </SectionFrame>
                      );
                    })}
                  </div>
                </IframePortal>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
