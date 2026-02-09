// src/components/builder/OnboardingTemplateStep.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2 } from "lucide-react";

import type { BlockInstance } from "@/types/builder";
import type { DesignSystem } from "@/types/design-system";

import { BlockRegistry, getModuleByType } from "@/components/builder/BlockRegistry";
import OnboardingPreviewIframeGrid from "@/components/builder/OnboardingPreviewIframeGrid";
import { listModules } from "@/sections/registry";

/* =========================================================
   Types
========================================================= */

export type ThemeKey = "blacky" | "whitey";
export type PresetGroup = "it_design" | "marketing" | "finance";

export type TemplatePreset = {
  id: string;
  name: string;
  subtitle: string;
  group: PresetGroup;
  themeKey: ThemeKey; // ✅ FIXED theme per preset (no i%2)
  sections: string[]; // module IDs e.g. "ab001", "hd001"
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  // ===== GROUP: IT / Design =====
  {
    id: "t001",
    group: "it_design",
    themeKey: "blacky",
    name: "Dev / Design Portfolio",
    subtitle: "Carousel hero + galerie projektů + proof",
    sections: ["hd001", "h002", "sh003", "st002", "ab001", "ab002", "sv001", "ts001", "ct001"],
  },
  {
    id: "t002",
    group: "it_design",
    themeKey: "whitey",
    name: "Dev / Design Portfolio (Light)",
    subtitle: "Stejná struktura v bílém designu",
    sections: ["hd001", "h002", "sh003", "st002", "ab001", "ab002", "sv001", "ts001", "ct001"],
  },

  // ===== GROUP: Marketing / Copy =====
  {
    id: "t003",
    group: "marketing",
    themeKey: "blacky",
    name: "Marketing / Copywriter",
    subtitle: "Text hero + projekty s odkazy + konverzní flow",
    sections: ["hd001", "h001", "sh001", "st002", "ab001", "ab002", "sv001", "ts001", "ct001"],
  },
  {
    id: "t004",
    group: "marketing",
    themeKey: "whitey",
    name: "Marketing / Copywriter (Light)",
    subtitle: "Stejná struktura v bílém designu",
    sections: ["hd001", "h001", "sh001", "st002", "ab001", "ab002", "sv001", "ts001", "ct001"],
  },

  // ===== GROUP: Finance / RE / Admin / Edu =====
  {
    id: "t005",
    group: "finance",
    themeKey: "blacky",
    name: "Finance / Real Estate",
    subtitle: "Důvěra přes čísla + detailní služby",
    sections: ["hd001", "h001", "st002", "sv002", "ab001", "ab002", "ts001", "ct001"],
  },
  {
    id: "t006",
    group: "finance",
    themeKey: "whitey",
    name: "Finance / Real Estate (Light)",
    subtitle: "Stejná struktura v bílém designu",
    sections: ["hd001", "h001", "st002", "sv002", "ab001", "ab002", "ts001", "ct001"],
  },
];


/* =========================================================
   Themes (DesignSystem)  ✅ camelCase runtime
========================================================= */

// updated onboarding theme presets (DB shape = snake_case)
// ✅ adds: inverse_surface, input, border

export const THEME_BLACKY = {
  body: "#d4d4d8",
  font: "system",
  heading: "#ffffff",

  primary: "#ffffff",
  primaryHover: "#e5e7eb",

  secondary: "#000000",
  secondaryHover: "#27272a",

  background: "#000000",
  surface: "#ffffff",

  // ✅ NEW
  inverseSurface: "#000000",
  input: "#0a0a0a",
  border: "#27272a",

  onPrimary: "#000000",
  onSurface: "#000000",
  onSecondary: "#ffffff",
  onBackground: "#ffffff",

  borderRadius: 16,
} as const;

export const THEME_WHITEY = {
  body: "#0a0a0a",
  font: "system",
  heading: "#0a0a0a",

  primary: "#0a0a0a",
  primaryHover: "#18181b",

  secondary: "#ffffff",
  secondaryHover: "#f4f4f5",

  background: "#ffffff",
  surface: "#0a0a0a",

  // ✅ NEW
  inverseSurface: "#0a0a0a",
  input: "#ffffff",
  border: "#e4e4e7",

  onPrimary: "#ffffff",
  onSurface: "#ffffff",
  onSecondary: "#0a0a0a",
  onSackground: "#0a0a0a",

  borderRadius: 16,
} as const;




