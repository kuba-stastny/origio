import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  await requireUser();
  const supabase = await supabaseServer();

  const url = new URL(req.url);
  const pageId = url.searchParams.get("pageId");
  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pages")
    .select("id, project_id, draft_json, published_json")
    .eq("id", pageId)
    .eq("project_id", params.projectId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Page not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: data.id,
    project_id: data.project_id,
    draft_json: data.draft_json ?? null,
    published_json: data.published_json ?? null,
  });
}
