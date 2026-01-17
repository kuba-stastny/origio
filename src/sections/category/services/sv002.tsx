// src/sections/services-grid.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { SectionModule } from '../../types';
import type { BlockInstance } from '@/types/builder';

import { SectionShell } from '@/sections/ui/SectionShell';
import type { DesignSystem } from '@/types/design-system';
import { resolveSectionTheme, mapThemeJson } from '@/lib/design-system';
import { Heading, Text } from '@/sections/ui/Typography';

// ✅ cinematic
import {
  CinematicBlurUp,
  CinematicFade,
  CinematicSplitWords,
} from '../../motion/cinematic';
import PreviewImage from "../../previews/sv002.png";

/**
 * services-grid (DS)
 * - Header: title left + CTA right
 * - Grid: 3 cols desktop, 1 col mobile
 * - Wide pattern: items in WIDE_INDEXES => col-span-2 AND show image (if provided)
 * - Icon: supports emoji OR react-icons value "pack:ExportName" (e.g. "md:MdBolt")
 * - Colors/typography: ONLY via DS tokens (SectionShell + Typography)
 */

/* =========================
   Defaults
========================= */

const DEFAULT_ITEMS = [
  {
    icon: 'md:MdOutlineSettings',
    image: {
      src: 'https://app.origio.site/images/mockup.png',
      alt: 'Technical SEO',
    },
    title: 'Technical SEO',
    description:
      'I design with purpose—crafting layouts that guide users to act, combining beauty with results.',
  },
  {
    icon: 'md:MdOutlineEditNote',
    image: { src: '', alt: '' },
    title: 'Content & Strategy',
    description:
      'Build fast, responsive sites with clear structure, fully animated and easy to edit.',
  },
  {
    icon: 'md:MdOutlineQueryStats',
    image: { src: '', alt: '' },
    title: 'Analytics & Reporting',
    description:
      'Set up tracking, dashboards and reporting so you always know what’s working.',
  },
  {
    icon: 'md:MdOutlineBusinessCenter',
    image: {
      src: 'https://app.origio.site/images/mockup.png',
      alt: 'Business strategy',
    },
    title: 'Business strategy',
    description:
      'I shape visual identities and product stories that fit your brand and stand out.',
  },
  {
    icon: 'md:MdOutlineCampaign',
    image: {
      src: 'https://app.origio.site/images/mockup.png',
      alt: 'Marketing leadership',
    },
    title: 'Marketing leadership',
    description:
      'Clear direction, priorities, and execution — so marketing moves the needle.',
  },
];

export const SERVICES_GRID_DEFAULT_DATA = {
  heading: 'My services',
  cta: {
    label: 'Get in touch',
    href: '#contact',
  },
  items: DEFAULT_ITEMS,
};

/* =========================
   Wide pattern – napevno
========================= */
const WIDE_INDEXES = new Set<number>([
  0, // 1.
  3, // 4.
  4, // 5.
  7,
  8,
]);

/* =========================
   react-icons dynamic rendering (pack:ExportName)
========================= */
function parseIconValue(v?: string | null) {
  if (!v) return null;
  const s = String(v);
  const idx = s.indexOf(':');
  if (idx === -1) return null;
  const pack = s.slice(0, idx);
  const name = s.slice(idx + 1);
  if (!pack || !name) return null;
  return { pack, name };
}

