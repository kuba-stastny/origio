// src/app/(admin)/admin/sites/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import SitesTableClient, { type SiteRow } from "./SitesTableClient";

export const dynamic = "force-dynamic";

function pickAuthorLabel(u: any): string {
  const md = u?.user_metadata ?? {};
  return (
    md.full_name ||
    [md.given_name, md.family_name].filter(Boolean).join(" ") ||
    u?.email ||
    (u?.id ? String(u.id).slice(0, 8) : "—")
  );
}

export default async function AdminSitesPage() {
  const supabase = await supabaseServer();

  // Projects
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select("id, slug, status, workspace_id, created_at")
    .order("created_at", { ascending: false })
    .limit(400);

  if (projErr) console.error("[admin/sites] projects error", projErr);

  // Pages (for onboarding + activity)
  const { data: pages, error: pagesErr } = await supabase
    .from("pages")
    .select("project_id, draft_saved_at, published_at, updated_at")
    .limit(10000);

  if (pagesErr) console.error("[admin/sites] pages error", pagesErr);

  // Aggregate: project -> pagesCount + lastUpdatedAt (+ optional lastDraftAt/lastPublishedAt)
  const pagesAgg = new Map<
    string,
    { pagesCount: number; lastUpdatedAt: string | null; lastDraftAt: string | null; lastPublishedAt: string | null }
  >();

  (pages ?? []).forEach((p: any) => {
    const pid = String(p.project_id);
    const prev =
      pagesAgg.get(pid) ?? { pagesCount: 0, lastUpdatedAt: null, lastDraftAt: null, lastPublishedAt: null };

    prev.pagesCount += 1;

    const u = p.updated_at ? String(p.updated_at) : null;
    const d = p.draft_saved_at ? String(p.draft_saved_at) : null;
    const pub = p.published_at ? String(p.published_at) : null;

    if (u && (!prev.lastUpdatedAt || u > prev.lastUpdatedAt)) prev.lastUpdatedAt = u;
    if (d && (!prev.lastDraftAt || d > prev.lastDraftAt)) prev.lastDraftAt = d;
    if (pub && (!prev.lastPublishedAt || pub > prev.lastPublishedAt)) prev.lastPublishedAt = pub;

    pagesAgg.set(pid, prev);
  });

  // Workspace members -> author user_id (prefer role=owner if exists, else earliest)
  const workspaceIds = Array.from(
    new Set((projects ?? []).map((p: any) => String(p.workspace_id)).filter(Boolean))
  );

  const { data: members, error: memErr } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role, created_at")
    .in("workspace_id", workspaceIds)
    .limit(10000);

  if (memErr) console.error("[admin/sites] workspace_members error", memErr);

  const ownerByWorkspace = new Map<string, string>();
  const earliestByWorkspace = new Map<string, { uid: string; created: string }>();

  (members ?? []).forEach((m: any) => {
    const wid = String(m.workspace_id);
    const uid = String(m.user_id);
    const role = String(m.role || "").toLowerCase();
    const created = String(m.created_at || "");

    if (role === "owner") {
      ownerByWorkspace.set(wid, uid);
      return;
    }

    const ex = earliestByWorkspace.get(wid);
    if (!ex || (created && created < ex.created)) {
      earliestByWorkspace.set(wid, { uid, created });
    }
  });

  const authorUserIdByWorkspace = new Map<string, string>();
  workspaceIds.forEach((wid) => {
    authorUserIdByWorkspace.set(wid, ownerByWorkspace.get(wid) ?? earliestByWorkspace.get(wid)?.uid ?? "");
  });

  // Auth users via Admin API
  const admin = supabaseAdmin();
  const uniqueAuthorIds = Array.from(new Set(Array.from(authorUserIdByWorkspace.values()).filter(Boolean)));

  const authUserById = new Map<string, any>();
  await Promise.all(
    uniqueAuthorIds.map(async (uid) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(uid);
        if (!error && data?.user) authUserById.set(uid, data.user);
      } catch (e) {
        console.error("[admin/sites] auth getUserById failed", uid, e);
      }
    })
  );

  const list: SiteRow[] =
    (projects ?? []).map((p: any) => {
      const pid = String(p.id);
      const wid = String(p.workspace_id);

      const agg =
        pagesAgg.get(pid) ?? { pagesCount: 0, lastUpdatedAt: null, lastDraftAt: null, lastPublishedAt: null };

      // Aktivita: primárně updated_at, fallback published/draft
      const activityAt =
        agg.lastUpdatedAt ??
        [agg.lastPublishedAt, agg.lastDraftAt].filter(Boolean).sort().pop() ??
        null;

      const authorId = authorUserIdByWorkspace.get(wid) || null;
      const authUser = authorId ? authUserById.get(authorId) : null;

      return {
        id: pid,
        slug: p.slug ?? null,
        status: (p.status as string | null) ?? null, // null => not started
        created_at: p.created_at ?? null,
        workspace_id: wid ?? null,

        pagesCount: agg.pagesCount,
        onboardingDone: agg.pagesCount > 0,

        activityAt,

        authorId,
        authorLabel: authUser ? pickAuthorLabel(authUser) : authorId ? authorId.slice(0, 8) : "—",
      };
    }) ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Weby</h1>
        <p className="text-sm text-zinc-400">Top admin přehled: status + onboarding + aktivita + autor.</p>
      </header>

      <SitesTableClient initial={list} />
    </div>
  );
}
