"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = Partial<{
  spacing: number;
  radius: number;
  influence: number;
  base: string;
  bg: string;
  intensity: number;
  className: string;
}>;

export default function DotGridBackground({
  spacing = 32,
  radius = 1.4,
  influence = 180,
  base = "#18181b", // zinc-800
  bg = "#09090b",
  intensity = 1.0,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const grid = useMemo(() => ({ cols: 0, rows: 0 }), []);
  const dprRef = useRef<number>(1);

  useEffect(() => {
    setMounted(true);
    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleLeave = () => {
      mouseRef.current = null;
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const setSize = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      dprRef.current = dpr;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grid.cols = Math.ceil(w / spacing) + 2;
      grid.rows = Math.ceil(h / spacing) + 2;
    };

    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    const baseRGB = hexToRgb(base) ?? { r: 39, g: 39, b: 42 };

    const draw = () => {
      // vyčisti (bez „světelného“ kruhu – žádný gradient)
      if (bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      } else {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      }

      const mx = mouseRef.current?.x ?? -9999;
      const my = mouseRef.current?.y ?? -9999;

      const offsetX = -spacing;
      const offsetY = -spacing;

      for (let row = 0; row < grid.rows; row++) {
        const y = offsetY + row * spacing;
        for (let col = 0; col < grid.cols; col++) {
          const x = offsetX + col * spacing;

          const dx = x - mx;
          const dy = y - my;
          const dist = Math.hypot(dx, dy);

          // 0..1 podle vzdálenosti (jen barva teček)
          let t = 0;
          if (dist < influence) {
            const k = 1 - dist / influence;
            t = Math.pow(k, 1.5) * intensity;
          }

          const r = Math.round(lerp(baseRGB.r, 70, t));
          const g = Math.round(lerp(baseRGB.g, 70, t));
          const b = Math.round(lerp(baseRGB.b, 70, t));
          ctx.fillStyle = `rgb(${r},${g},${b})`;

          const rr = radius + t * 0.9;
          ctx.beginPath();
          ctx.arc(x, y, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, spacing, radius, influence, base, bg, intensity, grid]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[0] ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full block"
        style={{ mixBlendMode: "normal" }} // jen tečky mění barvu
      />
    </div>
  );
}

/* --------------------------- helpers --------------------------- */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (![3, 6].includes(h.length)) return null;
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(n, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}