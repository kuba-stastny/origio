// src/components/builder/editor/universal/fields/IconField.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../cn";

/**
 * IconField – unified icon search (3 best outline packs)
 * Value format stays: "pack:ExportName"  e.g. "lu:LuHome"
 *
 * ✅ No pack selector
 * ✅ Search across 3 packs at once
 * ✅ Only outline-ish icons:
 *    - fi (Feather) -> outline by nature
 *    - lu (Lucide via react-icons) -> outline by nature
 *    - hi2 (Heroicons 2) -> ONLY HiOutline*
 *
 * Also filters out anything with Fill/Solid in the name.
 */

type IconFieldProps = {
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  disabled?: boolean;
};

type Pack = {
  id: string; // e.g. "lu"
  label: string;
  importPath: string;
  outlineOnly?: (exportName: string) => boolean;
};

const PACKS: Pack[] = [
  { id: "lu", label: "Lucide", importPath: "react-icons/lu" },
  { id: "fi", label: "Feather", importPath: "react-icons/fi" },
  {
    id: "hi2",
    label: "Heroicons 2 (Outline)",
    importPath: "react-icons/hi2",
    outlineOnly: (name) => name.startsWith("HiOutline"),
  },
];

// safety: remove filled/solid variants generally
function isFilledLike(name: string) {
  const s = name.toLowerCase();
  return s.includes("fill") || s.includes("solid");
}

function parseValue(v?: string | null) {
  if (!v) return null;
  const s = String(v);
  const i = s.indexOf(":");
  if (i === -1) return null;
  const pack = s.slice(0, i);
  const name = s.slice(i + 1);
  if (!pack || !name) return null;
  return { pack, name };
}

function isLegacyValue(v?: string | null) {
  const s = (v || "").toLowerCase();
  return s === "link" || s === "time" || s === "metric";
}

async function importPack(importPath: string) {
  // Keep explicit so Turbopack bundles predictably
  switch (importPath) {
    case "react-icons/lu":
      return import("react-icons/lu");
    case "react-icons/fi":
      return import("react-icons/fi");
    case "react-icons/hi2":
      return import("react-icons/hi2");
    default:
      return {};
  }
}

function getDisplayLabel(value?: string | null) {
  if (!value) return "";
  if (isLegacyValue(value)) return `${value} (legacy)`;
  const p = parseValue(value);
  if (!p) return String(value);
  return `${p.pack}:${p.name}`;
}

function IconPreview({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!value || isLegacyValue(value)) {
        setComp(null);
        return;
      }
      const parsed = parseValue(value);
      if (!parsed) {
        setComp(null);
        return;
      }
      const pack = PACKS.find((p) => p.id === parsed.pack);
      if (!pack) {
        setComp(null);
        return;
      }

      // Enforce "outline only"
      if (isFilledLike(parsed.name)) {
        setComp(null);
        return;
      }
      if (pack.outlineOnly && !pack.outlineOnly(parsed.name)) {
        setComp(null);
        return;
      }

      try {
        const mod: any = await importPack(pack.importPath);
        const C = mod?.[parsed.name] ?? null;
        if (!alive) return;
        setComp(() => (C ? C : null));
      } catch {
        if (!alive) return;
        setComp(null);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [value]);

  if (!Comp) return null;
  const C: any = Comp;
  return <C size={18} className={className} aria-hidden="true" />;
}

type IconKey = { pack: string; name: string };
function toKey(pack: string, name: string) {
  return `${pack}:${name}`;
}