async function loadReactIcon(pack: string, name: string) {
  switch (pack) {
    case 'fa': {
      const mod: any = await import('react-icons/fa');
      return mod?.[name] ?? null;
    }
    case 'fa6': {
      const mod: any = await import('react-icons/fa6');
      return mod?.[name] ?? null;
    }
    case 'md': {
      const mod: any = await import('react-icons/md');
      return mod?.[name] ?? null;
    }
    case 'io': {
      const mod: any = await import('react-icons/io');
      return mod?.[name] ?? null;
    }
    case 'io5': {
      const mod: any = await import('react-icons/io5');
      return mod?.[name] ?? null;
    }
    case 'fi': {
      const mod: any = await import('react-icons/fi');
      return mod?.[name] ?? null;
    }
    case 'hi': {
      const mod: any = await import('react-icons/hi');
      return mod?.[name] ?? null;
    }
    case 'hi2': {
      const mod: any = await import('react-icons/hi2');
      return mod?.[name] ?? null;
    }
    case 'ri': {
      const mod: any = await import('react-icons/ri');
      return mod?.[name] ?? null;
    }
    case 'bs': {
      const mod: any = await import('react-icons/bs');
      return mod?.[name] ?? null;
    }
    case 'tb': {
      const mod: any = await import('react-icons/tb');
      return mod?.[name] ?? null;
    }
    case 'si': {
      const mod: any = await import('react-icons/si');
      return mod?.[name] ?? null;
    }
    case 'bi': {
      const mod: any = await import('react-icons/bi');
      return mod?.[name] ?? null;
    }
    case 'cg': {
      const mod: any = await import('react-icons/cg');
      return mod?.[name] ?? null;
    }
    case 'ci': {
      const mod: any = await import('react-icons/ci');
      return mod?.[name] ?? null;
    }
    case 'di': {
      const mod: any = await import('react-icons/di');
      return mod?.[name] ?? null;
    }
    case 'gi': {
      const mod: any = await import('react-icons/gi');
      return mod?.[name] ?? null;
    }
    case 'go': {
      const mod: any = await import('react-icons/go');
      return mod?.[name] ?? null;
    }
    case 'gr': {
      const mod: any = await import('react-icons/gr');
      return mod?.[name] ?? null;
    }
    case 'im': {
      const mod: any = await import('react-icons/im');
      return mod?.[name] ?? null;
    }
    case 'lia': {
      const mod: any = await import('react-icons/lia');
      return mod?.[name] ?? null;
    }
    case 'lu': {
      const mod: any = await import('react-icons/lu');
      return mod?.[name] ?? null;
    }
    case 'pi': {
      const mod: any = await import('react-icons/pi');
      return mod?.[name] ?? null;
    }
    case 'rx': {
      const mod: any = await import('react-icons/rx');
      return mod?.[name] ?? null;
    }
    case 'sl': {
      const mod: any = await import('react-icons/sl');
      return mod?.[name] ?? null;
    }
    case 'tfi': {
      const mod: any = await import('react-icons/tfi');
      return mod?.[name] ?? null;
    }
    case 'ti': {
      const mod: any = await import('react-icons/ti');
      return mod?.[name] ?? null;
    }
    case 'vsc': {
      const mod: any = await import('react-icons/vsc');
      return mod?.[name] ?? null;
    }
    case 'wi': {
      const mod: any = await import('react-icons/wi');
      return mod?.[name] ?? null;
    }
    case 'ai': {
      const mod: any = await import('react-icons/ai');
      return mod?.[name] ?? null;
    }
    case 'fc': {
      const mod: any = await import('react-icons/fc');
      return mod?.[name] ?? null;
    }
    default:
      return null;
  }
}

function IconSmart({
  value,
  className,
  size = 32,
}: {
  value?: string | null;
  className?: string;
  size?: number;
}) {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);

  const parsed = useMemo(() => parseIconValue(value || ''), [value]);
  const isEmoji = !parsed && !!value;

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!parsed) {
        setComp(null);
        return;
      }
      try {
        const c = await loadReactIcon(parsed.pack, parsed.name);
        if (!alive) return;
        setComp(() => (c ? c : null));
      } catch {
        if (!alive) return;
        setComp(null);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [parsed?.pack, parsed?.name]);

  if (isEmoji) {
    return (
      <span
        className={[
          'inline-flex h-8 w-8 items-center justify-center',
          className || '',
        ].join(' ')}
        style={{ fontSize: 28, lineHeight: 1 }}
        aria-hidden="true"
      >
        {value}
      </span>
    );
  }

  if (!Comp) return null;
  const C: any = Comp;
  return <C className={className} size={size} />;
}

