// src/app/(publish)/[workspaceSlug]/[projectSlug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { supabaseServer } from "@/lib/supabase/server";

type RouteParams = {
  workspaceSlug: string;
  projectSlug: string;
};

type PageSettings = {
  title?: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string[];
  // libovolné další klíče nevadí, ale nejsou povinné
  [key: string]: unknown;
};

export async function generateMetadata(
  { params }: { params: RouteParams }
): Promise<Metadata> {
  const supabase = await supabaseServer();

  const { data: proj } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", params.projectSlug)
    .single();

  if (!proj) return {};

  const { data: page } = await supabase
    .from("pages")
    .select("name, settings_json")
    .eq("project_id", proj.id)
    .eq("path", "/")
    .single();

  const settings = (page?.settings_json ?? {}) as Partial<PageSettings>;

  return {
    title: settings.title ?? page?.name ?? "Stránka",
    description: settings.description,
    openGraph: {
      title: settings.title ?? page?.name,
      description: settings.description,
      images: settings.ogImage ? [settings.ogImage] : undefined,
    },
    robots: settings.noindex ? { index: false, follow: false } : undefined,
    keywords: Array.isArray(settings.keywords) ? settings.keywords : undefined,
  };
}

// Pokud potřebuješ SSR vždy (doporučeno pro publikované stránky s editacemi):
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: RouteParams }) {
  const supabase = await supabaseServer();

  // 1) Najdi projekt podle slugu
  const { data: proj } = await supabase
    .from("projects")
    .select("id, name")
    .eq("slug", params.projectSlug)
    .single();

  if (!proj) notFound();

  // 2) Načti domovskou stránku (path "/")
  const { data: page } = await supabase
    .from("pages")
    .select("id, name, settings_json, sections_json")
    .eq("project_id", proj.id)
    .eq("path", "/")
    .single();

  if (!page) notFound();

  const settings = (page.settings_json ?? {}) as Partial<PageSettings>;
  // sections_json může být pole bloků; pokud ještě nemáš renderer, zobrazíme fallback
  const sections = (page as unknown as { sections_json?: unknown }).sections_json;

  return (
    <main className="min-h-dvh">
      {/* Jednoduchý fallback render, dokud nepřipojíš vlastní renderer sekcí */}
      <header className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          {settings.title ?? page.name ?? "Stránka"}
        </h1>
        {settings.description && (
          <p className="mt-2 text-zinc-500">{settings.description}</p>
        )}
      </header>

      {typeof settings.ogImage === "string" && settings.ogImage.length > 0 && (
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative h-64 w-full overflow-hidden rounded-xl border border-zinc-800/50">
            {/* Next/Image kvůli LCP a aby nepadal eslint s <img> */}
            <Image
              src={settings.ogImage}
              alt={settings.title ?? page.name ?? "OG image"}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      <section className="mx-auto max-w-4xl px-6 py-10">
        {/* Pokud máš renderer, nahraď tenhle blok vlastní komponentou, např.: 
            <PublishedRenderer sections={sections} />
        */}
        {Array.isArray(sections) ? (
          <pre className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-4 text-sm text-zinc-300 overflow-auto">
            {JSON.stringify(sections, null, 2)}
          </pre>
        ) : (
          <p className="text-zinc-500">
            Zatím nemám nachystaný obsah sekcí k vykreslení.
          </p>
        )}
      </section>
    </main>
  );
}
