import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { slugify } from "@/lib/url";

/**
 * GET /api/v1/workspaces
 * Vrátí seznam workspace, kde je aktuální uživatel členem (včetně role).
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await supabaseServer();

  const { data: memberships, error: mErr } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id);

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  if (!memberships?.length) return NextResponse.json([]);

  const ids = memberships.map((m) => m.workspace_id);
  const { data: workspaces, error: wErr } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_at")
    .in("id", ids);

  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });

  const roleById = new Map(memberships.map((m) => [m.workspace_id, m.role]));
  const result = (workspaces ?? []).map((w) => ({ ...w, role: roleById.get(w.id) }));

  return NextResponse.json(result);
}

/**
 * POST /api/v1/workspaces
 * Body: { name: string }
 * Vytvoří workspace a přidá aktuálního uživatele jako ownera.
 * Řeší kolizi slug přes jednoduchý retry se suffixem.
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  // slug s jednoduchým retry při kolizi unikátního indexu
  const baseSlug = slugify(name);
  let attempt = 0;
  let ws:
    | { id: string; name: string; slug: string; created_at: string }
    | null = null;

  while (attempt < 3 && !ws) {
    const candidate =
      attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, slug: candidate, created_by: user.id })
      .select("id, name, slug, created_at")
      .single();

    if (!error && data) {
      ws = data;
      break;
    }

    // 23505 = unique_violation (např. kolize slug)
    if (error && (error as any).code === "23505") {
      attempt++;
      continue;
    }

    // jiná chyba
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!ws) {
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }

  // Přidej aktuálního uživatele jako ownera
  const { error: mErr } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: ws.id, user_id: user.id, role: "owner" });

  if (mErr) {
    return NextResponse.json(
      { error: `Workspace created but failed to add membership: ${mErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json(ws, { status: 201 });
}
