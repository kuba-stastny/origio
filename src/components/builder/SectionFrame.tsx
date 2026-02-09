// src/components/builder/SectionFrame.tsx
"use client";

import React, { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useBuilderStore } from "@/store/builder-store";
import { ChevronUp, ChevronDown, Trash2, Pencil } from "lucide-react";
import AddSectionLauncher from "./AddSectionLauncher";
import { useUiPanel } from "@/store/ui-panel";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BsPencilFill } from "react-icons/bs";

type EditorConfig = {
  schema: readonly any[];
  title?: string;
  modelPath?: string;
};

type Props = {
  id: string;
  index: number;
  total: number;
  className?: string;
  children: React.ReactNode;
  editor?: EditorConfig;
};

function cx(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

type ConfirmDeleteModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmDeleteModal({ open, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-zinc-950 p-10 shadow-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="mb-1 text-lg tracking-tighter text-center font-medium text-zinc-100">
              Opravdu chcete smazat tuto sekci?
            </div>
            <p className="mb-4 text-xs tracking-tighter text-center text-zinc-400">
              Tuto akci nejde vrátit zpět. Obsah sekce bude odstraněn z této stránky.
            </p>
            <div className="flex justify-center gap-2 mt-8">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Smazat sekci
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default function SectionFrame({
  id,
  index,
  total,
  className,
  children,
  editor,
}: Props) {
  const moveSection = useBuilderStore((s) => s.moveSection);
  const removeSection = useBuilderStore((s) => s.removeSection);
  const { openRight } = useUiPanel();

  const [confirmOpen, setConfirmOpen] = useState(false);

  // z URL: /workspaces/[workspaceId]/projects/[projectId]/builder
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const projectId = params?.projectId;

  // helper pro ulozeni draftu po zmene sekci
  const saveDraft = useCallback(() => {
    if (!projectId) return;

    const { pageId, sections } = useBuilderStore.getState();
    if (!pageId) return;

    void fetch(`/api/v1/projects/${projectId}/save-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, sections }),
    }).catch((err) => {
      console.error("Failed to save draft", err);
    });
  }, [projectId]);

  const canUp = index > 0;
  const canDown = index < total - 1;

  const onUp = () => {
    if (!canUp) return;
    moveSection(index, index - 1);
    saveDraft();
  };

  const onDown = () => {
    if (!canDown) return;
    moveSection(index, index + 1);
    saveDraft();
  };

  const handleRemoveConfirmed = () => {
    removeSection(id);
    saveDraft();
    setConfirmOpen(false);
  };

  const onRemoveClick = () => {
    setConfirmOpen(true);
  };

  // Bezpečný scroll v rámci canvasu po přidání nové sekce
  function scrollToCanvas(el: HTMLElement) {
    const canvas =
      (document.getElementById("builder-canvas") ||
        document.querySelector("[data-builder-canvas]")) as HTMLElement | null;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = elRect.top - canvasRect.top + canvas.scrollTop - 24;
    canvas.scrollTo({ top: offset, behavior: "smooth" });
  }

  const hasEditor = !!(editor && editor.schema);
  const editorTitle = editor?.title ?? "Upravit sekci";
  const editorModelPath = editor?.modelPath ?? "data";

  return (
    <>
      <div
        id={`section-${id}`}
        className={cx(
          "relative group rounded-2xl max-w-[1500px] mx-auto ring-1 ring-transparent hover:ring-zinc-700/40 transition-all",
          className
        )}
      >
        {/* Horní toolbar */}
        <div
          className={cx(
            "pointer-events-none absolute top-5 left-5 z-[2000]",
            "opacity-100 md:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          )}
        >
          <div
            className={cx(
              "pointer-events-auto flex flex-col items-center gap-1 rounded-2xl px-2 py-1",
              "bg-zinc-950 backdrop-blur",
              "shadow-sm"
            )}
          >
            {/* Nahoru */}
            <button
              type="button"
              onClick={onUp}
              disabled={!canUp}
              title="Přesunout nahoru"
              aria-label="Přesunout sekci nahoru"
              className={btnCls(!canUp)}
              hidden
            >
              <ChevronUp className="h-4 w-4" />
            </button>

            {/* Dolů */}
            <button
              type="button"
              onClick={onDown}
              disabled={!canDown}
              title="Přesunout dolů"
              aria-label="Přesunout sekci dolů"
              className={btnCls(!canDown)}
              hidden
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Upravit sekci (jen pokud má config) */}
            {hasEditor && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openRight({
                      type: "section-edit",
                      sectionId: id,
                      schema: editor!.schema,
                      title: editorTitle,
                      modelPath: editorModelPath,
                    })
                  }
                  title={editorTitle}
                  aria-label="Upravit sekci"
                  className={btnCls(false)}
                >
                  <BsPencilFill className="h-4 w-4" />
                  Upravit sekci
                </button>
              </>
            )}

            {/* Smazat */}
            <button
              type="button"
              onClick={onRemoveClick}
              title="Odstranit sekci"
              aria-label="Odstranit sekci"
              className={btnDangerCls()}
              hidden
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Obsah sekce */}
        {children}

        {/*
        <div className="absolute opacity-100 md:opacity-0 group-hover:opacity-100 bottom-0 z-[50] left-0 w-full h-auto transition-all duration-200">
          <div className="relative">
            <div className="relative flex cursor-pointer justify-center mb-2">
              <AddSectionLauncher
                label={
                  <span className="inline-flex items-center gap-2">
                    Přidat sekci
                  </span> as unknown as string
                }
                className="-mt-3 bg-zinc-950 hover:bg-zinc-900 cursor-pointer border-zinc-800 text-zinc-200 transition-all"
                afterIndex={index}
                onAdded={(block) => {
                  setTimeout(() => {
                    const el = document.getElementById(`section-${block.id}`);
                    if (el) scrollToCanvas(el as HTMLElement);
                  }, 50);
                  saveDraft();
                }}
              />
            </div>
          </div>
        </div>
       */}
      </div>

      {/* Confirm modal – renderovaný do document.body s animací */}
      <ConfirmDeleteModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleRemoveConfirmed}
      />
    </>
  );
}

function btnCls(disabled: boolean) {
  return [
    "inline-flex items-center justify-center rounded-lg text-sm",
    "h-auto w-auto gap-5 bg-zinc-900 px-4 py-2 text-zinc-300 hover:text-white",
    "hover:bg-zinc-800/80 active:bg-zinc-800",
    "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-zinc-500/50",
    "disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed",
    "transition-colors cursor-pointer ",
  ].join(" ");
}

function btnDangerCls() {
  return [
    "inline-flex items-center justify-center rounded-2xl",
    "h-9 w-9 text-red-300 hover:text-red-100",
    "hover:bg-red-900/40 active:bg-red-900/60",
    "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-red-600/50",
    "transition-colors cursor-pointer ",
  ].join(" ");
}
