'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Monitor, Smartphone, RefreshCcw } from 'lucide-react';

type TimeseriesPoint = {
  date: string;
  pageviews: number;
};

type AnalyticsSummary = {
  pageviews: number;
  unique: number;
  avg_duration_ms: number;
  avg_scroll: number;
  by_referrer: Array<{ referrer: string; count: number }>;
  by_country: Array<{ country: string; count: number }>;
  by_device: Array<{ device_category: string; count: number }>;
  timeseries?: TimeseriesPoint[];
};

type RangeKey = '24h' | '7d' | '30d' | '90d' | '1y';

/* =========================
   Helpers
========================= */

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function DeviceBigIcon({ device }: { device: 'desktop' | 'mobile' }) {
  const cls = 'h-9 w-9 text-zinc-100';
  if (device === 'desktop') return <Monitor className={cls} />;
  return <Smartphone className={cls} />;
}

/* =========================
   Device donut + cards
========================= */

function DeviceDonut({ pct, label }: { pct: number; label: string }) {
  const value = clamp(Math.round(pct), 0, 100);
  const size = 78;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgb(39 39 42)" // zinc-800
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgb(244 244 245)" // zinc-100
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm font-semibold text-zinc-100">{value}%</div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({
  title,
  count,
  pct,
  icon,
  mutedLabel,
}: {
  title: string;
  count: number;
  pct: number;
  icon: React.ReactNode;
  mutedLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-zinc-900/30 p-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center flex-col">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm">
            {icon}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="mb-4">
          <DeviceDonut pct={pct} label="podíl zařízení" />
        </div>
        <div className="text-2xl font-semibold text-zinc-100">{count}</div>
        <div className="mt-1 text-[11px] text-zinc-400">návštěv</div>
      </div>
    </div>
  );
}

/* =========================
   Skeletony
========================= */

function SkeletonKpiCard() {
  return (
    <div className="rounded-2xl bg-zinc-900/30 p-4 animate-pulse">
      <div className="mb-2 h-3 w-28 rounded bg-zinc-800" />
      <div className="h-7 w-24 rounded bg-zinc-800" />
    </div>
  );
}

function SkeletonDeviceCards() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      <div className="rounded-2xl bg-zinc-900/30 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-zinc-800" />
            <div className="h-3 w-28 rounded bg-zinc-800/70" />
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="h-5 w-12 rounded bg-zinc-800" />
          <div className="h-20 w-20 rounded-full bg-zinc-900/60" />
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/30 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-zinc-800" />
            <div className="h-3 w-28 rounded bg-zinc-800/70" />
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="h-5 w-12 rounded bg-zinc-800" />
          <div className="h-20 w-20 rounded-full bg-zinc-900/60" />
        </div>
      </div>
    </div>
  );
}

/* =========================
   Component
========================= */

