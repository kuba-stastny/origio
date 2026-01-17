'use client';

type TextFieldProps = {
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
};

export default function TextField({
  value,
  onChange,
  placeholder,
  multiline,
  rows = 3,
  maxLength,
}: TextFieldProps) {
  const stringValue =
    typeof value === 'string' ? value : value ?? '';
  const currentLength = stringValue.length;

  const field = multiline ? (
    <textarea
      className="w-full rounded-xl bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 outline-none ring-1 ring-transparent focus:ring-zinc-600/40"
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
    />
  ) : (
    <input
      type="text"
      className="w-full rounded-xl bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 outline-none ring-1 ring-transparent focus:ring-zinc-600/40"
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
    />
  );

  return (
    <div className="space-y-1">
      {field}
      {typeof maxLength === 'number' && (
        <div className="flex justify-end text-[11px] text-zinc-500">
          {currentLength} / {maxLength}
        </div>
      )}
    </div>
  );
}
