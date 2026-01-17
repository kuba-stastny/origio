// src/app/(admin)/admin/workspaces/page.tsx
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminWorkspacesPage() {
  const supabase = await supabaseServer();

  const { data: workspaces, error: wErr } = await supabase
    .from("workspaces")
    .select("id, name, slug, created_by, created_at")
    .order("created_at", { ascending: false });

  if (wErr) {
    console.error("[admin/workspaces] workspaces error", wErr);
  }

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id, workspace_id");

  if (pErr) {
    console.error("[admin/workspaces] projects error", pErr);
  }

  const projectCounts = new Map<string, number>();
  (projects ?? []).forEach((p: any) => {
    const wid = p.workspace_id as string;
    projectCounts.set(wid, (projectCounts.get(wid) ?? 0) + 1);
  });

  const rows =
    workspaces?.map((w: any) => ({
      id: w.id as string,
      name: (w.name as string) ?? null,
      slug: (w.slug as string) ?? null,
      created_by: (w.created_by as string) ?? null,
      created_at: (w.created_at as string) ?? null,
      project_count: projectCounts.get(w.id) ?? 0,
    })) ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
          Workspaces
        </h1>
        <p className="text-sm text-zinc-400">
          Přehled všech workspace a počtu projektů.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/60 backdrop-blur">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-zinc-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Název</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-left">Owner (user id)</th>
              <th className="px-4 py-3 text-left">Projekty</th>
              <th className="px-4 py-3 text-left">Vytvořen</th>
              <th className="px-4 py-3 text-left">ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr
                key={w.id}
                className="border-t border-zinc-800/60 hover:bg-white/[0.03] transition"
              >
                <td className="px-4 py-3 text-zinc-50">
                  {w.name || "Bez názvu"}
                </td>

                <td className="px-4 py-3 text-xs text-zinc-200">
                  {w.slug ? (
                    <code className="rounded-md bg-white/[0.04] px-2 py-1 ring-1 ring-white/10">
                      {w.slug}
                    </code>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </td>

                <td className="px-4 py-3 text-xs text-zinc-400">
                  {w.created_by ? (
                    <code className="rounded-md bg-white/[0.04] px-2 py-1 ring-1 ring-white/10">
                      {w.created_by}
                    </code>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-4 py-3 text-xs text-zinc-200 tabular-nums">
                  {w.project_count}
                </td>

                <td className="px-4 py-3 text-xs text-zinc-400">
                  {w.created_at
                    ? new Date(w.created_at).toLocaleString("cs-CZ")
                    : "—"}
                </td>

                <td className="px-4 py-3 text-xs text-zinc-400">
                  <code className="rounded-md bg-white/[0.04] px-2 py-1 ring-1 ring-white/10">
                    {w.id}
                  </code>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-zinc-400 text-sm"
                >
                  Zatím žádné workspace.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
