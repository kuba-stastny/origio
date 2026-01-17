// src/components/admin/sites/SitesTableClient.tsx
"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export type SiteRow = {
  id: string;
  slug: string | null;
  status: string | null;
  workspace_id: string | null;
  created_at: string | null;

  pagesCount: number;
  onboardingDone: boolean;

  // activity derived from pages.updated_at (max)
  activityAt: string | null;

  authorId: string | null;
  authorLabel: string;
};

type Props = { initial?: SiteRow[] };

const PUBLISHED_BASE_DOMAIN = "origio.site";

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

function fmtRelativeCs(v: string | null) {
  const t = toTime(v);
  if (!t) return "—";

  const now = Date.now();
  const diffMs = t - now; // negative = past
  const abs = Math.abs(diffMs);

  const rtf = new Intl.RelativeTimeFormat("cs", { numeric: "auto" });

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;

  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (abs < week) return rtf.format(Math.round(diffMs / day), "day");
  if (abs < month) return rtf.format(Math.round(diffMs / week), "week");
  return rtf.format(Math.round(diffMs / month), "month");
}

/**
 * Effective status:
 * - if pagesCount === 0 => treat as not started (null), regardless of stored status
 */
function effectiveStatus(row: Pick<SiteRow, "status" | "pagesCount">): string | null {
  if ((row.pagesCount ?? 0) === 0) return null;
  return row.status ?? null;
}

function statusLabelCs(status: string | null) {
  const s = String(status ?? "").toLowerCase();
  if (!s) return "Nezačal";
  if (s === "published") return "Publikováno";
  if (s === "draft") return "Draft";
  return s;
}

function statusPill(status: string | null) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border";
  const s = String(status ?? "").toLowerCase();

  if (!s) {
    return (
      <span className={`${base} border-white/10 bg-white/[0.04] text-zinc-200 whitespace-nowrap`}>
        nezačal
      </span>
    );
  }
  if (s === "published") {
    return (
      <span className={`${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-200 whitespace-nowrap`}>
        publikováno
      </span>
    );
  }
  if (s === "draft") {
    return (
      <span className={`${base} border-white/10 bg-white/[0.04] text-zinc-200 whitespace-nowrap`}>
        draft
      </span>
    );
  }
  return (
    <span className={`${base} border-white/10 bg-white/[0.04] text-zinc-200 whitespace-nowrap`}>
      {s}
    </span>
  );
}

function siteUrlFromSlug(slug: string | null) {
  const s = (slug || "").trim();
  if (!s) return null;
  return `https://${s}.${PUBLISHED_BASE_DOMAIN}`;
}

export default function SitesTableClient({ initial }: Props) {
  const safeInitial = initial ?? [];

  const rows = useMemo(() => {
    return [...safeInitial].sort((a, b) => {
      const aa = toTime(a.activityAt) ?? 0;
      const bb = toTime(b.activityAt) ?? 0;
      if (bb !== aa) return bb - aa;

      const ac = toTime(a.created_at) ?? 0;
      const bc = toTime(b.created_at) ?? 0;
      return bc - ac;
    });
  }, [safeInitial]);

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/60 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-zinc-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left whitespace-nowrap">Slug / Pages</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Created</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Autor</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Aktivita</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((site) => {
                const rel = fmtRelativeCs(site.activityAt);
                const st = effectiveStatus(site);
                const url = siteUrlFromSlug(site.slug);

                return (
                  <motion.tr
                    key={site.id}
                    initial={{ opacity: 0, y: 6, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="border-t border-zinc-800/60 hover:bg-white/[0.03] transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {url ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-zinc-50 whitespace-nowrap truncate max-w-[520px] hover:underline"
                              title={url}
                            >
                              {site.slug}.{PUBLISHED_BASE_DOMAIN}
                            </a>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-200 ring-1 ring-white/10 whitespace-nowrap hover:bg-white/15 transition"
                              title="Otevřít web"
                            >
                              open
                            </a>
                          </div>
                        ) : (
                          <span className="font-medium text-zinc-50 whitespace-nowrap truncate max-w-[520px]">
                            —
                          </span>
                        )}

                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-200 ring-1 ring-white/10 tabular-nums whitespace-nowrap">
                          {site.pagesCount} pages
                        </span>

                        {!site.onboardingDone && (
                          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-400 ring-1 ring-white/10 whitespace-nowrap">
                            onboarding: no
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                      {fmtDateCs(site.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="text-sm text-zinc-50 whitespace-nowrap truncate max-w-[260px] inline-block align-middle"
                        title={site.authorLabel}
                      >
                        {site.authorLabel || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="inline-flex items-center gap-2">
                        {statusPill(st)}
                        <span className="text-[11px] text-zinc-500 whitespace-nowrap">
                          {statusLabelCs(st)}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm text-zinc-100 whitespace-nowrap">{rel}</span>
                        <span className="mt-0.5 text-[11px] text-zinc-500 whitespace-nowrap">
                          {fmtDateCs(site.activityAt)}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <div className="text-sm text-zinc-300 whitespace-nowrap">Nic nenalezeno.</div>
                    <div className="mt-1 text-xs text-zinc-500 whitespace-nowrap">
                      Zatím tu nejsou žádné projekty.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800/70 px-4 py-3">
          <div className="text-xs text-zinc-500 whitespace-nowrap">
            Řazení: aktivita (pages.updated_at) ↓, pak created ↓.
          </div>
          <div className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">Rows: {rows.length}</div>
        </div>
      </div>
    </div>
  );
}
