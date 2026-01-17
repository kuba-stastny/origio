// src/components/panels/SlugPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

const CHECK_DELAY = 400;
const DOMAIN_SUFFIX = ".origio.site";

export default function SlugPanel() {
  const { projectId } = useParams() as { projectId: string };

  const [slug, setSlug] = useState("");
  const [currentSlug, setCurrentSlug] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // načti aktuální slug
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setMessage(null);

      try {
        const res = await fetch(`/api/v1/projects/${projectId}/slug`, {
          method: "GET",
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Nepodařilo se načíst slug.");

        if (!alive) return;

        const s = json?.slug ?? "";
        setSlug(s);
        setCurrentSlug(s);
        setAvailable(null);
      } catch (e: any) {
        if (!alive) return;
        setSlug("");
        setCurrentSlug("");
        setAvailable(null);
        setMessage(e?.message || "Chyba při načtení.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [projectId]);

  // debounce kontrola dostupnosti
  useEffect(() => {
    if (loading) return;

    // když je prázdný nebo stejný jako current, nekontroluj
    if (!slug || slug === currentSlug) {
      setAvailable(null);
      setChecking(false);
      return;
    }

    const t = setTimeout(async () => {
      setChecking(true);
      setMessage(null);

      try {
        const res = await fetch(
          `/api/v1/check-slug?slug=${encodeURIComponent(slug)}`,
          { method: "GET", cache: "no-store" }
        );
        const data = await res.json().catch(() => ({}));
        setAvailable(!!data?.available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, CHECK_DELAY);

    return () => clearTimeout(t);
  }, [slug, currentSlug, loading]);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/slug`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Chyba při ukládání.");

      setMessage("✅ Slug byl úspěšně změněn.");
      setCurrentSlug(slug);
      setAvailable(null);

      window.dispatchEvent(
        new CustomEvent("origio:slug-updated", { detail: { slug } })
      );
    } catch (e: any) {
      setMessage("❌ " + (e?.message || "Chyba při ukládání."));
    } finally {
      setSaving(false);
    }
  }

  const displayUrl = slug
    ? `https://${slug}${DOMAIN_SUFFIX}`
    : `https://tvoje-stranka${DOMAIN_SUFFIX}`;

  const inputClassName = (() => {
    const base =
      "h-10 w-full rounded-xl border bg-zinc-900 px-3 pr-9 text-sm text-zinc-100 outline-none transition-colors placeholder-zinc-500";
    const neutral = "border-zinc-800 focus:ring-1 focus:ring-zinc-600";
    if (!slug || slug === currentSlug) return `${base} ${neutral}`;
    if (checking) return `${base} border-zinc-600 focus:ring-zinc-600`;
    if (available === true)
      return `${base} border-emerald-500/70 focus:ring-emerald-600`;
    if (available === false)
      return `${base} border-red-500/70 focus:ring-red-600`;
    return `${base} ${neutral}`;
  })();

  const canSave =
    !saving &&
    !!slug &&
    slug !== currentSlug &&
    available !== false &&
    !checking;

  return (
    <div className="h-full bg-zinc-950 px-4 py-5 space-y-6">
      {loading ? (
        // ✅ Loading skeleton – stejný styl jako SettingsPanel
        <div className="space-y-4">
          <div className="h-10 rounded-xl bg-zinc-900/40 animate-pulse" />
          <div className="h-24 rounded-3xl bg-zinc-900/40 animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-zinc-900/40 animate-pulse ml-auto" />
        </div>
      ) : (
        <>
          {/* 🔥 Stejný design jako SettingsPanel – box kolem celé skupiny */}
          <section className="rounded-3xl bg-zinc-900/30 p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-100">
                Slug (bez mezer)
              </label>

              <div className="relative">
                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())
                  }
                  className={inputClassName}
                  placeholder="např. muj-projekt"
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  {checking && (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  )}
                  {!checking &&
                    slug &&
                    slug !== currentSlug &&
                    available === true && (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  {!checking &&
                    slug &&
                    slug !== currentSlug &&
                    available === false && (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                </div>
              </div>

            </div>

            {/* URL preview */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Tvoje adresa webu</p>
                <p className="mt-1 text-sm font-medium truncate">
                  <span className="text-zinc-100">{displayUrl}</span>
                </p>
              </div>
              {slug && (
                <span className="shrink-0 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-400">
                  veřejná URL
                </span>
              )}
            </div>
          </section>

          {/* Save Message */}
          {message && (
            <div
              className={`text-sm ${
                message.startsWith("✅") ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {message}
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex h-10 items-center rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Ukládám…" : "Uložit"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
