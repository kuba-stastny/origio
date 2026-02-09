// src/sections/services.tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import type { SectionModule } from '../../types';
import type { BlockInstance } from '@/types/builder';

import { Plus, Minus } from 'lucide-react';

import type { DesignSystem } from '@/types/design-system';
import { mapThemeJson } from '@/lib/design-system';
import { SectionShell } from '@/sections/ui/SectionShell';
import { Heading, Text } from '@/sections/ui/Typography';

// ✅ cinematic (relativní cesta dle tebe)
import {
  CinematicSplitWords,
  CinematicFade,
  CinematicBlurUp,
} from '../../motion/cinematic';
import PreviewImage from '../../previews/sv001.png';

/* =========================
   Defaults
========================= */
const DEFAULT_ITEMS = [
  {
    image: {
      src: 'https://app.origio.site/images/mockup.png',
      alt: 'Technical SEO',
    },
    title: 'Technical SEO',
    description:
      "I provide expert technical SEO services to boost your website's performance, improve site architecture, and ensure search engine crawlability for optimal online visibility.",
  },
  {
    image: {
      src: 'https://app.origio.site/images/mockup.png',
      alt: 'Content & Strategy',
    },
    title: 'Content & Strategy',
    description:
      'Clear content strategy, topic mapping, briefs a delivery pipeline – vše pro konzistentní a měřitelné výsledky.',
  },
  {
    image: {
      src: 'https://app.origio.site/images/mockup.png',
      alt: 'Analytics & Reporting',
    },
    title: 'Analytics & Reporting',
    description:
      'Nastavení měření, dashboardy a pravidelný reporting – abyste přesně věděli, co funguje.',
  },
  {
    image: {
      src: 'https://app.origio.site/images/mockup.png',
      alt: 'Business strategy',
    },
    title: 'Business strategy',
    description:
      'Propojuji marketingové cíle s byznysem. Hypotézy, experimenty, prioritizace, roadmapa.',
  },
  {
    image: {
      src: 'https://app.origio.site/images/mockup.png',
      alt: 'Marketing leadership',
    },
    title: 'Marketing leadership',
    description:
      'Interim/part-time vedení marketingu, hiring a nastavení procesů týmu.',
  },
];

/* =========================
   Utils
========================= */
function n(i: number) {
  return `/${String(i + 1).padStart(3, '0')}/`;
}

/* =========================
   Renderer
========================= */
type ServicesRendererProps = {
  block: BlockInstance;
  theme?: DesignSystem;
};

