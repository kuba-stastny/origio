// src/sections/types.ts
"use client";

import type { BlockInstance } from "@/types/builder";
import type { StaticImageData } from "next/image";
import type { ComponentType, ReactElement } from "react";

export type SectionId =
  | "hd001"
  | "h001"
  | "h002"
  | "sh001"
  | "sh002"
  | "sh003"
  | "lg001"
  | "st001"
  | "st002"
  | "sv001"
  | "sv002"
  | "ts001"
  | "ts002"
  | "ct001"
  | "ct002"
  | "ab001"
  | "ab002"
  | "ga001";



export type SectionData = Record<string, any>;

export type SectionRendererProps = {
  block: BlockInstance;
};

export type SectionEditorProps = {
  block: BlockInstance;
  // (zatím nepoužité, ale připravené pro globální inline editor)
  onChange?: (nextData: any) => void;
};

export type UniversalEditorConfig = {
  schema: readonly any[];
  title?: string;
  // default 'data'
  modelPath?: string;
};

export type SectionModuleMeta = {
  category: string;
  previewImage: StaticImageData | null;
};

/**
 * Definice bloku pro sekce – úmyslně držíme vlastní typ,
 * ale tvarově odpovídá tomu, co používáš v builderu:
 * - type, title, version
 * - defaultData (libovolný JSON)
 * - Renderer: funkce (props: { block }) => JSX.Element
 * - editor: config pro univerzální editor
 */
export type SectionBlockDefinition = {
  /** stejné jako SectionId; např. "hero", "header" */
  type: SectionId | string;

  /** název sekce v UI, např. "Hlavička" */
  title: string;

  /** verze sekce pro migrace */
  version: number;

  /** výchozí data sekce (musí být JSON-serializovatelná) */
  defaultData: SectionData;

  /** runtime renderer (client) */
  Renderer: (props: { block: BlockInstance }) => ReactElement;

  /** nastavení univerzálního editoru */
  editor?: UniversalEditorConfig;
};

export type SectionModule = {
  /** interní id modulu (např. "hero", "header") */
  id: SectionId;

  /** definice renderu a default dat */
  definition: SectionBlockDefinition;

  /** (volitelně) per-sekční editor – zatím dummy */
  Editor: ComponentType<SectionEditorProps>;

  /** metadata pro grid sekcí (kategorie, náhled) */
  meta?: SectionModuleMeta;
};
