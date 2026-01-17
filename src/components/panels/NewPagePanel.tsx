// src/components/panels/NewPagePanel.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function NewPagePanel() {
  const { projectId } = useParams() as { projectId: string };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateNewPage(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || submitting) return;

    const ok = window.confirm(
      "Opravdu chceš začít úplně znovu?\n\n" +
        "Aktuální stránka projektu se smaže včetně všech sekcí a textů. " +
        "Tuto akci nelze vrátit."
    );
    if (!ok) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/v1/projects/${projectId}/reset-page`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Nepodařilo se vytvořit novou stránku.");
      }

      // reload builderu po smazání page
      window.location.reload();
    } catch (err: any) {
      setError(
        err?.message || "Někde se stala chyba. Zkus to prosím za chvíli znovu."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full bg-zinc-950 px-4 py-5 space-y-5">

      <form onSubmit={handleCreateNewPage} className="space-y-6">
        {/* Warning box – srozumitelně, bez technikálií */}
        <section className="space-y-3 rounded-3xl bg-red-500/10 p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-100">
              Tato akce je nevratná
            </p>
            <p className="text-sm text-red-100/90">
              Po potvrzení se smaže aktuální stránka tohoto projektu včetně
              všech sekcí, textů a nastavení rozložení.
            </p>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-100/90">
            <li>Smaže se celý obsah aktuální stránky.</li>
            <li>Původní verzi už nepůjde obnovit.</li>
            <li>
              Po znovunačtení se spustí AI onboarding a vznikne nová stránka.
            </li>
          </ul>
        </section>

        {/* Info box – krátké vysvětlení kdy to použít */}
        <section className="space-y-2 rounded-3xl bg-zinc-900/50 p-6">
          <p className="text-sm font-medium text-zinc-100">
            Kdy tuto možnost použít?
          </p>
          <p className="text-sm text-zinc-300">
            Hodí se ve chvíli, kdy chceš pro tento projekt zkusit úplně jiný
            směr, nové texty nebo cílení a nechceš ručně mazat jednotlivé
            sekce.
          </p>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !projectId}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Mažu stránku…" : "Začít znovu s novou stránkou"}
          </button>
        </div>
      </form>
    </div>
  );
}
