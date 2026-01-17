// src/components/layout/RightSlideOverHost.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUiPanel } from "@/store/ui-panel";
import UniversalSectionEditor from "@/components/builder/editor/universal/UniversalSectionEditor";
import { X } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function RightSlideOverHost() {
  const { rightPanel, closeRight } = useUiPanel();
  const isOpen = !!rightPanel;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (blur + subtle vignette) */}
          <motion.button
            type="button"
            key="right-backdrop"
            aria-label="Close panel"
            className="fixed inset-0 z-[80] cursor-default bg-black/35 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            onClick={closeRight}
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-black/25 via-transparent to-black/35" />
          </motion.button>

          {/* Panel */}
          <motion.aside
            key="right-panel"
            className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-[600px]"
            initial={{ x: "100%", opacity: 0, filter: "blur(10px)" as any }}
            animate={{ x: 0, opacity: 1, filter: "blur(0px)" as any }}
            exit={{ x: "100%", opacity: 0, filter: "blur(10px)" as any }}
            transition={{ duration: 0.42, ease: EASE }}
            style={{ willChange: "transform" }}
          >
            {/* Outer wrapper */}
            <div className="flex h-full w-full flex-col">
              {/* Inner rounded shell */}
              <motion.div
                className="m-3 flex h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950"
                initial={{ scale: 0.985 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.985 }}
                transition={{ duration: 0.42, ease: EASE }}
                style={{ willChange: "transform" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-xl">
                  <p className="text-2xl font-medium tracking-tighter text-zinc-100">
                    {rightPanel?.type === "section-edit" && "Upravit sekci"}
                    {rightPanel?.type === "assets" && "Assety"}
                  </p>
                  <button
                    onClick={closeRight}
                    className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-full bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
                    aria-label="Zavřít panel"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 bg-zinc-950">
                  {rightPanel?.type === "section-edit" && (
                    <UniversalSectionEditor />
                  )}

                  {rightPanel?.type === "assets" && (
                    <div className="p-4">
                      <p className="text-sm text-zinc-200">
                        Asset library goes here…
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
