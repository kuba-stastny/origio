// src/sections/registry.tsx
"use client";

import type { BlockDefinition } from "@/types/builder";
import type { SectionModule } from "./types";

import hd001 from "./category/header/hd001";

import h001 from "./category/hero/h001";
import h002 from "./category/hero/h002";

import sh001 from "./category/showroom/sh001";
import sh002 from "./category/showroom/sh002";
import sh003 from "./category/showroom/sh003";

import st001 from "./category/stats/st001";
import st002 from "./category/stats/st002";

import sv001 from "./category/services/sv001";
import sv002 from "./category/services/sv002";

import ts001 from "./category/testimonials/ts001";
import ts002 from "./category/testimonials/ts002";

import ct001 from "./category/cta/ct001";
import ct002 from "./category/cta/ct002";

import ab001 from "./category/about/ab001";
import ab002 from "./category/about/ab002";

import ga001 from "./category/gallery/ga001";

const modules: SectionModule[] = [
  hd001,
  h001,
  h002,
  sh001,
  sh002,
  sh003,
  st001,
  st002,
  sv001,
  sv002,
  ts001,
  ts002,
  ct001,
  ct002,
  ab001,
  ab002,
  ga001,
];

const byId = new Map<string, SectionModule>();
const byType = new Map<string, SectionModule>();

for (const m of modules) {
  if (m?.id) byId.set(m.id, m);
  const t = m?.definition?.type;
  if (t) byType.set(t, m);
}

export function getModuleByType(typeOrId: string): SectionModule | undefined {
  return byType.get(typeOrId) || byId.get(typeOrId);
}

export function listModules(): SectionModule[] {
  return modules;
}

export const blockRegistry: Record<string, BlockDefinition> = {};
export const sectionEditors: Record<string, SectionModule["Editor"]> = {};

for (const m of modules) {
  blockRegistry[m.id] = m.definition;
  sectionEditors[m.id] = m.Editor;
}

export function getSectionEditor(typeOrId: string) {
  const mod = byType.get(typeOrId) || byId.get(typeOrId);
  return mod?.Editor ?? null;
}
