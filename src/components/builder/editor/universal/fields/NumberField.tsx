'use client';

export default function NumberField({
  value,
  onChange,
  step = 1,
  placeholder,
  min,
  max,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: number;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      className="w-full rounded-xl bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 outline-none ring-1 ring-transparent focus:ring-zinc-600/40"
      value={typeof value === 'number' ? value : ('' as any)}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      step={step}
      placeholder={placeholder}
      min={min}
      max={max}
    />
  );
}
