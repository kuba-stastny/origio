// src/components/builder/editor/universal/UniversalSectionEditor.tsx
"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { BsX } from "react-icons/bs";
import { useBuilderStore } from "@/store/builder-store";
import MediaManager from "@/components/media/MediaManager";
import { EditorProvider, type MediaType, type OpenMediaOpts } from "./EditorContext";
import { getByPath, setByPath } from "./utils";
import FieldRenderer from "./FieldRenderer";
import { useUiPanel } from "@/store/ui-panel";
import { useParams } from "next/navigation";

type MediaModalState = {
  path: string;
  type?: MediaType;
  allowed?: readonly MediaType[];
} | null;

export default function UniversalSectionEditor() {
  const { rightPanel, closeRight } = useUiPanel();
  const sections = useBuilderStore((s) => s.sections);

  // --- odvození pageId z builder storu robustně (podpora více možných klíčů)
  const pageId =
    useBuilderStore((s: any) => s.currentPageId) ??
    useBuilderStore((s: any) => s.pageId) ??
    useBuilderStore((s: any) => s.page?.id) ??
    null;

  // --- projectId z URL
  const params = useParams() as Record<string, string | undefined>;
  const projectId = params?.projectId;

  // i když rightPanel není sekce, hooky MUSÍ běžet
  const effectiveSectionId =
    rightPanel && rightPanel.type === "section-edit" ? rightPanel.sectionId : null;

  const schema = rightPanel && rightPanel.type === "section-edit" ? rightPanel.schema : [];

  const title =
    rightPanel && rightPanel.type === "section-edit"
      ? rightPanel.title || "Upravit sekci"
      : "Upravit sekci";

  const modelPath =
    rightPanel && rightPanel.type === "section-edit"
      ? rightPanel.modelPath || "data"
      : "data";

  const bucket =
    rightPanel && rightPanel.type === "section-edit"
      ? rightPanel.bucket || "files"
      : "files";

  const folder =
    rightPanel && rightPanel.type === "section-edit"
      ? rightPanel.folder || "media"
      : "media";

  // načti hodnoty z builder storu – když nemáme sekci, dostaneme {}
  const rootValue = useMemo(() => {
    if (!effectiveSectionId) return {};
    const sec = sections.find((s: any) => s.id === effectiveSectionId) as any;
    if (!sec) return {};
    return getByPath(sec, modelPath) ?? {};
  }, [sections, effectiveSectionId, modelPath]);

  const [draft, setDraft] = useState<any>(rootValue);

  // ✅ nově: modal state nese path + type + allowed
  const [mediaModal, setMediaModal] = useState<MediaModalState>(null);

  const [saving, setSaving] = useState<"idle" | "busy" | "ok" | "error">("idle");

  // debounce timer pro autosave
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // při změně sekce / modelPath resetujeme draft na rootValue
  useEffect(() => {
    setDraft(rootValue);
  }, [effectiveSectionId, modelPath, rootValue]);

  // uklid debounce na unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const scheduleSave = useCallback(() => {
    if (!projectId || !pageId) {
      if (!projectId) console.warn("❗ Chybí projectId v URL parametrech, autosave přeskočen.");
      if (!pageId) console.warn("❗ Chybí pageId v builder storu, autosave přeskočen.");
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving("busy");
        const latestSections = useBuilderStore.getState().sections;

        const res = await fetch(`/api/v1/projects/${projectId}/save-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageId, sections: latestSections }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }

        setSaving("ok");
        setTimeout(() => setSaving("idle"), 800);
      } catch (e) {
        console.error("❌ Chyba při autosave:", e);
        setSaving("error");
        setTimeout(() => setSaving("idle"), 1500);
      }
    }, 600);
  }, [pageId, projectId]);

  // změna v editoru -> jen update lokálního draftu
  const changeAt = (path: string, v: any) => setDraft((d: any) => setByPath(d, path, v));
  const getAt = (path?: string) => (path ? getByPath(draft, path) : draft);

  // ✅ UPDATED: openMediaFor bere opts
  const openMediaFor = (path: string, opts?: OpenMediaOpts) => {
    setMediaModal({
      path,
      type: opts?.type,
      allowed: opts?.allowed,
    });
  };

  // efekt: kdykoli se draft změní, propíšeme ho do builder storu + autosave
  useEffect(() => {
    if (!effectiveSectionId) return;

    // 1) update v builder storu
    useBuilderStore.getState().setSectionProp(effectiveSectionId, modelPath, draft);

    // 2) plán autosave
    scheduleSave();
  }, [draft, effectiveSectionId, modelPath, scheduleSave]);

  // pokud pravý panel není "section-edit", nic nevykreslujeme (ALE až po hookách!)
  if (!rightPanel || rightPanel.type !== "section-edit") {
    return null;
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header (schovaný, ale připravený do budoucna) */}
        <div className="hidden items-center justify-between px-4 py-3 border-b border-zinc-900">
          <div className="text-sm font-medium text-zinc-100">{title}</div>
          <button
            onClick={closeRight}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-zinc-900 text-zinc-200"
          >
            <BsX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <EditorProvider
            value={{
              draft,
              changeAt,
              getAt,
              openMediaFor,
              bucket,
              folder,
            }}
          >
            <FieldRenderer schema={schema} />
          </EditorProvider>
        </div>

        {/* Footer – můžeš sem dát malý indikátor uložení */}
        {/*
        <div className="border-t border-zinc-900 px-4 py-2 text-[11px] text-zinc-500">
          {saving === "busy" && "Ukládám změny…"}
          {saving === "ok" && "Uloženo"}
          {saving === "error" && "Chyba při ukládání"}
        </div>
        */}
      </div>

      {/* Media manager */}
      <AnimatePresence>
        {mediaModal?.path && (
          <MediaManager
            open={!!mediaModal?.path}
            onClose={() => setMediaModal(null)}
            onSelect={(url) => {
              const path = mediaModal.path;
              const current = getByPath(draft, path);

              // preferovaný typ:
              // 1) current.type (pokud existuje)
              // 2) mediaModal.type
              // 3) první povolený (allowed) / fallback image
              const currentType: MediaType | undefined =
                current && typeof current === "object" ? (current.type as any) : undefined;

              const allowed = mediaModal.allowed;
              const firstAllowed: MediaType =
                allowed && allowed.length
                  ? (allowed[0] as MediaType)
                  : "image";

              let nextType: MediaType = currentType || mediaModal.type || firstAllowed;
              if (allowed && allowed.length && !allowed.includes(nextType)) {
                nextType = firstAllowed;
              }

              if (typeof current === "string" || !current) {
                changeAt(path, {
                  type: nextType,
                  src: url,
                  ...(nextType === "image" ? { alt: "" } : {}),
                });
              } else {
                changeAt(path, {
                  ...current,
                  type: nextType,
                  src: url,
                  ...(nextType === "image"
                    ? { alt: typeof current.alt === "string" ? current.alt : "" }
                    : {}),
                });
              }

              setMediaModal(null);
            }}
            bucket={bucket}
            folder={folder}
            maxFiles={200}
            maxSizeMB={10}
          />
        )}
      </AnimatePresence>
    </>
  );
}
