// src/components/builder/BuilderCanvas.tsx
"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBuilderStore } from "@/store/builder-store";
import { BlockRenderer } from "./BlockRenderer";
import { BlockRegistry } from "./BlockRegistry";
import type { BlockInstance, BlockType } from "@/types/builder";
import { nanoid } from "@/utils/ids";
import { FaArrowDown, FaArrowUp, FaTrash, FaCopy } from "react-icons/fa";

/* ------------------------------ Section skeleton ------------------------------ */

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-1/3 rounded bg-zinc-200/60" />
      <div className="h-4 w-2/3 rounded bg-zinc-200/50" />
      <div className="h-4 w-5/6 rounded bg-zinc-200/40" />
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="h-9 rounded bg-zinc-200/40" />
        <div className="h-9 rounded bg-zinc-200/40" />
      </div>
    </div>
  );
}

/* ------------------------------ Ovládání sekce (vpravo dole) ------------------------------ */

function SectionControls({
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 4 }}
      className="pointer-events-auto flex items-center gap-1 rounded-xl border border-zinc-900/70 bg-black/95 p-1 shadow-lg"
      role="toolbar"
      aria-label="Ovládání sekce"
    >
      <button
        onClick={onMoveUp}
        className="rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
        title="Přesunout nahoru"
      >
        <FaArrowUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onMoveDown}
        className="rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
        title="Přesunout dolů"
      >
        <FaArrowDown className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onDuplicate}
        className="rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
        title="Duplikovat sekci"
      >
        <FaCopy className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
        title="Smazat sekci"
      >
        <FaTrash className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

/* ------------------------------ Karta sekce ------------------------------ */

