// src/components/panels/SettingsPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useUiPanel } from "@/store/ui-panel";
import { AlertTriangle } from "lucide-react";

const TITLE_MAX = 120;
const DESC_MAX = 300;

type Meta = { title?: string; description?: string };

export default function SettingsPanel() {
  const { projectId } = useParams() as { projectId: string };
  const { openLeft } = useUiPanel();

  const [meta, setMeta] = useState<Meta>({});
  const init = useMemo(
    () => ({
      title: meta.title ?? "",
      description: meta.description ?? "",
    }),
    [meta]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/projects/${projectId}/meta`, {
          method: "GET",
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok)
          throw new Error(json?.error || "Nepodařilo se načíst nastavení.");

        const nextTitle = json?.title ?? "";
        const nextDesc = json?.description ?? "";

        if (!alive) return;

        setMeta({ title: nextTitle, description: nextDesc });
        setTitle(nextTitle);
        setDescription(nextDesc);
        setSaved(false);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Chyba při načtení.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [projectId]);

  const isDirty = title !== init.title || description !== init.description;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      if (title.length > TITLE_MAX)
        throw new Error(`Title má mít max ${TITLE_MAX} znaků.`);
      if (description.length > DESC_MAX)
        throw new Error(`Description má mít max ${DESC_MAX} znaků.`);

      const res = await fetch(`/api/v1/projects/${projectId}/meta`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Uložení se nepovedlo.");

      setMeta({ title, description });
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || "Chyba při ukládání.");
    } finally {
      setSaving(false);
    }
  }

  const SkeletonSection = () => (
    <section className="rounded-3xl bg-zinc-900/30 p-6 space-y-3 animate-pulse">
      <div className="h-3 w-20 rounded bg-zinc-900/50" />
      <div className="h-10 w-full rounded-xl bg-zinc-900/40 border border-zinc-900" />
      <div className="flex justify-between items-center">
        <div className="h-3 w-44 rounded bg-zinc-900/45" />
        <div className="h-3 w-16 rounded bg-zinc-900/45" />
      </div>
    </section>
  );

  const Skeleton = () => (
    <div className="space-y-5">
      <SkeletonSection />
      <SkeletonSection />
      <div className="flex justify-end animate-pulse">
        <div className="h-10 w-32 rounded-xl bg-zinc-900/40 border border-zinc-900" />
      </div>
    </div>
  );

  return (
    <div className="h-full bg-zinc-950 px-4 py-5 flex flex-col">
      {loading ? (
        <div className="space-y-5">
          <Skeleton />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex-1 flex flex-col">
          <div className="space-y-5">
            {/* Title */}
            <section className="rounded-3xl bg-zinc-900/30 p-6 space-y-2">
              <label className="text-sm font-medium text-zinc-100">SEO titulek</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                placeholder="Max ~60–65 znaků (limit 120)"
                className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Doporučená délka 60–65 znaků.</span>
                <span>
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
            </section>

            {/* Description */}
            <section className="rounded-3xl bg-zinc-900/30 p-6 space-y-2">
              <label className="text-sm font-medium text-zinc-100">
              SEO popisek
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESC_MAX}
                placeholder="Stručný popis (limit 300)"
                className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
              />
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Krátké, jasné, bez vaty.</span>
                <span>
                  {description.length}/{DESC_MAX}
                </span>
              </div>
            </section>

            {error && <div className="text-sm text-red-400">{error}</div>}
            {saved && !error && (
              <div className="text-sm text-emerald-500">
                Uloženo. Metadata jsou aktuální.
              </div>
            )}
                 <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-950 hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Ukládám…" : "Uložit změny"}
              </button>
            </div>
          </div>

          {/* bottom actions (úplně dole) */}
          <div className="mt-auto pt-6 space-y-3">
            {/* Vytvořit stránku od nuly – stejný styl jako v HubPanelu */}
            <button
              type="button"
              onClick={() => openLeft("new-page")}
              className="w-full h-24 rounded-3xl bg-zinc-900/30 flex items-center gap-4 px-4 hover:bg-zinc-900 transition"
            >
              <div className="h-10 w-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base tracking-tighter font-medium text-zinc-50">
                  Vytvořit stránku od nuly
                </div>
                <div className="text-xs text-zinc-500">
                  Smazat aktuální stránku a spustit onboarding znovu
                </div>
              </div>
            </button>

       
          </div>
        </form>
      )}
    </div>
  );
}
