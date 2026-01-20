// src/app/api/v1/projects/[projectId]/autogen/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { nanoid } from "@/utils/ids";

import { getPreset } from "@/lib/templates/presets";
import { THEME_BLACKY, THEME_WHITEY } from "@/lib/templates/themes";
import { SECTION_META_BY_ID, PREFERRED_ORDER } from "@/sections/section-meta";

/* ----------------------------- Config ----------------------------- */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * ✅ PROMPT CONFIG (jedno místo, kde to ladíš)
 */
const PROMPT = {
  temperature: 0.7,
  maxTokens: 2000,

  common: {
    output: [
      "Odpověz POUZE validním JSONem, který přesně odpovídá struktuře defaultData.",
      "Zachovej stejné klíče i datové typy hodnot. NIC nepřidávej ani neubírej.",
      "Žádné vysvětlování, žádné komentáře, žádný text okolo JSONu.",
      "Žádné výplně typu „Lorem ipsum“, „Nadpis“, „Popis“, apod.",
      "Všechny texty PIŠ ČESKY. Nikde žádná angličtina.",
    ],
    constraints: [
      "Jasně vysvětli hodnotu nabídky během prvních 5–10 sekund (hlavně hero).",
      "Mluv jazykem cílové skupiny (žádný marketingový balast).",
      "Veď čtenáře k jedné konkrétní akci, která odpovídá websiteGoal.",
      "Piš konkrétně, stručně a lidsky s přihlédnutím na toneOfVoice.",
      "Bez klišé, prázdných frází a „agenturního“ jazyka.",
      "Důraz na přínos pro uživatele, ne na popis služby.",
      "Musí být zřetelně reflektovaný idealCustomer.",
      "V hero a službách musí být vidět mainProblem (co řešíš a proč to někoho zajímá).",
      "Dodrž SECTION META (co je to za sekci a co má obsahovat).",
      "SECTION META NOTE má NEJVYŠŠÍ PRIORITU. Nikdy ji neignoruj.",
      "Když chybí informace (cílovka, nabídka, fáze funnelu), domysli typické, realistické informace jako zkušený freelancer v oboru (primaryFocus) tak, aby to vedlo idealCustomer ke konverzi podle websiteGoal.",
    ],
    length: [
      "Nadpisy a labely krátké, úderné.",
      "Popisy a body text konkrétní a specifické (často 4–8 vět).",
      "Žádný zbytečný balast. Každá věta musí mít důvod.",
    ],
    style: [
      "Styl: sebevědomý, profesionální.",
      "Bez vykřičníků. Bez hype. Bez přehnaných slibů.",
      "Česky, přirozeně, jako bys mluvil s reálným člověkem.",
    ],
  },

  cs: {
    systemIntro: [
      "Jsi zkušený seniorní český copywriter pro webové stránky.",
      "Píšeš webové texty, které rychle vysvětlují hodnotu a vedou ke konverzní akci.",
      "Specializuješ se na moderní landing page pro služby a osobní značky.",
      "Píšeš přirozeně, konkrétně a s respektem k cílové skupině.",
    ],
    toneRules: [
      "Vše piš česky.",
      "Žádný marketingový balast a agenturní fráze.",
      "Žádné klišé typu „posuňte své podnikání“, „řešení na míru“, „komplexní služby“ bez konkrétního důkazu v onboardingu.",
      "Nepoužívej anglické termíny, pokud nejsou opravdu nutné (a když už, tak maximálně ojediněle a přirozeně). Ideálně vůbec.",
      "Primární CTA musí jasně odpovídat websiteGoal.",
    ],
  },

  userPromptOrder: [
    "persona",
    "brief",
    "onboarding",
    "sectionType",
    "sectionMetaHighPriority",
    "defaultData",
  ] as const,
};

/* ----------------------------- Types ------------------------------ */
type Lang = "cs" | "en";
type ThemeKey = "blacky" | "whitey";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

type SectionDef = {
  version: number;
  defaultData: Json;
  title?: string;
};
type Definitions = Record<string, SectionDef>;

type OnboardingV1 = {
  name?: string;
  primaryFocus?: string;

  idealCustomer?: string;
  mainProblem?: string;
  avoidCustomer?: string;

  projectCount?: string;
  toneOfVoice?: string;
  brag?: string;

  websiteGoal?: string;

  templateId?: string;
};

