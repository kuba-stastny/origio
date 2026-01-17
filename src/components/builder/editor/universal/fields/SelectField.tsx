'use client';

export default function SelectField({
  value,
  onChange,
  options,
}: {
  value?: string;
  onChange: (v?: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      className="w-full rounded-xl bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 outline-none ring-1 ring-transparent focus:ring-zinc-600/40"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">— vyber —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
