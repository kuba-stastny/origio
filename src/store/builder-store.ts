"use client";

import { create } from "zustand";
import type { BlockInstance } from "@/types/builder";
import type { DesignSystem } from "@/types/design-system";

/** ✅ publish režim pro CTA */
export type PublishMode = "publish" | "publish_changes" | "published";

/** ✅ stable stringify (ignoruje pořadí klíčů) */
function stableStringify(value: any): string {
  const seen = new WeakSet();
  const norm = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return "[Circular]";
    seen.add(v);

    if (Array.isArray(v)) return v.map(norm);

    const keys = Object.keys(v).sort();
    const out: any = {};
    for (const k of keys) out[k] = norm(v[k]);
    return out;
  };
  return JSON.stringify(norm(value));
}

function computePublishMode(
  draftSections: any,
  publishedSections: any
): PublishMode {
  if (publishedSections == null) return "publish";
  return stableStringify(draftSections) === stableStringify(publishedSections)
    ? "published"
    : "publish_changes";
}

/**
 * Stav a akce builderu pro práci s draftem stránky.
 */
type BuilderState = {
  projectId: string | null;
  pageId: string | null;

  selectedId: string | null;

  sections: BlockInstance[];

  theme: DesignSystem | null;

  pageGenerating: boolean;
  pageProgress: number | null;
  pagePhase: string | null;

  // ✅ PUBLISH: snapshot publikované verze (sekce)
  publishedSnapshot: BlockInstance[] | null;

  // ✅ PUBLISH: odvozený stav pro CTA
  publishMode: PublishMode;

  // ✅ PUBLISH: loader (TopBar ukáže Checking… dokud se to nenačte)
  publishStatusLoaded: boolean;
  setPublishStatusLoaded: (v: boolean) => void;

  // === INIT ===
  loadInitial: (pageId: string, sections: BlockInstance[]) => void;

  // ✅ PUBLISH: set published snapshot (z DB / po publish)
  setPublishedSnapshot: (sections: BlockInstance[] | null) => void;

  setPageId: (id: string | null) => void;
  setProjectId: (id: string | null) => void;

  setTheme: (theme: DesignSystem | null) => void;

  replaceSections: (sections: BlockInstance[]) => void;
  setSections: (sections: BlockInstance[]) => void;
  removeSection: (id: string) => void;
  moveSection: (from: number, to: number) => void;
  addSection: (section: BlockInstance) => void;

  insertSectionAt: (index: number, section: BlockInstance) => void;

  setSectionProp: (id: string, path: string, value: unknown) => void;

  select: (id: string | null) => void;

  setPageGenerating: (v: boolean) => void;
  setPageProgress: (v: number | null) => void;
  setPagePhase: (t: string | null) => void;
  resetProgress: () => void;
};

// --- helpery pro immutable update --- //
function parsePath(path: string): (string | number)[] {
  const out: (string | number)[] = [];
  const dotParts = path.split(".").filter(Boolean);
  for (const part of dotParts) {
    const re = /([^\[\]]+)|\[(\d+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(part))) {
      if (m[1] !== undefined) out.push(m[1]);
      else if (m[2] !== undefined) out.push(Number(m[2]));
    }
  }
  return out;
}

function deepSetImmutable<T>(input: T, path: string, value: unknown): T {
  const segs = parsePath(path);
  if (segs.length === 0) return input;

  const setAt = (node: any, i: number): any => {
    const key = segs[i]!;
    const isLast = i === segs.length - 1;
    const curVal = node != null ? node[key as any] : undefined;

    if (isLast) {
      if (Array.isArray(node)) {
        const nextArr = node.slice();
        nextArr[key as number] = value;
        return nextArr;
      }
      return { ...(node ?? {}), [key]: value };
    }

    const nextKey = segs[i + 1];
    const shouldBeArray = typeof nextKey === "number";

    let nextContainer: any;
    if (curVal !== undefined && curVal !== null) {
      nextContainer = Array.isArray(curVal) ? curVal.slice() : { ...curVal };
    } else {
      nextContainer = shouldBeArray ? [] : {};
    }

    const updatedChild = setAt(nextContainer, i + 1);

    if (Array.isArray(node)) {
      const nextArr = node.slice();
      nextArr[key as number] = updatedChild;
      return nextArr;
    }
    return { ...(node ?? {}), [key]: updatedChild };
  };

  const root = Array.isArray(input)
    ? (input as any[]).slice()
    : { ...(input as any) };
  return setAt(root, 0) as T;
}

/**
 * ✅ Debounced auto-save draft
 */
let saveTimer: any = null;

