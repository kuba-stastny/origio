// src/app/api/v1/projects/[projectId]/save-draft/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

type RouteParams = { projectId: string };

/**
 * ✅ DŮLEŽITÉ:
 * - Zod defaultně STRIPUJE neznámé klíče.
 * - Když sem pošleš title, bez schema/passthrough se zahodí => v DB nebude.
 *
 * Fix:
 * - přidat title (optional)
 * - + passthrough, ať ti nezmizí další budoucí fields
 */
const SectionSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    version: z.number(),
    data: z.unknown(),
    title: z.string().optional().nullable(), // ✅ FIX: zachovej title
  })
  .passthrough(); // ✅ FIX: nezahazuj další custom fields

const BodySchema = z.object({
  pageId: z.string().min(1, "pageId is required"),
  sections: z.array(SectionSchema),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { projectId } = await context.params;

  const user = await getUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await supabaseServer();

  // --- body ---
  const raw = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Body must be JSON and valid", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { pageId, sections } = parsed.data;

  // --- projekt + členství ---
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .eq("id", projectId)
    .maybeSingle();

  if (pErr || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: membership, error: mErr } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", project.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (mErr) {
    return NextResponse.json(
      { error: "Membership check failed" },
      { status: 500 }
    );
  }
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- ověř stránku v rámci projektu ---
  const { data: page, error: sErr } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (sErr || !page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // --- ulož do draft_json ---
  // ✅ drž konzistentní tvar docu
  const draftPayload = { version: 1, sections };

  const now = new Date().toISOString();

  const { error: updErr } = await supabase
    .from("pages")
    .update({
      draft_json: draftPayload,
      draft_saved_at: now,
      updated_at: now,
    })
    .eq("id", pageId)
    .eq("project_id", projectId);

  if (updErr) {
    return NextResponse.json(
      { error: updErr.message || "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
