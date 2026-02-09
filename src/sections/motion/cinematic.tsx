"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/* =========================================================
   Shared helpers (viewport-only, NO fallback, NO margin)
========================================================= */

type ViewportOnceProps = {
  children: React.ReactNode;
  className?: string;

  /** Framer viewport options */
  amount?: number; // 0..1

  /** Optional delay for the whole block */
  delay?: number;

  /** Variants provided by caller */
  variants: Variants;

  /** render as inline or block */
  as?: "div" | "span";
};

/**
 * ViewportOnce
 * - PURE whileInView (viewport triggers animation)
 * - NO margin (to avoid width-dependent issues)
 * - Inline text MUST use as="span"
 */
function ViewportOnce({
  children,
  className,
  amount = 0.2,
  delay = 0,
  variants,
  as = "div",
}: ViewportOnceProps) {
  const MotionTag = as === "span" ? motion.span : motion.div;

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  );
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* =========================================================
   1) Split WORDS – translateY + blur + fade (INLINE)
========================================================= */

export type CinematicSplitWordsProps = {
  text: string;
  className?: string;

  amount?: number;

  stagger?: number;
  y?: number;
  blur?: number;
  duration?: number;
  delayChildren?: number;

  /** Optional delay for the whole block */
  delay?: number;
};

export function CinematicSplitWords({
  text,
  className,
  amount,
  stagger,
  y,
  blur,
  duration,
  delayChildren,
  delay,
}: CinematicSplitWordsProps) {
  const r = useReducedMotion();

  const parts = useMemo(() => {
    const raw = (text ?? "").trim();
    if (!raw) return [];
    // keep whitespace tokens
    return raw.split(/(\s+)/).filter((t) => t.length > 0);
  }, [text]);

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: r ? 0 : stagger ?? 0.045,
        delayChildren: r ? 0 : delayChildren ?? 0.02,
      },
    },
  };

  const word: Variants = {
    hidden: {
      opacity: 0,
      y: r ? 0 : y ?? 14,
      filter: (r ? "blur(0px)" : `blur(${blur ?? 10}px)`) as any,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)" as any,
      transition: { duration: r ? 0.15 : duration ?? 0.55, ease: EASE_OUT },
    },
  };

  return (
    <ViewportOnce
      as="span"
      className={className}
      variants={container}
      amount={amount}
      delay={delay ?? 0}
    >
      {parts.map((token, i) => {
        const isSpace = /^\s+$/.test(token);
        if (isSpace) {
          return (
            <span key={`sp-${i}`} aria-hidden="true">
              {token}
            </span>
          );
        }
        return (
          <motion.span
            key={`w-${i}`}
            variants={word}
            className="inline-block will-change-transform"
          >
            {token}
          </motion.span>
        );
      })}
    </ViewportOnce>
  );
}

/* =========================================================
   2) Split LETTERS – translateY + blur + fade (INLINE)
========================================================= */

export type CinematicSplitLettersProps = {
  text: string;
  className?: string;

  amount?: number;

  stagger?: number;
  y?: number;
  blur?: number;
  duration?: number;
  delayChildren?: number;

  delay?: number;
};

export function CinematicSplitLetters({
  text,
  className,
  amount,
  stagger,
  y,
  blur,
  duration,
  delayChildren,
  delay,
}: CinematicSplitLettersProps) {
  const r = useReducedMotion();

  // ✅ split by tokens (words + spaces) so we can wrap whole words as nowrap blocks
  const tokens = useMemo(() => {
    const raw = (text ?? "");
    if (!raw) return [];
    // keep whitespace tokens
    return raw.split(/(\s+)/).filter((t) => t.length > 0);
  }, [text]);

  const container: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: r ? 0 : stagger ?? 0.012,
        delayChildren: r ? 0 : delayChildren ?? 0.02,
      },
    },
  };

  const letter: Variants = {
    hidden: {
      opacity: 0,
      y: r ? 0 : y ?? 18,
      filter: (r ? "blur(0px)" : `blur(${blur ?? 10}px)`) as any,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)" as any,
      transition: { duration: r ? 0.12 : duration ?? 0.45, ease: EASE_OUT },
    },
  };

  return (
    <ViewportOnce
      as="span"
      className={className}
      variants={container}
      amount={amount}
      delay={delay ?? 0}
    >
      {tokens.map((t, i) => {
        const isSpace = /^\s+$/.test(t);

        // keep spaces as real text nodes so wrapping behaves naturally
        if (isSpace) {
          return (
            <span key={`sp-${i}`} aria-hidden="true">
              {t}
            </span>
          );
        }

        // ✅ Wrap each word so it can NEVER break across lines
        return (
          <span
            key={`wd-${i}`}
            className="inline-flex whitespace-nowrap align-baseline"
          >
            {Array.from(t).map((ch, j) => (
              <motion.span
                key={`c-${i}-${j}`}
                variants={letter}
                className="inline-block will-change-transform"
              >
                {ch}
              </motion.span>
            ))}
          </span>
        );
      })}
    </ViewportOnce>
  );
}


/* =========================================================
   3) Full TEXT fade (BLOCK)
========================================================= */

export type CinematicTextFadeProps = {
  children: React.ReactNode;
  className?: string;

  amount?: number;

  duration?: number;
  delay?: number;
};

export function CinematicTextFade({
  children,
  className,
  amount,
  duration,
  delay,
}: CinematicTextFadeProps) {
  const r = useReducedMotion();

  const v: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: r ? 0.15 : duration ?? 0.6, ease: EASE_OUT },
    },
  };

  return (
    <ViewportOnce
      as="div"
      className={className}
      variants={v}
      amount={amount}
      delay={delay ?? 0}
    >
      {children}
    </ViewportOnce>
  );
}

/* =========================================================
   4) Element/block FADE wrapper
========================================================= */

export const CinematicFade = CinematicTextFade;

/* =========================================================
   5) Element/block BLUR + TRANSLATE + FADE wrapper
========================================================= */

export type CinematicBlurUpProps = {
  children: React.ReactNode;
  className?: string;

  amount?: number;

  y?: number;
  blur?: number;
  duration?: number;
  delay?: number;
};

export function CinematicBlurUp({
  children,
  className,
  amount,
  y,
  blur,
  duration,
  delay,
}: CinematicBlurUpProps) {
  const r = useReducedMotion();

  const v: Variants = {
    hidden: {
      opacity: 0,
      y: r ? 0 : y ?? 14,
      filter: (r ? "blur(0px)" : `blur(${blur ?? 10}px)`) as any,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)" as any,
      transition: { duration: r ? 0.18 : duration ?? 0.7, ease: EASE_OUT },
    },
  };

  return (
    <ViewportOnce
      as="div"
      className={className}
      variants={v}
      amount={amount}
      delay={delay ?? 0}
    >
      {children}
    </ViewportOnce>
  );
}
