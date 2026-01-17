import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  await requireUser();
  const supabase = await supabaseServer();

  const body = await req.json().catch(() => ({}));
  const pageId = body?.pageId;

  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }

  // 1) Load draft
  const { data: page, error: readErr } = await supabase
    .from("pages")
    .select("id, project_id, draft_json, path")
    .eq("id", pageId)
    .eq("project_id", params.projectId)
    .single();

  if (readErr || !page) {
    return NextResponse.json(
      { error: readErr?.message || "Page not found" },
      { status: 404 }
    );
  }

  // Optional: block publishing empty draft (prevents “Žádný obsah…”)
  const draft = page.draft_json ?? null;
  const hasSections =
    !!draft &&
    typeof draft === "object" &&
    Array.isArray((draft as any).sections) &&
    (draft as any).sections.length > 0;

  // Pokud chceš povolit publish i prázdné stránky, smaž tenhle blok
  if (!hasSections) {
    return NextResponse.json(
      { error: "Draft has no sections to publish." },
      { status: 400 }
    );
  }

  // 2) Publish page = copy draft -> published
  const { error: upPageErr } = await supabase
    .from("pages")
    .update({
      published_json: draft,
      published_at: new Date().toISOString(),
    })
    .eq("id", pageId)
    .eq("project_id", params.projectId);

  if (upPageErr) {
    return NextResponse.json({ error: upPageErr.message }, { status: 500 });
  }

  // 3) Mark project as published (important for public rendering)
  const { error: upProjectErr } = await supabase
    .from("projects")
    .update({
      status: "published",
    })
    .eq("id", params.projectId);

  if (upProjectErr) {
    return NextResponse.json({ error: upProjectErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