/* =========================
   Renderer
========================= */

type ServiceItem = {
  icon?: string; // emoji OR "pack:Name"
  image?: { src?: string; alt?: string };
  title?: string;
  description?: string;
};

function ServicesGridRenderer({
  block,
  theme,
}: {
  block: BlockInstance;
  theme?: DesignSystem;
}) {
  const d: any = block.data || {};

  const heading: string = d.heading || SERVICES_GRID_DEFAULT_DATA.heading;
  const ctaLabel: string = d.cta?.label || SERVICES_GRID_DEFAULT_DATA.cta.label;
  const ctaHref: string =
    (typeof d.cta?.href === 'string' && d.cta.href) ||
    SERVICES_GRID_DEFAULT_DATA.cta.href;

  const items: ServiceItem[] =
    Array.isArray(d.items) && d.items.length ? d.items : DEFAULT_ITEMS;

  const resolvedTheme = theme ?? mapThemeJson(null);

  return (
    <SectionShell theme={resolvedTheme}>
      <div className="mx-auto w-full bg-[color:var(--ds-bg)]">
        {/* top row: heading + CTA */}
        <div className="mb-8 flex items-center justify-between gap-4 md:mbg-10 md:mb-10">
          <div className="flex-1 max-w-[720px]">
            <Heading level="h2" weight="medium" tone="heading">
              <CinematicSplitWords
                text={heading}
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

          {/* CTA desktop */}
          <CinematicFade
            amount={0.35}
            margin="-120px"
            delay={0.15}
            duration={0.5}
          >
            <a
              href={ctaHref}
              className={[
                'hidden md:flex h-12 items-center justify-center px-8 py-2',
                'rounded-[calc(var(--ds-radius,16px))]',
                'bg-[color:var(--ds-on-bg)] text-[color:var(--ds-bg)]',
                'text-[18px] leading-[27px] font-medium tracking-[-0.01em]',
                'transition-transform',
              ].join(' ')}
            >
              {ctaLabel}
            </a>
          </CinematicFade>
        </div>

        {/* CTA mobile */}
        <CinematicFade
            amount={0.35}
            margin="-120px"
            delay={0.15}
            duration={0.5}
          >
        <a
          href={ctaHref}
          className={[
            'md:hidden mb-8 inline-flex h-12 w-full items-center justify-center px-8 py-2',
            'rounded-[calc(var(--ds-radius,16px))]',
            'bg-[color:var(--ds-on-bg)] text-[color:var(--ds-bg)]',
            'text-[16px] leading-[24px] font-medium tracking-[-0.01em]',
          ].join(' ')}
        >
          {ctaLabel}
        </a>
        </CinematicFade>

        {/* grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-7">
          {items.map((item, i) => {
            const isWide = WIDE_INDEXES.has(i);
            const hasImage = !!item.image?.src && isWide;

          

            return (
              <CinematicBlurUp
                key={i}
                amount={0.22}
                margin="-120px"
                y={10}
                blur={18}
                duration={1.05}
                delay={i * 0.06}
                className={[
                  'group relative flex h-full flex-col overflow-hidden p-6',
                  'rounded-[calc(var(--ds-radius,16px))]',
                  "bg-[color:color-mix(in_oklab,var(--ds-surface)_5%,transparent)]",
                  isWide ? 'md:col-span-2' : '',
                ].join(' ')}
              >
                <div className="flex flex-col gap-10 md:flex-row md:items-stretch">
                  {hasImage && (
                    <div className="relative shrink-0 md:w-[264px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image?.src}
                        alt={item.image?.alt || ''}
                        className={[
                          'w-full rounded-xl object-cover',
                          'md:h-[212px]',
                          'shadow-[0_25px_60px_-10px_color-mix(in_oklab,var(--ds-on-bg)_12%,transparent)]',
                        ].join(' ')}
                        draggable={false}
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col gap-4">
                    {!!item.icon && (
                      <div className="h-8 w-8">
                        <IconSmart
                          value={item.icon}
                          size={32}
                          className="text-[color:var(--ds-on-bg)]"
                        />
                      </div>
                    )}

                    <Text
                      as="h3"
                      tone="heading"
                      weight="medium"
                      className="text-[28px] md:text-[32px] leading-[34px] md:leading-[38.4px] tracking-[-0.01em]"
                    >
                      {item.title || 'Service'}
                    </Text>

                    <Text
                      size="lg"
                      tone="muted"
                      weight="light"
                      className="max-w-[560px]"
                    >
                      {item.description || ''}
                    </Text>
                  </div>
                </div>
              </CinematicBlurUp>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

/* =========================
   Schema
========================= */

export const SERVICES_GRID_SCHEMA = [
  {
    type: 'group',
    label: 'Nastavení sekce',
    children: [
      {
        type: 'text',
        path: 'heading',
        label: 'Nadpis sekce',
        placeholder: 'My services',
        maxLength: 80,
      },
      {
        type: 'group',
        label: 'CTA tlačítko',
        children: [
          {
            type: 'text',
            path: 'cta.label',
            label: 'Text tlačítka',
            placeholder: 'Get in touch',
            maxLength: 40,
          },
          {
            type: 'link',
            path: 'cta.href',
            label: 'Odkaz tlačítka',
            placeholder: '#contact nebo https://…',
          },
        ],
      },
      {
        type: 'group',
        label: 'Vzhled (theme)',
        children: [
          {
            type: 'theme',
            path: 'theme',
            label: 'Design systém sekce',
            help: 'Volitelné. Když nevyplníš, použije se globální theme.',
          },
        ],
      },
    ],
  },
  {
    type: 'repeater',
    label: 'Služby',
    path: 'items',
    emptyHint: 'Přidej první službu',
    itemFactory: () => ({
      icon: 'md:MdBolt',
      image: { src: '', alt: '' },
      title: 'New service',
      description: 'Short description…',
    }),
    children: [
      {
        type: 'icon',
        path: 'icon',
        label: 'Ikona',
        help: 'Ukládá se jako "pack:Name" (např. md:MdHome). Může být i emoji.',
        placeholder: 'Select icon…',
      },
      {
        type: 'image',
        path: 'image',
        label: 'Obrázek (použije se jen u wide karet)',
      },
      {
        type: 'text',
        path: 'title',
        label: 'Název služby',
        maxLength: 60,
      },
      {
        type: 'text',
        path: 'description',
        label: 'Popis',
        multiline: true,
        rows: 3,
        placeholder: 'Stručný popis služby...',
        maxLength: 260,
      },
    ],
  },
] as const;

/* =========================
   Registrace sekce
========================= */

const sv002: SectionModule = {
  id: 'sv002',
  definition: {
    type: 'services-grid',
    title: 'Služby – karty',
    version: 3,
    defaultData: SERVICES_GRID_DEFAULT_DATA,
    Renderer: ServicesGridRenderer,
    editor: {
      schema: SERVICES_GRID_SCHEMA,
      title: 'Upravit služby (karty)',
      modelPath: 'data',
    },
  },
  Editor: function ServicesGridEditor() {
    return (
      <div className="p-3 text-xs text-[color:color-mix(in_oklab,var(--ds-body,var(--ds-on-bg))_65%,transparent)]">
        (Použij horní akci „Upravit sekci“ pro nadpis, CTA a služby.)
      </div>
    );
  },
  meta: {
    category: 'services',
    previewImage: PreviewImage,
  },
};

export default sv002;
