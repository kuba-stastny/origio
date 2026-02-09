'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Monitor, Smartphone, RefreshCcw } from 'lucide-react';

type TimeseriesPoint = {
  date: string; // "YYYY-MM-DD" nebo ISO timestamp
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

function isRecord(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** ---------- UTC date helpers (KRITICKÉ pro timeseries shodu) ---------- */

function startOfDayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function formatISODateUTC(d: Date) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function formatDayLabelUTC(d: Date) {
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
}

/**
 * Převede vstupní date string na "YYYY-MM-DD" v UTC.
 * - "YYYY-MM-DD" -> vezme jako přesný den (bez posunu)
 * - ISO timestamp -> převede na UTC den
 */
function toUTCDateKey(s: string): string | null {
  if (!s || typeof s !== 'string') return null;

  // už je to denní key
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dt = new Date(s);
  if (!Number.isFinite(dt.getTime())) return null;

  const dayUTC = startOfDayUTC(dt);
  return formatISODateUTC(dayUTC);
}

/**
 * Robustní normalizace timeseries z API (různé tvary).
 */
function normalizeTimeseries(raw: any): TimeseriesPoint[] {
  if (!raw) return [];

  // 1) Array of objects
  if (Array.isArray(raw)) {
    const out: TimeseriesPoint[] = [];

    for (const it of raw) {
      if (!it) continue;

      let date =
        (isRecord(it) && (it.date || it.day || it.bucket || it.occurred_at || it.ts || it.time)) ??
        null;

      if (typeof date !== 'string') continue;

      const value =
        (isRecord(it) && (it.pageviews ?? it.count ?? it.views ?? it.value ?? it.total ?? it.n)) ??
        0;

      out.push({ date, pageviews: safeNum(value) });
    }

    return out.filter((p) => typeof p.date === 'string' && p.date.length > 0);
  }

  // 2) Object map: { "2026-01-10": 12, "2026-01-11": 5 }
  if (isRecord(raw)) {
    const out: TimeseriesPoint[] = [];
    for (const [k, v] of Object.entries(raw)) {
      if (typeof k !== 'string') continue;
      out.push({ date: k, pageviews: safeNum(v) });
    }
    return out;
  }

  return [];
}

/**
 * Vytvoří dense řadu posledních N dnů (včetně dneška) v UTC.
 * Dny bez dat doplní nulou.
 */
function buildDailyBarsUTC(timeseries: TimeseriesPoint[] | undefined, days: number) {
  const now = new Date();
  const end = startOfDayUTC(now);
  const start = addDaysUTC(end, -(days - 1));

  const map = new Map<string, number>();

  for (const p of Array.isArray(timeseries) ? timeseries : []) {
    if (!p || typeof p.date !== 'string') continue;

    const key = toUTCDateKey(p.date);
    if (!key) continue;

    map.set(key, safeNum(p.pageviews));
  }

  const out: Array<{ key: string; label: string; value: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = addDaysUTC(start, i);
    const key = formatISODateUTC(d);

    out.push({
      key,
      label: formatDayLabelUTC(d),
      value: safeNum(map.get(key) ?? 0),
    });
  }
  return out;
}

/** ✅ CZ format pro tooltip: "D. M. YYYY" */
function formatCzFromISODateKey(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return `${d}. ${mo}. ${y}`;
}

function DeviceBigIcon({ device }: { device: 'desktop' | 'mobile' }) {
  const cls = 'h-9 w-9 text-zinc-100';
  if (device === 'desktop') return <Monitor className={cls} />;
  return <Smartphone className={cls} />;
}

/* =========================
   Chart tabs + bar chart (HTML/CSS only)
========================= */

type ChartRange = '14d' | '1m' | '3m';

const CHART_TABS: Array<{ key: ChartRange; label: string; days: number }> = [
  { key: '14d', label: '14 dnů', days: 14 },
  { key: '1m', label: '1 měsíc', days: 30 },
  { key: '3m', label: '3 měsíce', days: 90 },
];

function ChartTabs({
  value,
  onChange,
}: {
  value: ChartRange;
  onChange: (v: ChartRange) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl bg-zinc-950/50 p-1 ring-1 ring-zinc-800/60">
      {CHART_TABS.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={[
              'px-3 py-2 text-[12px] rounded-xl transition select-none',
              active
                ? 'bg-zinc-900 text-zinc-100 shadow-sm ring-1 ring-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40',
            ].join(' ')}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function VisitsBarChart({
  bars,
  loading,
}: {
  bars: Array<{ key: string; label: string; value: number }>;
  loading: boolean;
}) {
  const max = Math.max(1, ...bars.map((x) => safeNum(x.value)));
  const sum = bars.reduce((a, b) => a + safeNum(b.value), 0);

  const gapClass = bars.length <= 30 ? 'gap-2' : 'gap-1';
  const empty = sum === 0;

  // ✅ dense = 1m a 3m (tenké sloupce → solid bar, bez ringu)
  const dense = bars.length > 30;

  return (
    <div className="rounded-2xl bg-zinc-900/30 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs text-zinc-400">Návštěvnost</h4>
        <div className="text-[11px] text-zinc-500">
          {loading ? 'načítám…' : 'zobrazení stránky'}
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-44 overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-800/80" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 right-0 top-1/4 h-px bg-zinc-800/30" />
            <div className="absolute left-0 right-0 top-2/4 h-px bg-zinc-800/30" />
            <div className="absolute left-0 right-0 top-3/4 h-px bg-zinc-800/30" />
          </div>

          <div className={['absolute inset-0 h-full flex items-end', gapClass].join(' ')}>
            {bars.map((b) => {
              const v = safeNum(b.value);
              const pct = clamp((v / max) * 100, 0, 100);

              return (
                <div key={b.key} className="flex-1 min-w-0 h-full flex flex-col items-center">
                  <div className="w-full flex-1 h-full flex items-end justify-center">
                    <div
                      className={[
                        'relative w-full h-full flex items-end justify-center group',
                        dense ? 'px-[1px]' : 'px-[2px]',
                      ].join(' ')}
                    >
                      {/* ✅ tooltip (CZ format) – jen hover, uvnitř grafu (nepřesahuje) */}
                      <div
                        className={[
                          'pointer-events-none absolute top-2 left-1/2 -translate-x-1/2',
                          'z-20 opacity-0 group-hover:opacity-100 transition',
                          'rounded-xl bg-zinc-950/80 px-2.5 py-1.5',
                          'text-[11px] text-zinc-100 ring-1 ring-zinc-800/60',
                          'whitespace-nowrap',
                        ].join(' ')}
                      >
                        <span className="text-zinc-300">{formatCzFromISODateKey(b.key)}</span>
                        <span className="mx-1 text-zinc-500">•</span>
                        <span className="tabular-nums">{loading ? '—' : v}</span>
                      </div>

                      {/* ✅ sloupec */}
                      <div
                        className={[
                          'relative',
                          dense ? 'rounded-[2px]' : 'rounded-sm',
                          dense
                            ? 'bg-blue-600' // ✅ vždy viditelně modré i na 1–2px
                            : 'bg-gradient-to-t from-blue-600 via-blue-700 to-blue-800',
                          dense ? '' : 'ring-1 ring-blue-300/15',
                          loading ? 'opacity-40' : 'opacity-100',
                          'transition-opacity',
                          dense ? 'min-w-[2px]' : 'w-full',
                        ].join(' ')}
                        style={{
                          height: `${pct}%`,
                          minHeight: v > 0 ? 6 : 3,
                          width: dense ? 2 : undefined,
                        }}
                        aria-label={`${formatCzFromISODateKey(b.key)}: ${v} zobrazení`}
                      />
                    </div>
                  </div>

                  {/* ✅ vždy bez popisků dole – jen hover */}
                  <div className="h-4" />
                </div>
              );
            })}
          </div>

          {empty && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-zinc-950/60 px-3 py-2 text-[12px] text-zinc-300 ring-1 ring-zinc-800/60">
                Pro tento rozsah nejsou zatím data.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Device donut + cards
========================= */

function DeviceDonut({ pct }: { pct: number }) {
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
            stroke="rgb(39 39 42)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgb(244 244 245)"
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
          <DeviceDonut pct={pct} />
        </div>
        <div className="text-2xl font-semibold text-zinc-100">{count}</div>
        <div className="mt-1 text-[11px] text-zinc-400">{mutedLabel}</div>
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

function SkeletonChart() {
  return (
    <div className="rounded-2xl bg-zinc-900/30 p-4 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-zinc-800" />
        <div className="h-9 w-72 rounded-2xl bg-zinc-950/40 ring-1 ring-zinc-800/50" />
      </div>
      <div className="h-44 rounded-xl bg-zinc-950/40 ring-1 ring-zinc-800/50" />
      <div className="mt-3 h-3 w-72 rounded bg-zinc-800/60" />
    </div>
  );
}

/* =========================
   Component
========================= */

export default function AnalyticsPanel() {
  const { projectId } = useParams() as { projectId: string };

  // KPI range napevno
  const [range] = useState<RangeKey>('7d');

  // ✅ Chart range jen 14d / 1m / 3m
  const [chartRange, setChartRange] = useState<'14d' | '1m' | '3m'>('14d');

  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  const [chartTimeseries, setChartTimeseries] = useState<TimeseriesPoint[]>([]);

  const cacheRef = useRef<Partial<Record<RangeKey, AnalyticsSummary>>>({});
  const chartCacheRef = useRef<Partial<Record<'14d' | '1m' | '3m', TimeseriesPoint[]>>>({});

  // refresh UI state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshOk, setRefreshOk] = useState(false);
  const [refreshErr, setRefreshErr] = useState<string | null>(null);

  async function fetchSummary(r: RangeKey): Promise<AnalyticsSummary> {
    const res = await fetch(`/api/v1/analytics/summary?projectId=${projectId}&range=${r}`, {
      method: 'GET',
      cache: 'no-store',
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || 'Nepodařilo se načíst analytiku.');

    const rawTs = json.timeseries ?? [];
    const ts = normalizeTimeseries(rawTs);

    const normalized: AnalyticsSummary = {
      pageviews: json.pageviews ?? 0,
      unique: json.unique ?? 0,
      avg_duration_ms: json.avg_duration_ms ?? 0,
      avg_scroll: json.avg_scroll ?? 0,
      by_referrer: Array.isArray(json.by_referrer) ? json.by_referrer : [],
      by_country: Array.isArray(json.by_country) ? json.by_country : [],
      by_device: Array.isArray(json.by_device) ? json.by_device : [],
      timeseries: ts,
    };

    return normalized;
  }

  async function loadKpi(r: RangeKey) {
    setError(null);

    const cached = cacheRef.current[r];
    if (cached) setData(cached);
    else setLoading(true);

    try {
      const normalized = cached ?? (await fetchSummary(r));
      cacheRef.current[r] = normalized;
      setData(normalized);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Chyba při načítání dat.');
    } finally {
      setLoading(false);
    }
  }

  function chartRangeToApiRange(cr: '14d' | '1m' | '3m'): RangeKey {
    if (cr === '14d') return '30d'; // posledních 14 z 30
    if (cr === '1m') return '30d';
    return '90d'; // 3m
  }

  async function loadChart(cr: '14d' | '1m' | '3m') {
    if (!projectId) return;

    setChartLoading(true);

    const cached = chartCacheRef.current[cr];
    if (cached) {
      setChartTimeseries(cached);
      setChartLoading(false);
      return;
    }

    try {
      const apiRange = chartRangeToApiRange(cr);
      const summary = await fetchSummary(apiRange);

      cacheRef.current[apiRange] = summary;

      const ts = Array.isArray(summary.timeseries) ? summary.timeseries : [];
      chartCacheRef.current[cr] = ts;

      setChartTimeseries(ts);
    } catch (e: any) {
      setError(e?.message || 'Chyba při načítání grafu.');
      setChartTimeseries([]);
    } finally {
      setChartLoading(false);
    }
  }

  async function hardRefresh() {
    if (!projectId || refreshing) return;

    setRefreshErr(null);
    setRefreshOk(false);
    setRefreshing(true);

    try {
      cacheRef.current = {};
      chartCacheRef.current = {};

      await Promise.all([loadKpi(range), loadChart(chartRange)]);

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
      await Promise.all([loadKpi(range), loadChart(chartRange)]);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void loadChart(chartRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartRange, projectId]);

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
      rows.find((x) => (x.device_category || '').toLowerCase() === 'desktop')?.count ?? 0;
    const mobile =
      rows.find((x) => (x.device_category || '').toLowerCase() === 'mobile')?.count ?? 0;

    const total = Math.max(1, safeNum(desktop) + safeNum(mobile));

    return {
      desktop: safeNum(desktop),
      mobile: safeNum(mobile),
      desktopPct: (safeNum(desktop) / total) * 100,
      mobilePct: (safeNum(mobile) / total) * 100,
    };
  }, [data]);

  const showSkeleton = loading && !data;

  const chartBars = useMemo(() => {
    const days = CHART_TABS.find((t) => t.key === chartRange)?.days ?? 14;
    return buildDailyBarsUTC(chartTimeseries, days);
  }, [chartTimeseries, chartRange]);

  return (
    <div className="h-full px-4 py-5 space-y-5 bg-zinc-950">
      <div className="flex flex-col gap-6 overflow-y-auto pb-10">
        {/* Chart */}
        {showSkeleton ? (
          <SkeletonChart />
        ) : (
          <div className="rounded-2xl bg-zinc-900/30 p-4 overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <div className="text-xs text-zinc-400">Návštěvnost</div>
                  <div className="text-[11px] text-zinc-500">zobrazení stránky</div>
                </div>

                <button
                  type="button"
                  onClick={hardRefresh}
                  disabled={refreshing}
                  title="Refresh statistiky"
                  aria-label="Refresh statistiky"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950/40 text-zinc-200 hover:bg-zinc-950/70 transition disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-zinc-800/60"
                >
                  <RefreshCcw className={['h-5 w-5', refreshing ? 'animate-spin' : ''].join(' ')} />
                </button>
              </div>

              <ChartTabs value={chartRange} onChange={setChartRange as any} />
            </div>

            <div className="mt-4">
              <VisitsBarChart bars={chartBars} loading={chartLoading || refreshing} />
            </div>
          </div>
        )}

        {!showSkeleton && error && (
          <div className="rounded-2xl bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
        )}

        {!showSkeleton && refreshErr && (
          <div className="rounded-2xl bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {refreshErr}
          </div>
        )}

        {!showSkeleton && refreshOk && (
          <div className="rounded-2xl bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
            Aktualizováno
          </div>
        )}

        {/* Skeleton */}
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

        {/* Content */}
        {!showSkeleton && data && (
          <>
            {/* KPI */}
            <section className="rounded-3xl flex flex-col gap-10">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-900/30 p-4">
                  <p className="mb-1 text-xs text-zinc-400">Zobrazení stránky</p>
                  <p className="text-2xl font-semibold text-zinc-100">{data.pageviews}</p>
                </div>

                <div className="rounded-2xl bg-zinc-900/30 p-4">
                  <p className="mb-1 text-xs text-zinc-400">Unikátní návštěvníci</p>
                  <p className="text-2xl font-semibold text-zinc-100">{data.unique}</p>
                </div>

                <div className="rounded-2xl bg-zinc-900/30 p-4">
                  <p className="mb-1 text-xs text-zinc-400">Průměrná délka návštěvy</p>
                  <p className="text-2xl font-semibold text-zinc-100">{readableDuration}</p>
                </div>

                <div className="rounded-2xl bg-zinc-900/30 p-4">
                  <p className="mb-1 text-xs text-zinc-400">Průměrný scroll</p>
                  <p className="text-2xl font-semibold text-zinc-100">{data.avg_scroll ?? 0}%</p>
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
                    mutedLabel="návštěv z počítače"
                    count={deviceStats.desktop}
                    pct={deviceStats.desktopPct}
                    icon={<DeviceBigIcon device="desktop" />}
                  />

                  <DeviceCard
                    title="Mobile"
                    mutedLabel="návštěv z telefonu"
                    count={deviceStats.mobile}
                    pct={deviceStats.mobilePct}
                    icon={<DeviceBigIcon device="mobile" />}
                  />
                </div>
              </div>
            </section>

            {/* Bottom refresh */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={hardRefresh}
                disabled={refreshing}
                title="Refresh statistiky"
                aria-label="Refresh statistiky"
                className="inline-flex mx-auto h-9 w-9 items-center justify-center rounded-xl bg-zinc-900/40 text-zinc-200 hover:bg-zinc-900/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCcw className={['h-5 w-5', refreshing ? 'animate-spin' : ''].join(' ')} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