export default function AnalyticsPanel() {
  const { projectId } = useParams() as { projectId: string };

  // Range nechávám jen kvůli API parametru, UI switcher je pryč.
  const [range] = useState<RangeKey>('7d');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  const cacheRef = useRef<Partial<Record<RangeKey, AnalyticsSummary>>>({});

  // ✅ refresh UI state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshOk, setRefreshOk] = useState(false);
  const [refreshErr, setRefreshErr] = useState<string | null>(null);

  async function load(r: RangeKey) {
    setError(null);

    const cached = cacheRef.current[r];
    if (cached) {
      setData(cached);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(
        `/api/v1/analytics/summary?projectId=${projectId}&range=${r}`,
        { method: 'GET' }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(json?.error || 'Nepodařilo se načíst analytiku.');

      const normalized: AnalyticsSummary = {
        pageviews: json.pageviews ?? 0,
        unique: json.unique ?? 0,
        avg_duration_ms: json.avg_duration_ms ?? 0,
        avg_scroll: json.avg_scroll ?? 0,
        by_referrer: json.by_referrer ?? [],
        by_country: json.by_country ?? [],
        by_device: json.by_device ?? [],
        timeseries: json.timeseries ?? [],
      };

      cacheRef.current[r] = normalized;
      setData(normalized);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Chyba při načítání dat.');
    } finally {
      setLoading(false);
    }
  }

  async function hardRefresh() {
    if (!projectId || refreshing) return;

    setRefreshErr(null);
    setRefreshOk(false);
    setRefreshing(true);

    try {
      // ✅ vyhoď cache a přinutili fetch
      delete cacheRef.current[range];

      // ✅ ukázat skeleton jen pokud nechceš: tady necháme data svítit a jen ikonku spin
      await load(range);

      setRefreshOk(true);
      window.setTimeout(() => setRefreshOk(false), 1400);
    } catch (e: any) {
      setRefreshErr(e?.message || 'Refresh se nepovedl.');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!projectId) return;
    let alive = true;

    (async () => {
      if (!alive) return;
      await load(range);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, range]);

  const readableDuration = useMemo(() => {
    if (!data) return '–';
    const s = Math.round((safeNum(data.avg_duration_ms) || 0) / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return `${m}m ${rest}s`;
  }, [data]);

  const deviceStats = useMemo(() => {
    const rows = data?.by_device ?? [];
    const desktop =
      rows.find((x) => (x.device_category || '').toLowerCase() === 'desktop')
        ?.count ?? 0;
    const mobile =
      rows.find((x) => (x.device_category || '').toLowerCase() === 'mobile')
        ?.count ?? 0;

    const total = Math.max(1, safeNum(desktop) + safeNum(mobile));

    return {
      desktop: safeNum(desktop),
      mobile: safeNum(mobile),
      desktopPct: (safeNum(desktop) / total) * 100,
      mobilePct: (safeNum(mobile) / total) * 100,
    };
  }, [data]);

  const showSkeleton = loading && !data;

  return (
    <div className="h-full px-4 py-5 space-y-5 bg-zinc-950">
   
      <div className="flex flex-col gap-6 overflow-y-auto pb-10">
        {showSkeleton && (
          <>
            <section className="rounded-3xl flex flex-col gap-10">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <SkeletonKpiCard />
                <SkeletonKpiCard />
                <SkeletonKpiCard />
                <SkeletonKpiCard />
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl bg-zinc-900/30 p-4">
                <div className="mb-3 h-3 w-20 rounded bg-zinc-800 animate-pulse" />
                <SkeletonDeviceCards />
              </div>
            </section>
          </>
        )}

        {!showSkeleton && error && (
          <div className="rounded-2xl bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {!showSkeleton && data && (
          <>
            {/* KPI only (bez switcheru a bez grafu) */}
            <section className="rounded-3xl flex flex-col gap-10">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-900/30 p-4">
                  <p className="mb-1 text-xs text-zinc-400">Zobrazení stránky</p>
                  <p className="text-2xl font-semibold text-zinc-100">
                    {data.pageviews}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-900/30 p-4">
                  <p className="mb-1 text-xs text-zinc-400">
                    Unikátní návštěvníci
                  </p>
                  <p className="text-2xl font-semibold text-zinc-100">
                    {data.unique}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-900/30 p-4">
                  <p className="mb-1 text-xs text-zinc-400">
                    Průměrná délka návštěvy
                  </p>
                  <p className="text-2xl font-semibold text-zinc-100">
                    {readableDuration}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-900/30 p-4">
                  <p className="mb-1 text-xs text-zinc-400">Průměrný scroll</p>
                  <p className="text-2xl font-semibold text-zinc-100">
                    {data.avg_scroll ?? 0}%
                  </p>
                </div>
              </div>
            </section>

            {/* Devices */}
            <section className="space-y-4">
              <div className="rounded-2xl bg-zinc-900/30 p-4">
                <h4 className="mb-3 text-xs text-zinc-400">Zařízení</h4>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <DeviceCard
                    title="Desktop"
                    mutedLabel="návštěvy z počítače"
                    count={deviceStats.desktop}
                    pct={deviceStats.desktopPct}
                    icon={<DeviceBigIcon device="desktop" />}
                  />

                  <DeviceCard
                    title="Mobile"
                    mutedLabel="návštěvy z telefonu"
                    count={deviceStats.mobile}
                    pct={deviceStats.mobilePct}
                    icon={<DeviceBigIcon device="mobile" />}
                  />
                </div>
              </div>
            </section>
            <div className="flex items-center gap-2">
      

      <button
        type="button"
        onClick={hardRefresh}
        disabled={refreshing}
        title="Refresh statistiky"
        aria-label="Refresh statistiky"
        className="inline-flex mx-auto h-9 w-9 items-center justify-center rounded-xl bg-zinc-900/40 text-zinc-200 hover:bg-zinc-900/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCcw
          className={['h-5 w-5', refreshing ? 'animate-spin' : ''].join(' ')}
        />
      </button>
    </div>
          </>
        )}
      </div>
    </div>
  );
}
