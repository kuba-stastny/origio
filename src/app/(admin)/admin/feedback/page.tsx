// src/app/(admin)/admin/feedback/page.tsx
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type FeedbackRow = {
  id: string;
  created_at: string | null;
  emoji: string | null;
  message: string | null;
  path: string | null;
};

function fmtDateCs(v: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("cs-CZ");
  } catch {
    return "—";
  }
}

function safeEmoji(e: string | null) {
  const s = (e || "").trim();
  return s ? s : "💬";
}

export default async function AdminFeedbackPage() {
  const supabase = await supabaseServer();

  const { data: feedback, error: fbErr } = await supabase
    .from("feedback")
    .select("id, created_at, emoji, message, path")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (fbErr) console.error("[admin/feedback] feedback error", fbErr);

  const rows: FeedbackRow[] =
    (feedback ?? []).map((r: any) => ({
      id: String(r.id),
      created_at: r.created_at ?? null,
      emoji: r.emoji ?? null,
      message: r.message ?? null,
      path: r.path ?? null,
    })) ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Feedback</h1>
        <p className="text-sm text-zinc-400">Pouze čas + zpráva.</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/60 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-zinc-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left whitespace-nowrap w-[220px]">Kdy</th>
                <th className="px-4 py-3 text-left">Feedback</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-zinc-800/60 hover:bg-white/[0.03] transition">
                  <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap align-top">
                    {fmtDateCs(r.created_at)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="text-xl leading-none">{safeEmoji(r.emoji)}</div>
                      <div className="min-w-0">
                        <div className="text-sm text-zinc-50 break-words">
                          {r.message ? r.message : <span className="text-zinc-500">—</span>}
                        </div>
                     
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center">
                    <div className="text-sm text-zinc-300 whitespace-nowrap">Nic nenalezeno.</div>
                    <div className="mt-1 text-xs text-zinc-500 whitespace-nowrap">Zatím tu není žádný feedback.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-800/70 px-4 py-3">
          <div className="text-xs text-zinc-500 whitespace-nowrap">Řazení: created_at ↓</div>
          <div className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">Rows: {rows.length}</div>
        </div>
      </div>
    </div>
  );
}
