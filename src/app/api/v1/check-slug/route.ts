import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ available: false });

  const sb = await supabaseServer();
  const { data } = await sb.from("projects").select("id").eq("slug", slug).maybeSingle();
  return NextResponse.json({ available: !data });
}
