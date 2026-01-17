// src/lib/links.ts
"use client";

export type LinkObject = {
  mode: "external" | "phone" | "email" | "section";
  value: string;
};

export type AnyLink = string | LinkObject | undefined | null;

function isHashSection(raw: string) {
  return raw.startsWith("#") && raw.length > 1;
}

function normalizePhone(v: string) {
  return v.replace(/\s+/g, "");
}

export function getSectionId(link: AnyLink): string | null {
  if (!link) return null;

  // legacy: "#contact"
  if (typeof link === "string") {
    if (isHashSection(link)) return link.slice(1);
    return null;
  }

  // new: { mode:"section", value:"contact" }
  if (link.mode === "section" && link.value) return link.value;

  return null;
}

export function toHref(link: AnyLink): string {
  if (!link) return "#";

  if (typeof link === "string") {
    // IMPORTANT: hash string bereme jako "section", ne jako href
    if (isHashSection(link)) return "#";
    return link || "#";
  }

  if (link.mode === "section") return "#";
  if (link.mode === "phone") return link.value ? `tel:${normalizePhone(link.value)}` : "#";
  if (link.mode === "email") return link.value ? `mailto:${link.value}` : "#";

  return link.value || "#";
}

/**
 * Použij na <a {...linkProps(href)} />
 * - section => href="#" + data-section-link="id"
 * - ostatní => href normal
 */
export function linkProps(link: AnyLink) {
  const sectionId = getSectionId(link);

  if (sectionId) {
    return {
      href: "#",
      "data-section-link": sectionId,
    } as const;
  }

  return {
    href: toHref(link),
  } as const;
}
