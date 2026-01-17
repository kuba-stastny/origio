// src/components/builder/AddSectionLauncher.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { BsCheck2 } from 'react-icons/bs';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

import { useBuilderStore } from '@/store/builder-store';
import type { BlockInstance, BlockType } from '@/types/builder';
import { nanoid } from '@/utils/ids';

import { listModules } from '@/sections/registry';
import type { SectionModule } from '@/sections/types';
import type { StaticImageData } from 'next/image';

/* ------------------------------ Kategorizace / labely ------------------------------ */

const CATEGORY_OPTIONS = [
  { key: 'all', label: 'Vše' },
  { key: 'hero', label: 'Hero' },
  { key: 'features', label: 'Funkce' },
  { key: 'testimonials', label: 'Reference' },
  { key: 'pricing', label: 'Ceník' },
  { key: 'faq', label: 'FAQ' },
] as const;

type CatKey = (typeof CATEGORY_OPTIONS)[number]['key'];

function labelForModule(mod: SectionModule) {
  return mod.definition?.title || mod.id;
}

function categoryForModule(mod: SectionModule): CatKey | 'other' {
  const meta = (mod as any).meta;
  const cat = meta?.category as CatKey | 'other' | undefined;
  return cat ?? 'other';
}

function previewForModule(mod: SectionModule): string {
  const meta = (mod as any).meta;
  const p = meta?.previewImage as string | StaticImageData | undefined;

  if (!p) return `/images/blocks/${mod.id}.png`;
  return typeof p === 'string' ? p : p.src;
}

/* ------------------------------ Supabase (client) ------------------------------ */

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, anon);
}

/* ------------------------------ draft_json helpers ------------------------------ */

function coerceDraftJson(raw: any): any | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw;
  return null;
}

function extractSectionTypesFromDraftJson(draftRaw: any): string[] {
  const draft = coerceDraftJson(draftRaw);
  if (!draft) return [];

  // podle tvého příkladu: { sections: [...] }
  const sections = Array.isArray(draft?.sections)
    ? draft.sections
    : Array.isArray(draft?.blocks)
      ? draft.blocks
      : Array.isArray(draft)
        ? draft
        : [];

  const types: string[] = [];
  for (const s of sections) {
    const t = s?.type;
    if (typeof t === 'string' && t.trim()) types.push(t.trim());
  }
  return types;
}

/* ------------------------------ Props ------------------------------ */

type Props = {
  label?: string;
  className?: string;
  variant?: 'solid' | 'outline';
  onAdded?: (block: BlockInstance) => void;
  afterIndex?: number;
  pageId?: string | null;
};

/* ------------------------------ Komponenta ------------------------------ */

