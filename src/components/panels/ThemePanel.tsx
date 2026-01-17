// src/components/panels/ThemePanel.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useBuilderStore } from "@/store/builder-store";
import { mapThemeJson } from "@/lib/design-system";

/* =========================
   Typy a defaulty (NEW schema)
========================= */

type ThemeDraft = {
  primary: string;
  primary_hover: string;
  secondary: string;
  secondary_hover: string;

  background: string;
  surface: string;

  // ✅ NEW
  inverse_surface: string;
  input: string;
  border: string;

  on_primary: string;
  on_secondary: string;
  on_background: string;
  on_surface: string;

  heading: string;
  body: string;

  border_radius: number;
  font: string;
};

const DEFAULT_THEME_DRAFT: ThemeDraft = {
  primary: "#ffffff",
  primary_hover: "#e5e7eb",
  secondary: "#000000",
  secondary_hover: "#27272a",

  background: "#000000",
  surface: "#ffffff",

  // ✅ NEW defaults (blacky-like)
  inverse_surface: "#000000",
  input: "#0a0a0a",
  border: "#27272a",

  on_primary: "#000000",
  on_secondary: "#ffffff",
  on_background: "#ffffff",
  on_surface: "#000000",

  heading: "#ffffff",
  body: "#d4d4d8",

  border_radius: 16,
  font: "system",
};

const RADIUS_OPTIONS: { id: string; label: string; value: number }[] = [
  { id: "none", label: "None", value: 0 },
  { id: "sm", label: "sm", value: 2 },
  { id: "md", label: "md", value: 6 },
  { id: "lg", label: "lg", value: 8 },
  { id: "xl", label: "xl", value: 12 },
  { id: "2xl", label: "2xl", value: 16 },
  { id: "3xl", label: "3xl", value: 24 },
];

const FONT_OPTIONS: { id: string; label: string }[] = [
  { id: "system", label: "System" },
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
  { id: "inter", label: "Inter" },
  { id: "manrope", label: "Manrope" },
  { id: "dm_sans", label: "DM Sans" },
  { id: "space_grotesk", label: "Space Grotesk" },
  { id: "poppins", label: "Poppins" },
  { id: "plus_jakarta", label: "Plus Jakarta Sans" },
  { id: "outfit", label: "Outfit" },
  { id: "playfair", label: "Playfair Display" },
  { id: "cormorant", label: "Cormorant Garamond" },
];

/* =========================
   Normalizace theme_json z API -> ThemeDraft
========================= */

function normalizeToDraft(raw: any): ThemeDraft {
  const base = DEFAULT_THEME_DRAFT;
  const root = raw ?? {};

  const pickStr = (k: keyof ThemeDraft) =>
    typeof root[k] === "string" ? (root[k] as string) : (base[k] as string);

  const border_radius =
    typeof root.border_radius === "number"
      ? root.border_radius
      : base.border_radius;

  const font = typeof root.font === "string" ? root.font : base.font;

  return {
    primary: pickStr("primary"),
    primary_hover: pickStr("primary_hover"),
    secondary: pickStr("secondary"),
    secondary_hover: pickStr("secondary_hover"),

    background: pickStr("background"),
    surface: pickStr("surface"),

    // ✅ NEW
    inverse_surface: pickStr("inverse_surface"),
    input: pickStr("input"),
    border: pickStr("border"),

    on_primary: pickStr("on_primary"),
    on_secondary: pickStr("on_secondary"),
    on_background: pickStr("on_background"),
    on_surface: pickStr("on_surface"),

    heading: pickStr("heading"),
    body: pickStr("body"),

    border_radius,
    font,
  };
}

/* =========================
   Komponenta
========================= */

