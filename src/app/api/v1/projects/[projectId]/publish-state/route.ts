import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

function stableStringify(value: any): string {
  const seen = new WeakSet();
  const norm = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return "[Circular]";
    seen.add(v);
    if (Array.isArray(v)) return v.map(norm);
    const keys = Object.keys(v).sort();
    const out: any = {};
    for (const k of keys) out[k] = norm(v[k]);
    return out;
  };
  return JSON.stringify(norm(value));
}

type PublishMode = "publish" | "publish_changes" | "published";

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

  const draft = data.draft_json ?? null;
  const published = data.published_json ?? null;
  const hasPublished = published != null;

  const same =
    hasPublished && stableStringify(draft) === stableStringify(published);

  const mode: PublishMode = !hasPublished
    ? "publish"
    : same
    ? "published"
    : "publish_changes";

  // ✅ IMPORTANT: published snapshot (sections) for client store
  const publishedSections =
    (published as any)?.sections && Array.isArray((published as any).sections)
      ? (published as any).sections
      : null;

  return NextResponse.json({
    mode,
    hasPublished,
    same,
    publishedSections,
  });
}