export default function AddSectionLauncher({
  label = 'Nová sekce',
  className = '',
  variant = 'solid',
  onAdded,
  afterIndex,
  pageId: pageIdFromProps = null,
}: Props) {
  const params = useParams() as any;

  const pageIdFromParams: string | null =
    params?.pageId ?? params?.page_id ?? params?.id ?? params?.page ?? null;

  const pageIdFromStore: string | null =
    (useBuilderStore((s: any) => s.pageId) as string | null) ??
    (useBuilderStore((s: any) => s.currentPageId) as string | null) ??
    (useBuilderStore((s: any) => s.activePageId) as string | null) ??
    (useBuilderStore((s: any) => s.page?.id) as string | null) ??
    null;

  const resolvedPageId = pageIdFromProps ?? pageIdFromParams ?? pageIdFromStore ?? null;

  const select =
    (useBuilderStore((s: any) => s.select) as (id: string | null) => void) ??
    (useBuilderStore((s: any) => s.setSelected || s.setSelectedId) as (
      id: string | null
    ) => void) ??
    (() => {});

  const sections = useBuilderStore((s: any) => s.sections) as BlockInstance[] | undefined;

  const replaceSections =
    (useBuilderStore((s: any) => s.replaceSections || s.setSections) as
      | ((sections: BlockInstance[]) => void)
      | undefined) ?? undefined;

  const addBlock =
    (useBuilderStore((s: any) => s.addBlock || s.addSection) as
      | ((block: BlockInstance) => void)
      | ((type: BlockType, initial?: any, version?: number) => void)
      | undefined) ?? undefined;

  const insertSectionAt =
    (useBuilderStore((s: any) => s.insertSectionAt) as
      | ((index: number, block: BlockInstance) => void)
      | undefined) ?? undefined;

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<CatKey>('all');
  const [mounted, setMounted] = useState(false);

  const [existingTypes, setExistingTypes] = useState<Set<string>>(new Set());
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    // fromStore typy sekcí v builderu (tady typicky bude "h002" atd.)
    const fromStore = new Set<string>(
      (sections ?? [])
        .map((s) => (typeof s?.type === 'string' ? s.type.trim() : ''))
        .filter(Boolean)
    );

    async function run() {
      setLoadingExisting(true);

      try {
        if (!resolvedPageId) {
          if (!cancelled) setExistingTypes(fromStore);
          return;
        }

        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from('pages')
          .select('draft_json')
          .eq('id', resolvedPageId)
          .single();

        if (error) {
          if (!cancelled) setExistingTypes(fromStore);
          return;
        }

        const draftTypes = extractSectionTypesFromDraftJson(data?.draft_json);
        const merged = new Set<string>([
          ...Array.from(fromStore),
          ...draftTypes.map((t) => t.trim()).filter(Boolean),
        ]);

        if (!cancelled) setExistingTypes(merged);
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resolvedPageId]);

  const modules = useMemo(() => listModules(), []);
  const filteredModules = useMemo(() => {
    if (filter === 'all') return modules;
    return modules.filter((m) => categoryForModule(m) === filter);
  }, [modules, filter]);

  function handleAdd(mod: SectionModule) {
    const def: any = mod.definition;
    if (!def) return;

    // ✅ U tebe: "type je stejny jako id" => používáme mod.id jako canonical key
    const canonicalType = (mod.id || def.type) as BlockType;

    const block: BlockInstance = {
      id: nanoid(),
      type: canonicalType,
      version: def.version,
      data: def.defaultData,
      title: def.title || '',
    };

    try {
      if (typeof afterIndex === 'number' && insertSectionAt) {
        insertSectionAt(afterIndex + 1, block);
      } else if (typeof afterIndex === 'number' && sections && replaceSections) {
        const next = sections.slice();
        next.splice(afterIndex + 1, 0, block);
        replaceSections(next);
      } else if (addBlock) {
        if ((addBlock as any).length >= 2) {
          (addBlock as any)(block.type, block.data, block.version);
        } else {
          (addBlock as any)(block);
        }
      } else {
        console.warn('Builder store nemá vhodnou akci pro přidání sekce.');
        return;
      }

      setExistingTypes((prev) => new Set([...Array.from(prev), String(block.type)]));

      select?.(block.id);
      onAdded?.(block);
      setOpen(false);
    } catch (e) {
      console.error('Chyba při přidávání bloku:', e);
    }
  }

  const btnBase =
    'inline-flex items-center gap-2 backdrop-blur-xl rounded-2xl px-4 py-2 text-base transition';

  const btnVariant =
    variant === 'outline'
      ? 'border-2 border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50'
      : variant === 'solid'
        ? 'border-2 border-zinc-900 bg-zinc-100 text-black hover:bg-zinc-200'
        : 'border-2 border-zinc-300 bg-zinc-900 text-zinc-100 hover:bg-zinc-900';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${btnBase} ${btnVariant} ${className}`}
      >
        <FaPlus className="h-3.5 w-3.5" />
        {label}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 backdrop-blur-xl p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              >
                <motion.div
                  className="w-full h-[90vh] max-w-6xl gap-4 rounded-2xl p-4 md:p-6"
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Hlavička */}
                  <div className="pb-5 max-h-fit flex items-center justify-center flex-col gap-3">
                    <button
                      onClick={() => setOpen(false)}
                      className="rounded-full border border-zinc-800 px-3 py-3 text-lg text-zinc-200 hover:bg-zinc-900"
                      aria-label="Zavřít"
                    >
                      <FaTimes />
                    </button>

                    <div className="text-xs text-zinc-400">
                      {loadingExisting ? (
                        'Kontroluji, co už je na stránce…'
                      ) : (
                        <>
                          Přidáno: <span className="text-zinc-200">{existingTypes.size}</span>
                          {resolvedPageId ? (
                            <span className="ml-2 text-zinc-500">pageId: {resolvedPageId}</span>
                          ) : (
                            <span className="ml-2 text-zinc-500">(bez pageId – jen store)</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sidebar filtry */}
                  <aside className="pb-5">
                    <ul className="space-y-1 flex gap-2">
                      {CATEGORY_OPTIONS.map((c) => (
                        <li key={c.key}>
                          <button
                            onClick={() => setFilter(c.key)}
                            className={`w-full rounded-2xl border px-4 py-2 text-left text-sm transition ${
                              filter === c.key
                                ? 'border-zinc-600 bg-zinc-900 text-zinc-100'
                                : 'border-zinc-800 bg-zinc-900/30 text-zinc-300 hover:bg-zinc-900/60'
                            }`}
                          >
                            {c.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </aside>

                  {/* Grid šablon */}
                  <section className="flex flex-col h-full pb-[100px] overflow-y-scroll">
                    {filteredModules.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                        Pro tuto kategorii nemáme žádné bloky.
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredModules.map((mod) => {
                          const def: any = mod.definition;
                          const cardLabel = labelForModule(mod);
                          const cat = categoryForModule(mod);
                          const previewSrc = previewForModule(mod);

                          // ✅ canonical key = to, co máš v draft_json: section.type = "h002"
                          const canonicalKey = String(mod.id).trim();
                          const isAlreadyOnPage = canonicalKey && existingTypes.has(canonicalKey);

                          return (
                            <button
                              key={mod.id}
                              onClick={() => handleAdd(mod)}
                              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 text-left transition hover:border-zinc-600 focus-visible:shadow-[0_0_0_2px_rgba(99,102,241,0.35)]"
                              title={
                                isAlreadyOnPage
                                  ? `${cardLabel} – už je na stránce`
                                  : `Přidat ${cardLabel}`
                              }
                            >
                              {isAlreadyOnPage && (
                                <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500/25 px-2.5 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-400/40 backdrop-blur">
                                  <BsCheck2 className="h-4 w-4 text-emerald-200" />
                                  Přidáno
                                </div>
                              )}

                              <div className="aspect-[4/3] w-full bg-zinc-950/30">
                                <img
                                  src={previewSrc}
                                  alt={cardLabel}
                                  className="h-full w-full object-cover opacity-90 group-hover:opacity-100"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    const parent = (e.currentTarget as HTMLImageElement)
                                      .parentElement!;
                                    parent.innerHTML =
                                      '<div class="flex h-full w-full items-center justify-center text-xs text-zinc-500">Bez náhledu</div>';
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between px-3 py-2">
                                <div>
                                  <div className="text-sm font-medium text-zinc-100">
                                    {cardLabel}
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {cat === 'other'
                                      ? 'Blok'
                                      : CATEGORY_OPTIONS.find((x) => x.key === cat)?.label}
                                    <span className="ml-2 text-[10px] text-zinc-600">
                                      ({canonicalKey})
                                    </span>
                                  </div>
                                </div>

                                <span className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-400">
                                  v{def?.version ?? '1'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
