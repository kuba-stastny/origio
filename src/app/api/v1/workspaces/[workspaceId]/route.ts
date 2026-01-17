import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { slugify } from "@/lib/url";

type RouteParams = Promise<{ workspaceId: string }>;

/** GET detail workspace (id, name, slug, created_at) */
export async function GET(
  _req: NextRequest,
  context: { params: RouteParams }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await context.params;

  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id,name,slug,created_at")
    .eq("id", workspaceId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

/** PATCH: přejmenování (a přegenerování slugu s fallbackem při kolizi) */
export async function PATCH(
  req: NextRequest,
  context: { params: RouteParams }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await context.params;

  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  const base = slugify(name);
  let attempt = 0;

  while (attempt < 3) {
    const candidate =
      attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await supabase
      .from("workspaces")
      .update({ name, slug: candidate })
      .eq("id", workspaceId)
      .select("id,name,slug,created_at")
      .single();

    if (!error) return NextResponse.json(data);

    // RLS: not owner / forbidden
    if ((error as any)?.message?.includes("violates row-level security")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Unikátní kolize slug (Postgres 23505)
    if ((error as any)?.code === "23505") {
      attempt++;
      continue;
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
}

/** DELETE: vyžaduje body { confirmName }, ověří shodu názvu a smaže (CASCADE) */
export async function DELETE(
  req: NextRequest,
  context: { params: RouteParams }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workspaceId } = await context.params;

  const { confirmName } = (await req.json().catch(() => ({}))) as {
    confirmName?: string;
  };

  if (!confirmName) {
    return NextResponse.json({ error: "Missing confirmName" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  // 1) načti workspace kvůli ověření názvu
  const { data: ws, error: wErr } = await supabase
    .from("workspaces")
    .select("id,name")
    .eq("id", workspaceId)
    .single();

  if (wErr || !ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (ws.name !== confirmName) {
    return NextResponse.json({ error: "Workspace name does not match" }, { status: 400 });
  }

  // 2) smaž (RLS zajistí, že to smí jen owner). FK jsou nastavené ON DELETE CASCADE.
  const { error: dErr } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  if (dErr) {
    if ((dErr as any)?.message?.includes("violates row-level security")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: dErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