export default function IconField({
  value,
  onChange,
  placeholder = "Select icon…",
  disabled,
}: IconFieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(false);
  const [icons, setIcons] = useState<IconKey[]>([]);
  const [limit, setLimit] = useState(220);

  // Close on outside click / ESC
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as any)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Load all packs (lazy) only when dropdown opens first time
  useEffect(() => {
    let alive = true;

    async function run() {
      if (!open) return;
      if (icons.length > 0) return;

      setLoading(true);
      try {
        const all: IconKey[] = [];

        for (const pack of PACKS) {
          const mod: any = await importPack(pack.importPath);
          const keys = Object.keys(mod || {}).filter((k) => {
            const v = (mod as any)[k];

            // must be component-like
            if (typeof v !== "function") return false;

            // remove fill/solid variants
            if (isFilledLike(k)) return false;

            // pack-specific "outline only"
            if (pack.outlineOnly && !pack.outlineOnly(k)) return false;

            // avoid random internals
            if (k.toLowerCase().includes("context")) return false;

            return true;
          });

          keys.sort((a, b) => a.localeCompare(b));
          for (const name of keys) all.push({ pack: pack.id, name });
        }

        if (!alive) return;
        setIcons(all);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return icons.slice(0, limit);

    // small fuzzy: startsWith priority on export name and on full "pack:name"
    const starts: IconKey[] = [];
    const contains: IconKey[] = [];

    for (const it of icons) {
      const full = toKey(it.pack, it.name).toLowerCase();
      const name = it.name.toLowerCase();

      if (name.startsWith(query) || full.startsWith(query)) starts.push(it);
      else if (name.includes(query) || full.includes(query)) contains.push(it);

      if (starts.length + contains.length >= limit) break;
    }

    return [...starts, ...contains].slice(0, limit);
  }, [icons, q, limit]);

  const display = getDisplayLabel(value);

  const subtitle = useMemo(() => {
    if (isLegacyValue(value)) return "Legacy value (replace by selecting icon)";
    return "Lucide + Feather + Heroicons (outline)";
  }, [value]);

  return (
    <div ref={rootRef} className="relative">
      {/* ✅ IMPORTANT: no nested buttons */}
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={cn(
            "flex-1 rounded-xl border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-left",
            "hover:bg-zinc-800/60 transition",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-700 bg-zinc-900/60">
                <IconPreview value={value} className="text-zinc-200" />
              </span>

              <div className="min-w-0">
                <div className="truncate text-[12px] text-zinc-200">
                  {display || <span className="text-zinc-500">{placeholder}</span>}
                </div>
                <div className="truncate text-[11px] text-zinc-500">{subtitle}</div>
              </div>
            </div>

            <span className="text-[11px] text-zinc-500">{open ? "▲" : "▼"}</span>
          </div>
        </button>

        {!!value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange("");
              setQ("");
            }}
            className={cn(
              "rounded-xl border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-[12px] text-zinc-200",
              "hover:bg-zinc-800/60 transition"
            )}
            title="Clear"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 z-[60] mt-2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-xl backdrop-blur",
            "p-3"
          )}
        >
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setLimit(220);
                }}
                placeholder="Search icons… (e.g. home, user, arrow, lu:home)"
                className={cn(
                  "w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-[13px] text-zinc-100",
                  "placeholder:text-zinc-500 outline-none focus:border-zinc-700"
                )}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <div>
                {loading
                  ? "Loading…"
                  : `${icons.length.toLocaleString()} outline icons`}
                {q.trim() ? ` • search: "${q.trim()}"` : ""}
              </div>
              <div className="text-zinc-500">Pick one</div>
            </div>

            <div className="max-h-[340px] overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
              {loading ? (
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 rounded-lg border border-zinc-800 bg-zinc-900/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {filtered.length === 0 ? (
                    <div className="p-6 text-center text-[12px] text-zinc-500">
                      No icons found.
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                      {filtered.map((it) => {
                        const v = toKey(it.pack, it.name);
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onChange(v);
                              setOpen(false);
                            }}
                            className={cn(
                              "group grid h-10 place-items-center rounded-lg border border-zinc-800 bg-zinc-900/40",
                              "hover:bg-zinc-800/60 hover:border-zinc-700 transition"
                            )}
                            title={v}
                          >
                            <IconPreview
                              value={v}
                              className="text-zinc-200 group-hover:text-zinc-50"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {icons.length > limit && (
                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLimit((v) => v + 260);
                        }}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-[12px] text-zinc-200 hover:bg-zinc-800/60"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[11px] text-zinc-500">
                Value: <span className="text-zinc-300">{display || "—"}</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-[12px] text-zinc-200 hover:bg-zinc-800/60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
