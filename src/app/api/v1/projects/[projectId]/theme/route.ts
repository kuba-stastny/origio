// src/app/api/v1/projects/[projectId]/theme/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { DesignSystemJson } from "@/types/design-system";

type ThemeJson = DesignSystemJson | null;

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  await requireUser();
  const supabase = await supabaseServer();
  const { projectId } = params;

  const { data: page, error } = await supabase
    .from("pages")
    .select("id, theme_json")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("GET /theme error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se načíst theme." },
      { status: 500 }
    );
  }

  const theme = (page?.theme_json as ThemeJson) ?? null;

  return NextResponse.json({ theme_json: theme });
}

export async function PUT(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  await requireUser();
  const supabase = await supabaseServer();
  const { projectId } = params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const theme = body?.theme_json as ThemeJson;

  if (!theme || typeof theme !== "object") {
    return NextResponse.json(
      { error: "Chybí nebo je neplatný objekt theme." },
      { status: 400 }
    );
  }

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pageError) {
    console.error("PUT /theme – load page error:", pageError);
    return NextResponse.json(
      { error: "Nepodařilo se načíst stránku projektu." },
      { status: 500 }
    );
  }

  if (!page?.id) {
    return NextResponse.json(
      { error: "Projekt zatím nemá žádnou stránku." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("pages")
    .update({ theme_json: theme })
    .eq("id", page.id);

  if (updateError) {
    console.error("PUT /theme – update error:", updateError);
    return NextResponse.json(
      { error: "Nepodařilo se uložit theme." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
