"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  maxWidth?: number;
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.97 },
};

export default function ModalShell({
  open,
  onClose,
  title,
  children,
  maxWidth = 720,
}: ModalShellProps) {
  // ESC zavírání
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  

  return (
    <div className="fixed inset-0 z-[4000] pointer-events-none">
      {/* Backdrop */}
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            key="backdrop"
            className="absolute inset-0  bg-zinc-950/80 backdrop-blur-xl pointer-events-auto"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence mode="wait">
        {open && (
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              key="panel"
              className="relative w-full rounded-2xl shadow-2xl pointer-events-auto"
              style={{ maxWidth }}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b px-4 py-3 dark:border-zinc-800">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {title ?? "Nastavení"}
                </h2>
                <button
                  onClick={onClose}
                  className="inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 dark:border-zinc-700"
                >
                  Zavřít
                </button>
              </div>
              <div className="p-4 sm:p-6">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
