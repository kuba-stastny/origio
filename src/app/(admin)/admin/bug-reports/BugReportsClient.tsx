// src/app/(admin)/admin/bug-reports/BugReportsClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

export type BugRow = {
  id: string;
  created_at: string | null;
  message: string | null;
  screenshot_urls: string[];
};

function toTime(v: string | null) {
  if (!v) return null;
  const t = +new Date(v);
  return Number.isFinite(t) ? t : null;
}

function fmtDateCs(v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("cs-CZ");
  } catch {
    return "—";
  }
}

export default function BugReportsClient({ initial }: { initial: BugRow[] }) {
  const rows = useMemo(() => {
    return [...(initial ?? [])].sort((a, b) => {
      const aa = toTime(a.created_at) ?? 0;
      const bb = toTime(b.created_at) ?? 0;
      return bb - aa;
    });
  }, [initial]);

  const [open, setOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  function openImage(url: string) {
    setActiveUrl(url);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setActiveUrl(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/60 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-zinc-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left whitespace-nowrap w-[220px]">Kdy</th>
                <th className="px-4 py-3 text-left">Zpráva</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 6, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="border-t border-zinc-800/60 hover:bg-white/[0.03] transition"
                >
                  <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap align-top">
                    {fmtDateCs(r.created_at)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="space-y-3">
                      <div className="text-sm text-zinc-50 break-words">
                        {r.message ? r.message : <span className="text-zinc-500">—</span>}
                      </div>

                      {r.screenshot_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {r.screenshot_urls.map((url, i) => (
                            <button
                              key={`${r.id}-shot-${i}`}
                              type="button"
                              onClick={() => openImage(url)}
                              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition"
                              title="Otevřít screenshot"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Screenshot ${i + 1}`}
                                className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition"
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center">
                    <div className="text-sm text-zinc-300 whitespace-nowrap">Nic nenalezeno.</div>
                    <div className="mt-1 text-xs text-zinc-500 whitespace-nowrap">
                      Zatím tu není žádný report.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800/70 px-4 py-3">
          <div className="text-xs text-zinc-500 whitespace-nowrap">Řazení: created_at ↓</div>
          <div className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">Rows: {rows.length}</div>
        </div>
      </div>

      {/* Modal */}
      {open && activeUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="text-xs text-zinc-400 truncate">{activeUrl}</div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[0.08] transition"
              >
                Zavřít
              </button>
            </div>

            <div className="p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeUrl}
                alt="Screenshot"
                className="max-h-[78vh] w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
