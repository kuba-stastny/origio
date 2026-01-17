// src/sections/header.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";
import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";

import { SectionShell } from "@/sections/ui/SectionShell";
import { Button } from "@/sections/ui/Button";
import { Text } from "@/sections/ui/Typography";

import {
  BsX,
  BsInstagram,
  BsFacebook,
  BsTwitter,
  BsLinkedin,
  BsYoutube,
  BsTiktok,
} from "react-icons/bs";
import { FaGripLines } from "react-icons/fa6";

import { linkProps, getSectionId, toHref, type LinkObject } from "@/lib/links";

/* =========================
   Types
========================= */

type NavItem = {
  label: string;
  href?: string | LinkObject;
};

type Cta = {
  label: string;
  href?: string | LinkObject;
};

type SocialItem = {
  platform?: string;
  href?: string | LinkObject;
};

/* =========================
   Social icon helpers
========================= */

function getSocialIcon(platform?: string) {
  switch (platform) {
    case "instagram":
      return BsInstagram;
    case "facebook":
      return BsFacebook;
    case "twitter":
      return BsTwitter;
    case "linkedin":
      return BsLinkedin;
    case "youtube":
      return BsYoutube;
    case "tiktok":
      return BsTiktok;
    default:
      return BsInstagram;
  }
}

function getSocialLabel(platform?: string) {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "twitter":
      return "X / Twitter";
    case "linkedin":
      return "LinkedIn";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    default:
      return "Social";
  }
}

/* =========================
   Default data
========================= */

export const HEADER_DEFAULT_DATA = {
  logo: {
    src: "https://app.origio.site/images/person.png",
    alt: "Avatar",
  },
  profile: {
    name: "Harrison Cole",
    status: "Available for work",
  },
  nav: [
    { label: "Projects", href: { mode: "section", value: "projects" } },
    { label: "Services", href: { mode: "section", value: "services" } },
    { label: "Reviews", href: { mode: "section", value: "reviews" } },
  ] as NavItem[],
  cta: {
    label: "Let's connect",
    href: { mode: "section", value: "contact" },
  } as Cta,
  socials: [] as SocialItem[],
};

/* =========================
   Tiny iframe-safe scroll (for PORTAL clicks)
   (SectionShell delegation doesn't see portal clicks)
========================= */

function prefersReducedMotion(doc: Document) {
  const win = doc.defaultView;
  if (!win) return false;
  return win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function findScrollTargetInDoc(doc: Document, sectionId: string) {
  const id = String(sectionId || "").trim();
  if (!id) return null;

  // exact id
  const byId = doc.getElementById(id) as HTMLElement | null;
  if (byId) return byId;

  // prefixed id used in builder: section-<id>
  const byPrefixedId = doc.getElementById(`section-${id}`) as HTMLElement | null;
  if (byPrefixedId) return byPrefixedId;

  // data-section-id fallback
  const byData = doc.querySelector(
    `[data-section-id="${CSS.escape(id)}"]`
  ) as HTMLElement | null;
  if (byData) return byData;

  const byDataPrefixed = doc.querySelector(
    `[data-section-id="${CSS.escape(`section-${id}`)}"]`
  ) as HTMLElement | null;

  return byDataPrefixed;
}

function getStickyOffsetPx(doc: Document): number {
  const header = doc.querySelector("[data-sticky-header]") as HTMLElement | null;
  if (!header) return 0;
  const h = Math.round(header.getBoundingClientRect().height || 0);
  return Math.min(240, Math.max(0, h));
}

function scrollToSectionInDoc(doc: Document, sectionId: string) {
  const win = doc.defaultView;
  if (!win) return;

  const target = findScrollTargetInDoc(doc, sectionId);
  if (!target) return;

  const offset = getStickyOffsetPx(doc);
  const behavior: ScrollBehavior = prefersReducedMotion(doc) ? "auto" : "smooth";

  const top = target.getBoundingClientRect().top + win.pageYOffset - offset;
  win.scrollTo({ top, behavior });
}

/* =========================
   Renderer
========================= */

type HeaderRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem; // from DevicePreview
};

