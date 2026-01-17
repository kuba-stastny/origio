"use client";

import React from "react";
import { cn } from "./cn";

/**
 * Design-system Typography (single source of truth)
 *
 * 1:1 podle Figmy (sizes + line-height):
 * Headings: 120%
 * Text:
 *  - X-large 24px: 132%
 *  - Large   20px: 132%
 *  - Medium  18px: 150%
 *  - Regular 16px: 140%
 *  - Small   14px: 132%
 *  - Tiny    12px: 124%
 *
 * Barvy bere z CSS proměnných (SectionShell):
 *  - --ds-heading
 *  - --ds-body
 *  - fallback: --ds-on-bg
 *
 * tone="inherit" → nepřepisuje barvu (text-current)
 */

export type Tone = "heading" | "body" | "muted" | "inherit";
export type Align = "left" | "center" | "right";
export type Weight =
  | "extralight"
  | "light"
  | "regular"
  | "medium"
  | "semibold"
  | "bold";

export type HeadingLevel = "display" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type TextSize =
  | "xl" // 24 / 22
  | "lg" // 20 / 18
  | "md" // 18 / 16
  | "sm" // 16 / 14
  | "xs" // 14 / 12
  | "tiny"; // 12 / 10

const TONE_CLASS: Record<Tone, string> = {
  heading:
    "text-[color:var(--ds-heading,var(--ds-on-bg))] [text-wrap:balance]",
  body: "text-[color:var(--ds-body,var(--ds-on-bg))]",
  muted:
    "text-[color:color-mix(in_oklab,var(--ds-body,var(--ds-on-bg))_65%,transparent)]",
  inherit: "text-current",
};

const ALIGN_CLASS: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const WEIGHT_CLASS: Record<Weight, string> = {
  extralight: "font-extralight",
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

/**
 * Headings — přesně velikosti z Figmy + line-height 120%
 * (Mobile / Desktop)
 */
const HEADING_CLASS: Record<HeadingLevel, string> = {
  // Display: 72 / 48
  display: "text-[48px] md:text-[72px] leading-[120%]",
  // H1: 64 / 44
  h1: "text-[44px] md:text-[64px] leading-[120%]",
  // H2: 56 / 40
  h2: "text-[40px] md:text-[56px] leading-[120%]",
  // H3: 44 / 32
  h3: "text-[32px] md:text-[44px] leading-[120%]",
  // H4: 32 / 24
  h4: "text-[24px] md:text-[32px] leading-[120%]",
  // H5: 24 / 20
  h5: "text-[20px] md:text-[24px] leading-[120%]",
  // H6: 20 / 20
  h6: "text-[20px] md:text-[20px] leading-[120%]",
};

/**
 * Text — přesně velikosti z Figmy + line-height podle screenshotu
 * (Mobile / Desktop)
 */
const TEXT_CLASS: Record<TextSize, string> = {
  // Text X-large: 24 / 22, 132%
  xl: "text-[22px] md:text-[24px] leading-[132%]",
  // Text Large: 20 / 18, 132%
  lg: "text-[18px] md:text-[20px] leading-[132%]",
  // Text Medium: 18 / 16, 150%
  md: "text-[16px] md:text-[18px] leading-[150%]",
  // Text Regular: 16 / 14, 140%
  sm: "text-[14px] md:text-[16px] leading-[140%]",
  // Text Small: 14 / 12, 132%
  xs: "text-[12px] md:text-[14px] leading-[132%]",
  // Text Tiny: 12 / 10, 124%
  tiny: "text-[10px] md:text-[12px] leading-[124%]",
};

/* =========================================================
   Heading
========================================================= */

export type HeadingProps<T extends React.ElementType = "h2"> = {
  as?: T;
  level?: HeadingLevel;
  tone?: Tone; // default: heading
  align?: Align; // default: left
  weight?: Weight; // default: medium (Figma headings jsou Medium)
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "color">;

export function Heading<T extends React.ElementType = "h2">({
  as,
  level = "h2",
  tone = "heading",
  align = "left",
  weight = "medium",
  className,
  children,
  ...rest
}: HeadingProps<T>) {
  const Comp = (as ?? "h2") as React.ElementType;

  return (
    <Comp
      className={cn(
        TONE_CLASS[tone],
        ALIGN_CLASS[align],
        WEIGHT_CLASS[weight],
        HEADING_CLASS[level],
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* =========================================================
   Text
========================================================= */

export type TextProps<T extends React.ElementType = "p"> = {
  as?: T;
  size?: TextSize;
  tone?: Tone; // default: body
  align?: Align; // default: left
  weight?: Weight; // default: regular
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "color">;

export function Text<T extends React.ElementType = "p">({
  as,
  size = "sm", // Figmou defaultně nejčastěji “Text Regular” (16/14)
  tone = "body",
  align = "left",
  weight = "regular",
  className,
  children,
  ...rest
}: TextProps<T>) {
  const Comp = (as ?? "p") as React.ElementType;

  return (
    <Comp
      className={cn(
        TONE_CLASS[tone],
        ALIGN_CLASS[align],
        WEIGHT_CLASS[weight],
        TEXT_CLASS[size],
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* =========================================================
   Convenience exports
========================================================= */

export const Display = (p: Omit<HeadingProps<"h1">, "level" | "as">) => (
  <Heading as="h1" level="display" {...p} />
);
export const H1 = (p: Omit<HeadingProps<"h1">, "level" | "as">) => (
  <Heading as="h1" level="h1" {...p} />
);
export const H2 = (p: Omit<HeadingProps<"h2">, "level" | "as">) => (
  <Heading as="h2" level="h2" {...p} />
);
export const H3 = (p: Omit<HeadingProps<"h3">, "level" | "as">) => (
  <Heading as="h3" level="h3" {...p} />
);
export const H4 = (p: Omit<HeadingProps<"h4">, "level" | "as">) => (
  <Heading as="h4" level="h4" {...p} />
);
export const H5 = (p: Omit<HeadingProps<"h5">, "level" | "as">) => (
  <Heading as="h5" level="h5" {...p} />
);
export const H6 = (p: Omit<HeadingProps<"h6">, "level" | "as">) => (
  <Heading as="h6" level="h6" {...p} />
);
