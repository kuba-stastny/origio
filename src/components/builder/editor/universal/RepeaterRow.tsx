'use client';

import React from 'react';
import { BsArrowDown, BsArrowUp, BsTrash } from 'react-icons/bs';

type Props = {
  index: number;
  total: number;
  children: React.ReactNode;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  /** Kompaktnější režim (menší padding/gap) */
  dense?: boolean;
  /** Volitelný titulek položky místo "Položka #x" */
  title?: string;
};

export default function RepeaterRow({
  index,
  total,
  children,
  onUp,
  onDown,
  onRemove,
  dense = true,
  title,
}: Props) {
  const wrapCls = dense
    ? 'rounded-2xl bg-zinc-900/30  border-zinc-800 px-5 py-7'
    : 'rounded-2xl bg-zinc-900/30  border-zinc-800 px-5 py-7';

  const headCls = dense
    ? 'flex items-center justify-between gap-2'
    : 'flex items-center justify-between gap-3';

  const bodyCls = dense ? 'mt-2 grid gap-2' : 'mt-3 grid gap-3';

  return (
    <div className={wrapCls}>
      {/* Header strip */}
      <div className={headCls}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-zinc-900/50 px-2 py-2 text-[10px] font-medium text-zinc-300 ring-1 ring-zinc-800">
            {index + 1}/{total}
          </span>
          <span className="text-xs hidden text-zinc-400 truncate">
            {title ?? `Položka #${index + 1}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton
            onClick={onUp}
            disabled={index === 0}
            title="Nahoru"
            ariaLabel="Přesunout položku nahoru"
          >
            <BsArrowUp className="h-4 w-4" />
          </IconButton>

          <IconButton
            onClick={onDown}
            disabled={index === total - 1}
            title="Dolů"
            ariaLabel="Přesunout položku dolů"
          >
            <BsArrowDown className="h-4 w-4" />
          </IconButton>

          <div className="mx-1 h-4 w-px bg-zinc-800" />

          <IconButton
            onClick={onRemove}
            tone="danger"
            title="Smazat"
            ariaLabel="Smazat položku"
          >
            <BsTrash className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      {/* Content */}
      <div className={bodyCls}>{children}</div>
    </div>
  );
}

/* --- Mini helper pro ikonové tlačítko --- */
function IconButton({
  onClick,
  disabled,
  title,
  ariaLabel,
  tone = 'default',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  const base =
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition focus:outline-none focus:ring-2 focus:ring-offset-0';
  const styles =
    tone === 'danger'
      ? 'text-red-500 hover:bg-red-900/40 focus:ring-red-600/50'
      : 'text-zinc-300 hover:bg-zinc-800/70 focus:ring-zinc-500/40';
  const disabledCls = 'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? title}
      className={`${base} ${styles} ${disabledCls}`}
    >
      {children}
    </button>
  );
}
