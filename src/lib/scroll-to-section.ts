// src/lib/scroll-to-section.ts
"use client";

export type LinkValue = {
  mode: "external" | "phone" | "email" | "section";
  value: string;
};

type ScrollOptions = {
  /** např. výška sticky headeru */
  offset?: number;
  /** default: "smooth" (automaticky přepne na "auto" při prefers-reduced-motion) */
  behavior?: ScrollBehavior;
  /** default: 1200ms */
  timeoutMs?: number;
  /** když používáš prefix na id v DOM (např. "sec-hero"), nastav tady */
  idPrefix?: string;
  /** fallback: zkusí najít element i přes [data-section-id="..."] */
  enableDataAttrFallback?: boolean;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function getTargetEl(sectionId: string, opts: ScrollOptions) {
  const doc = document;

  const directId = sectionId;
  const prefixedId = opts.idPrefix ? `${opts.idPrefix}${sectionId}` : null;

  return (
    doc.getElementById(directId) ||
    (prefixedId ? doc.getElementById(prefixedId) : null) ||
    (opts.enableDataAttrFallback
      ? (doc.querySelector(`[data-section-id="${CSS.escape(sectionId)}"]`) as HTMLElement | null)
      : null)
  );
}

/** Smooth scroll na element s id (bez použití # v URL) */
export function scrollToSection(sectionId: string, opts: ScrollOptions = {}) {
  if (typeof window === "undefined") return false;
  if (!sectionId) return false;

  const offset = opts.offset ?? 0;
  const behavior: ScrollBehavior =
    prefersReducedMotion() ? "auto" : opts.behavior ?? "smooth";

  const el = getTargetEl(sectionId, opts);
  if (!el) return false;

  // scroll s offsetem (scrollIntoView offset neumí)
  const top =
    el.getBoundingClientRect().top + window.pageYOffset - Math.max(0, offset);

  window.scrollTo({ top, behavior });
  return true;
}

/**
 * Univerzální click handler pro LinkValue:
 * - section: preventDefault + smooth scroll
 * - phone/email/external: nechá default nebo otevře okno pro external
 */
export function handleLinkClick(
  e: React.MouseEvent<HTMLElement> | MouseEvent,
  link: LinkValue | string | undefined | null,
  opts: ScrollOptions = {}
) {
  if (!link) return;

  // kdyby někde přišel string (legacy)
  if (typeof link === "string") return;

  if (link.mode !== "section") return;

  // section: žádné #, jen scroll
  e.preventDefault?.();
  e.stopPropagation?.();

  // pokud se sekce ještě renderuje (např. po state update), zkusíme párkrát počkat
  const timeoutMs = opts.timeoutMs ?? 1200;
  const started = performance.now();

  const tryScroll = () => {
    const ok = scrollToSection(link.value, opts);
    if (ok) return;

    if (performance.now() - started < timeoutMs) {
      requestAnimationFrame(tryScroll);
    }
  };

  tryScroll();
}

/** Helper pro render href (pro non-section typy) */
export function linkToHref(link: LinkValue | string | undefined | null) {
  if (!link) return "#";
  if (typeof link === "string") return link || "#";

  const v = link.value || "";
  if (link.mode === "phone") return v ? `tel:${v}` : "#";
  if (link.mode === "email") return v ? `mailto:${v}` : "#";
  if (link.mode === "external") return v || "#";

  // section nechceme přes #
  return "#";
}
