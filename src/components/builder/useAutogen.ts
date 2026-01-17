// src/components/builder/useAutogen.ts
"use client";

import { useBuilderStore } from "@/store/builder-store";
import { nanoid } from "@/utils/ids";
import { BlockRegistry } from "@/components/builder/BlockRegistry";

/**
 * Autogen hook
 * - POST /api/v1/projects/:projectId/autogen
 * - ukládá pageId + sections do builder store
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

type Definitions = Record<string, { version: number; defaultData: any; title?: string }>;

export function useAutogen(_workspaceId: string, projectId: string) {
  const setGenerating = useBuilderStore((s) => s.setPageGenerating);
  const setProgress = useBuilderStore((s) => s.setPageProgress);
  const setPhase = useBuilderStore((s) => s.setPagePhase);
  const replaceSections = useBuilderStore((s) => s.replaceSections);
  const resetProgress = useBuilderStore((s) => s.resetProgress);
  const setPageId = useBuilderStore((s) => s.setPageId);

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

      // title může být buď přímo na definici, nebo uvnitř definition (podle toho jak to máš zorganizované)
      const title =
        def?.title ??
        def?.definition?.title ??
        def?.meta?.title ??
        undefined;

      definitions[key] = {
        version: def?.version ?? 1,
        defaultData: def?.defaultData ?? {},
        title: title || key, // ✅ fallback
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

          // NEW: onboarding payload (server z toho skládá brief)
          onboarding: payload.onboarding,

          // NEW: template + theme
          templateId: payload.templateId ?? payload.onboarding?.templateId ?? null,
          themeKey: payload.themeKey ?? null,

          // NEW: fixní sekce (pořadí)
          forcedSections: Array.isArray(payload.forcedSections)
            ? payload.forcedSections
            : null,

          // optional meta
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

      const sections = Array.isArray(json?.sections) ? json.sections : [];

      // ✅ dorovnej id + (kdyby server neposlal title, dopočti z definitions)
      sections.forEach((s: any) => {
        if (!s.id) s.id = nanoid();

        if (!s.title && s.type && definitions[s.type]?.title) {
          s.title = definitions[s.type]?.title;
        }
      });

      // >>> DŮLEŽITÉ: propsat do store
      if (returnedPageId) setPageId(returnedPageId);
      replaceSections(sections);

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
