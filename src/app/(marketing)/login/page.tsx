'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import DotGridBackground from '@/components/DotGridBackground';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // ✅ pokud už client session existuje (localStorage), tak ji jednou syncneme do cookies
  // a pošleme uživatele na server redirect (/post-login).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (!session) return;

        // Zkus sync do cookies (ať to server vidí a middleware nebliká)
        await fetch('/api/v1/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        });

        if (!cancelled) router.replace('/api/v1/auth/post-login');
      } catch {
        // nic – zůstane na loginu
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.session) {
        setErrorMsg(error?.message ?? 'Nepodařilo se přihlásit.');
        return;
      }

      // ✅ klíč: uložit session do httpOnly cookies (server pak session uvidí)
      const syncRes = await fetch('/api/v1/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });

      if (!syncRes.ok) {
        const j = await syncRes.json().catch(() => null);
        setErrorMsg(j?.error ?? 'Nepodařilo se synchronizovat přihlášení na server.');
        return;
      }

      // ✅ teď už všechno řeší server (workspace + project + redirect)
      router.replace('/api/v1/auth/post-login');
    } catch (err: any) {
      console.error('[Login] unexpected error', err);
      setErrorMsg(err?.message ?? 'Něco se pokazilo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Google OAuth: redirect jde na /auth/callback (server exchange code → cookies → post-login)
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsGoogleSubmitting(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (error) {
        setErrorMsg(error.message ?? 'Nepodařilo se přihlásit přes Google.');
        setIsGoogleSubmitting(false);
      }
    } catch (err: any) {
      console.error('[Login] google login error', err);
      setErrorMsg(err?.message ?? 'Nepodařilo se přihlásit přes Google.');
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* ✅ MOBILE background video */}
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

      {/* ✅ logo fixně vlevo nahoře */}
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

      <DotGridBackground />

      <div className="relative z-10 h-[100vh] w-full grid-cols-1 lg:grid lg:grid-cols-2">
        <div className="w-full h-full flex items-center justify-center p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' as any }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' as any }}
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
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleSubmitting || isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/55 px-4 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-900/60 disabled:opacity-60 transition"
                >
                  <FcGoogle className="h-5 w-5" />
                  {isGoogleSubmitting ? 'Přesměrovávám na Google…' : 'Přihlásit se přes Google'}
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

                  {errorMsg && (
                    <p className="text-red-400 text-xs bg-red-950/30 border border-red-800/50 rounded-lg px-3 py-2">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting}
                    className="mt-1 bg-white text-zinc-900 rounded-xl py-2.5 text-sm font-semibold hover:bg-zinc-200 disabled:opacity-60 transition"
                  >
                    {isSubmitting ? 'Přihlašování…' : 'Přihlásit se'}
                  </button>
                </form>

                <p className="mt-5 text-left text-xs text-zinc-500">
                  Nemáte účet?{' '}
                  <a
                    href="/register"
                    className="text-zinc-200 hover:text-white underline underline-offset-4"
                  >
                    Registrujte se
                  </a>
                </p>
              </div>
            </div>

            <p className="mt-6 text-[10px] text-zinc-500/70">
              © {new Date().getFullYear()} Origio. Všechna práva vyhrazena.
            </p>
          </motion.div>
        </div>

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
