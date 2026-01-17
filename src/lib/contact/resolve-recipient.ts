import type { Recipient } from "./types";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !service) {
    throw new Error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getEmailFromAuthUserId(userId: string) {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) throw error;

  return data?.user?.email ?? null;
}

/**
 * PUBLIC resolver: slug -> project (must be published) -> recipient
 * Publish check uses `projects.status` (your schema).
 */
export async function resolveRecipientBySlug(slug: string): Promise<Recipient | null> {
  const supabase = getAdminSupabase();

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, slug, workspace_id, status")
    .eq("slug", slug)
    .maybeSingle();

  if (projErr) throw projErr;
  if (!project) return null;

  // ✅ PUBLISH CHECK (adjust enum value if your published value is different)
  // Common: 'published' | 'live' | 'public'
  if (String(project.status) !== "published") return null;

  return resolveRecipientByProjectId(project.id);
}

export async function resolveRecipientByProjectId(
  projectId: string
): Promise<Recipient | null> {
  const supabase = getAdminSupabase();

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, slug, workspace_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projErr) throw projErr;
  if (!project) return null;

  const { data: ws, error: wsErr } = await supabase
    .from("workspaces")
    .select("id, created_by")
    .eq("id", project.workspace_id)
    .maybeSingle();

  if (wsErr) throw wsErr;
  if (!ws?.created_by) return null;

  const email = await getEmailFromAuthUserId(ws.created_by);
  if (!email) return null;

  return {
    projectId: project.id,
    projectSlug: project.slug,
    workspaceId: project.workspace_id,
    ownerUserId: ws.created_by,
    toEmail: email,
  };
}
