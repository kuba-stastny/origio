import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

type RangeKey = "24h" | "7d" | "30d" | "90d" | "1y";

function clampRange(r: string | null): RangeKey {
  const x = (r || "").toLowerCase();
  if (x === "24h") return "24h";
  if (x === "7d") return "7d";
  if (x === "30d") return "30d";
  if (x === "90d") return "90d";
  if (x === "1y") return "1y";
  return "7d";
}

function rangeToDays(range: RangeKey) {
  if (range === "24h") return 1; // denní bucket (poslední 1 den)
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return 365;
}

export async function GET(req: NextRequest) {
  const user = await getUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") || "";
  const range = clampRange(url.searchParams.get("range"));

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  // 1) project → workspace_id
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .eq("id", projectId)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 2) auth check: user must be workspace member
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", project.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const days = rangeToDays(range);

  /**
   * ✅ VŠECHNO podle occurred_at:
   * - pageviews = count(*)
   * - unique = count(distinct visitor_id)
   * - avg_duration_ms = avg(duration_ms)
   * - avg_scroll = avg(scroll_depth)
   * - by_device/by_country/by_referrer = group by
   * - timeseries = denní buckets (generate_series + left join) + zero fill
   */
  const { data: payload, error: rpcErr } = await supabase.rpc("analytics_summary_v1", {
    p_project_id: projectId,
    p_days: days,
  });

  // Pokud ještě nemáš RPC funkci, fallback na raw SQL přes "sql" nejde (supabase-js)
  // => proto tady RPC.
  if (rpcErr) {
    return NextResponse.json(
      { error: rpcErr.message, hint: "Chybí RPC funkce analytics_summary_v1 (viz SQL níže)." },
      { status: 500 }
    );
  }

  return NextResponse.json(payload ?? {}, { status: 200 });
}
