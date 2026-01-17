"use client";

import React from "react";
import { cn } from "./cn";
import { Text, type TextProps } from "./Typography";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "md";

type ButtonTextSize = NonNullable<TextProps["size"]>;
type ButtonTextWeight = NonNullable<TextProps["weight"]>;

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

const BASE =
  "inline-flex w-full lg:w-auto cursor-pointer items-center justify-center gap-4 select-none whitespace-nowrap " +
  "transition-[background-color,color,border-color,box-shadow,transform,opacity] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

const SIZE: Record<
  ButtonSize,
  { wrap: string; textSize: ButtonTextSize; textWeight: ButtonTextWeight }
> = {
  md: {
    // požadavek: h-auto + px-8 py-2
    wrap: "h-auto px-8 py-2",
    // typografie tlačítka — klidně uprav, ale teď je to konzistentní
    textSize: "md", // (Text Regular 16/14) – pro tlačítko obvykle sedí
    textWeight: "medium",
  },
};

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "rounded-[var(--ds-radius)] " +
    "bg-[var(--ds-primary)] text-[var(--ds-on-primary)] " +
    "hover:bg-[var(--ds-primary-hover)] " +
    "focus-visible:ring-[color:var(--ds-primary)] focus-visible:ring-offset-[color:var(--ds-bg)]",

  secondary:
    "rounded-[var(--ds-radius)] " +
    "bg-[var(--ds-secondary)] text-[var(--ds-on-secondary)] " +
    "hover:bg-[var(--ds-secondary-hover)] " +
    "focus-visible:ring-[color:var(--ds-secondary)] focus-visible:ring-offset-[color:var(--ds-bg)]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  type = "button",
  children,
  ...props
}: Props) {
  const cfg = SIZE[size];

  return (
    <button
      type={type}
      className={cn(BASE, cfg.wrap, VARIANT[variant], fullWidth && "w-full", className)}
      {...props}
    >
      <Text
        as="span"
        tone="inherit"
        size={cfg.textSize}
        weight={cfg.textWeight}
      >
        {children}
      </Text>
    </button>
  );
}

/* =========================================================
   Link wrapper (optional)
========================================================= */

type ButtonLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  const cfg = SIZE[size];

  return (
    <a className={cn("inline-flex", fullWidth && "w-full", className)} {...props}>
      <span className={cn(BASE, cfg.wrap, VARIANT[variant], fullWidth && "w-full")}>
        <Text as="span" tone="inherit" size={cfg.textSize} weight={cfg.textWeight}>
          {children}
        </Text>
      </span>
    </a>
  );
}
