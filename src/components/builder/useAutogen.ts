// src/components/builder/useAutogen.ts
"use client";

import { useBuilderStore } from "@/store/builder-store";
import { nanoid } from "@/utils/ids";
import { BlockRegistry } from "@/components/builder/BlockRegistry";
import type { DesignSystem } from "@/types/design-system";

/**
 * Autogen hook
 * - POST /api/v1/projects/:projectId/autogen
 * - ukládá pageId + sections + theme do builder store (ATOMICKY)
 * - animuje progress + phase
 */

export type ThemeKey = "blacky" | "whitey";

export type OnboardingV1 = {
  // Step 1
  name?: string;
  primaryFocus?: string;

  // Step 2
  idealCustomer?: string;
  mainProblem?: string;
  avoidCustomer?: string;

  // Step 3
  projectCount?: string;
  toneOfVoice?: string;
  brag?: string;

  // Step 4
  websiteGoal?: string;

  // Step 5
  templateId?: string;
};

type Definitions = Record<
  string,
  { version: number; defaultData: any; title?: string }
>;

function assertTheme(theme: any): asserts theme is DesignSystem {
  if (!theme || typeof theme !== "object") {
    throw new Error("Autogen nevrátil theme (DesignSystem).");
  }

  const must = (k: string) => {
    if (typeof theme[k] !== "string" || theme[k].trim() === "") {
      throw new Error(`Theme je nekompletní – chybí "${k}".`);
    }
  };

  // Bez fallbacků: vyžadujeme vše
  must("primary");
  must("primaryHover");
  must("secondary");
  must("secondaryHover");
  must("background");
  must("surface");
  must("inverseSurface");
  must("input");
  must("border");
  must("onPrimary");
  must("onSecondary");
  must("onBackground");
  must("onSurface");
  must("heading");
  must("body");
  must("font");

  if (typeof theme.borderRadius !== "number") {
    throw new Error(`Theme je nekompletní – "borderRadius" musí být number.`);
  }
}

export function useAutogen(_workspaceId: string, projectId: string) {
  const setGenerating = useBuilderStore((s) => s.setPageGenerating);
  const setProgress = useBuilderStore((s) => s.setPageProgress);
  const setPhase = useBuilderStore((s) => s.setPagePhase);
  const resetProgress = useBuilderStore((s) => s.resetProgress);

  // ✅ nový atomický setter ze store
  const loadInitialFull = useBuilderStore((s) => s.loadInitialFull);

  async function run(payload: {
    onboarding: OnboardingV1;
    templateId?: string | null;
    themeKey?: ThemeKey | null;
    forcedSections?: string[] | null; // FIXNÍ pořadí typů sekcí
    language?: "cs" | "en";
    maxSections?: number;
    persona?: string | null; // optional legacy meta
    version?: number; // optional
  }): Promise<{ ok: boolean; pageId?: string }> {
    if (!projectId) throw new Error("Missing projectId");

    setGenerating(true);
    setProgress(0.06);
    setPhase("Přemýšlím…");

    const PHASES = [
      "Přemýšlím…",
      "Navrhuji strukturu…",
      "Generuji texty…",
      "Optimalizuji…",
    ] as const;

    const TARGETS = [0.28, 0.56, 0.82, 0.92] as const;

    const T1 = 1600; // -> Navrhuji strukturu…
    const T2 = 3200; // -> Generuji texty…
    const T3 = 5200; // -> Optimalizuji…

    let currentTarget = TARGETS[0];
    let p = 0.06;

    const progressTimer = window.setInterval(() => {
      const alpha = 0.14;
      p = p + (currentTarget - p) * alpha;
      if (Math.abs(currentTarget - p) < 0.002) p = currentTarget;
      setProgress(Number(p.toFixed(3)));
    }, 120);

    const t1 = window.setTimeout(() => {
      setPhase(PHASES[1]);
      currentTarget = TARGETS[1];
    }, T1);

    const t2 = window.setTimeout(() => {
      setPhase(PHASES[2]);
      currentTarget = TARGETS[2];
    }, T2);

    const t3 = window.setTimeout(() => {
      setPhase(PHASES[3]);
      currentTarget = TARGETS[3];
    }, T3);

    // ---- připrav definitions, které server potřebuje (bez Rendererů) ----
    const availableTypes = Object.keys(BlockRegistry);

    const definitions: Definitions = {};
    for (const key of availableTypes) {
      const def: any = (BlockRegistry as any)[key];

      const title =
        def?.title ??
        def?.definition?.title ??
        def?.meta?.title ??
        undefined;

      definitions[key] = {
        version: def?.version ?? 1,
        defaultData: def?.defaultData ?? {},
        title: title || key, // fallback jen pro title, ne pro theme
      };
    }

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/autogen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: payload.language ?? "cs",
          definitions,
          maxSections: payload.maxSections ?? 10,

          onboarding: payload.onboarding,

          templateId: payload.templateId ?? payload.onboarding?.templateId ?? null,
          themeKey: payload.themeKey ?? null,

          forcedSections: Array.isArray(payload.forcedSections)
            ? payload.forcedSections
            : null,

          persona: payload.persona ?? null,
          version: payload.version ?? 1,
        }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        throw new Error(json?.error || "Chyba generování");
      }

      const returnedPageId: string | undefined = json?.pageId
        ? String(json.pageId)
        : undefined;

      if (!returnedPageId) {
        throw new Error("Autogen nevrátil pageId.");
      }

      const sections = Array.isArray(json?.sections) ? json.sections : [];
      const theme = json?.theme;

      // ✅ Bez fallbacků: theme musí existovat a být kompletní
      assertTheme(theme);

      // ✅ dorovnej id + title
      sections.forEach((s: any) => {
        if (!s.id) s.id = nanoid();
        if (!s.title && s.type && definitions[s.type]?.title) {
          s.title = definitions[s.type]?.title;
        }
      });

      // ✅ ATOMICKY: pageId + sections + theme v jednom kroku (žádný flash)
      loadInitialFull(returnedPageId, sections, theme);

      setPhase("Dokončuji…");
      currentTarget = 0.95;

      window.setTimeout(() => {
        currentTarget = 1.0;
      }, 450);

      window.setTimeout(() => {
        window.clearInterval(progressTimer);
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
        resetProgress();
      }, 1000);

      return { ok: true, pageId: returnedPageId };
    } catch (e) {
      window.clearInterval(progressTimer);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);

      setPhase("Něco se pokazilo");
      window.setTimeout(() => {
        resetProgress();
      }, 600);

      throw e;
    } finally {
      setGenerating(false);
    }
  }

  return { run };
}