function getThemeByKey(k: ThemeKey): DesignSystem {
  return k === "whitey" ? THEME_WHITEY : THEME_BLACKY;
}

/* =========================================================
   Helpers
========================================================= */

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function cloneObj<T>(v: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sc = (globalThis as any)?.structuredClone;
  if (typeof sc === "function") return sc(v);
  return JSON.parse(JSON.stringify(v));
}

function resolveModule(key: string) {
  const mods = listModules();

  let mod = mods.find((m: any) => m.id === key);
  if (!mod) mod = mods.find((m: any) => m.definition?.type === key);
  if (!mod) mod = getModuleByType(key) as any;

  return mod as any | undefined;
}

function buildBlocksFromTypes(templateId: string, keys: string[]): BlockInstance[] {
  return keys.map((key, idx) => {
    const mod = resolveModule(key);
    const def = mod?.definition as any;

    const blockType = def?.type ?? key;
    const version = Number(def?.version ?? 1);
    const defaultData = cloneObj(def?.defaultData ?? {});
    const title = def.title ?? "Untitled";

    return {
      id: `${templateId}-${idx}-${mod?.id ?? key}`,
      type: blockType,
      version,
      data: defaultData,
      title: title,
    } as BlockInstance;
  });
}

function resolveGroupFromPrimaryFocus(primaryFocus?: string): PresetGroup {
  const f = (primaryFocus || "").toLowerCase();

  // IT / design / visual creators
  if (
    f.includes("it") ||
    f.includes("vývoj") ||
    f.includes("vyvoj") ||
    f.includes("design") ||
    f.includes("grafika") ||
    f.includes("video") ||
    f.includes("foto") ||
    f.includes("fitness")
  ) {
    return "it_design";
  }

  // Marketing / growth / copy / consulting
  if (
    f.includes("marketing") ||
    f.includes("růst") ||
    f.includes("rust") ||
    f.includes("copy") ||
    f.includes("poraden")
  ) {
    return "marketing";
  }

  // Finance / admin / real estate / education
  if (
    f.includes("finance") ||
    f.includes("nemovit") ||
    f.includes("administr") ||
    f.includes("vzděl") ||
    f.includes("vzdel")
  ) {
    return "finance";
  }

  return "it_design";
}

type OnboardingTemplateStepProps = {
  payload?: {
    name?: string;
    primaryFocus?: string;
    service?: string;
    idealCustomer?: string;
    mainProblem?: string;
    avoidCustomer?: string;
    projectCount?: string;
    toneOfVoice?: string;
    brag?: string;
    websiteGoal?: string;
    externalUrl?: string;
  };

  templateId: string;
  setTemplateId: (id: string) => void;

  themeKey: ThemeKey;
  setThemeKey: (k: ThemeKey) => void;

  isGenerating?: boolean;

  /** ✅ nový: spustí generování okamžitě po výběru */
  onConfirmTemplate?: (templateId: string, themeKey: ThemeKey) => void;
};

function personalizeBlock(block: BlockInstance, payload?: OnboardingTemplateStepProps["payload"]) {
  if (!payload) return block;

  const name = (payload.name || "").trim();
  const focus = (payload.primaryFocus || "").trim();
  const problem = (payload.mainProblem || "").trim();

  const data: any = cloneObj(block.data ?? {});

  const setIfEmpty = (obj: any, key: string, val: string) => {
    if (!val) return;
    if (!obj || !Object.prototype.hasOwnProperty.call(obj, key)) return;

    const cur = obj[key];
    const isEmpty =
      cur === undefined ||
      cur === null ||
      (typeof cur === "string" && cur.trim() === "");

    if (isEmpty) obj[key] = val;
  };

  const headline = name ? `${name}${focus ? ` — ${focus}` : ""}` : "";

  setIfEmpty(data, "heading", headline);
  setIfEmpty(data, "title", headline);
  setIfEmpty(data, "subheading", problem);
  setIfEmpty(data, "subtitle", problem);

  if (data?.content && typeof data.content === "object") {
    if ("heading" in data.content) {
      const cur = data.content.heading;
      if (!cur || (typeof cur === "string" && cur.trim() === "")) data.content.heading = headline || cur;
    }
    if ("subheading" in data.content) {
      const cur = data.content.subheading;
      if ((!cur || (typeof cur === "string" && cur.trim() === "")) && problem) data.content.subheading = problem;
    }
  }

  return { ...block, data };
}

