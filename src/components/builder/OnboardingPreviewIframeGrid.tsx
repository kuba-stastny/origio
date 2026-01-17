// src/components/builder/OnboardingPreviewIframeGrid.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type PreviewTheme = "dark" | "light";

type Props = {
  children: ReactNode;

  /** Simuluje "browser zoom" (0.75 = 75%) */
  scale?: number;

  /** Šířka design canvasu (desktop) */
  designWidth?: number;

  /** Theme pro iframe body */
  theme?: PreviewTheme;

  /** Když true, iframe je interaktivní (scroll/click uvnitř) */
  interactive?: boolean;

  className?: string;
};

function copyStyles(from: Document, to: Document): Promise<void> {
  const loadPromises: Promise<void>[] = [];

  from.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((link) => {
    const el = to.createElement("link");
    el.rel = "stylesheet";
    el.href = link.href;

    const p = new Promise<void>((resolve) => {
      el.onload = () => resolve();
      el.onerror = () => resolve();
    });

    loadPromises.push(p);
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

/**
 * ✅ Onboarding-only iframe preview
 * - iframe fills parent (100% w/h)
 * - canvas has fixed design width (e.g. 1280/1440)
 * - scaled to fit card width + optional "browser zoom" scale
 * - no fixed heights inside component (parent controls height)
 */
export default function OnboardingPreviewIframeGrid({
  children,
  scale = 0.85,
  designWidth = 1500,
  theme = "dark",
  interactive = false,
  className,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [containerW, setContainerW] = useState(1024);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => setContainerW(el.clientWidth || 1024);
    compute();

    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // fit-to-width only + "browser zoom"
  const finalScale = useMemo(() => {
    const fit = (containerW || designWidth) / designWidth; // <= 1 if card smaller than canvas
    return Math.min(1, fit, scale);
  }, [containerW, designWidth, scale]);

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
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin:0; padding:0; width:100%; height:100%; }
      body { background: transparent; overflow: auto; }
      #__preview_root { width: 100%; min-height: 100%; }
    </style>
  </head>
  <body>
    <div id="__preview_root" class="pb-[60vh]"></div>
  </body>
</html>`);
      doc.close();

      await copyStyles(document, doc);

      const root = doc.getElementById("__preview_root") as HTMLElement | null;
      setMountNode(root);
      setReady(true);
    };

    const onLoad = () => void setup();
    iframe.addEventListener("load", onLoad);
    void setup();

    return () => iframe.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const html = doc.documentElement;
    const body = doc.body;

    if (theme === "dark") {
      html.classList.add("dark");
      body.className = "bg-zinc-950 text-white";
    } else {
      html.classList.remove("dark");
      body.className = "bg-white text-zinc-950";
    }
  }, [theme, ready]);

  return (
    <div ref={containerRef} className={className}>
      <div className="relative h-full w-full overflow-hidden">
        <div className="absolute w-full h-full inset-0 flex justify-center">
          <div
            className="relative"
            style={{
              width: designWidth,
              height: "100%",
              transform: `scale(${finalScale})`,
              transformOrigin: "top center",
            }}
          >
            <iframe
              ref={iframeRef}
              title="Onboarding Preview"
              className="block h-full w-full rounded-2xl bg-transparent"
              style={{
                width: designWidth,
                height: "200vh",
                pointerEvents: interactive ? "auto" : "none",
              }}
              scrolling={interactive ? "yes" : "no"}
              sandbox="allow-same-origin allow-scripts"
            />

            {ready && mountNode ? createPortal(children, mountNode) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
