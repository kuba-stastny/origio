"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiCheck, FiCopy, FiExternalLink } from "react-icons/fi";
import { useMemo, useState } from "react";

type PublishSuccessModalProps = {
  open: boolean;
  onClose: () => void;
  url: string;
};

export default function PublishSuccessModal({
  open,
  onClose,
  url,
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const niceUrl = useMemo(() => url.replace(/^https?:\/\//, ""), [url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-zinc-950/85 p-8 shadow-2xl ring-1 ring-zinc-800/70 backdrop-blur"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Publikováno"
          >
            {/* blobs background (tvůj super blur) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -left-24 -top-20 h-48 w-80 rounded-full bg-blue-500 blur-3xl mix-blend-screen"
                animate={{
                  x: [0, 240, 50, 260, 0],
                  y: [0, 16, -12, 20, 0],
                  rotate: [0, 18, -10, 24, 0],
                  opacity: [0.25, 0.65, 0.35, 0.7, 0.25],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -right-28 -top-24 h-52 w-88 rounded-full bg-blue-700 blur-3xl mix-blend-screen"
                animate={{
                  x: [0, -260, -60, -240, 0],
                  y: [0, 18, -12, 16, 0],
                  rotate: [0, -16, 12, -22, 0],
                  opacity: [0.12, 0.32, 0.18, 0.36, 0.12],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -left-28 -bottom-28 h-56 w-96 rounded-full bg-blue-900 blur-3xl mix-blend-screen"
                animate={{
                  x: [0, 280, 80, 240, 0],
                  y: [0, -20, 12, -16, 0],
                  rotate: [0, 14, -12, 20, 0],
                  opacity: [0.14, 0.42, 0.2, 0.46, 0.14],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-black/[0.55]" />
              <div className="absolute inset-0 ring-1 ring-white/[0.05]" />
            </div>

            

            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <FiCheck className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1">
                  <div className="text-xl font-semibold text-zinc-50">
                    Publikováno
                  </div>
                  <div className="mt-1 text-sm text-zinc-300">
                    Web je live. Otevři ho nebo si zkopíruj odkaz.
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/45 px-4 py-3">
                <div className="flex items-center gap-3">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 text-sm text-zinc-100 hover:text-blue-300"
                    title={url}
                  >
                    <span className="block truncate">{niceUrl}</span>
                  </a>

                  <button
                    type="button"
                    onClick={copy}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-white/15"
                  >
                    <FiCopy className="h-4 w-4" />
                    {copied ? "Zkopírováno" : "Kopírovat"}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/15"
                >
                  Zavřít
                </button>

                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
                >
                  Otevřít web
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
