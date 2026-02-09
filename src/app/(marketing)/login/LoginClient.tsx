"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import DotGridBackground from "@/components/DotGridBackground";
import { FcGoogle } from "react-icons/fc";

type AuthStage = "idle" | "checking" | "syncing" | "redirecting";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function syncSessionToServer(access_token: string, refresh_token: string) {
  const attempts = [0, 250, 600];
  let lastErr: any = null;

  for (let i = 0; i < attempts.length; i++) {
    if (attempts[i]) await sleep(attempts[i]);

    try {
      const res = await fetch("/api/v1/auth/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ access_token, refresh_token }),
      });

      if (res.ok) return { ok: true as const };

      const j = await res.json().catch(() => null);
      lastErr = j?.error ?? `HTTP ${res.status}`;
    } catch (e: any) {
      lastErr = e?.message ?? String(e);
    }
  }

  return { ok: false as const, error: lastErr ?? "Session sync failed" };
}

export default function LoginClient() {
  const search = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [stage, setStage] = useState<AuthStage>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const finalizedRef = useRef(false);

  const oauthError = useMemo(() => {
    const e = search.get("e");
    const m = search.get("m");
    if (!e) return null;
    return m ? `${e}: ${m}` : e;
  }, [search]);

  const statusText = useMemo(() => {
    if (stage === "checking") return "Kontroluju přihlášení…";
    if (stage === "syncing") return "Synchronizuju přihlášení…";
    if (stage === "redirecting") return "Přesměrovávám…";
    return "";
  }, [stage]);

  async function finalizeAuth(session: { access_token: string; refresh_token: string }) {
    if (finalizedRef.current) return;
    finalizedRef.current = true;

    setErrorMsg("");
    setStage("syncing");

    const sync = await syncSessionToServer(session.access_token, session.refresh_token);

    if (!sync.ok) {
      finalizedRef.current = false;
      setStage("idle");
      setErrorMsg(sync.error ?? "Nepodařilo se synchronizovat přihlášení na server.");
      return;
    }

    setStage("redirecting");
    window.location.assign("/api/v1/auth/post-login");
  }

  useEffect(() => {
    if (oauthError) setErrorMsg(oauthError);
  }, [oauthError]);

  useEffect(() => {
    let alive = true;

    setStage("checking");

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        const session = data?.session;
        if (session?.access_token && session?.refresh_token) {
          await finalizeAuth({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          return;
        }
      } catch {
        // ignore
      } finally {
        if (alive) setStage("idle");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return;
      if (session?.access_token && session?.refresh_token) {
        await finalizeAuth({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.session) {
        setErrorMsg(error?.message ?? "Nepodařilo se přihlásit.");
        return;
      }

      await finalizeAuth({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    } catch (err: any) {
      console.error("[Login] unexpected error", err);
      setErrorMsg(err?.message ?? "Něco se pokazilo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setIsGoogleSubmitting(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setErrorMsg(error.message ?? "Nepodařilo se přihlásit přes Google.");
        setIsGoogleSubmitting(false);
      }
    } catch (err: any) {
      console.error("[Login] google login error", err);
      setErrorMsg(err?.message ?? "Nepodařilo se přihlásit přes Google.");
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      <div className="fixed left-6 top-6 z-50">
        <a href="/" className="inline-flex items-center gap-2">
          <img className="w-8" src="/images/logo2.png" alt="" />
          <div className="flex items-center gap-1">
            <span className="text-zinc-100 font-semibold tracking-tight">Origio</span>
            <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] font-semibold text-zinc-200">
              BETA
            </span>
          </div>
        </a>
      </div>

      <DotGridBackground />

      <div className="relative z-10 min-h-screen w-full flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10, filter: "blur(10px)" as any }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" as any }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tighter leading-[0.95] text-zinc-50">
            Vytvoř si prémiovou <br />
            prodejní stránku <br />
            za 3 minuty
          </h1>

          <div className="mt-7">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={
                isGoogleSubmitting ||
                isSubmitting ||
                stage === "syncing" ||
                stage === "redirecting"
              }
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/55 px-4 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-900/60 disabled:opacity-60 transition"
            >
              <FcGoogle className="h-5 w-5" />
              {isGoogleSubmitting ? "Přesměrovávám na Google…" : "Přihlásit se přes Google"}
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800/70" />
              <span className="text-[10px] text-zinc-500">nebo</span>
              <div className="h-px flex-1 bg-zinc-800/70" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs text-zinc-400">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="např. kubo@studio.cz"
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/55 focus:outline-none focus:ring-2 focus:ring-zinc-300/10 text-white placeholder:text-zinc-500 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs text-zinc-400">
                  Heslo
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/55 focus:outline-none focus:ring-2 focus:ring-zinc-300/10 text-white placeholder:text-zinc-500 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {(statusText || errorMsg) && (
                <div
                  className={[
                    "rounded-lg px-3 py-2 text-xs border",
                    errorMsg
                      ? "text-red-300 bg-red-950/30 border-red-800/50"
                      : "text-zinc-300 bg-zinc-950/35 border-zinc-800/70",
                  ].join(" ")}
                >
                  {errorMsg ? errorMsg : statusText}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  isGoogleSubmitting ||
                  stage === "checking" ||
                  stage === "syncing" ||
                  stage === "redirecting"
                }
                className="mt-1 bg-white text-zinc-900 rounded-xl py-2.5 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60 transition"
              >
                {stage === "syncing"
                  ? "Synchronizuju…"
                  : stage === "redirecting"
                  ? "Přesměrovávám…"
                  : isSubmitting
                  ? "Přihlašování…"
                  : "Přihlásit se"}
              </button>
            </form>

            <p className="mt-5 text-left text-xs text-zinc-500">
              Nemáte účet?{" "}
              <a
                href="/register"
                className="text-zinc-200 hover:text-white underline underline-offset-4"
              >
                Registrujte se
              </a>
            </p>
          </div>

          <p className="mt-6 text-[10px] text-zinc-500/70">
            © {new Date().getFullYear()} Origio. Všechna práva vyhrazena.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
