import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

async function getFirstPage(supabase: any, projectId: string) {
  const { data, error } = await supabase
    .from("pages")
    .select("id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) return { pageId: null, error };
  const pid = data?.[0]?.id ?? null;
  return { pageId: pid, error: null };
}

export async function POST(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await supabaseServer();
  const projectId = params.projectId;

  // 1) Ověř projekt
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    return NextResponse.json(
      { error: "Projekt nenalezen", supabaseError: projErr?.message },
      { status: 404 }
    );
  }

  // 2) Existující stránka?
  {
    const { pageId, error } = await getFirstPage(supabase, projectId);
    if (!error && pageId) return NextResponse.json({ pageId });
    if (error) {
      return NextResponse.json(
        { error: "Nepodařilo se načíst stránky", supabaseError: error.message },
        { status: 500 }
      );
    }
  }

  // 3) Vytvoř default page
  const candidates = ["/", "/home"];
  let lastErr: any = null;

  for (const pathCandidate of candidates) {
    const { data: inserted, error: insErr } = await supabase
      .from("pages")
      .insert({
        project_id: projectId,
        name: "Domů",
        path: pathCandidate,
      })
      .select("id")
      .single();

    if (!insErr && inserted?.id) {
      return NextResponse.json({ pageId: inserted.id });
    }
    lastErr = insErr;
  }

  // 4) Unikátní fallback
  const uniqPath = `/home-${Math.random().toString(36).slice(2, 7)}`;
  const { data: inserted2, error: insErr2 } = await supabase
    .from("pages")
    .insert({
      project_id: projectId,
      name: "Domů",
      path: uniqPath,
    })
    .select("id")
    .single();

  if (!insErr2 && inserted2?.id) {
    return NextResponse.json({ pageId: inserted2.id });
  }

  // 5) poslední pokus načíst
  {
    const { pageId } = await getFirstPage(supabase, projectId);
    if (pageId) return NextResponse.json({ pageId });
  }

  return NextResponse.json(
    {
      error: "Nepodařilo se vytvořit stránku",
      hint:
        "Zkontroluj RLS policy pro tabulku 'pages' a že neexistují další povinné NOT NULL sloupce.",
      supabaseError: insErr2?.message ?? lastErr?.message,
    },
    { status: 500 }
  );
}
