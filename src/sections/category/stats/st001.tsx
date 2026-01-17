// src/sections/logo-loop.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SectionModule } from "../../types";
import type { BlockInstance } from "@/types/builder";

import { SectionShell } from "@/sections/ui/SectionShell";
import type { DesignSystem } from "@/types/design-system";
import { mapThemeJson } from "@/lib/design-system";
import PreviewImage from "../../previews/st001.png";

/* =========================================================
   Typy LogoLoop
========================================================= */
export type LogoItem =
  | {
      node: React.ReactNode;
      href?: string;
      title?: string;
      ariaLabel?: string;
    }
  | {
      src: string;
      alt?: string;
      href?: string;
      title?: string;
      srcSet?: string;
      sizes?: string;
      width?: number;
      height?: number;
    };

export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right";
  width?: number | string;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

/* =========================================================
   Pomocné konstanty / util
========================================================= */
const ANIMATION_CONFIG = {
  SMOOTH_TAU: 0.25,
  MIN_COPIES: 2,
  COPY_HEADROOM: 2,
} as const;

const toCssLength = (v?: number | string) =>
  typeof v === "number" ? `${v}px` : v ?? undefined;

const cx = (...p: Array<string | false | null | undefined>) =>
  p.filter(Boolean).join(" ");

/* =========================================================
   Hooky pro animaci / image load / resize
========================================================= */
const useResizeObserver = (
  callback: () => void,
  elements: Array<React.RefObject<Element | null>>,
  dependencies: React.DependencyList
) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("ResizeObserver" in window)) {
      const handleResize = () => callback();
      window.addEventListener("resize", handleResize);
      callback();
      return () => window.removeEventListener("resize", handleResize);
    }

    const observers = elements.map((ref) => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });

    callback();
    return () => observers.forEach((o) => o?.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

const useImageLoader = (
  seqRef: React.RefObject<HTMLUListElement | null>,
  onLoad: () => void,
  dependencies: React.DependencyList
) => {
  useEffect(() => {
    const images = seqRef.current?.querySelectorAll("img") ?? [];
    if (images.length === 0) {
      onLoad();
      return;
    }

    let left = images.length;
    const done = () => {
      left -= 1;
      if (left === 0) onLoad();
    };

    images.forEach((img) => {
      const el = img as HTMLImageElement;
      if (el.complete) {
        done();
      } else {
        el.addEventListener("load", done, { once: true });
        el.addEventListener("error", done, { once: true });
      }
    });

    return () =>
      images.forEach((img) => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

const useAnimationLoop = (
  trackRef: React.RefObject<HTMLDivElement | null>,
  targetVelocity: number,
  seqWidth: number,
  isHovered: boolean,
  pauseOnHover: boolean
) => {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const velRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (seqWidth > 0) {
      offsetRef.current = ((offsetRef.current % seqWidth) + seqWidth) % seqWidth;
      track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
    }

    if (prefersReduced) {
      track.style.transform = "translate3d(0,0,0)";
      return () => {
        lastRef.current = null;
      };
    }

    const animate = (ts: number) => {
      if (lastRef.current === null) lastRef.current = ts;
      const dt = Math.max(0, ts - lastRef.current) / 1000;
      lastRef.current = ts;

      const target = pauseOnHover && isHovered ? 0 : targetVelocity;
      const ease = 1 - Math.exp(-dt / ANIMATION_CONFIG.SMOOTH_TAU);
      velRef.current += (target - velRef.current) * ease;

      if (seqWidth > 0) {
        let next = offsetRef.current + velRef.current * dt;
        next = ((next % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = next;
        track.style.transform = `translate3d(${-next}px,0,0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [targetVelocity, seqWidth, isHovered, pauseOnHover]);
};

/* =========================================================
   LogoLoop render komponenta
========================================================= */
export const LogoLoop = React.memo<LogoLoopProps>(
  ({
    logos,
    speed = 120,
    direction = "left",
    width = "100%",
    logoHeight = 28,
    gap = 32,
    pauseOnHover = true,
    fadeOut = true,
    fadeOutColor = "#09090b",
    scaleOnHover = true,
    ariaLabel = "Partner logos",
    className,
    style,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const seqRef = useRef<HTMLUListElement>(null);

    const [seqWidth, setSeqWidth] = useState<number>(0);
    const [copyCount, setCopyCount] = useState<number>(ANIMATION_CONFIG.MIN_COPIES);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const targetVelocity = useMemo(() => {
      const magnitude = Math.abs(speed);
      const directionMultiplier = direction === "left" ? 1 : -1;
      const speedMultiplier = speed < 0 ? -1 : 1;
      return magnitude * directionMultiplier * speedMultiplier;
    }, [speed, direction]);

    const updateDimensions = useCallback(() => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const sequenceWidth = seqRef.current?.getBoundingClientRect?.().width ?? 0;

      if (sequenceWidth > 0) {
        setSeqWidth(Math.ceil(sequenceWidth));
        const copiesNeeded =
          Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
        setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
      }
    }, []);

    useResizeObserver(updateDimensions, [containerRef, seqRef], [logos, gap, logoHeight]);
    useImageLoader(seqRef, updateDimensions, [logos, gap, logoHeight]);
    useAnimationLoop(trackRef, targetVelocity, seqWidth, isHovered, pauseOnHover);

    const cssVariables = useMemo(
      () =>
        ({
          "--logoloop-gap": `${gap}px`,
          "--logoloop-logoHeight": `${logoHeight}px`,
        }) as React.CSSProperties,
      [gap, logoHeight, fadeOutColor]
    );

    const rootClasses = useMemo(
      () =>
        cx(
          "relative overflow-x-hidden group",
          "[--logoloop-gap:32px]",
          "[--logoloop-logoHeight:28px]",
          scaleOnHover && "py-[calc(var(--logoloop-logoHeight)*0.1)]",
          className
        ),
      [scaleOnHover, className]
    );

    const handleMouseEnter = () => pauseOnHover && setIsHovered(true);
    const handleMouseLeave = () => pauseOnHover && setIsHovered(false);

    const renderLogoItem = useCallback(
      (item: LogoItem, key: React.Key) => {
        const isNodeItem = "node" in item;

        const content = isNodeItem ? (
          <span
            className={cx(
              "inline-flex items-center font-medium text-zinc-100",
              "motion-reduce:transition-none",
              scaleOnHover &&
                "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/item:scale-110"
            )}
            aria-hidden={!!(item as any).href && !(item as any).ariaLabel}
          >
            {(item as any).node}
          </span>
        ) : (
          <img
            className={cx(
              "block h-[var(--logoloop-logoHeight)] w-auto object-contain",
              "[-webkit-user-drag:none] pointer-events-none",
              "[image-rendering:-webkit-optimize-contrast]",
              "motion-reduce:transition-none",
              scaleOnHover &&
                "transition-transform grayscale duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/item:scale-110"
            )}
            src={(item as any).src}
            srcSet={(item as any).srcSet}
            sizes={(item as any).sizes}
            width={(item as any).width}
            height={(item as any).height}
            alt={(item as any).alt ?? ""}
            title={(item as any).title}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        );

        const itemAriaLabel = isNodeItem
          ? (item as any).ariaLabel ?? (item as any).title
          : (item as any).alt ?? (item as any).title;

        const inner = (item as any).href ? (
          <a
            className={cx(
              "inline-flex items-center rounded no-underline",
              "transition-opacity duration-200 ease-linear",
              "hover:opacity-80",
              "focus-visible:outline focus-visible:outline-current focus-visible:outline-offset-2"
            )}
            href={(item as any).href}
            aria-label={itemAriaLabel || "logo link"}
            target="_blank"
            rel="noreferrer noopener"
          >
            {content}
          </a>
        ) : (
          content
        );

        return (
          <li
            className={cx(
              "mr-[var(--logoloop-gap)] flex-none text-[length:var(--logoloop-logoHeight)] leading-[1]",
              scaleOnHover && "overflow-visible group/item"
            )}
            key={key}
            role="listitem"
          >
            {inner}
          </li>
        );
      },
      [scaleOnHover]
    );

    const logoLists = useMemo(
      () =>
        Array.from({ length: copyCount }, (_, copyIndex) => (
          <ul
            className="flex items-center"
            key={`copy-${copyIndex}`}
            role="list"
            aria-hidden={copyIndex > 0}
            ref={copyIndex === 0 ? seqRef : undefined}
          >
            {logos.map((item, itemIndex) => renderLogoItem(item, `${copyIndex}-${itemIndex}`))}
          </ul>
        )),
      [copyCount, logos, renderLogoItem]
    );

    const containerStyle = useMemo(
      (): React.CSSProperties => ({
        width: toCssLength(width) ?? "100%",
        ...cssVariables,
        ...style,
      }),
      [width, cssVariables, style]
    );

    return (
      <div
        ref={containerRef}
        className={rootClasses}
        style={containerStyle}
        role="region"
        aria-label={ariaLabel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {fadeOut && (
          <>
            <div
              aria-hidden
              className={cx(
                "pointer-events-none absolute inset-y-0 left-0 z-[1]",
                "w-[clamp(24px,8%,120px)]",
                "bg-[linear-gradient(to_right,var(--ds-bg)_0%,rgba(0,0,0,0)_100%)]"
              )}
            />
            <div
              aria-hidden
              className={cx(
                "pointer-events-none absolute inset-y-0 right-0 z-[1]",
                "w-[clamp(24px,8%,120px)]",
                "bg-gradient-to-l from-[var(--ds-bg)] to-transparent"
              )}
            />
          </>
        )}

        <div
          className={cx(
            "flex w-max select-none will-change-transform",
            "motion-reduce:transform-none"
          )}
          ref={trackRef}
        >
          {logoLists}
        </div>
      </div>
    );
  }
);
LogoLoop.displayName = "LogoLoop";

/* =========================================================
   Sekce: Logo Loop — Renderer
========================================================= */
const LOGO_DEFAULTS = [
  { src: "https://app.origio.site/images/logoipsum.svg", alt: "React", href: "https://react.dev" },
  { src: "https://app.origio.site/images/logoipsum.svg", alt: "Next.js", href: "https://nextjs.org" },
  { src: "https://app.origio.site/images/logoipsum.svg", alt: "TypeScript", href: "https://www.typescriptlang.org" },
];

function LogoLoopRenderer({
  block,
  theme,
}: {
  block: BlockInstance;
  theme?: DesignSystem;
}) {
  const d: any = block.data || {};
  const items = Array.isArray(d.items) ? d.items : [];

  const logos: LogoItem[] = useMemo(() => {
    const base = items.length
      ? items
      : LOGO_DEFAULTS.map((l) => ({
          image: { src: l.src, alt: l.alt },
          href: (l as any).href ?? "",
        }));

    return base.map((it: any) => {
      const src = it.image?.src || it.src;
      const alt = it.image?.alt || it.alt || it.title || "";
      const href = it.href || undefined;
      const title = it.title || undefined;

      if (src) return { src, alt, href, title } as LogoItem;

      const text = title ?? "Logo";
      return {
        node: (
          <span className="inline-block rounded-md bg-zinc-900 px-3 py-1 text-sm text-zinc-100">
            {text}
          </span>
        ),
        href,
        title: text,
        ariaLabel: text,
      } as LogoItem;
    });
  }, [items]);

  const SETTINGS = {
    speed: 120,
    direction: "left" as const,
    logoHeight: 70,
    gap: 40,
    pauseOnHover: true,
    scaleOnHover: true,
    fadeOut: true,
    fadeOutColor: "#09090b",
    ariaLabel: "Technology partners",
  };

  // ✅ FIX: theme bereme z props (builder ho posila), fallback je mapThemeJson(null)
  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme} className="relative w-full">
      <LogoLoop
        logos={logos}
        speed={SETTINGS.speed}
        direction={SETTINGS.direction}
        logoHeight={SETTINGS.logoHeight}
        gap={SETTINGS.gap}
        pauseOnHover={SETTINGS.pauseOnHover}
        scaleOnHover={SETTINGS.scaleOnHover}
        fadeOut={SETTINGS.fadeOut}
        fadeOutColor={SETTINGS.fadeOutColor}
        ariaLabel={SETTINGS.ariaLabel}
      />
    </SectionShell>
  );
}

/* =========================================================
   Editor – pouze položky
========================================================= */
export const LOGO_LOOP_SCHEMA = [
  {
    type: "repeater",
    label: "Loga",
    path: "items",
    emptyHint: "Přidejte první logo",
    children: [
      { type: "image", path: "image", label: "Logo (obrázek)" },
      {
        type: "text",
        path: "title",
        label: "Text místo loga (volitelné)",
        maxLength: 60,
      },
      {
        type: "text",
        path: "href",
        label: "Odkaz (volitelné)",
        placeholder: "https://…",
        maxLength: 200,
      },
    ],
  },
] as const;

/* =========================================================
   Výchozí data + registrace sekce
========================================================= */
const LOGO_DEFAULTS_FOR_DATA = LOGO_DEFAULTS.map((l) => ({
  image: { src: l.src, alt: l.alt ?? "" },
  href: (l as any).href ?? "",
  title: (l as any).title ?? "",
}));

const st001: SectionModule = {
  id: "st001",
  definition: {
    type: "logo-loop",
    title: "Loga",
    version: 2,
    defaultData: {
      items: LOGO_DEFAULTS_FOR_DATA,
    },
    Renderer: LogoLoopRenderer,
    editor: {
      schema: LOGO_LOOP_SCHEMA,
      title: "Upravit loga",
      modelPath: "data",
    },
  },
  Editor: function LogoLoopEditor() {
    return (
      <div className="p-3 text-xs text-zinc-400">
        (Použij horní akce sekce „Upravit sekci“ pro správu log.)
      </div>
    );
  },
  meta: {
    category: "logos",
    previewImage: PreviewImage,
  },
};

export default st001;