function HeaderRenderer({ block, theme }: HeaderRendererProps) {
  const d: any = block.data || {};

  const logo = d.logo ?? HEADER_DEFAULT_DATA.logo;
  const profile = d.profile ?? HEADER_DEFAULT_DATA.profile;

  const nav: NavItem[] =
    Array.isArray(d.nav) && d.nav.length ? d.nav : HEADER_DEFAULT_DATA.nav;

  const cta: Cta = d.cta ?? HEADER_DEFAULT_DATA.cta;
  const socials: SocialItem[] = Array.isArray(d.socials)
    ? d.socials
    : HEADER_DEFAULT_DATA.socials;

  const resolvedTheme = theme ?? mapThemeJson(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  // NOTE: SectionShell je <section>, takže ref musí být HTMLElement
  const rootRef = useRef<HTMLElement | null>(null);

  // portal root inside preview document (iframe)
  useEffect(() => {
    if (!rootRef.current) return;

    const doc = rootRef.current.ownerDocument || document;
    const el = doc.createElement("div");
    doc.body.appendChild(el);
    setPortalEl(el);

    return () => {
      try {
        doc.body.removeChild(el);
      } catch {
        // ignore
      }
    };
  }, []);

  // lock scroll (within preview document)
  useEffect(() => {
    if (!mobileOpen || !rootRef.current) return;
    const doc = rootRef.current.ownerDocument || document;
    const prev = doc.body.style.overflow;
    doc.body.style.overflow = "hidden";
    return () => {
      doc.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const hasSocials = useMemo(() => {
    return socials.some((s) => {
      const href = toHref(s.href as any);
      return href && href !== "#";
    });
  }, [socials]);

  // click handler only for PORTAL (mobile overlay) links:
  const handlePortalNavClick = (href?: string | LinkObject) => {
    // zavřít menu hned
    setMobileOpen(false);

    const sectionId = getSectionId(href as any);
    if (!sectionId) return; // external/tel/mail - necháme browser

    // section scroll v tom správném documentu (iframe)
    const doc = rootRef.current?.ownerDocument || document;

    // necháme doběhnout close animaci/layout a pak scroll
    requestAnimationFrame(() => {
      scrollToSectionInDoc(doc, sectionId);
    });
  };

  // ✅ CLOSE MENU on ANY link click inside portal (even if someone forgets to add handler)
  useEffect(() => {
    if (!mobileOpen || !portalEl) return;
    const doc = portalEl.ownerDocument || document;

    const onClickCapture = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;

      // any <a href> or anything with data-link/data-section-link inside overlay
      const a = t.closest("a[href]") as HTMLAnchorElement | null;
      const carrier = t.closest("[data-link],[data-section-link]") as HTMLElement | null;

      if (a || carrier) {
        setMobileOpen(false);
      }
    };

    doc.addEventListener("click", onClickCapture, true);
    return () => doc.removeEventListener("click", onClickCapture, true);
  }, [mobileOpen, portalEl]);

  const mobileOverlay =
    portalEl &&
    createPortal(
      <div
        className={[
          "fixed inset-0 z-[9999] md:hidden",
          "bg-black/80 backdrop-blur-2xl transition-opacity duration-300",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        <div className="relative flex h-full flex-col px-4 pt-6 pb-10 text-white">
          {/* top row */}
          <div className="mb-10 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={logo?.src || ""}
                alt={logo?.alt || "Avatar"}
                draggable={false}
              />

              <div className="inline-flex flex-col items-start">
                <Text size="xl" weight="medium" tone="inherit">
                  {profile?.name || "Harrison Cole"}
                </Text>

                <div className="inline-flex items-center gap-1 rounded-lg">
                  <Text size="xs" weight="extralight" tone="inherit">
                    {profile?.status || "Available for work"}
                  </Text>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center"
              aria-label="Close menu"
            >
              <BsX className="h-8 w-8 text-white" />
            </button>
          </div>

          {/* center nav */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            {nav.map((item, i) => {
              const sectionId = getSectionId(item.href as any);
              const isSection = !!sectionId;

              return (
                <a
                  key={i}
                  {...(isSection
                    ? linkProps(item.href as any)
                    : { href: toHref(item.href as any) })}
                  onClick={(e) => {
                    // ✅ always close (even for external)
                    setMobileOpen(false);

                    if (isSection) {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePortalNavClick(item.href);
                      return;
                    }
                  }}
                  className="inline-flex"
                >
                  <Text size="md" weight="light" tone="inherit">
                    {item.label || `Item ${i + 1}`}
                  </Text>
                </a>
              );
            })}
          </div>

          {/* bottom CTA + socials */}
          <div className="mt-6">
            {(() => {
              const sectionId = getSectionId(cta.href as any);
              const isSection = !!sectionId;

              return (
                <a
                  {...(isSection
                    ? linkProps(cta.href as any)
                    : { href: toHref(cta.href as any) })}
                  onClick={(e) => {
                    // ✅ always close (even for external)
                    setMobileOpen(false);

                    if (isSection) {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePortalNavClick(cta.href);
                      return;
                    }
                  }}
                  className="block"
                >
                  <Button variant="primary" className="w-full">
                    {cta?.label || "Let's connect"}
                  </Button>
                </a>
              );
            })()}

            {hasSocials && (
              <div className="mt-6 flex items-center justify-center gap-6">
                {socials.map((social, i) => {
                  const href = toHref(social.href as any);
                  if (!social.platform || !href || href === "#") return null;

                  const Icon = getSocialIcon(social.platform);
                  const label = getSocialLabel(social.platform);

                  return (
                    <a
                      key={i}
                      href={href}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5"
                      aria-label={label}
                      onClick={() => setMobileOpen(false)} // ✅ close on social click
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>,
      portalEl
    );

  return (
    <SectionShell
      theme={resolvedTheme}
      className="p-0! text-[var(--ds-on-bg)]"
      ref={rootRef as any}
    >
      {/* FIXED bar */}
      <div className="fixed left-0 top-0 z-[300] w-full" data-sticky-header>
        {/* gradient strip */}
        <div className="w-full bg-gradient-to-b from-[var(--ds-bg)] to-[var(--ds-bg)]/80">
          <div className="mx-auto w-full max-w-[1500px] px-0 lg:px-20">
            <div className="inline-flex w-full items-center justify-between py-6">
              {/* Left */}
              <div className="flex items-center gap-4 text-[var(--ds-on-bg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={logo?.src || ""}
                  alt={logo?.alt || "Avatar"}
                  draggable={false}
                />

                <div className="inline-flex flex-col items-start">
                  <Text size="xl" weight="medium" tone="inherit">
                    {profile?.name || "Harrison Cole"}
                  </Text>

                  <div className="inline-flex items-center gap-1 rounded-lg">
                    <Text size="xs" weight="extralight" tone="inherit">
                      {profile?.status || "Available for work"}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Center nav */}
              <nav
                className="hidden items-center gap-10 text-[var(--ds-on-bg)] md:flex"
                aria-label="Primary navigation"
              >
                {nav.map((item, i) => (
                  <a
                    key={i}
                    {...linkProps(item.href as any)}
                    className="inline-flex transition-opacity hover:opacity-80"
                  >
                    <Text size="md" weight="light" tone="inherit" align="center">
                      {item.label || `Item ${i + 1}`}
                    </Text>
                  </a>
                ))}
              </nav>

              {/* Right */}
              <div className="flex items-center gap-3">
                <a {...linkProps(cta.href as any)} className="hidden md:inline-flex">
                  <Button variant="primary" className="rounded-2xl">
                    {cta?.label || "Let's connect"}
                  </Button>
                </a>

                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center text-[var(--ds-on-bg)] md:hidden"
                  aria-label="Open menu"
                >
                  <FaGripLines className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* spacer so content isn't hidden under fixed header */}
      <div className="h-[96px]" />
      {mobileOverlay}
    </SectionShell>
  );
}

/* =========================
   Schema
========================= */

export const HEADER_SCHEMA = [
  {
    type: "group",
    label: "Avatar",
    children: [{ type: "image", path: "logo", label: "Avatar image" }],
  },
  {
    type: "group",
    label: "Profile",
    children: [
      { type: "text", path: "profile.name", label: "Name", maxLength: 60 },
      {
        type: "text",
        path: "profile.status",
        label: "Status",
        multiline: true,
        rows: 2,
        maxLength: 120,
      },
    ],
  },
  {
    type: "repeater",
    label: "Navigation",
    path: "nav",
    emptyHint: "Add first nav item",
    children: [
      { type: "text", path: "label", label: "Label", maxLength: 32 },
      { type: "link", path: "href", label: "Link" },
    ],
  },
  {
    type: "group",
    label: "CTA button",
    children: [
      { type: "text", path: "cta.label", label: "Label", maxLength: 32 },
      { type: "link", path: "cta.href", label: "Link" },
    ],
  },
  {
    type: "repeater",
    label: "Socials",
    path: "socials",
    emptyHint: "Add first link",
    children: [
      {
        type: "select",
        path: "platform",
        label: "Platform",
        options: [
          { value: "instagram", label: "Instagram" },
          { value: "facebook", label: "Facebook" },
          { value: "twitter", label: "X / Twitter" },
          { value: "linkedin", label: "LinkedIn" },
          { value: "youtube", label: "YouTube" },
          { value: "tiktok", label: "TikTok" },
        ],
      },
      { type: "link", path: "href", label: "URL" },
    ],
  },
] as const;

/* =========================
   Editor component
========================= */

function HeaderEditor() {
  return (
    <div className="p-3 text-xs text-zinc-400">
      (Use the right panel to edit items.)
    </div>
  );
}

/* =========================
   SectionModule
========================= */

const hd001: SectionModule = {
  id: "hd001",
  definition: {
    type: "header",
    title: "Header",
    version: 5,
    defaultData: HEADER_DEFAULT_DATA,
    Renderer: HeaderRenderer,
    editor: {
      schema: HEADER_SCHEMA,
      title: "Edit Header",
      modelPath: "data",
    },
  },
  Editor: HeaderEditor,
  meta: {
    category: "header",
    previewImage: null,
  },
};

export default hd001;
