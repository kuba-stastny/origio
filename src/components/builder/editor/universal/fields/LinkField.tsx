'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useBuilderStore } from '@/store/builder-store';

import {
  FaLink,
  FaPhoneAlt,
  FaEnvelope,
  FaHashtag,
  FaCheckCircle,
} from 'react-icons/fa';

export type LinkValue = {
  mode: 'external' | 'phone' | 'email' | 'section';
  value: string;
};

type LinkFieldProps = {
  value: any;
  onChange: (v: LinkValue) => void;
  placeholder?: string;
};

const MODE_LABELS: Record<LinkValue['mode'], string> = {
  external: 'Externí URL',
  phone: 'Telefon',
  email: 'E-mail',
  section: 'Sekce na stránce',
};

const MODE_ICONS: Record<LinkValue['mode'], React.ReactNode> = {
  external: <FaLink className="h-3.5 w-3.5" />,
  phone: <FaPhoneAlt className="h-3.5 w-3.5" />,
  email: <FaEnvelope className="h-3.5 w-3.5" />,
  section: <FaHashtag className="h-3.5 w-3.5" />,
};

type Option<T extends string = string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

/* =========================================================
   Motion presets
========================================================= */

const menuVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
};

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: 6, filter: 'blur(8px)' },
};

/* =========================================================
   Dropdown (opens to the LEFT) — Dark theme
========================================================= */

function Dropdown<T extends string>({
  currentLabel,
  options,
  onSelect,
  currentIcon,
}: {
  currentLabel: string;
  options: Option<T>[];
  onSelect: (value: T) => void;
  currentIcon?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  const toggle = () => setOpen((o) => !o);

  const handleSelect = (val: T) => {
    onSelect(val);
    setOpen(false);
  };

  // close on outside click / escape
  React.useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs text-zinc-100 outline-none transition hover:bg-zinc-950/30 focus:ring-1 focus:ring-zinc-600"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5 text-zinc-200 ring-1 ring-white/10">
            {currentIcon ?? <FaCheckCircle className="h-3.5 w-3.5" />}
          </span>
          <span className="truncate text-left">{currentLabel}</span>
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 opacity-70 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial="hidden"
            animate="show"
            exit="exit"
            variants={menuVariants}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute left-0 z-40 mt-1 w-full origin-top-left overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl ring-1 ring-white/5"
          >
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="max-h-64 overflow-y-auto p-1"
            >
              {options.map((opt) => (
                <motion.li key={opt.value} variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-100 transition hover:bg-zinc-950/30"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/5 text-zinc-200 ring-1 ring-white/10">
                      {opt.icon ?? <FaCheckCircle className="h-3.5 w-3.5" />}
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   LinkField — Dark theme
========================================================= */

export default function LinkField({ value, onChange, placeholder }: LinkFieldProps) {
  const sections = useBuilderStore((s) => s.sections);

  // options from section.title (primary), with fallbacks
  const sectionOptions: Option[] = React.useMemo(() => {
    return (sections ?? []).map((sec: any, idx: number) => {
      const defTitle = sec?.title;
      const label = defTitle || `Sekce ${idx + 1}`;

      return {
        value: String(sec?.id ?? ''),
        label,
        icon: <FaHashtag className="h-3.5 w-3.5" />,
      };
    });
  }, [sections]);

  const parsed: LinkValue =
    value && typeof value === 'object' && 'mode' in value && 'value' in value
      ? (value as LinkValue)
      : { mode: 'external', value: '' };

  const [mode, setMode] = React.useState<LinkValue['mode']>(parsed.mode);
  const [innerValue, setInnerValue] = React.useState<string>(parsed.value ?? '');

  // sync from outside
  React.useEffect(() => {
    if (!value) {
      setMode('external');
      setInnerValue('');
      return;
    }
    if (value?.mode && value?.value !== undefined) {
      setMode(value.mode);
      setInnerValue(value.value ?? '');
    }
  }, [value]);

  const update = (nextMode: LinkValue['mode'], nextValue: string) => {
    onChange({ mode: nextMode, value: nextValue });
  };

  const handleModeSelect = (nextMode: LinkValue['mode']) => {
    setMode(nextMode);
    const nextValue = innerValue ?? '';
    setInnerValue(nextValue);
    update(nextMode, nextValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInnerValue(v);
    update(mode, v);
  };

  const handleSectionSelect = (sectionId: string) => {
    setInnerValue(sectionId);
    update(mode, sectionId);
  };

  const effectivePlaceholder =
    mode === 'external'
      ? placeholder ?? 'https://…'
      : mode === 'phone'
      ? placeholder ?? '+420 123 456 789'
      : mode === 'email'
      ? placeholder ?? 'napriklad@domena.cz'
      : placeholder ?? 'Vyberte sekci…';

  const selectedSectionLabel =
    sectionOptions.find((o) => o.value === innerValue)?.label || effectivePlaceholder;

  const modeOptions: Option<LinkValue['mode']>[] = [
    { value: 'external', label: MODE_LABELS.external, icon: MODE_ICONS.external },
    { value: 'phone', label: MODE_LABELS.phone, icon: MODE_ICONS.phone },
    { value: 'email', label: MODE_LABELS.email, icon: MODE_ICONS.email },
    { value: 'section', label: MODE_LABELS.section, icon: MODE_ICONS.section },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Label 1 */}
      <div className="text-[12px] font-light text-zinc-300">
        Vyberte typ odkazu
      </div>

      {/* Dropdown 1: mode */}
      <Dropdown<LinkValue['mode']>
        currentLabel={MODE_LABELS[mode]}
        currentIcon={MODE_ICONS[mode]}
        options={modeOptions}
        onSelect={handleModeSelect}
      />

      {/* Label 2 */}
      <div className="pt-1 text-[12px] font-light text-zinc-300">
        {mode === 'section' ? 'Vyberte hodnotu' : 'Zadejte hodnotu'}
      </div>

      {/* Dropdown 2 / input */}
      {mode === 'section' ? (
        <Dropdown
          currentLabel={selectedSectionLabel}
          currentIcon={<FaHashtag className="h-3.5 w-3.5" />}
          options={
            sectionOptions.length
              ? sectionOptions
              : [
                  {
                    value: '' as any,
                    label: 'Žádné sekce k dispozici',
                    icon: <FaHashtag className="h-3.5 w-3.5" />,
                  },
                ]
          }
          onSelect={(val) => {
            if (!val) return;
            handleSectionSelect(String(val));
          }}
        />
      ) : (
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {MODE_ICONS[mode]}
          </div>
          <input
            type="text"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition hover:bg-zinc-950/40 focus:ring-1 focus:ring-zinc-600"
            value={innerValue}
            onChange={handleInputChange}
            placeholder={effectivePlaceholder}
          />
        </div>
      )}
    </div>
  );
}
