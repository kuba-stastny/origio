// src/components/panels/AccountPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type LoadedUser = {
  id: string;
  email: string | null;
  full_name: string;
  raw_metadata?: Record<string, any>;
};

export default function AccountPanel() {
  const [user, setUser] = useState<LoadedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // form states (původně AccountSettings)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const router = useRouter();

  function resetBanners() {
    setMsg("");
    setErr("");
  }

  async function apiPatch(body: Record<string, any>) {
    const res = await fetch("/api/v1/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "Operace selhala.");
    return json;
  }

  // load user
  useEffect(() => {
    let active = true;

    async function loadUser() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/account", {
          method: "GET",
          credentials: "include",
        });
        if (!active) return;

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const next: LoadedUser = {
          id: data.id,
          email: data.email ?? null,
          full_name: data.full_name ?? "",
          raw_metadata: data.raw_metadata ?? {},
        };

        if (!active) return;

        setUser(next);

        // ✅ init form fields
        setName(next.full_name ?? "");
        setEmail(next.email ?? "");
      } catch (e) {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  // actions
  async function onSaveName() {
    if (!user) return;
    resetBanners();
    setSavingName(true);
    try {
      await apiPatch({ full_name: name });
      setMsg("Jméno bylo uloženo.");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Nepodařilo se uložit jméno.");
    } finally {
      setSavingName(false);
    }
  }

  async function onSaveEmail() {
    if (!user) return;
    resetBanners();
    setSavingEmail(true);
    try {
      await apiPatch({ email });
      setMsg("E-mail aktualizován. Zkontroluj potvrzovací zprávu v e-mailu.");
    } catch (e: any) {
      setErr(e?.message || "Nepodařilo se aktualizovat e-mail.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function onSavePassword() {
    if (!user) return;
    resetBanners();

    if (password.length < 8) {
      setErr("Heslo musí mít alespoň 8 znaků.");
      return;
    }
    if (password !== password2) {
      setErr("Hesla se neshodují.");
      return;
    }

    setSavingPass(true);
    try {
      await apiPatch({ password });
      setPassword("");
      setPassword2("");
      setMsg("Heslo bylo změněno.");
    } catch (e: any) {
      setErr(e?.message || "Nepodařilo se změnit heslo.");
    } finally {
      setSavingPass(false);
    }
  }

  async function onDeleteAccount() {
    if (!user) return;
    resetBanners();

    if (deleteConfirm !== "SMAZAT") {
      setErr('Pro potvrzení napiš přesně: "SMAZAT".');
      return;
    }
    if (!confirm("Opravdu smazat účet? Tato akce je nevratná.")) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/v1/account", { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Smazání selhalo.");

      window.location.href = "/";
    } catch (e: any) {
      setErr(e?.message || "Nepodařilo se smazat účet.");
    } finally {
      setDeleting(false);
    }
  }

  // --- logout přes Supabase + redirect ---
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  // ✅ Skeleton přesně podle struktury UI
  const SkeletonBanner = () => (
    <div className="rounded-xl border border-zinc-900/60 bg-zinc-900/30 px-3 py-2 animate-pulse">
      <div className="h-3 w-52 rounded bg-zinc-900/50" />
    </div>
  );

  const SkeletonSectionRow = ({ buttonWidth = 84 }: { buttonWidth?: number }) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center animate-pulse">
      <div className="h-10 w-full rounded-xl bg-zinc-900/40 border border-zinc-900" />
      <div
        className="h-10 rounded-xl bg-zinc-900/40 border border-zinc-900 shrink-0"
        style={{ width: buttonWidth }}
      />
    </div>
  );

  const SkeletonSection = () => (
    <section className="rounded-3xl bg-zinc-900/30 p-6 animate-pulse">
      <div className="mb-3 h-3 w-28 rounded bg-zinc-900/50" />
      <SkeletonSectionRow />
    </section>
  );

  const SkeletonPasswordSection = () => (
    <section className="rounded-3xl bg-zinc-900/30 p-6 animate-pulse">
      <div className="mb-3 h-3 w-28 rounded bg-zinc-900/50" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-10 w-full rounded-xl bg-zinc-900/40 border border-zinc-900" />
        <div className="h-10 w-full rounded-xl bg-zinc-900/40 border border-zinc-900" />
      </div>
      <div className="mt-3">
        <div className="h-10 w-36 rounded-xl bg-zinc-900/40 border border-zinc-900" />
      </div>
    </section>
  );

  const SkeletonDeleteSection = () => (
    <section className="rounded-3xl bg-zinc-900/30 p-6 animate-pulse">
      <div className="mb-3 h-3 w-28 rounded bg-zinc-900/50" />
      <div className="space-y-2">
        <div className="h-3 w-[90%] rounded bg-zinc-900/45" />
        <div className="h-3 w-[70%] rounded bg-zinc-900/45" />
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="h-10 w-full rounded-xl bg-zinc-900/40 border border-zinc-900" />
        <div className="h-10 w-40 rounded-xl bg-zinc-900/40 border border-zinc-900 shrink-0" />
      </div>
    </section>
  );

  const SkeletonLogout = () => (
    <div className="pt-3 border-t border-zinc-900/40 animate-pulse">
      <div className="h-9 w-28 rounded-lg bg-zinc-900/40 border border-zinc-900" />
    </div>
  );

  return (
    <div className="h-full bg-zinc-950 px-4 py-5">
      <div className="space-y-5">
        {loading ? (
          <>
            <SkeletonBanner />

            <div className="space-y-8">
              <SkeletonSection />
              <SkeletonSection />
              <SkeletonPasswordSection />
              <SkeletonDeleteSection />
            </div>

            <SkeletonLogout />
          </>
        ) : (
          <>
            {!user ? (
              <p className="text-sm text-red-400">Nepodařilo se načíst data z účtu.</p>
            ) : (
              <div className="space-y-8">
                {msg && (
                  <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-emerald-300">
                    {msg}
                  </div>
                )}
                {err && (
                  <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-red-300">
                    {err}
                  </div>
                )}

                {/* Změna jména */}
                <section className="rounded-3xl bg-zinc-900/30 text-zinc-100 p-6">
                  <h2 className="mb-3 text-sm font-medium">Změna jména</h2>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tvé jméno"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={onSaveName}
                      disabled={savingName}
                      className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingName ? "Ukládám…" : "Uložit"}
                    </button>
                  </div>
                </section>

                {/* Změna e-mailu */}
                <section className="rounded-3xl bg-zinc-900/30 text-zinc-100 p-6">
                  <h2 className="mb-3 text-sm font-medium">Změna e-mailu</h2>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="novy@email.cz"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={onSaveEmail}
                      disabled={savingEmail}
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingEmail ? "Ukládám…" : "Aktualizovat"}
                    </button>
                  </div>
                </section>

                {/* Změna hesla */}
                <section className="rounded-3xl bg-zinc-900/30 text-zinc-100 p-6">
                  <h2 className="mb-3 text-sm font-medium">Změna hesla</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nové heslo (min. 8 znaků)"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
                    />
                    <input
                      type="password"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      placeholder="Potvrzení nového hesla"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
                    />
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={onSavePassword}
                      disabled={savingPass}
                      className="inline-flex items-center text-sm justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-zinc-200 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingPass ? "Ukládám…" : "Změnit heslo"}
                    </button>
                  </div>
                </section>

                {/* Smazání účtu */}
                <section className="rounded-3xl bg-zinc-900/30 p-6 hidden">
                  <h2 className="mb-3 text-sm font-medium text-zinc-100">Smazání účtu</h2>
                  <p className="text-sm text-red-400/90">
                    Tato akce je nevratná. Pro potvrzení napiš do pole níže: <b>SMAZAT</b>
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="SMAZAT"
                      className="w-full text-sm rounded-xl border border-red-900/60 bg-red-950/50 px-3 py-2 text-red-100 placeholder-red-400 outline-none focus:ring-1 focus:ring-red-800"
                    />
                    <button
                      type="button"
                      onClick={onDeleteAccount}
                      disabled={deleting}
                      className="inline-flex w-40 text-sm border border-red-600 items-center justify-center rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleting ? "Mažu…" : "Smazat účet"}
                    </button>
                  </div>
                </section>
                 {/* logout tlačítko */}
            <div className="pt-3 border-t border-zinc-900/40">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 px-3 py-2 text-sm text-zinc-100 border border-zinc-800/60"
              >
                <span>Odhlásit se</span>
              </button>
            </div>
              </div>
            )}

           
          </>
        )}
      </div>
    </div>
  );
}
