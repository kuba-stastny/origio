// src/sections/ui/SectionShell.tsx
"use client";

import React, { forwardRef, useCallback, useMemo, type ReactNode } from "react";
import type { DesignSystem } from "@/types/design-system";
import { cn } from "./cn";

/* =========================
   Font map z theme.font -> CSS stack
========================= */

const FONT_FAMILIES: Record<string, string> = {
  manrope: '"Manrope", sans-serif',
  inter: '"Inter", sans-serif',
  dm_sans: '"DM Sans", sans-serif',
  space_grotesk: '"Space Grotesk", sans-serif',
  poppins: '"Poppins", sans-serif',
  plus_jakarta: '"Plus Jakarta Sans", sans-serif',
  outfit: '"Outfit", sans-serif',
  playfair: '"Playfair Display", serif',
  cormorant: '"Cormorant Garamond", serif',
  system:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  sans:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", "Times", serif',
  mono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

/* =========================
   Smooth scroll (iframe + scroll container safe)
========================= */

type LinkValue = {
  mode: "external" | "phone" | "email" | "section";
  value: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function parseLinkFromDataset(el: HTMLElement): LinkValue | null {
  const direct = el.getAttribute("data-section-link");
  if (direct) return { mode: "section", value: direct };

  const raw = el.getAttribute("data-link");
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);
    if (obj?.mode === "section" && typeof obj.value === "string") {
      return { mode: "section", value: obj.value };
    }
    return null;
  } catch {
    return null;
  }
}

function parseHashHref(href: string | null | undefined): string | null {
  if (!href) return null;

  // podporujeme "#id" i "/cokoliv#id"
  const idx = href.indexOf("#");
  if (idx === -1) return null;

  const id = href.slice(idx + 1).trim();
  return id ? id : null;
}

function findTarget(doc: Document, id: string) {
  const safe = id.trim();
  if (!safe) return null;

  // 1) přesný id
  const direct = doc.getElementById(safe) as HTMLElement | null;
  if (direct) return direct;

  // 2) tvoje reálné id v DOM: "section-<id>"
  const prefixed = doc.getElementById(`section-${safe}`) as HTMLElement | null;
  if (prefixed) return prefixed;

  // 3) fallback přes data-section-id (kdybys někde měl)
  const byData = doc.querySelector(
    `[data-section-id="${CSS.escape(safe)}"]`
  ) as HTMLElement | null;
  if (byData) return byData;

  // 4) fallback pro případ, že by data-section-id bylo taky s prefixem
  const byDataPref = doc.querySelector(
    `[data-section-id="${CSS.escape(`section-${safe}`)}"]`
  ) as HTMLElement | null;
  if (byDataPref) return byDataPref;

  return null;
}

