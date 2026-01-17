// src/app/api/v1/migrations/health/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { migrateDocumentToLatest } from "@/lib/migrations";

function deepEqual(a: any, b: any) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await supabaseServer();

  // Vytáhneme všechny stránky, na které má uživatel přístup (RLS to omezí)
  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, project_id, page_json")
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let total = 0;
  let wouldChange = 0;
  const details: Array<{ id: string; project_id: string; changed: boolean }> = [];

  for (const p of pages ?? []) {
    total++;
    const raw = (p.page_json as any) ?? { version: 1, sections: [] };
    const { doc: latest, changed } = migrateDocumentToLatest(raw);
    if (changed || !deepEqual(raw, latest)) {
      wouldChange++;
      details.push({ id: p.id, project_id: p.project_id, changed: true });
    }
  }

  return NextResponse.json({
    ok: true,
    totalPages: total,
    wouldChange,
    samples: details.slice(0, 50), // omezíme výstup
  });
}
