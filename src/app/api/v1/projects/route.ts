// vytvoří jen projekt; name + slug jsou náhodné
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

function rand(alphaNumLen = 8) {
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < alphaNumLen; i++) s += abc[(Math.random() * abc.length) | 0];
  return s;
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: any = {};
  try { payload = await req.json(); } catch {}
  const workspaceId: string = (payload?.workspaceId || "").trim();
  if (!workspaceId) return NextResponse.json({ error: "Missing 'workspaceId'" }, { status: 400 });

  const supabase = await supabaseServer();

  // ověř členství (RLS guard)
  const { data: membership, error: mErr } = await supabase
    .from("workspace_members").select("role")
    .eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  if (mErr) return NextResponse.json({ error: "Membership check failed" }, { status: 500 });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // náhodné jméno + slug (nezávislé na názvu od klienta)
  const token = rand(10);                           // např. "f7j2k1p9qz"
  const name  = `Projekt ${token}`;                 // např. "Projekt f7j2k1p9qz"
  const slug  = token;                              // slug = čistě náhodný řetězec

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspaceId,
      name,
      slug,
      status: "draft",
      purpose: payload?.purpose ?? "other",
      brief: payload?.brief ?? null,
    })
    .select("id, slug")
    .single();
  if (pErr || !project) {
    return NextResponse.json({ error: pErr?.message || "Project insert failed" }, { status: 500 });
  }

  // NEzakládáme žádnou stránku → builder pozná „prázdný“ stav a ukáže prompt
  const redirectTo = `/workspaces/${workspaceId}/projects/${project.id}/builder?onboarding=1`;
  return NextResponse.json({ ok: true, projectId: project.id, slug: project.slug, redirectTo }, { status: 201 });
}