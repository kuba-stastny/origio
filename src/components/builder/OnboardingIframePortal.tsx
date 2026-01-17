// src/components/builder/OnboardingIframePortal.tsx
"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
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

  if (loadPromises.length === 0) return Promise.resolve();
  return Promise.all(loadPromises).then(() => undefined);
}

type OnboardingIframePortalProps = {
  /** Desktop viewport width (např. 1280) */
  width?: number;
  /** Desktop viewport height (např. 820) */
  height?: number;

  /**
   * “Browser zoom” uvnitř iframe.
   * 1 = žádný zoom, 0.75 = ukáže víc obsahu (jako 75% zoom v prohlížeči)
   */
  zoom?: number;

  /**
   * Pokud je true, tak se celý iframe stage zmenší, aby se vešel do karty.
   * (typicky chceš true pro mini náhledy)
   */
  scaleToFit?: boolean;

  /** Když chceš limitovat výšku v kartě (px) */
  maxCardHeight?: number;

  /** Přidá fake topbar pro “browser feel” */
  showBrowserFrame?: boolean;

  /** Class pro wrapper karty */
  className?: string;

  children: ReactNode;
};

export default function OnboardingIframePortal({
  width = 1280,
  height = 820,
  zoom = 0.75,
  scaleToFit = true,
  maxCardHeight = 320,
  showBrowserFrame = true,
  className,
  children,
}: OnboardingIframePortalProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [containerW, setContainerW] = useState<number>(800);
  const [isReady, setIsReady] = useState(false);

  // measure container width (for scaleToFit)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => setContainerW(el.clientWidth || 800);
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // init iframe doc
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const setup = async () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; }
      /* zabrání divným “scrollbar jumpům” v mini náhledech */
      body { overflow: hidden; }
    </style>
  </head>
  <body class="${dmSans.className}">
  </body>
</html>`);
      doc.close();

      await copyStyles(document, doc);

      setMountNode(doc.body);
      setIsReady(true);
    };

    void setup();
  }, []);

  // inner zoom: musí zvětšit “layout size”, aby se nic neuseklo
  const innerZoom = Math.max(0.4, Math.min(1, zoom || 1));
  const zoomedW = Math.round(width * innerZoom);
  const zoomedH = Math.round(height * innerZoom);

  // stage scaleToFit (karta) – zmenší celý “zoomed viewport” aby se vešel
  const fitScale = scaleToFit ? Math.min(1, containerW / zoomedW) : 1;
  const stageW = Math.round(zoomedW * fitScale);
  const stageH = Math.round(Math.min(maxCardHeight, zoomedH * fitScale));

  // frame topbar height (inside iframe content)
  const frameTopbar = showBrowserFrame ? 32 : 0;

  return (
    <div ref={containerRef} className={className}>
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/20"
        style={{
          width: stageW,
          height: stageH,
          maxWidth: "100%",
        }}
      >
        {/* iframe always fills wrapper */}
        <iframe
          ref={iframeRef}
          className="absolute inset-0 h-full w-full"
          style={{
            border: "none",
            display: "block",
          }}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />

        {/* loader */}
        {!isReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur">
            <div className="flex flex-col items-center gap-2 text-xs text-white/70">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              <div>Nahrávám náhled…</div>
            </div>
          </div>
        )}

        {/* React -> iframe */}
        {isReady && mountNode
          ? createPortal(
              <div
                // outer stage: simulate a real desktop viewport
                style={{
                  width: width,
                  height: height,
                  transform: `scale(${innerZoom})`,
                  transformOrigin: "top left",
                  // klíčové: aby se obsah po zoomu neusekl vpravo/dole
                  // (tahle kombinace se chová jako “browser zoom”)
                }}
              >
                {/* fake browser frame */}
                {showBrowserFrame && (
                  <div
                    style={{
                      height: frameTopbar,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.35)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.20)",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.20)",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.20)",
                        display: "inline-block",
                      }}
                    />
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.55)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Preview
                    </span>
                  </div>
                )}

                {/* content area */}
                <div
                  style={{
                    width: "100%",
                    height: `calc(100% - ${frameTopbar}px)`,
                    overflow: "hidden",
                  }}
                >
                  {/* IMPORTANT: aby sekce nechtěly “proklik” a scroll v kartě */}
                  <div style={{ pointerEvents: "none" }}>{children}</div>
                </div>
              </div>,
              mountNode
            )
          : null}
      </div>
    </div>
  );
}
