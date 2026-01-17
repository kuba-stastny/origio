// src/app/(admin)/admin/page.tsx
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function fmtPct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${Math.round(n * 10) / 10}%`;
}

function toIso(d: Date) {
  return d.toISOString();
}

function subtractDays(from: Date, days: number) {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d;
}

function subtractMonths(from: Date, months: number) {
  const d = new Date(from);
  d.setMonth(d.getMonth() - months);
  return d;
}

function toTime(v: string | null) {
  if (!v) return null;
  const t = +new Date(v);
  return Number.isFinite(t) ? t : null;
}

export default async function AdminDashboardPage() {
  const supabase = await supabaseServer();

  // Basic counts
  const { count: workspacesCount } = await supabase
    .from("workspaces")
    .select("*", { count: "exact", head: true });

  const { count: projectsCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  const { count: pagesCount } = await supabase
    .from("pages")
    .select("*", { count: "exact", head: true });

  const { count: membersCount } = await supabase
    .from("workspace_members")
    .select("*", { count: "exact", head: true });

  // Latest projects
  const { data: latestProjects, error: latestErr } = await supabase
    .from("projects")
    .select("id, name, slug, status, workspace_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (latestErr) console.error("[admin] latestProjects error", latestErr);
  const projects = latestProjects ?? [];

  /* =========================================================
     USERS (distinct, derived from workspace_members)
     - total users
     - new users in last X (based on first membership created_at)
  ========================================================= */

  const { data: members, error: memErr } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, created_at")
    .order("created_at", { ascending: true })
    .limit(20000);

  if (memErr) console.error("[admin] workspace_members fetch error", memErr);

  const byUser = new Map<string, { firstSeen: string; lastSeen: string }>();

  (members ?? []).forEach((m: any) => {
    const uid = String(m.user_id || "");
    const created = String(m.created_at || "");
    if (!uid || !created) return;

    const ex = byUser.get(uid);
    if (!ex) {
      byUser.set(uid, { firstSeen: created, lastSeen: created });
    } else {
      if (created < ex.firstSeen) ex.firstSeen = created;
      if (created > ex.lastSeen) ex.lastSeen = created;
    }
  });

  const totalUsers = byUser.size;

  const now = new Date();
  const cut7 = subtractDays(now, 7);
  const cut14 = subtractDays(now, 14);
  const cut30 = subtractDays(now, 30);
  const cut3m = subtractMonths(now, 3);

  const newUsers7 = Array.from(byUser.values()).filter((u) => {
    const t = toTime(u.firstSeen);
    return t !== null && t >= +cut7;
  }).length;

  const newUsers14 = Array.from(byUser.values()).filter((u) => {
    const t = toTime(u.firstSeen);
    return t !== null && t >= +cut14;
  }).length;

  const newUsers30 = Array.from(byUser.values()).filter((u) => {
    const t = toTime(u.firstSeen);
    return t !== null && t >= +cut30;
  }).length;

  const newUsers3m = Array.from(byUser.values()).filter((u) => {
    const t = toTime(u.firstSeen);
    return t !== null && t >= +cut3m;
  }).length;

  /* =========================================================
     ACTIVE PAGES
     "active" = page has draft_saved_at OR published_at
     (computed from counts + overlap)
  ========================================================= */

  const { count: publishedPages } = await supabase
    .from("pages")
    .select("*", { count: "exact", head: true })
    .not("published_at", "is", null);

  const { count: draftPages } = await supabase
    .from("pages")
    .select("*", { count: "exact", head: true })
    .not("draft_saved_at", "is", null);

  const { count: bothPages } = await supabase
    .from("pages")
    .select("*", { count: "exact", head: true })
    .not("published_at", "is", null)
    .not("draft_saved_at", "is", null);

  const activePages =
    (publishedPages ?? 0) + (draftPages ?? 0) - (bothPages ?? 0);

  /* =========================================================
     ONBOARDING %
     Approx: user is "onboarded" if they're a member of a workspace
     that has at least one page (via projects -> pages).
  ========================================================= */

  const { data: projRows, error: projErr } = await supabase
    .from("projects")
    .select("id, workspace_id")
    .limit(20000);

  if (projErr) console.error("[admin] projects map error", projErr);

  const projectToWorkspace = new Map<string, string>();
  (projRows ?? []).forEach((p: any) => {
    const pid = String(p.id || "");
    const wid = String(p.workspace_id || "");
    if (pid && wid) projectToWorkspace.set(pid, wid);
  });

  const { data: pageRows, error: pagesErr } = await supabase
    .from("pages")
    .select("project_id")
    .limit(20000);

  if (pagesErr) console.error("[admin] pages map error", pagesErr);

  const workspacesWithPages = new Set<string>();
  (pageRows ?? []).forEach((p: any) => {
    const pid = String(p.project_id || "");
    const wid = projectToWorkspace.get(pid);
    if (wid) workspacesWithPages.add(wid);
  });

  const usersOnboarded = new Set<string>();
  (members ?? []).forEach((m: any) => {
    const wid = String(m.workspace_id || "");
    const uid = String(m.user_id || "");
    if (!uid || !wid) return;
    if (workspacesWithPages.has(wid)) usersOnboarded.add(uid);
  });

  const onboardedUsersCount = usersOnboarded.size;
  const onboardedPct = totalUsers > 0 ? (onboardedUsersCount / totalUsers) * 100 : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-50">
          Origio Admin
        </h1>
        <p className="text-sm text-zinc-400">
          Přehled workspace, projektů, stránek a uživatelů.
        </p>
      </header>

      {/* Top stats */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Workspaces" value={workspacesCount ?? 0} />
        <StatCard label="Projekty" value={projectsCount ?? 0} />
        <StatCard label="Stránky (celkem)" value={pagesCount ?? 0} />
        <StatCard label="Workspace members" value={membersCount ?? 0} />
      </section>

      {/* Users overview */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-50">Uživatelé</h2>

        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Uživatelé celkem" value={totalUsers} />
          <StatCard label="Noví (7 dní)" value={newUsers7} hint={`od ${toIso(cut7).slice(0, 10)}`} />
          <StatCard label="Noví (14 dní)" value={newUsers14} hint={`od ${toIso(cut14).slice(0, 10)}`} />
          <StatCard label="Noví (30 dní)" value={newUsers30} hint={`od ${toIso(cut30).slice(0, 10)}`} />
          <StatCard label="Noví (3 měsíce)" value={newUsers3m} hint={`od ${toIso(cut3m).slice(0, 10)}`} />
        </div>
      </section>

      {/* Pages + onboarding */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-50">Onboarding & stránky</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Aktivní stránky" value={activePages} hint="draft_saved_at nebo published_at" />
          <StatCard label="Published stránky" value={publishedPages ?? 0} />
          <StatCard label="Onboarded users" value={onboardedUsersCount} hint={`= ${fmtPct(onboardedPct)} z uživatelů`} />
        </div>

        <div className="text-xs text-zinc-500">
          Onboarding % je počítané jako: uživatel je členem workspace, která má alespoň 1 záznam v <code className="rounded bg-white/[0.04] px-1 py-0.5 ring-1 ring-white/10">pages</code>.
        </div>
      </section>

      {/* Latest projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
            Poslední projekty
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/60 backdrop-blur">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-zinc-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Název</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Workspace ID</th>
                <th className="px-4 py-3 text-left">Stav</th>
                <th className="px-4 py-3 text-left">Vytvořeno</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p: any) => (
                <tr
                  key={p.id}
                  className="border-t border-zinc-800/60 hover:bg-white/[0.03] transition"
                >
                  <td className="px-4 py-3 text-zinc-50">
                    {p.name || "Bez názvu"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-300">
                    <code className="rounded-md bg-white/[0.04] px-2 py-1 ring-1 ring-white/10">
                      {p.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    <code className="rounded-md bg-white/[0.04] px-2 py-1 ring-1 ring-white/10">
                      {p.workspace_id}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString("cs-CZ")
                      : "—"}
                  </td>
                </tr>
              ))}

              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-zinc-400 text-sm"
                  >
                    Zatím žádné projekty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/60 backdrop-blur px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-50">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border backdrop-blur";

  if (!status) {
    return (
      <span className={`${base} border-white/10 bg-white/[0.04] text-zinc-300`}>
        unknown
      </span>
    );
  }

  const s = String(status).toLowerCase();

  if (s === "published") {
    return (
      <span
        className={`${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-200`}
      >
        published
      </span>
    );
  }

  if (s === "draft") {
    return (
      <span className={`${base} border-white/10 bg-white/[0.04] text-zinc-200`}>
        draft
      </span>
    );
  }

  if (s === "archived") {
    return (
      <span
        className={`${base} border-amber-500/20 bg-amber-500/10 text-amber-200`}
      >
        archived
      </span>
    );
  }

  return (
    <span className={`${base} border-white/10 bg-white/[0.04] text-zinc-200`}>
      {s}
    </span>
  );
}