type BodyIn = {
  desc?: string;
  onboarding?: OnboardingV1;

  language?: string;
  definitions?: Definitions;
  maxSections?: number;

  templateId?: string | null;
  themeKey?: ThemeKey | null;

  persona?: string | null;
  forcedSections?: string[];

  version?: number;
};

type GeneratedSection = {
  id: string;
  type: string;
  version: number;
  data: Json;
  title?: string;
};

type DraftDoc = {
  version: number;
  sections: GeneratedSection[];
};

type MetaJson = {
  title: string;
  locale: string;
  robots: string;
  description: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: "summary_large_image" | "summary" | "app" | "player" | null;
};

/* ----------------------------- Helpers --------------------------- */
function clean(s: unknown) {
  return String(s ?? "").trim();
}

function safeJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function hasAnyOnboarding(o?: OnboardingV1 | null) {
  if (!o) return false;
  return Object.values(o).some((v) => clean(v).length > 0);
}

function resolveTheme(themeKey: ThemeKey | null | undefined) {
  if (themeKey === "whitey") return THEME_WHITEY;
  return THEME_BLACKY;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isEmptyObject(v: unknown) {
  return isRecord(v) && Object.keys(v).length === 0;
}

/**
 * ✅ Build a strong brief for LLM from onboarding (source of truth)
 * Pozn.: i když přijde language=en, generujeme vždy česky (uživatelský požadavek).
 */
function buildBriefFromOnboarding(o: OnboardingV1, _language: Lang) {
  const lines: string[] = [];

  lines.push("Vytvoř moderní one-page web pro osobní služby / podnikání.");
  if (clean(o.name)) lines.push(`Jméno / značka: ${clean(o.name)}`);
  if (clean(o.primaryFocus)) lines.push(`Obor: ${clean(o.primaryFocus)}`);

  if (clean(o.idealCustomer)) lines.push(`Ideální zákazník: ${clean(o.idealCustomer)}`);
  if (clean(o.mainProblem)) lines.push(`Hlavní problém, který řeším: ${clean(o.mainProblem)}`);
  if (clean(o.avoidCustomer)) lines.push(`S kým nechci spolupracovat: ${clean(o.avoidCustomer)}`);

  if (clean(o.projectCount)) lines.push(`Zkušenosti (projekty): ${clean(o.projectCount)}`);
  if (clean(o.toneOfVoice)) lines.push(`Tone of voice: ${clean(o.toneOfVoice)}`);
  if (clean(o.brag)) lines.push(`Důkaz / konkrétní opora: ${clean(o.brag)}`);

  if (clean(o.websiteGoal)) lines.push(`Primární cíl webu (CTA): ${clean(o.websiteGoal)}`);
  if (clean(o.templateId)) lines.push(`Vybraný design (template): ${clean(o.templateId)}`);

  lines.push(
    [
      "Píšeš texty, které:",
      "- jasně vysvětlují hodnotu nabídky během prvních 5–10 sekund,",
      "- mluví jazykem cílové skupiny (žádný marketingový balast),",
      "- vedou čtenáře k jedné konkrétní akci.",
      "",
      "Piš:",
      "- konkrétně, stručně a lidsky s přihlédnutím na definovaný toneOfVoice,",
      "- bez klišé, prázdných frází a „agenturního“ jazyka,",
      "- s důrazem na přínos pro uživatele, ne na popis služby.",
      "",
      "Styl:",
      "- sebevědomý, profesionální,",
      "- žádné vykřičníky, žádný hype,",
      "- psáno česky, přirozeně, jako bys mluvil s reálným člověkem.",
      "",
      "Pokud chybí informace, domysli realistické a typické informace pro daný obor tak, aby to vedlo ideálního zákazníka ke konverzní akci podle cíle webu.",
    ].join("\n")
  );

  return lines.join("\n").trim();
}

function derivePersona(b: BodyIn, o?: OnboardingV1 | null) {
  const legacy = b.persona;
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim();
  const fromOnboarding = clean(o?.primaryFocus);
  return fromOnboarding || null;
}

function buildMetaJson(o: OnboardingV1 | null, language: Lang): MetaJson {
  const name = clean(o?.name);
  const focus = clean(o?.primaryFocus);
  const ic = clean(o?.idealCustomer);
  const prob = clean(o?.mainProblem);
  const goal = clean(o?.websiteGoal);

  // ✅ vždy česky (uživatelský požadavek)
  const titleBase = [name || "", focus || ""].filter(Boolean).join(" — ").slice(0, 120);
  const title = titleBase || "Osobní web — služby a kontakt";

  const descriptionBase = [
    prob ? `Pomáhám řešit: ${prob}` : "",
    ic ? `Pro: ${ic}` : "",
    goal ? `Cíl: ${goal}` : "",
  ]
    .filter(Boolean)
    .join(" • ")
    .slice(0, 300);

  const description = descriptionBase || "Moderní one-page web pro služby, důvěru a konverze.";

  return {
    title,
    description,
    locale: "cs_CZ",
    robots: "noindex,nofollow",
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    twitterCard: null,
  };
}

/* ----------------------- Header nav patching ---------------------- */
function buildHeaderNavFromSections(sections: GeneratedSection[]) {
  const LABEL_BY_TYPE: Record<string, string> = {
    sh001: "Projekty",
    sh002: "Projekty",
    sh003: "Projekty",

    sv001: "Služby",
    sv002: "Služby",

    ts001: "Reference",
    ts002: "Reference",

    ab001: "O mně",
    ab002: "O mně",

    ct001: "Kontakt",
    ct002: "Kontakt",

    ga001: "Galerie",
    st001: "Klienti",
    st002: "Výsledky",
  };

  const NAV_ORDER = [
    "sh001",
    "sh002",
    "sh003",
    "sv001",
    "sv002",
    "ts001",
    "ts002",
    "ab001",
    "ab002",
    "ct001",
    "ct002",
    "ga001",
    "st001",
    "st002",
  ];

  const idByType = new Map<string, string>();
  for (const s of sections) idByType.set(s.type, s.id);

  const nav: any[] = [];
  for (const type of NAV_ORDER) {
    const id = idByType.get(type);
    if (!id) continue;

    const label = LABEL_BY_TYPE[type];
    if (!label) continue;

    if (nav.some((x) => x.label === label)) continue;

    nav.push({
      href: { mode: "section", value: id },
      label,
    });
  }

  return nav;
}

function patchHeaderNav(sections: GeneratedSection[]) {
  const header = sections.find((s) => s.type === "hd001");
  if (!header) return;
  if (!isRecord(header.data)) return;

  (header.data as any).nav = buildHeaderNavFromSections(sections);
}

/* ----------------------- Prompt builder (UX) ---------------------- */
function buildSystemPrompt(_language: Lang) {
  const L = PROMPT.cs;

  return [
    ...L.systemIntro,
    "",
    "DŮLEŽITÉ (výstup):",
    ...PROMPT.common.output.map((x) => `- ${x}`),
    "",
    "TVRDÁ PRAVIDLA:",
    ...PROMPT.common.constraints.map((x) => `- ${x}`),
    "",
    "DÉLKA A STRUKTURA:",
    ...PROMPT.common.length.map((x) => `- ${x}`),
    "",
    "STYL:",
    ...PROMPT.common.style.map((x) => `- ${x}`),
    "",
    "TÓN PSANÍ:",
    ...L.toneRules.map((x) => `- ${x}`),
  ].join("\n");
}

function buildUserPrompt(args: {
  type: string;
  defaultData: Json;
  brief: string;
  persona?: string | null;
  onboarding?: OnboardingV1 | null;
}) {
  const { type, defaultData, brief, persona, onboarding } = args;
  const meta = SECTION_META_BY_ID[type];

  const sectionMetaHighPriority = meta
    ? [
        "SECTION META — NEJVYŠŠÍ PRIORITA (nikdy neignoruj):",
        `- id: ${meta.id}`,
        `- type: ${meta.type}`,
        `- title: ${meta.title}`,
        meta.aiHint ? `- aiHint: ${meta.aiHint}` : "",
        meta.note ? `- NOTE (NEJVYŠŠÍ PRIORITA): ${meta.note}` : "",
        "",
        "Musíš dodržet NOTE výše i za cenu větší konkrétnosti. Pokud je text vágní, vyhraj NOTE.",
        "Všechno piš česky.",
      ]
        .filter(Boolean)
        .join("\n")
    : "SECTION META — NEJVYŠŠÍ PRIORITA: (nenalezeno pro toto id) — drž se striktně defaultData.";

  const blocks: Record<(typeof PROMPT.userPromptOrder)[number], string> = {
    persona: persona ? `Persona: ${persona}` : "",
    brief: `Brief:\n${brief || "nezadáno"}`,
    onboarding: onboarding
      ? `ONBOARDING (zdroj pravdy):\n${JSON.stringify(onboarding, null, 2)}`
      : "",
    sectionType: `ID sekce: "${type}"`,
    sectionMetaHighPriority,
    defaultData: `Struktura defaultData k vyplnění:\n${JSON.stringify(defaultData, null, 2)}`,
  };

  return PROMPT.userPromptOrder
    .map((k) => blocks[k])
    .filter((s) => s.trim().length > 0)
    .join("\n\n");
}

/* ----------------------- OpenAI section gen ----------------------- */
function extractJsonObject(raw: string): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;

  if (s.startsWith("{") && s.endsWith("}")) return s;

  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return s.slice(start, end + 1);

  return null;
}

