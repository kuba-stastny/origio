import { supabaseServer } from "@/lib/supabase/server";
import { addDays, isAfter } from "date-fns";

/**
 * Vrací true, pokud workspace má aktivní přístup (trial nebo aktivní/subscription běžící).
 * @param workspaceId UUID workspace
 */
export async function hasActiveAccess(workspaceId: string) {
  const supabase = await supabaseServer();

  // 1️⃣ záznamy z billing_subscriptions
  const { data: subs, error } = await supabase
    .from("billing_subscriptions")
    .select("status, cancel_at_period_end, current_period_end")
    .eq("workspace_id", workspaceId);

  const now = new Date();

  // 2️⃣ žádný billing záznam => trial podle vytvoření workspace
  if (!error && (!subs || subs.length === 0)) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("created_at")
      .eq("id", workspaceId)
      .maybeSingle();

    if (!ws) return false;

    const createdAt = new Date(ws.created_at);
    const trialEnds = addDays(createdAt, 30);

    return isAfter(trialEnds, now); // ještě běží trial
  }

  // 3️⃣ existují záznamy => kontrola subscription stavu
  if (subs && subs.length > 0) {
    // Aktivní nebo běžící subscription
    const activeSub = subs.find((s) =>
      ["active", "trialing", "past_due"].includes(s.status)
    );
    if (activeSub) return true;

    // Zrušeno, ale ještě běží období (do current_period_end)
    const runningSub = subs.find((s) => {
      if (!s.current_period_end) return false;
      const periodEnd = new Date(s.current_period_end);
      return isAfter(periodEnd, now);
    });
    if (runningSub) return true;
  }

  // 4️⃣ jinak zablokováno
  return false;
}
