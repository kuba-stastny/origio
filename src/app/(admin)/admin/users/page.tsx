// src/app/(admin)/admin/users/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function pickUserLabel(u: any): { name: string; email: string } {
  const md = u?.user_metadata ?? {};
  const name =
    md.full_name ||
    [md.given_name, md.family_name].filter(Boolean).join(" ") ||
    md.name ||
    "—";

  const email = u?.email ? String(u.email) : "—";
  return { name, email };
}

function fmtDateCs(v: string) {
  try {
    return new Date(v).toLocaleString("cs-CZ");
  } catch {
    return "—";
  }
}

export default async function AdminUsersPage() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin/users] workspace_members error", error);
  }

  const members = data ?? [];

  // Group by user_id
  const byUser = new Map<
    string,
    { userId: string; workspacesCount: number; firstSeen: string; lastSeen: string }
  >();

  members.forEach((m: any) => {
    const uid = String(m.user_id || "");
    const created = String(m.created_at || "");
    if (!uid || !created) return;

    const existing = byUser.get(uid);
    if (!existing) {
      byUser.set(uid, {
        userId: uid,
        workspacesCount: 1,
        firstSeen: created,
        lastSeen: created,
      });
    } else {
      existing.workspacesCount += 1;
      if (created < existing.firstSeen) existing.firstSeen = created;
      if (created > existing.lastSeen) existing.lastSeen = created;
    }
  });

  const baseRows = Array.from(byUser.values()).sort((a, b) =>
    a.firstSeen > b.firstSeen ? -1 : 1
  );

  // Hydrate Auth users (name + email) via Admin API
  const admin = supabaseAdmin();
  const authUserById = new Map<string, any>();

  // avoid slamming API
  const uniqueIds = Array.from(new Set(baseRows.map((r) => r.userId)));

  await Promise.all(
    uniqueIds.map(async (uid) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(uid);
        if (!error && data?.user) authUserById.set(uid, data.user);
      } catch (e) {
        console.error("[admin/users] auth getUserById failed", uid, e);
      }
    })
  );

  const rows = baseRows.map((r) => {
    const u = authUserById.get(r.userId);
    const { name, email } = u ? pickUserLabel(u) : { name: "—", email: "—" };
    return { ...r, name, email };
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Uživatelé</h1>
        <p className="text-sm text-zinc-400">
          Distinct uživatelé na základě záznamů ve&nbsp;workspace_members + Auth profil.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/60 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-zinc-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left whitespace-nowrap">Uživatel</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Email</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Počet workspace</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">První membership</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">Poslední membership</th>
                <th className="px-4 py-3 text-left whitespace-nowrap">User ID</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.userId}
                  className="border-t border-zinc-800/60 hover:bg-white/[0.03] transition"
                >
                  <td className="px-4 py-3 text-sm text-zinc-50 whitespace-nowrap">
                    {u.name}
                  </td>

                  <td className="px-4 py-3 text-sm text-zinc-200 whitespace-nowrap">
                    {u.email}
                  </td>

                  <td className="px-4 py-3 text-xs text-zinc-50 tabular-nums whitespace-nowrap">
                    {u.workspacesCount}
                  </td>

                  <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {fmtDateCs(u.firstSeen)}
                  </td>

                  <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                    {fmtDateCs(u.lastSeen)}
                  </td>

                  <td className="px-4 py-3 text-xs text-zinc-200 whitespace-nowrap">
                    <code className="rounded-md bg-white/[0.04] px-2 py-1 ring-1 ring-white/10">
                      {u.userId}
                    </code>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-sm">
                    Zatím žádní uživatelé (žádné záznamy ve workspace_members).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800/70 px-4 py-3">
          <div className="text-xs text-zinc-500 whitespace-nowrap">Řazení: firstSeen ↓</div>
          <div className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">Rows: {rows.length}</div>
        </div>
      </div>
    </div>
  );
}