function triggerSaveDraft(get: () => BuilderState) {
  const { projectId, pageId } = get();
  if (!projectId || !pageId) return;

  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    const { projectId: pid, pageId: pgid, sections } = get();
    if (!pid || !pgid) return;

    void fetch(`/api/v1/projects/${pid}/save-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: pgid, sections }),
    }).catch((err) => {
      console.error("Failed to save draft", err);
    });
  }, 450);
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  projectId: null,
  pageId: null,
  selectedId: null,
  sections: [],
  theme: null,

  pageGenerating: false,
  pageProgress: null,
  pagePhase: null,

  publishedSnapshot: null,
  publishMode: "publish",

  publishStatusLoaded: false,
  setPublishStatusLoaded: (v) => set({ publishStatusLoaded: !!v }),

  // init sekcí (draft)
  loadInitial: (pageId, sections) =>
    set((s) => {
      const nextSections = Array.isArray(sections) ? sections : [];
      return {
        pageId,
        selectedId: null,
        sections: nextSections,
        pageGenerating: false,
        pageProgress: null,
        pagePhase: null,
        // publishMode se dopočítá z publishedSnapshot, který přijde později z publish-state
        publishMode: computePublishMode(nextSections, s.publishedSnapshot),
      };
    }),

  // ✅ klíč: published snapshot z DB / po publish
  setPublishedSnapshot: (sectionsOrNull) =>
    set((s) => {
      const nextPublished = sectionsOrNull
        ? Array.isArray(sectionsOrNull)
          ? sectionsOrNull
          : []
        : null;

      return {
        publishedSnapshot: nextPublished,
        publishMode: computePublishMode(s.sections, nextPublished),
      };
    }),

  setPageId: (id) => set({ pageId: id ?? null }),
  setProjectId: (id) => set({ projectId: id ?? null }),

  setTheme: (theme) => set({ theme }),

  replaceSections: (sections) => {
    set((s) => {
      const next = Array.isArray(sections) ? sections : [];
      return {
        sections: next,
        publishMode: computePublishMode(next, s.publishedSnapshot),
      };
    });
    triggerSaveDraft(get);
  },

  setSections: (sections) => {
    set((s) => {
      const next = Array.isArray(sections) ? sections : [];
      return {
        sections: next,
        publishMode: computePublishMode(next, s.publishedSnapshot),
      };
    });
    triggerSaveDraft(get);
  },

  removeSection: (id) => {
    set((s) => {
      const next = s.sections.filter((x) => x.id !== id);
      return {
        sections: next,
        selectedId: s.selectedId === id ? null : s.selectedId,
        publishMode: computePublishMode(next, s.publishedSnapshot),
      };
    });
    triggerSaveDraft(get);
  },

  moveSection: (from, to) => {
    set((s) => {
      const arr = s.sections.slice();
      const len = arr.length;
      if (len === 0) return s;

      if (from < 0 || from >= len || to < 0 || to > len || from === to)
        return s;

      const [moved] = arr.splice(from, 1);
      const safeTo = Math.max(0, Math.min(to, arr.length));
      arr.splice(safeTo, 0, moved);

      return {
        sections: arr,
        publishMode: computePublishMode(arr, s.publishedSnapshot),
      };
    });
    triggerSaveDraft(get);
  },

  addSection: (section) => {
    set((s) => {
      const next = [...s.sections, section];
      return {
        sections: next,
        publishMode: computePublishMode(next, s.publishedSnapshot),
      };
    });
    triggerSaveDraft(get);
  },

  insertSectionAt: (index, section) => {
    set((s) => {
      const arr = s.sections.slice();
      const safeIndex = Math.max(0, Math.min(index, arr.length));
      arr.splice(safeIndex, 0, section);

      return {
        sections: arr,
        publishMode: computePublishMode(arr, s.publishedSnapshot),
      };
    });
    triggerSaveDraft(get);
  },

  setSectionProp: (id, path, value) => {
    set((state) => {
      const idx = state.sections.findIndex((s) => s.id === id);
      if (idx === -1) return state;

      const next = state.sections.slice();
      const current = next[idx];

      const updated = deepSetImmutable(
        current as any,
        path,
        value
      ) as BlockInstance;

      next[idx] = updated;

      return {
        sections: next,
        publishMode: computePublishMode(next, state.publishedSnapshot),
      };
    });

    triggerSaveDraft(get);
  },

  select: (id) => set({ selectedId: id }),

  setPageGenerating: (v) => set({ pageGenerating: v }),
  setPageProgress: (v) => set({ pageProgress: v }),
  setPagePhase: (t) => set({ pagePhase: t }),

  resetProgress: () =>
    set({
      pageGenerating: false,
      pageProgress: null,
      pagePhase: null,
    }),
}));
