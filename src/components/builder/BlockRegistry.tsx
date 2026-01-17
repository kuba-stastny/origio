// src/components/builder/BlockRegistry.tsx
"use client";

// 🔁 jen re-export tvého registry, ať zůstanou importy v builderu stejné
export {
    // staré kompatibilní exporty (zůstávají)
    blockRegistry as BlockRegistry,
    sectionEditors,
    getSectionEditor,
    // nové helpery
    getModuleByType,
  } from "@/sections/registry";