function modelSupportsTemperature(model: string) {
  return /^gpt-4o|^gpt-4\.1|^gpt-4\b|^gpt-3\.5/i.test(model);
}

function buildOpenAIBody(args: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
}) {
  const base: any = {
    model: args.model,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
    response_format: { type: "json_object" },
  };

  // ✅ gpt-5-*: use max_completion_tokens, no temperature
  if (/^gpt-5/i.test(args.model)) {
    base.max_completion_tokens = args.maxTokens;
    return base;
  }

  // ✅ older chat.completions models: max_tokens + temperature
  base.max_tokens = args.maxTokens;
  if (modelSupportsTemperature(args.model)) base.temperature = args.temperature;
  return base;
}

async function generateSectionCopy<T extends Json>(args: {
  type: string;
  defaultData: T;
  brief: string;
  language: Lang;
  persona?: string | null;
  onboarding?: OnboardingV1 | null;
}): Promise<{ data: T; warning?: string }> {
  if (!OPENAI_API_KEY) {
    return {
      data: structuredClone(args.defaultData),
      warning: "OPENAI_API_KEY missing → fallback defaultData",
    };
  }

  const system = buildSystemPrompt(args.language);
  const user = buildUserPrompt({
    type: args.type,
    defaultData: args.defaultData,
    brief: args.brief,
    persona: args.persona ?? null,
    onboarding: args.onboarding ?? null,
  });

  const willSendTemperature =
    modelSupportsTemperature(OPENAI_MODEL) && !/^gpt-5/i.test(OPENAI_MODEL);

  console.log(`[autogen] openai.request`, {
    type: args.type,
    model: OPENAI_MODEL,
    systemChars: system.length,
    userChars: user.length,
    willSendTemperature,
    max_output_tokens: PROMPT.maxTokens,
    meta: SECTION_META_BY_ID[args.type],
  });

  const body = buildOpenAIBody({
    model: OPENAI_MODEL,
    system,
    user,
    maxTokens: PROMPT.maxTokens,
    temperature: PROMPT.temperature,
  });

  const started = Date.now();
  let status = 0;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    status = res.status;
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        payload?.error?.message || `OpenAI request failed (status ${res.status})`;
      console.log(`[autogen] openai.error`, {
        type: args.type,
        status: res.status,
        message: msg,
      });
      return {
        data: structuredClone(args.defaultData),
        warning: `OpenAI error for "${args.type}": ${msg} → fallback defaultData`,
      };
    }

    const rawText = payload?.choices?.[0]?.message?.content ?? "";
    const ms = Date.now() - started;

    console.log(`[autogen] openai.response`, {
      type: args.type,
      status,
      ms,
      outputChars: rawText?.length ?? 0,
      rawPreview: (rawText || "").slice(0, 260),
    });

    const extracted = extractJsonObject(rawText);
    if (!extracted) {
      return {
        data: structuredClone(args.defaultData),
        warning: `AI returned empty/invalid output for "${args.type}" → fallback defaultData`,
      };
    }

    const fallback = structuredClone(args.defaultData);
    const parsed = safeJson<T>(extracted, fallback);

    if (isEmptyObject(parsed)) {
      return {
        data: fallback,
        warning: `AI returned empty object for "${args.type}" → fallback defaultData`,
      };
    }

    return { data: parsed };
  } catch (e: any) {
    console.log(`[autogen] openai.exception`, {
      type: args.type,
      status,
      message: e?.message || String(e),
    });
    return {
      data: structuredClone(args.defaultData),
      warning: `OpenAI exception for "${args.type}": ${e?.message || e} → fallback defaultData`,
    };
  }
}