function BlocksCanvas({
  blocks,
  theme,
  pageBgClass,
}: {
  blocks: BlockInstance[];
  theme: DesignSystem;
  pageBgClass: string;
}) {
  return (
    <div className={cx("w-full min-h-full", pageBgClass)}>
      {blocks.map((blk) => {
        const def: any = (BlockRegistry as any)?.[blk.type];
        const modFallback = !def ? getModuleByType(blk.type) : null;
        const finalDef: any = def ?? modFallback?.definition;
        const Renderer = finalDef?.Renderer as React.ComponentType<any> | undefined;

        if (!Renderer) {
          return (
            <div
              key={blk.id}
              className="m-6 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-white/70"
            >
              Neznámá sekce: <b>{blk.type}</b>
            </div>
          );
        }

        return <Renderer key={blk.id} block={blk} theme={theme} />;
      })}
    </div>
  );
}

/* =========================================================
   Component
========================================================= */

export default function OnboardingTemplateStep({
  payload,
  templateId,
  setTemplateId,
  themeKey,
  setThemeKey,
  isGenerating = false,
  onConfirmTemplate,
}: OnboardingTemplateStepProps) {
  const cards = useMemo(() => {
    const recommendedGroup = resolveGroupFromPrimaryFocus(payload?.primaryFocus);
  
    const groupOrder: PresetGroup[] = [
      recommendedGroup,
      ...(["it_design", "marketing", "finance"] as PresetGroup[]).filter((g) => g !== recommendedGroup),
    ];
  
// ✅ zachovej páry: vždy blacky -> whitey (na střídačku) + držet páry pohromadě
const ordered = groupOrder.flatMap((g) => {
  const withinGroup = TEMPLATE_PRESETS.filter((p) => p.group === g);

  const getPairIndex = (id: string) => {
    // t001 -> 1, t002 -> 2 ... (nebo cokoli číselného)
    const n = Number(id.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? Math.floor((n - 1) / 2) : 9999;
  };

  return withinGroup.sort((a, b) => {
    const ap = getPairIndex(a.id);
    const bp = getPairIndex(b.id);
    if (ap !== bp) return ap - bp; // nejdřív pár (t001+t002), pak (t003+t004)...

    const at = a.themeKey === "blacky" ? 0 : 1;
    const bt = b.themeKey === "blacky" ? 0 : 1;
    if (at !== bt) return at - bt; // v rámci páru vždy blacky -> whitey

    return 0;
  });
});

  
    return ordered.map((p) => {
      const tk = p.themeKey;
      const theme = getThemeByKey(tk);
  
      const pageBgClass = tk === "whitey" ? "bg-white" : "bg-zinc-950";
      const iframeTheme = tk === "whitey" ? "light" : "dark";
  
      const baseBlocks = buildBlocksFromTypes(p.id, p.sections);
      const blocks = baseBlocks.map((b) => personalizeBlock(b, payload));
  
      return { ...p, blocks, theme, pageBgClass, iframeTheme };
    });
  }, [payload]);
  

  const [fullPreviewId, setFullPreviewId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  // ESC close
  useEffect(() => {
    if (!fullPreviewId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullPreviewId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullPreviewId]);

  // lock scroll while modal open
  useEffect(() => {
    if (!fullPreviewId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullPreviewId]);

  const confirmTemplate = (id: string, tk: ThemeKey) => {
    if (isGenerating) return;
    setTemplateId(id);
    setThemeKey(tk);
    onConfirmTemplate?.(id, tk);
  };

  const modalCard = useMemo(() => {
    if (!fullPreviewId) return null;
    return cards.find((c) => c.id === fullPreviewId) ?? null;
  }, [cards, fullPreviewId]);

  return (
    <div className="flex flex-col gap-10">
      {/* Title */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-center text-[40px] leading-[50px] font-medium text-white">
          Vyber si design
        </div>
        <div className="text-center text-sm font-light text-white/80">
          Klikni na „Vybrat design“ a stránka se začne generovat.
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((t) => {
          const isSelected = templateId === t.id;

          return (
            <div key={t.id} className="w-full">
              <div
                className={cx(
                  "group relative w-full overflow-hidden rounded-[28px] p-6 transition",
                  "bg-white/[0.06]",
                  isGenerating && "opacity-70"
                )}
              >
                <div className="relative w-full aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <div className="absolute inset-0">
                    <OnboardingPreviewIframeGrid
                      theme={t.iframeTheme}
                      designWidth={1440}
                      scale={0.85}
                      className="h-full w-full"
                      interactive={false}
                    >
                      <BlocksCanvas blocks={t.blocks} theme={t.theme} pageBgClass={t.pageBgClass} />
                    </OnboardingPreviewIframeGrid>
                  </div>

                  {/* Hover overlay */}
                  <div
                    className={cx(
                      "absolute inset-0 z-[20] flex items-center justify-center",
                      "opacity-100 pointer-events-auto",
                      "md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 rounded-2xl bg-black/55 backdrop-blur-md md:group-hover:pointer-events-auto",
                      "transition-opacity duration-200"
                    )}
                  >
                    <div className="absolute inset-0 transition-opacity duration-200  rounded-2xl" />

                    <div className="relative z-[30] flex items-center gap-3">
                      <motion.button
                        type="button"
                        whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                        onClick={() => confirmTemplate(t.id, t.themeKey)}
                        disabled={isGenerating}
                        className={cx(
                          "h-12 rounded-2xl px-6 text-[14px] cursor-pointer font-semibold transition",
                          "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                          isGenerating
                            ? "bg-white/30 text-white/70 cursor-not-allowed"
                            : isSelected
                            ? "bg-white text-black"
                            : "bg-white text-black hover:bg-white/90"
                        )}
                      >
                        {isGenerating ? "Generuji…" : "Vybrat design"}
                      </motion.button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                        onClick={() => !isGenerating && setFullPreviewId(t.id)}
                        disabled={isGenerating}
                        className={cx(
                          "h-12 w-12 rounded-2xl cursor-pointer grid place-items-center transition",
                          "border border-white/15 bg-white/10 text-white hover:bg-white/15",
                          "shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                          isGenerating && "opacity-60 cursor-not-allowed"
                        )}
                        aria-label="Full preview"
                        title="Full preview"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-white/15" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL PREVIEW MODAL (PORTAL) */}
      {isMounted &&
        createPortal(
          <AnimatePresence>
            {fullPreviewId && modalCard && (
              <motion.div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Backdrop */}
                <button
                  type="button"
                  aria-label="Close modal"
                  className="absolute inset-0 bg-black/70"
                  onClick={() => setFullPreviewId(null)}
                />

                {/* Dialog */}
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  className="relative z-[1] w-full max-w-[1300px] overflow-hidden rounded-3xl bg-black/30 backdrop-blur-xl ring-1 ring-white/10"
                  initial={{ opacity: 0, y: 10, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-4 px-6 py-5">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">
                        {modalCard.name ?? "Preview"}
                      </div>
                      <div className="mt-0.5 text-xs text-white/60">
                        Full preview • {modalCard.themeKey} • iframe scroll inside
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.button
                        type="button"
                        whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                        onClick={() => {
                          confirmTemplate(fullPreviewId, modalCard.themeKey);
                          setFullPreviewId(null);
                        }}
                        disabled={isGenerating}
                        className={cx(
                          "h-10 rounded-2xl px-5 text-xs font-semibold transition",
                          isGenerating
                            ? "bg-white/20 text-white/70 cursor-not-allowed border border-white/10"
                            : "bg-white text-black hover:bg-white/90"
                        )}
                      >
                        {isGenerating ? "Generuji…" : "Vybrat design"}
                      </motion.button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFullPreviewId(null)}
                        className="h-10 rounded-2xl border border-white/10 bg-white/5 px-5 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Zavřít
                      </motion.button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="h-[72vh] w-full overflow-hidden rounded-2xl bg-black/40">
                      <OnboardingPreviewIframeGrid
                        theme={modalCard.iframeTheme ?? "dark"}
                        scale={1}
                        className="h-full w-full"
                        interactive={true}
                      >
                        <BlocksCanvas
                          blocks={modalCard.blocks ?? []}
                          theme={modalCard.theme ?? THEME_BLACKY}
                          pageBgClass={modalCard.pageBgClass ?? "bg-zinc-950"}
                        />
                      </OnboardingPreviewIframeGrid>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <div className="hidden">
        selected: {templateId} / {themeKey}
      </div>
    </div>
  );
}
