// app/api/v1/analytics/summary/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const workspaceId = searchParams.get("workspaceId"); // volitelné

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing 'projectId' in query" },
      { status: 400 }
    );
  }

  const supabase = await supabaseServer();

  // posledních 30 dní
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  let query = supabase
    .from("analytics_pageviews")
    .select(
      "workspace_id, project_id, path, session_id, visitor_id, referrer, country, device_category, os, duration_ms, scroll_depth, occurred_at"
    )
    .eq("project_id", projectId)
    .gte("occurred_at", sinceIso)
    .order("occurred_at", { ascending: false });

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("analytics summary error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];

  const pageviews = rows.length;

  // unikátní
  const uniqueSet = new Set<string>();
  for (const r of rows) {
    if (r.visitor_id) uniqueSet.add(r.visitor_id);
  }
  const unique = uniqueSet.size;

  // agregace s omezením
  // bereme jen duration 1ms – 300000ms (5 min), aby to neskákalo
  const MAX_DURATION = 300_000; // 5 minutes in ms
  let durationSum = 0;
  let durationCount = 0;

  let scrollSum = 0;
  let scrollCount = 0;

  const byReferrerMap = new Map<string, number>();
  const byCountryMap = new Map<string, number>();
  const byDeviceMap = new Map<string, number>();

  for (const r of rows) {
    const dur = typeof r.duration_ms === "number" ? r.duration_ms : null;
    if (dur && dur > 0 && dur <= MAX_DURATION) {
      durationSum += dur;
      durationCount += 1;
    }

    const scroll = typeof r.scroll_depth === "number" ? r.scroll_depth : null;
    if (scroll !== null && scroll >= 0 && scroll <= 100) {
      scrollSum += scroll;
      scrollCount += 1;
    }

    const ref = r.referrer || "(direct)";
    byReferrerMap.set(ref, (byReferrerMap.get(ref) || 0) + 1);

    const c = r.country || "Unknown";
    byCountryMap.set(c, (byCountryMap.get(c) || 0) + 1);

    const d = r.device_category || "other";
    byDeviceMap.set(d, (byDeviceMap.get(d) || 0) + 1);
  }

  const avg_duration_ms =
    durationCount > 0 ? Math.round(durationSum / durationCount) : 0;
  const avg_scroll = scrollCount > 0 ? Math.round(scrollSum / scrollCount) : 0;

  const by_referrer = Array.from(byReferrerMap.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const by_country = Array.from(byCountryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const by_device = Array.from(byDeviceMap.entries())
    .map(([device_category, count]) => ({ device_category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    pageviews,
    unique,
    avg_duration_ms,
    avg_scroll,
    by_referrer,
    by_country,
    by_device,
    range: {
      from: sinceIso,
      to: new Date().toISOString(),
    },
  });
}
