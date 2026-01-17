// src/components/builder/IframePortal.tsx
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["100","200","300", "400", "500", "600", "700"],
});

function copyStyles(from: Document, to: Document): Promise<void> {
  const loadPromises: Promise<void>[] = [];

  from
    .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    .forEach((link) => {
      const el = to.createElement("link");
      el.rel = "stylesheet";
      el.href = link.href;

      const loadPromise = new Promise<void>((resolve) => {
        el.onload = () => resolve();
        el.onerror = () => resolve();
      });

      loadPromises.push(loadPromise);
      to.head.appendChild(el);
    });

  from.querySelectorAll<HTMLStyleElement>("style").forEach((style) => {
    const el = to.createElement("style");
    el.textContent = style.textContent;
    to.head.appendChild(el);
  });

  if (loadPromises.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(loadPromises).then(() => undefined);
}

type WidthSpec = number | "full" | string;

function resolveWidth(spec: WidthSpec, containerW: number, fallback = 1024) {
  if (typeof spec === "number") return spec;
  if (spec === "full") return containerW || fallback;
  if (typeof spec === "string") {
    const s = spec.trim().toLowerCase();
    if (s.endsWith("%")) {
      const pct = parseFloat(s);
      if (Number.isFinite(pct) && containerW)
        return Math.max(0, (pct / 100) * containerW);
      return containerW || fallback;
    }
    if (s.endsWith("px")) {
      const px = parseFloat(s);
      return Number.isFinite(px) ? px : fallback;
    }
  }
  return containerW || fallback;
}

type IframePortalProps = {
  width: WidthSpec;
  /** Výška náhledu v px */
  viewportHeight?: number;
  scaleToFit?: boolean;
  className?: string;
  children: ReactNode;
};

export default function IframePortal({
  width,
  viewportHeight = 800,
  scaleToFit = false,
  className,
  children,
}: IframePortalProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [containerW, setContainerW] = useState<number>(1024);
  const [internalW, setInternalW] = useState<number>(1024);
  const [scale, setScale] = useState<number>(1);
  const [isReady, setIsReady] = useState(false);

  // sleduj container (kvůli scaleToFit)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => setContainerW(el.clientWidth || 1024);
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // přepočet vnitřní šířky
  useEffect(() => {
    setInternalW(resolveWidth(width, containerW));
  }, [width, containerW]);

  // scale
  useEffect(() => {
    if (typeof width !== "number" || !scaleToFit) {
      setScale(1);
      return;
    }
    const s = Math.min(1, (containerW || internalW) / width);
    setScale(Number.isFinite(s) ? s : 1);
  }, [width, scaleToFit, containerW, internalW]);

  // init iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setup = async () => {
      const doc = iframe.contentDocument!;
      doc.open();
      doc.write(
        `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; }
    </style>
  </head>
  <body class="bg-zinc-950 ${dmSans.className}">
  </body>
</html>`
      );
      doc.close();

      await copyStyles(document, doc);

      setMountNode(doc.body);
      setIsReady(true);
    };

    void setup();
  }, []);

  const effectiveW = internalW;
  const outerHeight = viewportHeight;

  const outerScale = scale;
  const stageW = Math.round(effectiveW * outerScale);
  const stageH = Math.round(outerHeight * outerScale);

  return (
    <div ref={containerRef} className={className}>
      <div
        className="mx-auto relative flex items-center justify-center mb-30"
        style={{ width: stageW, height: stageH, maxWidth: "100%" }}
      >
        {/* Loader */}
        {!isReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-sm text-zinc-200">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200/40 border-t-white" />
              <p className="text-xs text-zinc-400">Nahrávám náhled…</p>
            </div>
          </div>
        )}

        <div
          className="relative"
          style={{
            width: effectiveW,
            height: outerHeight,
            transform: `scale(${outerScale})`,
            transformOrigin: "top center",
          }}
        >
          {/* ČISTÝ IFRÁME */}
          <iframe
            className="max-w-[1500px] h-[90vh] mx-auto"
            ref={iframeRef}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              width: "100%",
              borderRadius: 12,
              display: "block",
              overflow: "auto",
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />

          {/* React children do iframe dokumentu */}
          {isReady && mountNode ? createPortal(children, mountNode) : null}
        </div>
      </div>
    </div>
  );
}