export default function ThemePanel() {
  const { projectId } = useParams() as { projectId: string };

  const pageId =
    useBuilderStore((s: any) => s.currentPageId) ??
    useBuilderStore((s: any) => s.pageId) ??
    useBuilderStore((s: any) => s.page?.id) ??
    null;

  const setThemeRaw = useBuilderStore(
    (s: any) => (typeof s.setTheme === "function" ? s.setTheme : undefined)
  ) as ((t: any) => void) | undefined;

  const [saving, setSaving] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [draft, setDraft] = useState<ThemeDraft | null>(null);

  useEffect(() => {
    if (draft) return;

    let alive = true;

    async function init() {
      if (!projectId || !pageId) {
        if (!alive) return;
        const initial = DEFAULT_THEME_DRAFT;
        setDraft(initial);
        if (setThemeRaw) setThemeRaw(mapThemeJson(initial));
        return;
      }

      try {
        const res = await fetch(
          `/api/v1/projects/${projectId}/theme?pageId=${pageId}`,
          { method: "GET" }
        );
        const json = await res.json().catch(() => ({}));
        if (!alive) return;

        const raw = json?.theme_json ?? json?.theme ?? json ?? {};
        const themeDraft = normalizeToDraft(raw);

        setDraft(themeDraft);
        if (setThemeRaw) setThemeRaw(mapThemeJson(themeDraft));
      } catch (e) {
        console.error("❌ Chyba při načítání theme:", e);
        if (!alive) return;

        const fallback = DEFAULT_THEME_DRAFT;
        setDraft(fallback);
        if (setThemeRaw) setThemeRaw(mapThemeJson(fallback));
      }
    }

    void init();

    return () => {
      alive = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [draft, projectId, pageId, setThemeRaw]);

  const scheduleSave = useCallback(
    (next: ThemeDraft) => {
      if (!projectId || !pageId) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setSaving("busy");
          const res = await fetch(`/api/v1/projects/${projectId}/theme`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageId,
              theme_json: next,
            }),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || `HTTP ${res.status}`);
          }

          setSaving("ok");
          setTimeout(() => setSaving("idle"), 800);
        } catch (e) {
          console.error("❌ Chyba při ukládání theme:", e);
          setSaving("error");
          setTimeout(() => setSaving("idle"), 1500);
        }
      }, 600);
    },
    [projectId, pageId]
  );

  function update(patch: Partial<ThemeDraft>) {
    setDraft((prev) => {
      const base = prev ?? DEFAULT_THEME_DRAFT;
      return { ...base, ...patch };
    });
  }

  useEffect(() => {
    if (!draft) return;

    if (setThemeRaw) setThemeRaw(mapThemeJson(draft));
    scheduleSave(draft);
  }, [draft, setThemeRaw, scheduleSave]);

  if (!draft) {
    return (
      <div className="h-full bg-zinc-950 px-4 py-5 space-y-4">
        <div className="h-7 rounded-xl bg-zinc-800/60 animate-pulse" />
        <div className="h-7 rounded-xl bg-zinc-800/60 animate-pulse" />
        <div className="h-7 rounded-xl bg-zinc-800/60 animate-pulse" />
      </div>
    );
  }

  const colorRow = (id: string, label: string, key: keyof ThemeDraft) => (
    <div key={id} className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={String(draft[key])}
          onChange={(e) => update({ [key]: e.target.value } as any)}
          className="h-7 w-7 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900"
        />
        <input
          type="text"
          value={String(draft[key])}
          onChange={(e) => update({ [key]: e.target.value } as any)}
          className="w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
        />
      </div>
    </div>
  );

  const group = (title: string, children: React.ReactNode) => (
    <section className="space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="text-xs font-medium text-zinc-100">{title}</div>
      <div className="space-y-3">{children}</div>
    </section>
  );

  return (
    <div className="h-full bg-zinc-950 px-4 py-5 space-y-5 text-zinc-100">
      {/* Header */}
      <section className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
        <span className="font-medium text-zinc-100">Theme</span>
        <span>
          {saving === "busy" && "Saving…"}
          {saving === "ok" && "Saved"}
          {saving === "error" && "Error"}
          {saving === "idle" && ""}
        </span>
      </section>

      {/* Colors */}
      {group(
        "Colors",
        <>
          {colorRow("primary", "Primary", "primary")}
          {colorRow("primary_hover", "Primary hover", "primary_hover")}
          {colorRow("on_primary", "On primary", "on_primary")}

          <div className="h-px bg-zinc-800/70" />

          {colorRow("secondary", "Secondary", "secondary")}
          {colorRow("secondary_hover", "Secondary hover", "secondary_hover")}
          {colorRow("on_secondary", "On secondary", "on_secondary")}

          <div className="h-px bg-zinc-800/70" />

          {colorRow("background", "Background", "background")}
          {colorRow("on_background", "On background", "on_background")}

          <div className="h-px bg-zinc-800/70" />

          {colorRow("surface", "Surface", "surface")}
          {colorRow("on_surface", "On surface", "on_surface")}

          {/* ✅ NEW */}
          <div className="h-px bg-zinc-800/70" />
          {colorRow("inverse_surface", "Inverse surface", "inverse_surface")}
          {colorRow("input", "Input", "input")}
          {colorRow("border", "Border", "border")}

          <div className="h-px bg-zinc-800/70" />

          {colorRow("heading", "Heading", "heading")}
          {colorRow("body", "Body", "body")}
        </>
      )}

      {/* Radius */}
      <section className="space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium text-zinc-100">Radius</div>
          <div className="text-[11px] text-zinc-500">{draft.border_radius}px</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((opt) => {
            const active = draft.border_radius === opt.value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ border_radius: opt.value })}
                className={[
                  "rounded-full px-3 py-1.5 text-xs border transition",
                  active
                    ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                    : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Font */}
      <section className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="text-xs font-medium text-zinc-100">Font</div>

        <div className="grid grid-cols-1 gap-2">
          {FONT_OPTIONS.map((font) => {
            const active = draft.font === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => update({ font: font.id })}
                className={[
                  "w-full rounded-2xl border px-3 py-2 text-left text-xs transition",
                  active
                    ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                    : "border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
                ].join(" ")}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {font.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
