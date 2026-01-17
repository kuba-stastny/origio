// src/components/builder/editor/types.ts

export type Draft = any;

/** -----------------------
 * Base
------------------------ */
export type VisibleIf = (draft: Draft) => boolean;

export type BaseField = {
  path?: string; // u repeater child "text" může být "" (jako u tagů)
  label?: string;
  help?: string;
  placeholder?: string;
  visibleIf?: VisibleIf;
};

/** -----------------------
 * Field types
------------------------ */
export type TextFieldDef = BaseField & {
  type: "text";
  path: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
};

export type NumberFieldDef = BaseField & {
  type: "number";
  path: string;
  step?: number;
  min?: number;
  max?: number;
};

export type SwitchFieldDef = BaseField & {
  type: "switch";
  path: string;
};

export type SelectFieldDef = BaseField & {
  type: "select";
  path: string;
  options: Array<{ label: string; value: string }>;
};

export type LinkFieldDef = BaseField & {
  type: "link";
  path: string;
};

export type ImageFieldDef = BaseField & {
  type: "image";
  path: string;
};

export type IconFieldDef = BaseField & {
  type: "icon";
  path: string;
};

export type MediaType = "image" | "video";

export type MediaFieldDef = BaseField & {
  type: "media";
  path: string;
  /** default: ["image","video"] */
  allowed?: readonly MediaType[];
};

export type GroupFieldDef = BaseField & {
  type: "group";
  label?: string;
  children: SchemaField[];
};

export type RepeaterFieldDef = BaseField & {
  type: "repeater";
  path: string;
  label?: string;
  emptyHint?: string;
  itemFactory?: () => any;
  children: SchemaField[];
};

export type SchemaField =
  | TextFieldDef
  | NumberFieldDef
  | SwitchFieldDef
  | SelectFieldDef
  | LinkFieldDef
  | ImageFieldDef
  | MediaFieldDef
  | IconFieldDef
  | GroupFieldDef
  | RepeaterFieldDef;
