// src/lib/migrations.ts
import type { PageDocument, BlockInstance } from "@/types/builder";
import { BlockRegistry } from "@/components/builder/BlockRegistry";
import { validateBlockData } from "@/lib/builderValidation";
import { logger } from "@/lib/logger";

// měkký deep-merge: doplní defaulty bez mazání uživatelských hodnot
function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (Array.isArray(base) || Array.isArray(patch)) return ((patch as any) ?? base) as T;
  if (typeof base === "object" && base && typeof patch === "object" && patch) {
    const out: any = { ...base };
    for (const k of Object.keys(patch)) {
      const bv: any = (base as any)[k];
      const pv: any = (patch as any)[k];
      out[k] = typeof bv === "object" && bv && typeof pv === "object" && pv ? deepMerge(bv, pv) : pv;
    }
    return out;
  }
  return ((patch as any) ?? base) as T;
}

export function migrateBlockToLatest(block: BlockInstance): { block: BlockInstance; changed: boolean } {
  const def = BlockRegistry[block.type];
  if (!def) return { block, changed: false };

  let currentVersion = block.version ?? 1;
  let data = block.data ?? {};
  let changed = false;

  // 1) Migruj po krocích n -> n+1
  while (def.migrations && def.migrations[currentVersion]) {
    try {
      data = def.migrations[currentVersion](data);
    } catch (e: any) {
      logger.warn(`Migration ${block.type} v${currentVersion}->v${currentVersion + 1} selhala`, { error: e?.message });
      // při selhání migrace raději doplníme defaulty a pokračujeme dál
      data = deepMerge(def.defaultData, data);
    }
    currentVersion++;
    changed = true;
  }

  // 2) Doplň defaulty nové verze
  data = deepMerge(def.defaultData, data);

  // 3) BEST-EFFORT FALLBACK (tvůj požadavek):
  // pokud stále nejsme na finální verzi a chybí mezikroky, povyš na nejnovější
  if (def.version && (block.version ?? 1) < def.version) {
    data = deepMerge(def.defaultData, data);
    currentVersion = def.version;
    changed = true;
    logger.warn(`Missing migrations for ${block.type}: ${block.version ?? 1} -> ${def.version}`);
  }

  // 4) Validace aktuální verze dat Zodem
  const validated = validateBlockData(block.type, def.version, data);
  if (!validated.ok) {
    logger.warn(`Validation failed for ${block.type} v${def.version}: ${validated.error}`);
    data = def.defaultData; // raději bezpečný fallback
    changed = true;
  } else {
    data = validated.data;
  }

  if (changed || currentVersion !== block.version) {
    return {
      block: { ...block, version: currentVersion, data },
      changed: true,
    };
  }
  return { block, changed: false };
}

export function migrateDocumentToLatest(doc: PageDocument): { doc: PageDocument; changed: boolean } {
  let changed = false;
  const sections = (doc.sections ?? []).map((b) => {
    const res = migrateBlockToLatest(b);
    if (res.changed) changed = true;
    return res.block;
  });

  const out: PageDocument = {
    version: 1, // sem můžeš přidat vlastní verzi dokumentu a její migrace
    settings: doc.settings ?? {},
    sections,
  };

  return { doc: out, changed };
}
