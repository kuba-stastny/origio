// app/api/v1/account/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";


export async function GET() {
  const user = await requireUser();

  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: (user.user_metadata?.full_name as string | undefined) ?? "",
    raw_metadata: user.user_metadata ?? {},
  });
}

// Base URL z env nebo z hlaviček požadavku
function getBaseUrlFromReq(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  return host ? `${proto}://${host}` : "";
}

// PATCH /api/v1/account — jméno / e-mail / heslo
export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const supabase = await supabaseServer();

    const body = await req.json().catch(() => ({}));
    const full_name =
      typeof body?.full_name === "string" ? body.full_name.trim() : undefined;
    const email = typeof body?.email === "string" ? body.email.trim() : undefined;
    const password =
      typeof body?.password === "string" ? body.password : undefined;

    if (!full_name && !email && !password) {
      return NextResponse.json(
        { error: "Nebylo předáno nic ke změně." },
        { status: 400 }
      );
    }

    const payload: any = {};
    if (full_name !== undefined)
      payload.data = { ...(user?.user_metadata ?? {}), full_name };
    if (email) payload.email = email;
    if (password) payload.password = password;

    const options: any = {};
    if (email) {
      const base = getBaseUrlFromReq(req);
      if (base) options.emailRedirectTo = `${base}/auth/callback`;
    }

    const { error } = await supabase.auth.updateUser(payload, options);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Update selhal." },
      { status: 400 }
    );
  }
}

// DELETE /api/v1/account — bez admina → soft delete + odhlášení
export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const supabase = await supabaseServer();

    // (Volitelně) tvoje RPC pro kaskádní úklid dat
    const { error: rpcErr } = await supabase.rpc("app_delete_current_user");
    if (rpcErr && rpcErr.code !== "PGRST116") throw rpcErr;

    // Označit profil jako smazaný (uprav názvy tabulek/sloupců podle DB)
    await supabase
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
        is_deleted: true,
      })
      .eq("id", user.id)
      .throwOnError();

    // Odhlášení (server klient umí cookies vyčistit v route handleru)
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true, softDeleted: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Delete selhal." },
      { status: 400 }
    );
  }
}