/* ------------------------ Section picking ------------------------- */
function pickTypes(desc: string, definitions: Definitions, max: number): string[] {
  const all = Object.keys(definitions);
  if (!all.length) return [];

  const txt = (desc || "").toLowerCase();
  const take = (cands: string[]) => cands.filter((t) => definitions[t]).slice(0, max);

  if (/portfolio|ukázk|projek|reference|case|work/.test(txt)) {
    const picked = take(["hd001", "h001", "sh001", "ga001", "ts001", "ct001"]);
    if (picked.length) return picked;
  }

  if (/služb|nabídk|spolupr|freelanc|agentura|studio|konzult/.test(txt)) {
    const picked = take(["hd001", "h001", "sv001", "sv002", "ts001", "ct001"]);
    if (picked.length) return picked;
  }

  if (/výsledk|čís|stat|růst|konverz|poptávk|lead|%/.test(txt)) {
    const picked = take(["hd001", "h001", "st001", "st002", "ts001", "ct001"]);
    if (picked.length) return picked;
  }

  const fromPreferred = take([...PREFERRED_ORDER]);
  if (fromPreferred.length) return fromPreferred;

  return all.slice(0, max);
}

/* ----------------------------- Route ----------------------------- */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const reqId = nanoid();
  const params = await context.params;
  const projectParam = params.projectId;

  console.log(`[autogen:${reqId}] start`, { projectParam });

  const user = await getUser().catch(() => null);
  if (!user) {
    console.log(`[autogen:${reqId}] unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await request.json().catch(() => ({}))) as unknown;
  const b: BodyIn =
    typeof raw === "object" && raw !== null ? (raw as BodyIn) : ({} as BodyIn);

  // ✅ i když přijde "en", generujeme česky (uživatelský požadavek)
  const language: Lang = "cs";

  const definitions: Definitions = b.definitions ?? {};
  const maxSections = Math.min(Number(b.maxSections ?? 10), 12);

  console.log(`[autogen:${reqId}] request.body`, {
    language,
    hasDefinitions: !!Object.keys(definitions).length,
    maxSections,
    templateId: b.templateId ?? null,
    themeKey: b.themeKey ?? null,
    forcedSectionsCount: Array.isArray(b.forcedSections) ? b.forcedSections.length : 0,
  });

  if (!Object.keys(definitions).length) {
    return NextResponse.json({ error: "Missing definitions" }, { status: 400 });
  }

  const onboarding = (b.onboarding ?? null) as OnboardingV1 | null;
  const legacyDesc = clean(b.desc);

  const desc = hasAnyOnboarding(onboarding)
    ? buildBriefFromOnboarding(onboarding!, language)
    : legacyDesc;

  if (!desc) {
    return NextResponse.json({ error: "Missing desc/onboarding" }, { status: 400 });
  }

  const persona = derivePersona(b, onboarding);
  const forcedSections = Array.isArray(b.forcedSections) ? b.forcedSections : null;

  const templateId =
    typeof b.templateId === "string" && b.templateId.trim()
      ? b.templateId.trim()
      : clean(onboarding?.templateId) || null;

  const themeKey = (b.themeKey ?? null) as ThemeKey | null;
  const theme_json = resolveTheme(themeKey);

  const supabase = await supabaseServer();

  // 1) find project by id
  const { data: projectById } = await supabase
    .from("projects")
    .select("id, workspace_id, name")
    .eq("id", projectParam)
    .maybeSingle();

  let project: { id: string; workspace_id: string; name: string } | null =
    projectById ?? null;

  // 2) or by slug
  if (!project) {
    const { data: projectBySlug } = await supabase
      .from("projects")
      .select("id, workspace_id, name")
      .eq("slug", projectParam)
      .maybeSingle();

    project = projectBySlug ?? null;
  }

  if (!project) {
    console.log(`[autogen:${reqId}] project_not_found`, { projectParam });
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 3) find/create page
  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("project_id", project.id)
    .eq("path", "/")
    .limit(1)
    .maybeSingle();

  let pageId: string | undefined = existing?.id;

  const meta_json = buildMetaJson(onboarding, language);
  const settings_json = {
    title: project.name,
    ai_intent: {
      brief: desc,
      persona,
      onboarding: onboarding ?? null,
      templateId,
      themeKey,
      version: b.version ?? 1,
    },
  };

  if (!pageId) {
    const { data: created, error: cErr } = await supabase
      .from("pages")
      .insert({
        project_id: project.id,
        name: "Domů",
        path: "/",
        page_json: { version: 1, sections: [] },
        draft_json: { version: 1, sections: [] },
        settings_json,
        meta_json,
        theme_json,
      })
      .select("id")
      .single();

    if (cErr) {
      console.log(`[autogen:${reqId}] page_create_failed`, { error: cErr.message });
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }

    pageId = created!.id as string;
    console.log(`[autogen:${reqId}] page_created`, { pageId });
  } else {
    const { error: upErr } = await supabase
      .from("pages")
      .update({
        settings_json,
        meta_json,
        theme_json,
      })
      .eq("id", pageId);

    if (upErr) {
      console.log(`[autogen:${reqId}] page_update_failed`, { error: upErr.message });
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    console.log(`[autogen:${reqId}] page_updated`, { pageId });
  }

  // 4) pick sections (priority: template preset -> forcedSections -> picker)
  let picked: string[] = [];

  // 4A) template preset exact order
  if (templateId) {
    const preset = getPreset(templateId);
    if (preset?.sections?.length) {
      picked = preset.sections.filter((t) => definitions[t]);
    }
  }

  // 4B) forced sections (explicit request)
  if (!picked.length && forcedSections?.length) {
    picked = forcedSections.filter((s) => definitions[s]);
  }

  // 4C) fallback picker
  if (!picked.length) {
    picked = pickTypes(desc, definitions, maxSections);
  }

  picked = picked.slice(0, maxSections);

  console.log(`[autogen:${reqId}] sections_picked`, {
    templateId,
    pickedCount: picked.length,
    picked,
  });

  if (!picked.length) {
    const available = Object.keys(definitions);
    return NextResponse.json(
      {
        error: "No matching sections found",
        debug: {
          templateId,
          themeKey,
          availableCount: available.length,
          sampleAvailable: available.slice(0, 30),
        },
      },
      { status: 400 }
    );
  }

  // 5) generate sections (parallel) + fallback warnings
  const warnings: Array<{ type: string; warning: string }> = [];

  const sections: GeneratedSection[] = await Promise.all(
    picked.map(async (type) => {
      const def = definitions[type];

      const { data: aiData, warning } = await generateSectionCopy({
        type,
        defaultData: def.defaultData,
        brief: desc,
        language,
        persona,
        onboarding,
      });

      if (warning) {
        warnings.push({ type, warning });
        console.log(`[autogen:${reqId}] section_fallback`, { type, warning });
      }

      return {
        id: nanoid(),
        type,
        version: def.version,
        data: aiData,
        title: clean(def.title) || undefined,
      };
    })
  );

  // ✅ IMPORTANT: patch header nav to use REAL generated section IDs
  patchHeaderNav(sections);

  // 6) save draft_json
  const draftDoc: DraftDoc = { version: 1, sections };
  const { error: uErr } = await supabase
    .from("pages")
    .update({ draft_json: draftDoc })
    .eq("id", pageId!);

  if (uErr) {
    console.log(`[autogen:${reqId}] save_failed`, { error: uErr.message });
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  console.log(`[autogen:${reqId}] done`, {
    pageId,
    sectionsCount: sections.length,
    warningsCount: warnings.length,
  });

  return NextResponse.json({ ok: true, pageId, sections, warnings }, { status: 200 });
}
