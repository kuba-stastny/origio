// src/app/api/v1/projects/[projectId]/reset-page/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { projectId } = context.params;

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId in URL." },
      { status: 400 }
    );
  }

  const supabase = await supabaseServer();

  // ověř uživatele – RLS pohlídá zbytek
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // najdi stránku podle project_id (předpoklad: 1 page na projekt)
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id")
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle();

  if (pageError) {
    console.error("Error loading page:", pageError);
    return NextResponse.json(
      { error: "Nepodařilo se najít stránku." },
      { status: 500 }
    );
  }

  // pokud projekt zatím žádnou page nemá, success
  // (ALE analytiku pro projekt resetneme stejně)
  const { error: analyticsError } = await supabase
    .from("analytics_pageviews")
    .delete()
    .eq("project_id", projectId);

  if (analyticsError) {
    console.error("Error deleting analytics for project:", analyticsError);
    return NextResponse.json(
      { error: "Failed to reset analytics for project." },
      { status: 500 }
    );
  }

  if (!page) {
    return NextResponse.json({
      success: true,
      note: "No page to delete (analytics reset done).",
    });
  }

  // smaž samotnou page
  const { error: deleteError } = await supabase
    .from("pages")
    .delete()
    .eq("id", page.id);

  if (deleteError) {
    console.error("Error deleting page:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete page." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
