"use client";

import React, { useRef } from "react";
import type { SchemaField } from "./types";
import { useEditorCtx } from "./EditorContext";

import TextField from "./fields/TextField";
import NumberField from "./fields/NumberField";
import SwitchField from "./fields/SwitchField";
import SelectField from "./fields/SelectField";
import ImageField from "./fields/ImageField";
import RepeaterRow from "./RepeaterRow";
import LinkField from "./fields/LinkField";
import IconField from "./fields/IconField";

function Row({
  label,
  help,
  children,
}: {
  label?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      {label && <label className="text-[12px] text-zinc-300">{label}</label>}
      {children}
      {help && <div className="text-[11px] text-zinc-500">{help}</div>}
    </div>
  );
}

export default function FieldRenderer({
  schema,
  basePath = "",
}: {
  schema: SchemaField[];
  basePath?: string;
}) {
  const { draft, changeAt, getAt, openMediaFor } = useEditorCtx();
  const finalizedRef = useRef(false);

  const renderField = (
    f: SchemaField,
    idx: number,
    base = ""
  ): React.ReactNode => {
    if (f.visibleIf && !f.visibleIf(draft)) return null;

    // Group wrapper
    if (f.type === "group") {
      return (
        <div
          key={`g-${idx}`}
          className="grid gap-4 rounded-2xl bg-zinc-900/30 border-zinc-800/60 p-4"
        >
          {f.label && (
            <div className="text-sm font-medium text-zinc-200">{f.label}</div>
          )}
          <div className="grid gap-4">
            {f.children.map((c, i) => renderField(c, i, base))}
          </div>
        </div>
      );
    }

    const fullPath = base ? `${base}.${f.path ?? ""}` : f.path ?? "";

    switch (f.type) {
      case "text":
        return (
          <Row key={idx} label={f.label} help={f.help}>
            <TextField
              value={getAt(fullPath)}
              onChange={(v) => changeAt(fullPath, v)}
              placeholder={f.placeholder}
              multiline={f.multiline}
              rows={f.rows}
              maxLength={f.maxLength}
            />
          </Row>
        );

      case "link":
        return (
          <Row key={idx} label={f.label} help={f.help}>
            <LinkField
              value={getAt(fullPath)}
              onChange={(v) => changeAt(fullPath, v)}
              placeholder={f.placeholder}
            />
          </Row>
        );

      case "number":
        return (
          <Row key={idx} label={f.label} help={f.help}>
            <NumberField
              value={getAt(fullPath)}
              onChange={(v) => changeAt(fullPath, v)}
              step={f.step}
              placeholder={f.placeholder}
              min={f.min}
              max={f.max}
            />
          </Row>
        );

      case "switch":
        return (
          <Row key={idx} label={f.label} help={f.help}>
            <SwitchField
              checked={!!getAt(fullPath)}
              onChange={(v) => changeAt(fullPath, v)}
            />
          </Row>
        );

      case "select":
        return (
          <Row key={idx} label={f.label} help={f.help}>
            <SelectField
              value={getAt(fullPath)}
              onChange={(v) => changeAt(fullPath, v)}
              options={f.options}
            />
          </Row>
        );

      case "image":
        return (
          <Row key={idx} label={f.label} help={f.help}>
            <ImageField
              value={getAt(fullPath)}
              onChange={(v) => changeAt(fullPath, v)}
              onPick={() => openMediaFor(fullPath, { type: "image" })}
            />
          </Row>
        );

      case "icon":
        return (
          <Row key={idx} label={f.label} help={f.help}>
            <IconField
              value={getAt(fullPath)}
              onChange={(v) => changeAt(fullPath, v)}
              placeholder={f.placeholder ?? "Select icon…"}
            />
          </Row>
        );

      case "repeater": {
        const items: any[] = Array.isArray(getAt(fullPath)) ? getAt(fullPath) : [];

        const addItem = () => {
          const next = f.itemFactory ? f.itemFactory() : {};
          changeAt(fullPath, [...items, next]);
        };

        const removeItem = (i: number) => {
          const next = items.filter((_, idx2) => idx2 !== i);
          changeAt(fullPath, next);
        };

        const moveItem = (from: number, to: number) => {
          if (to < 0 || to >= items.length || from === to) return;
          const n = [...items];
          const [m] = n.splice(from, 1);
          n.splice(to, 0, m);
          changeAt(fullPath, n);
        };

        return (
          <div key={idx} className="grid gap-2 p-5 rounded-2xl bg-zinc-900/30">
            <div className="flex items-center justify-between">
              <div className="text-base text-zinc-200">
                {f.label ?? "Seznam položek"}{" "}
                <span className="text-zinc-500">({items.length})</span>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800/70"
              >
                Přidat položku
              </button>
            </div>

            {items.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                {f.emptyHint ?? "Žádné položky."}
              </div>
            )}

            <div className="grid gap-5">
              {items.map((_, i) => (
                <RepeaterRow
                  key={i}
                  index={i}
                  total={items.length}
                  onUp={() => moveItem(i, i - 1)}
                  onDown={() => moveItem(i, i + 1)}
                  onRemove={() => removeItem(i)}
                >
                  <div className="grid gap-6">
                    {f.children.map((child, ci) =>
                      renderField(child, ci, `${fullPath}.${i}`)
                    )}
                  </div>
                </RepeaterRow>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return <div className="grid gap-5">{schema.map((f, i) => renderField(f, i, basePath))}</div>;
}
