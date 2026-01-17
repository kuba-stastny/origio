// src/lib/analytics/repo.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RawEvent, HeatKind, Breakpoint } from "./types";

const TILE_COLS = 64;
const TILE_ROWS = 36;

export function tileIndexFromPct(pct: number, max: number) {
  const i = Math.floor(Number(pct) * max);
  return Math.max(0, Math.min(max - 1, isFinite(i) ? i : 0));
}

export async function createOrTouchSession(
  sb: SupabaseClient,
  params: {
    sessionId?: string | null;
    anonId?: string | null;
    device_type?: string | null;
    os?: string | null;
    country?: string | null;
    region?: string | null;
    city?: string | null;
    ua?: string | null;
  }
): Promise<string> {
  const now = new Date().toISOString();

  // Pokud klient posílá sessionId, nejdřív se pokusíme touchnout.
  if (params.sessionId) {
    const updates: Record<string, any> = { last_seen: now };
    if (params.device_type != null) updates.device_type = params.device_type;
    if (params.os != null) updates.os = params.os;
    if (params.ua != null) updates.ua = params.ua;
    if (params.country != null) updates.country = params.country;
    if (params.region != null) updates.region = params.region;
    if (params.city != null) updates.city = params.city;

    // Zkusíme UPDATE a hned si necháme vrátit affected rows.
    const { data: updRows, error: updErr } = await sb
      .from("analytics_sessions")
      .update(updates)
      .eq("id", params.sessionId)
      .select("id");

    if (updErr) throw updErr;

    if (updRows && updRows.length > 0) {
      // Řádek existoval → hotovo
      return params.sessionId;
    }

    // Session s tímhle ID neexistuje → vytvoříme ji se STEJNÝM id (fix FK problémů)
    const { data: insRow, error: insErr } = await sb
      .from("analytics_sessions")
      .insert({
        id: params.sessionId,                 // <- DŮLEŽITÉ: explicitně použít stejné ID
        anon_id: params.anonId ?? null,
        device_type: params.device_type ?? null,
        os: params.os ?? null,
        country: params.country ?? null,
        region: params.region ?? null,
        city: params.city ?? null,
        ua: params.ua ?? null,
        last_seen: now,
      })
      .select("id")
      .single();

    // race-condition: kdyby mezi UPDATE a INSERT session vznikla, může přijít unique violation → ignorujeme
    // @ts-ignore (kód chyby je driver-specific)
    if (insErr && insErr.code !== "23505") throw insErr;

    return (insRow?.id as string) || (params.sessionId as string);
  }

  // Bez sessionId → vytvoříme novou (auto UUID)
  const { data, error } = await sb
    .from("analytics_sessions")
    .insert({
      anon_id: params.anonId ?? null,
      device_type: params.device_type ?? null,
      os: params.os ?? null,
      country: params.country ?? null,
      region: params.region ?? null,
      city: params.city ?? null,
      ua: params.ua ?? null,
      last_seen: now,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function insertPageview(
  sb: SupabaseClient,
  params: {
    sessionId: string;
    projectId: string;
    pageId: string;
    path: string;
    referrer?: string | null;
    utm?: Record<string, unknown> | null;
    screen?: { w: number; h: number } | null;
    viewport?: { w: number; h: number } | null;
    device_type?: string | null;
    os?: string | null;
    country?: string | null;
    region?: string | null;
    city?: string | null;
  }
): Promise<string> {
  const { data, error } = await sb
    .from("analytics_pageviews")
    .insert({
      session_id: params.sessionId,
      project_id: params.projectId,
      page_id: params.pageId,
      path: params.path,
      referrer: params.referrer ?? null,
      utm: params.utm ?? null,
      screen: params.screen ?? null,
      viewport: params.viewport ?? null,
      device_type: params.device_type ?? null,
      os: params.os ?? null,
      country: params.country ?? null,
      region: params.region ?? null,
      city: params.city ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function insertRawEvents(
  sb: SupabaseClient,
  pageviewId: string,
  sessionId: string | null | undefined,
  events: RawEvent[]
) {
  if (!events.length) return;
  const rows = events.map((e) => ({
    session_id: sessionId ?? null,
    pageview_id: pageviewId,
    ts: e.ts ? new Date(e.ts).toISOString() : new Date().toISOString(),
    name: e.type,
    props: e.data ?? null,
  }));
  const { error } = await sb.from("analytics_events").insert(rows);
  if (error) throw error;
}

export async function updateAggregatesFromEvents(
  sb: SupabaseClient,
  pageviewId: string,
  current: {
    scroll_depth: number | null;
    duration_ms: number | null;
    clicks_count: number;
    clicks_top: Record<string, number> | null;
    sections_ms: Record<string, number> | null;
  },
  events: RawEvent[]
) {
  let maxScroll = current.scroll_depth ?? 0;
  let finalDuration = current.duration_ms ?? null;
  let clicksCount = current.clicks_count ?? 0;
  const top: Record<string, number> = { ...(current.clicks_top ?? {}) };
  const sections: Record<string, number> = { ...(current.sections_ms ?? {}) };

  for (const e of events) {
    if (e.type === "scroll" && e.data?.["depthPct"] != null) {
      const v = Math.round(Number(e.data["depthPct"]));
      if (isFinite(v)) maxScroll = Math.max(maxScroll, v);
    }
    if (e.type === "end" && typeof e.data?.["durationMs"] === "number") {
      const d = Math.max(0, Math.round(Number(e.data["durationMs"])));
      if (isFinite(d)) finalDuration = d;
    }
    if (e.type === "section_time" && e.data) {
      for (const [k, v] of Object.entries(e.data)) {
        const ms = Math.max(0, Number(v) | 0);
        if (!k) continue;
        sections[k] = (sections[k] || 0) + ms;
      }
    }
    if (e.type === "click") {
      clicksCount += 1;
      const sel =
        (e.data?.["selector"] && String(e.data["selector"]).slice(0, 120)) ||
        "other";
      top[sel] = (top[sel] || 0) + 1;
    }
  }

  const sortedTop = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 30);

  const updates: any = {
    last_seen: new Date().toISOString(),
    scroll_depth: maxScroll,
    clicks_count: clicksCount,
    sections_ms: sections,
    clicks_top: Object.fromEntries(sortedTop),
  };
  if (finalDuration !== null) updates.duration_ms = finalDuration;

  const { error } = await sb
    .from("analytics_pageviews")
    .update(updates)
    .eq("id", pageviewId);
  if (error) throw error;
}

export async function upsertHeatTiles(
  sb: SupabaseClient,
  ctx: { project_id: string; page_id: string; path: string },
  items: Array<{ bp: Breakpoint; kind: HeatKind; x_pct: number; y_pct: number; count?: number }>
) {
  if (!items.length) return;
  const acc = new Map<string, number>();
  for (const it of items) {
    const x = tileIndexFromPct(Number(it.x_pct || 0), TILE_COLS);
    const y = tileIndexFromPct(Number(it.y_pct || 0), TILE_ROWS);
    const key = `${it.bp}|${it.kind}|${x}|${y}`;
    acc.set(key, (acc.get(key) || 0) + (it.count ?? 1));
  }
  const rows = Array.from(acc.entries()).map(([k, cnt]) => {
    const [bp, kind, xs, ys] = k.split("|");
    return {
      project_id: ctx.project_id,
      page_id: ctx.page_id,
      path: ctx.path,
      breakpoint: bp,
      kind,
      x: Number(xs),
      y: Number(ys),
      count: cnt,
    };
  });

  const { error } = await sb
    .from("analytics_heat_tiles")
    .upsert(rows, {
      onConflict: "project_id,page_id,path,breakpoint,kind,x,y",
    })
    .select("count");
  if (error) throw error;
}