function ServicesRenderer({ block, theme }: ServicesRendererProps) {
  const d: any = block.data || {};
  const heading: string = d.heading || 'My services';
  const items: any[] =
    Array.isArray(d.items) && d.items.length ? d.items : DEFAULT_ITEMS;

  const resolvedTheme = theme ?? mapThemeJson(null);

  const [open, setOpen] = useState<number | null>(0);

  const list = useMemo(
    () =>
      items.map((it) => ({
        image: it.image ?? { src: '', alt: '' },
        title: it.title ?? '',
        description: it.description ?? '',
      })),
    [items]
  );

  // ✅ smoother toggling (prevents “stutter” when clicking fast)
  const toggle = useCallback((i: number) => {
    setOpen((prev) => (prev === i ? null : i));
  }, []);

  return (
    <SectionShell theme={resolvedTheme} className="p-0">
      <section className="relative">
        <div className="mx-auto w-full max-w-[1280px]">
          {/* Title */}
          <div className="mb-12 md:mb-20">
            <Heading level="h2" weight="medium" tone="heading">
              <CinematicSplitWords
                text={heading}
                // důležité: ať se to chová jako inline obsah nadpisu
                className="inline"
                amount={0.35}
                margin="-120px"
                stagger={0.06}
                y={14}
                blur={14}
                duration={0.75}
                delayChildren={0}
              />
            </Heading>
          </div>

          {/* List */}
          <div className="flex flex-col">
            {list.map((it, i) => {
              const isOpen = open === i;

              return (
                <CinematicBlurUp
                  key={i}
                  // ✅ “co položka” animace
                  amount={0.25}
                  margin="-120px"
                  y={10}
                  blur={18}
                  duration={1.1}
                  delay={i * 0.06}
                  className="w-full"
                >
                  <div className="w-full">
                    {/* Row */}
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      className={[
                        'w-full text-left',
                        'grid',
                        'grid-cols-[56px_1fr_48px]',
                        'gap-6',
                        'md:gap-[160px]',
                        'items-start',
                        'py-6',
                        'select-none',
                      ].join(' ')}
                      style={{ color: 'var(--ds-on-bg)' }}
                      aria-expanded={isOpen}
                    >
                      {/* /001/ */}
                      <div className="w-[56px]">
                        <Text size="lg" weight="light" tone="body">
                          {n(i)}
                        </Text>
                      </div>

                      {/* Content cell */}
                      <div className="min-w-0">
                        {!isOpen ? (
                          <Heading
                            as="div"
                            level="h4"
                            weight="medium"
                            tone="heading"
                          >
                            {it.title || 'Service'}
                          </Heading>
                        ) : (
                          <div
                            className={[
                              'flex min-w-0 flex-col gap-6',
                              'md:flex-row md:gap-10',
                            ].join(' ')}
                          >
                            {/* Image */}
                            <div className="shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={it.image?.src || ''}
                                alt={it.image?.alt || ''}
                                className="h-[80px] w-[200px] rounded-[16px] object-cover"
                                draggable={false}
                              />
                            </div>

                            {/* Text */}
                            <div className="min-w-0 flex flex-col gap-4">
                              <Heading
                                as="div"
                                level="h4"
                                weight="medium"
                                tone="heading"
                              >
                                {it.title || 'Service'}
                              </Heading>

                              <Text size="lg" weight="light" tone="body">
                                {it.description || ''}
                              </Text>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          outline: '1px solid var(--ds-border)',
                          outlineOffset: '-1px',
                        }}
                        aria-hidden="true"
                      >
                        {/* ✅ bez framer rotace → žádné “kousání”
                            (ikonka se jen přepne, je to nejplynulejší) */}
                        {isOpen ? (
                          <Minus
                            className="h-4 w-4"
                            style={{ color: 'var(--ds-on-bg)' }}
                          />
                        ) : (
                          <Plus
                            className="h-4 w-4"
                            style={{ color: 'var(--ds-on-bg)' }}
                          />
                        )}
                      </div>
                    </button>

                    {/* Divider */}
                    <div
                      className="h-px"
                      style={{
                        background:
                          'color-mix(in_oklab, var(--ds-border) 55%, transparent)',
                      }}
                    />
                  </div>
                </CinematicBlurUp>
              );
            })}
          </div>
        </div>
      </section>
    </SectionShell>
  );
}

/* =========================
   Universal editor schema
========================= */
export const SERVICES_SCHEMA = [
  {
    type: 'group',
    label: 'Section',
    children: [
      {
        type: 'text',
        path: 'heading',
        label: 'Heading',
        placeholder: 'My services',
        maxLength: 80,
      },
    ],
  },
  {
    type: 'repeater',
    label: 'Services',
    path: 'items',
    emptyHint: 'Add first service',
    children: [
      {
        type: "media",
        path: "image",
        label: "Média (obrázek / video)",
        allowed: ["image"],
      },
      { type: 'text', path: 'title', label: 'Title', maxLength: 60 },
      {
        type: 'text',
        path: 'description',
        label: 'Description',
        multiline: true,
        rows: 4,
        placeholder: 'Short description…',
        maxLength: 260,
      },
    ],
  },
] as const;

/* =========================
   SectionModule registrace
========================= */
const sv001: SectionModule = {
  id: 'sv001',
  definition: {
    type: 'services',
    title: 'Services',
    version: 5,
    defaultData: {
      heading: 'My services',
      items: DEFAULT_ITEMS,
    },
    Renderer: ServicesRenderer,
    editor: {
      schema: SERVICES_SCHEMA,
      title: 'Edit services',
      modelPath: 'data',
    },
  },
  Editor: function ServicesEditor() {
    return (
      <div className="p-3 text-xs text-zinc-400">
        (Use “Edit section” to update heading and items.)
      </div>
    );
  },
  meta: {
    category: 'features',
    previewImage: PreviewImage,
  },
};

export default sv001;
