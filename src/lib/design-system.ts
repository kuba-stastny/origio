// src/lib/design-system.ts
import type {
  DesignSystem,
  DesignSystemJson,
  SectionThemeOverride,
} from "@/types/design-system";

/**
 * Fallback theme (runtime = camelCase)
 */
export const FALLBACK_THEME: DesignSystem = {
  primary: "#ffffff",
  primaryHover: "#e5e7eb", // gray-200
  secondary: "#000000",
  secondaryHover: "#27272a", // zinc-800

  background: "#000000",
  surface: "#ffffff",

  // ✅ NEW
  inverseSurface: "#000000",
  input: "#ffffff",
  border: "#27272a", // zinc-800

  onPrimary: "#000000",
  onSecondary: "#ffffff",
  onBackground: "#ffffff",
  onSurface: "#000000",

  heading: "#ffffff",
  body: "#d4d4d8", // zinc-300

  borderRadius: 16,
  font: "system",
};

function isNonEmptyObject(v: any) {
  return !!v && typeof v === "object" && Object.keys(v).length > 0;
}

function isNonEmptyString(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v: any): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function toFiniteNumber(v: any): number | undefined {
  if (isFiniteNumber(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/**
 * DB JSON -> runtime DesignSystem (camelCase)
 *
 * Supports BOTH:
 * - snake_case keys (DB): on_primary, primary_hover, border_radius
 * - camelCase keys (runtime/old): onPrimary, primaryHover, borderRadius
 *
 * Rule: prefer snake_case, then camelCase, then fallback
 */
export function mapThemeJson(json?: DesignSystemJson | null): DesignSystem {
  if (!isNonEmptyObject(json)) return { ...FALLBACK_THEME };

  const j: any = json;

  const pick = (snake: string, camel: string, fb: string) => {
    const s = j[snake];
    if (isNonEmptyString(s)) return s;

    const c = j[camel];
    if (isNonEmptyString(c)) return c;

    return fb;
  };

  const pickNum = (snake: string, camel: string, fb: number) => {
    const s = toFiniteNumber(j[snake]);
    if (s !== undefined) return s;

    const c = toFiniteNumber(j[camel]);
    if (c !== undefined) return c;

    return fb;
  };

  return {
    primary: pick("primary", "primary", FALLBACK_THEME.primary),
    primaryHover: pick(
      "primary_hover",
      "primaryHover",
      FALLBACK_THEME.primaryHover
    ),

    secondary: pick("secondary", "secondary", FALLBACK_THEME.secondary),
    secondaryHover: pick(
      "secondary_hover",
      "secondaryHover",
      FALLBACK_THEME.secondaryHover
    ),

    background: pick("background", "background", FALLBACK_THEME.background),
    surface: pick("surface", "surface", FALLBACK_THEME.surface),

    // ✅ NEW
    inverseSurface: pick(
      "inverse_surface",
      "inverseSurface",
      FALLBACK_THEME.inverseSurface
    ),
    input: pick("input", "input", FALLBACK_THEME.input),
    border: pick("border", "border", FALLBACK_THEME.border),

    onPrimary: pick("on_primary", "onPrimary", FALLBACK_THEME.onPrimary),
    onSecondary: pick("on_secondary", "onSecondary", FALLBACK_THEME.onSecondary),
    onBackground: pick(
      "on_background",
      "onBackground",
      FALLBACK_THEME.onBackground
    ),
    onSurface: pick("on_surface", "onSurface", FALLBACK_THEME.onSurface),

    heading: pick("heading", "heading", FALLBACK_THEME.heading),
    body: pick("body", "body", FALLBACK_THEME.body),

    borderRadius: pickNum(
      "border_radius",
      "borderRadius",
      FALLBACK_THEME.borderRadius
    ),
    font: (isNonEmptyString(j.font) ? j.font : FALLBACK_THEME.font) as any,
  };
}

/**
 * runtime DesignSystem (camelCase) -> DB JSON (snake_case)
 */
export function designSystemToJson(theme: DesignSystem): DesignSystemJson {
  return {
    primary: theme.primary,
    primary_hover: theme.primaryHover,

    secondary: theme.secondary,
    secondary_hover: theme.secondaryHover,

    background: theme.background,
    surface: theme.surface,

    // ✅ NEW
    inverse_surface: theme.inverseSurface,
    input: theme.input,
    border: theme.border,

    on_primary: theme.onPrimary,
    on_secondary: theme.onSecondary,
    on_background: theme.onBackground,
    on_surface: theme.onSurface,

    heading: theme.heading,
    body: theme.body,

    border_radius: theme.borderRadius,
    font: theme.font,
  };
}

/**
 * Per-section override:
 * - merge global theme (as JSON) + override (JSON)
 * - map back to runtime DS
 *
 * Note: override is expected in DB JSON shape (snake_case),
 * but camelCase is still tolerated by mapThemeJson().
 */
export function resolveSectionTheme(
  globalTheme: DesignSystem,
  override?: SectionThemeOverride | null
): DesignSystem {
  if (!override || !isNonEmptyObject(override)) return globalTheme;

  const baseJson = designSystemToJson(globalTheme);
  const mergedJson: DesignSystemJson = { ...baseJson, ...(override as any) };

  return mapThemeJson(mergedJson);
}
