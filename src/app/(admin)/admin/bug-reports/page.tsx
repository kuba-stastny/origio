// src/app/(admin)/admin/bug-reports/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import BugReportsClient, { type BugRow } from "./BugReportsClient";

export const dynamic = "force-dynamic";

function asStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);

  try {
    const parsed = typeof v === "string" ? JSON.parse(v) : v;
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}

  return [];
}

export default async function AdminBugReportsPage() {
  const supabase = await supabaseServer();

  const { data: reports, error } = await supabase
    .from("bug_reports")
    .select("id, created_at, message, screenshot_urls")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) console.error("[admin/bug-reports] bug_reports error", error);

  const rows: BugRow[] =
    (reports ?? []).map((r: any) => ({
      id: String(r.id),
      created_at: r.created_at ?? null,
      message: r.message ?? null,
      screenshot_urls: asStringArray(r.screenshot_urls),
    })) ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Bug reports</h1>
        <p className="text-sm text-zinc-400">Kdy + zpráva + screenshoty.</p>
      </header>

      <BugReportsClient initial={rows} />
    </div>
  );
}
