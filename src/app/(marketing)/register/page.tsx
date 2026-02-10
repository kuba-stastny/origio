// src/app/register/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ pokud už session existuje → sync cookies + post-login
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!session) return;

        await fetch("/api/v1/auth/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });

        if (!cancelled) router.replace("/api/v1/auth/post-login");
      } catch {
        // noop
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function syncSessionToCookies(session: {
    access_token: string;
    refresh_token: string;
  }) {
    const r = await fetch("/api/v1/auth/set-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    });

    if (!r.ok) {
      const j = await r.json().catch(() => null);
      throw new Error(
        j?.error ?? "Nepodařilo se synchronizovat přihlášení na server."
      );
    }
  }

  // ✅ send welcome email (neblokuje UX)
  async function sendWelcome(toEmail: string) {
    try {
      const r = await fetch("/api/v1/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: toEmail }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => null);
        console.warn("[WelcomeEmail] failed", j?.error ?? r.status);
      }
    } catch (e) {
      console.warn("[WelcomeEmail] failed (network)", e);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    const nameTrim = fullName.trim();
    const emailTrim = email.trim();

    if (!nameTrim) {
      setErrorMsg("Vyplňte prosím jméno a příjmení.");
      return;
    }
    if (password !== passwordAgain) {
      setErrorMsg("Hesla se neshodují.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Heslo musí mít alespoň 6 znaků.");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Sign up
      const { data, error } = await supabase.auth.signUp({
        email: emailTrim,
        password,
        options: {
          data: {
            full_name: nameTrim,
            display_name: nameTrim,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message ?? "Nepodařilo se vytvořit účet.");
        return;
      }

      // ✅ Pokud session není vrácena → zapnuté email confirmation
      if (!data?.session) {
        // ✅ pošli welcome i v tomhle režimu (uživatel ještě není přihlášen)
        void sendWelcome(emailTrim);

        setInfoMsg(
          "Účet je vytvořený. Zkontrolujte e-mail a potvrďte registraci (aktivaci). Potom se přihlaste."
        );
        return;
      }

      // ✅ Máme session → sync cookies + pošli welcome + redirect
      await syncSessionToCookies({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      // ✅ welcome (nečekáme na výsledek, UX je priorita)
      void sendWelcome(emailTrim);

      router.replace("/api/v1/auth/post-login");
    } catch (err: any) {
      console.error("[Register] unexpected error", err);
      setErrorMsg(err?.message ?? "Něco se pokazilo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[100vh] w-full bg-black text-white relative overflow-hidden">
      {/* MOBILE background video */}
      <div className="absolute inset-0 lg:hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/login.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.12),transparent_45%)]" />
      </div>

      {/* logo fixně vlevo nahoře */}
      <div className="fixed left-6 top-6 z-50">
        <a href="/" className="inline-flex items-center gap-2">
          <img className="w-8" src="/images/logo2.png" alt="" />
          <div className="flex flex-col leading-tight">
            <div className="flex items-center justify-center gap-1">
              <span className="text-zinc-100 font-semibold tracking-tight">
                Origio
              </span>
              <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-[10px] font-semibold text-zinc-200">
                BETA
              </span>
            </div>
          </div>
        </a>
      </div>

      {/* layout */}
      <div className="relative z-10 h-[100vh] w-full lg:grid lg:grid-cols-2">
        {/* LEFT: form */}
        <div className="w-full h-full flex items-center justify-center p-6 lg:p-10">
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
              <div className="rounded-3xl">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 text-sm"
                >
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fullName" className="text-xs text-zinc-400">
                      Jméno a příjmení
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="např. Jakub Novák"
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/55 focus:outline-none focus:ring-2 focus:ring-zinc-300/10 text-white placeholder:text-zinc-500 transition"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="password"
                        className="text-xs text-zinc-400"
                      >
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
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="passwordAgain"
                        className="text-xs text-zinc-400"
                      >
                        Heslo znovu
                      </label>
                      <input
                        id="passwordAgain"
                        type="password"
                        placeholder="••••••••"
                        className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/55 focus:outline-none focus:ring-2 focus:ring-zinc-300/10 text-white placeholder:text-zinc-500 transition"
                        value={passwordAgain}
                        onChange={(e) => setPasswordAgain(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-red-400 text-xs bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
                      {errorMsg}
                    </p>
                  )}

                  {infoMsg && (
                    <p className="text-emerald-300 text-xs bg-emerald-950/30 border border-emerald-800/50 rounded-lg px-3 py-2">
                      {infoMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-1 bg-white text-zinc-900 rounded-xl py-2.5 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60 transition"
                  >
                    {isSubmitting ? "Vytvářím účet…" : "Zaregistrovat se"}
                  </button>
                </form>

                <p className="mt-5 text-left text-xs text-zinc-500">
                  Už máte účet?{" "}
                  <a
                    href="/login"
                    className="text-zinc-200 hover:text-white underline underline-offset-4"
                  >
                    Přihlásit se
                  </a>
                </p>
              </div>
            </div>

            <p className="mt-6 text-[10px] text-zinc-500/70">
              © {new Date().getFullYear()} Origio. Všechna práva vyhrazena.
            </p>
          </motion.div>
        </div>

        {/* RIGHT: video (desktop only) */}
        <div className="hidden lg:block relative p-6 lg:p-8">
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-950">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src="/videos/login.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
          </div>
        </div>
      </div>
    </div>
  );
}