function prefersReducedMotion(win: Window) {
  return win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function getStickyOffset(doc: Document) {
  const header = doc.querySelector("[data-sticky-header]") as HTMLElement | null;
  if (!header) return 0;
  return clamp(Math.round(header.getBoundingClientRect().height || 0), 0, 240);
}

function isScrollable(el: HTMLElement) {
  const st = el.scrollHeight;
  const ch = el.clientHeight;
  if (st <= ch + 1) return false;

  const css = el.ownerDocument.defaultView?.getComputedStyle(el);
  const oy = css?.overflowY;
  return oy === "auto" || oy === "scroll" || oy === "overlay";
}

function findScrollRoot(doc: Document): HTMLElement {
  const se = doc.scrollingElement as HTMLElement | null;
  if (se && se.scrollHeight > se.clientHeight + 1) return se;

  const canvas = doc.querySelector(
    "#builder-canvas,[data-builder-canvas], #public-canvas"
  ) as HTMLElement | null;
  if (canvas && isScrollable(canvas)) return canvas;

  return (doc.body as any) || (doc.documentElement as any);
}

function scrollToSection(doc: Document, sectionId: string) {
  const win = doc.defaultView;
  if (!win) return false;

  const target = findTarget(doc, sectionId);
  if (!target) return false;

  const scrollRoot = findScrollRoot(doc);
  const offset = getStickyOffset(doc);
  const behavior: ScrollBehavior = prefersReducedMotion(win) ? "auto" : "smooth";

  const rootIsDoc =
    scrollRoot === doc.documentElement ||
    scrollRoot === doc.body ||
    scrollRoot === (doc.scrollingElement as any);

  if (rootIsDoc) {
    const top = target.getBoundingClientRect().top + win.pageYOffset - offset;
    win.scrollTo({ top, behavior });
    return true;
  }

  const rootRect = scrollRoot.getBoundingClientRect();
  const tgtRect = target.getBoundingClientRect();
  const top = tgtRect.top - rootRect.top + scrollRoot.scrollTop - offset;

  scrollRoot.scrollTo({ top, behavior });
  return true;
}

/* =========================
   Props
========================= */

type Props = {
  theme: DesignSystem;
  children: ReactNode;
  className?: string;
};

/* =========================
   SectionShell
========================= */

export const SectionShell = forwardRef<HTMLElement, Props>(function SectionShell(
  { theme, children, className }: Props,
  ref
) {
  const effectiveTheme = useMemo<DesignSystem>(() => ({ ...theme }), [theme]);

  const style = useMemo(
    () =>
      ({
        "--ds-primary": effectiveTheme.primary,
        "--ds-primary-hover": effectiveTheme.primaryHover,
        "--ds-secondary": effectiveTheme.secondary,
        "--ds-secondary-hover": effectiveTheme.secondaryHover,

        "--ds-bg": effectiveTheme.background,
        "--ds-surface": effectiveTheme.surface,

        // ✅ NEW CSS variables
        "--ds-inverse-surface": effectiveTheme.inverseSurface,
        "--ds-input": effectiveTheme.input,
        "--ds-border": effectiveTheme.border,

        "--ds-on-primary": effectiveTheme.onPrimary,
        "--ds-on-secondary": effectiveTheme.onSecondary,
        "--ds-on-bg": effectiveTheme.onBackground,
        "--ds-on-surface": effectiveTheme.onSurface,

        "--ds-heading": effectiveTheme.heading,
        "--ds-body": effectiveTheme.body,

        "--ds-radius": `${effectiveTheme.borderRadius ?? 16}px`,

        fontFamily:
          FONT_FAMILIES[effectiveTheme.font ?? "system"] ??
          FONT_FAMILIES.system,
      } as React.CSSProperties),
    [effectiveTheme]
  );

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const carrier =
      (target.closest("[data-section-link],[data-link]") as HTMLElement | null) ??
      null;

    let sectionId: string | null = null;

    if (carrier) {
      const link = parseLinkFromDataset(carrier);
      if (link?.mode === "section" && link.value) sectionId = link.value;
    }

    if (!sectionId) {
      const a = target.closest("a[href]") as HTMLAnchorElement | null;
      const id = parseHashHref(a?.getAttribute("href"));
      if (id) sectionId = id;
    }

    if (!sectionId) return;

    e.preventDefault();
    e.stopPropagation();

    const doc = (carrier ?? target).ownerDocument || document;

    const start = performance.now();
    const timeoutMs = 1200;

    const tryScroll = () => {
      const ok = scrollToSection(doc, sectionId!);
      if (ok) return;
      if (performance.now() - start < timeoutMs) {
        doc.defaultView?.requestAnimationFrame(tryScroll);
      }
    };

    tryScroll();
  }, []);

  return (
    <section
      ref={ref}
      style={style}
      onClickCapture={onClickCapture}
      className={cn(
        "relative bg-[var(--ds-bg)] text-[var(--ds-on-bg)]",
        "px-4 py-10 md:px-20 md:py-18",
        className
      )}
    >
      {children}
    </section>
  );
});
