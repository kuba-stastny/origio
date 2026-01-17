'use client';

import { cx } from '../utils';

export default function SwitchField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx('h-6 w-11 rounded-full p-0.5 transition', checked ? 'bg-zinc-200' : 'bg-zinc-700')}
      aria-pressed={checked}
    >
      <span className={cx('block h-5 w-5 rounded-full bg-zinc-900 transition-transform', checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  );
}