const SectionCard = memo(function SectionCard({
  block,
  selected,
  loading,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: {
  block: BlockInstance;
  selected: boolean;
  loading: boolean;
  onSelect: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={[
        "group relative mb-6 rounded-2xl border-2 transition-shadow",
        selected ? "border-blue-800" : "border-zinc-950 hover:shadow-md",
      ].join(" ")}
      onClick={(e) => {
        e.stopPropagation?.();
        onSelect(block.id);
      }}
      role="button"
      tabIndex={0}
    >
      {loading && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-black/70 p-6">
          <SectionSkeleton />
        </div>
      )}

      <div className="p-5" aria-hidden={loading}>
        <BlockRenderer block={block} />
      </div>

      <div className="pointer-events-none absolute bottom-3 right-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <SectionControls
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
});

/* ------------------------------ AI typing overlay ------------------------------ */

function CodeTypingOverlay() {
  const sections = useBuilderStore((s: any) => s.sections) as BlockInstance[] | undefined;
  const progress = useBuilderStore((s: any) => s.pageProgress) as number | null;

  const lines = useMemo(() => {
    const header = [`import { createPage } from "@/builder";`, `const page = createPage();`];
    const body =
      (sections ?? []).length > 0
        ? (sections ?? []).map((b) => `page.add("${b.type}")`)
        : [`// Analyzuji byznys…`, `// Navrhuji strukturu…`, `// Připravuji obsah…`];
    const footer = [`await page.optimizeCopy();`, `export default page;`];
    return [...header, ...body, ...footer];
  }, [sections]);

  const [typed, setTyped] = useState<string[]>(() => lines.map(() => ""));
  const [ln, setLn] = useState(0);
  const [col, setCol] = useState(0);
  const key = useMemo(() => lines.join("\n"), [lines]);

  useEffect(() => {
    setTyped(lines.map(() => ""));
    setLn(0);
    setCol(0);
  }, [key]);

  useEffect(() => {
    if (ln >= lines.length) return;
    const targetLine = lines[ln] || "";
    const speed = 14 + Math.round(Math.random() * 10);
    const tick = setInterval(() => {
      setTyped((prev) => {
        const next = [...prev];
        const nextCol = col + 1;
        next[ln] = targetLine.slice(0, nextCol);
        return next;
      });

      setCol((c) => {
        const nc = c + 1;
        if (nc >= targetLine.length) {
          setTimeout(() => {
            setLn((l) => l + 1);
            setCol(0);
          }, 70);
        }
        return nc;
      });
    }, 20000 / (speed * 60));

    return () => clearInterval(tick);
  }, [ln, col, lines]);

  const trails = Array.from({ length: 10 });

  return (
    <motion.div
      className="absolute left-0 right-0 top-8 mx-auto w-full max-w-3xl"
      initial={{ opacity: 0, y: -8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
      transition={{ duration: 0.25 }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-zinc-300/80 bg-black shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200/80 bg-zinc-50/70 px-4 py-2">
          <div className="text-xs font-medium text-zinc-600">AI generuje stránku…</div>
          <div className="text-[11px] text-zinc-500">
            {typeof progress === "number" ? `${Math.round(progress * 100)}%` : "• • •"}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 z-0 px-4 py-4">
            <div className="space-y-2">
              {trails.map((_, i) => (
                <motion.div
                  key={i}
                  className="h-3 rounded bg-zinc-200"
                  initial={{ width: `${30 + (i % 5) * 10}%`, opacity: 0.9 }}
                  animate={{
                    width: [
                      `${30 + (i % 5) * 10}%`,
                      `${70 + ((i + 2) % 5) * 5}%`,
                      `${45 + ((i + 1) % 6) * 7}%`,
                    ],
                    opacity: [0.85, 0.95, 0.9],
                  }}
                  transition={{
                    duration: 2.4 + (i % 3) * 0.2,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                    delay: i * 0.06,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 overflow-hidden px-4 py-4">
            <pre className="m-0 whitespace-pre-wrap break-words font-mono text-[12px] leading-6 text-zinc-800">
              {typed.map((t, i) => {
                const isActive = i === ln;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                    <code>
                      {t}
                      {isActive && <span className="ml-[1px] inline-block animate-pulse">▌</span>}
                    </code>
                  </motion.div>
                );
              })}
            </pre>
          </div>
        </div>

        <div className="h-1 w-full bg-zinc-200/80">
          <motion.div
            className="h-full bg-zinc-800"
            initial={{ width: "0%" }}
            animate={{ width: typeof progress === "number" ? `${Math.round(progress * 100)}%` : "20%" }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------ BuilderCanvas – hlavní komponenta ------------------------------ */

export default function BuilderCanvas() {
  // tolerantní binding jako v LeftPanelu
  const sections = useBuilderStore((s: any) => s.sections) as BlockInstance[] | undefined;
  const selectedId = useBuilderStore((s: any) => s.selectedId) as string | null | undefined;

  const select =
    (useBuilderStore((s: any) => s.select) as ((id: string | null) => void)) ??
    (useBuilderStore((s: any) => s.setSelected || s.setSelectedId) as ((id: string | null) => void)) ??
    (() => {});

  const addBlock =
    (useBuilderStore((s: any) => s.addBlock || s.addSection) as
      | ((block: BlockInstance) => void)
      | ((type: BlockType, initial?: any, version?: number) => void)
      | undefined) ?? undefined;

  const removeBlock =
    (useBuilderStore((s: any) => s.removeBlock || s.removeSelected) as
      | ((id: string) => void)
      | (() => void)
      | undefined) ?? undefined;

  const moveBlock =
    (useBuilderStore((s: any) => s.moveBlock || s.moveSelected) as
      | ((id: string, dir: "up" | "down") => void)
      | ((dir: "up" | "down") => void)
      | undefined) ?? undefined;

  const loadingMap =
    (useBuilderStore((s: any) => s.loadingMap) as Record<string, boolean> | undefined) || {};
  const pageGenerating = useBuilderStore((s: any) => s.pageGenerating) as boolean;

  const list = useMemo(() => sections ?? [], [sections]);

  /* ---------- Per-section akce ---------- */

  function handleSelect(id: string) {
    select?.(id);
  }
  function handleRemove(id: string) {
    if (!removeBlock) return;
    try {
      if ((removeBlock as any).length >= 1) (removeBlock as any)(id);
      else (removeBlock as any)();
    } catch (e) {
      console.error("Chyba při mazání bloku:", e);
    }
  }
  function handleMove(id: string, dir: "up" | "down") {
    if (!moveBlock) return;
    try {
      if ((moveBlock as any).length >= 2) (moveBlock as any)(id, dir);
      else (moveBlock as any)(dir);
    } catch (e) {
      console.error("Chyba při přesunu bloku:", e);
    }
  }
  function handleDuplicate(b: BlockInstance) {
    if (!addBlock) return;
    try {
      const def = (BlockRegistry as any)[b.type];
      const newBlock: BlockInstance = {
        id: nanoid(),
        type: b.type,
        version: b.version ?? def?.version ?? 1,
        data: { ...(b.data ?? def?.defaultData ?? {}) },
      };
      if ((addBlock as any).length >= 2) {
        (addBlock as any)(newBlock.type, newBlock.data, newBlock.version);
      } else {
        (addBlock as any)(newBlock);
      }
      select?.(newBlock.id);
    } catch (e) {
      console.error("Chyba při duplikaci bloku:", e);
    }
  }

  return (
    <div className="relative mx-auto w-full">
   

      {/* Overlay s „AI generuje stránku…“ */}
      <AnimatePresence>
        {pageGenerating && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CodeTypingOverlay />
          </motion.div>
        )}
      </AnimatePresence>

      {list.length === 0 && !pageGenerating && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-black/70 p-10 text-center text-sm text-zinc-500">
          Zatím žádné sekce — přidej je tlačítkem <b>„Nová sekce“</b> nahoře nebo použij <b>AI</b>.
        </div>
      )}

      <div>
        {list.map((block) => (
          <SectionCard
            key={block.id}
            block={block}
            selected={selectedId === block.id}
            loading={!!loadingMap?.[block.id]}
            onSelect={handleSelect}
            onMoveUp={() => handleMove(block.id, "up")}
            onMoveDown={() => handleMove(block.id, "down")}
            onDuplicate={() => handleDuplicate(block)}
            onDelete={() => handleRemove(block.id)}
          />
        ))}
      </div>
    </div>
  );
}
