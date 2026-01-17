import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

type RouteParams = Promise<{ workspaceId: string }>;

export async function GET(_req: NextRequest, context: { params: RouteParams }) {
  const user = await requireUser();
  const { workspaceId } = await context.params;

  const supabase = await supabaseServer();

  // ověř členství
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { error: "Do tohoto workspace nemáte přístup." },
      { status: 403 }
    );
  }

  // načti poslední subscription
  const { data: sub, error: sErr } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sErr) {
    return NextResponse.json(
      { error: sErr.message || "Nepodařilo se načíst předplatné." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    workspaceId,
    subscription: sub ?? null,
  });
}
