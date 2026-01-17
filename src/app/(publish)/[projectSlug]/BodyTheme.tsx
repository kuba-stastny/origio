// src/components/theme/BodyTheme.tsx
"use client";

import { useEffect } from "react";
import type { DesignSystem } from "@/types/design-system";

export default function BodyTheme({ theme }: { theme: DesignSystem }) {
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;

    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.onBackground;

    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, [theme.background, theme.onBackground]);

  return null;
}
