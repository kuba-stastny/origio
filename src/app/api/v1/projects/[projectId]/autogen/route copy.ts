import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { nanoid } from "@/utils/ids";

import { getPreset } from "@/lib/templates/presets";
import { THEME_BLACKY, THEME_WHITEY } from "@/lib/templates/themes";

/* ----------------------------- Config ----------------------------- */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

/**
 * gpt-5-* (a některé další) nepodporují temperature/max_tokens na chat.completions.
 * Podle tvých logů:
 * - temperature ❌
 * - max_tokens ❌ -> použij max_completion_tokens ✅
 */
function supportsTemperature(model: string) {
  const m = (model || "").toLowerCase();
  if (m.startsWith("gpt-5")) return false;
  return true;
}

function usesMaxCompletionTokens(model: string) {
  const m = (model || "").toLowerCase();
  // podle tvých logů gpt-5-mini vyžaduje max_completion_tokens
  if (m.startsWith("gpt-5")) return true;
  return false;
}

/* Retry / stability */
const OPENAI_RETRIES_EMPTY = Number(process.env.OPENAI_RETRIES_EMPTY ?? 2);
const OPENAI_RETRIES_INVALID_JSON = Number(process.env.OPENAI_RETRIES_INVALID_JSON ?? 2);
const OPENAI_RETRIES_HTTP = Number(process.env.OPENAI_RETRIES_HTTP ?? 1);
const OPENAI_RETRY_BASE_DELAY_MS = Number(process.env.OPENAI_RETRY_BASE_DELAY_MS ?? 350);
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 60000);

/**
 * ✅ PROMPT CONFIG
 */
const PROMPT = {
  temperature: 0.7,
  maxTokens: 2000,

  common: {
    output: [
      "Reply STRICTLY with JSON that matches the given defaultData structure.",
      "Keep the exact same keys and value types. Do NOT add/remove fields.",
      "No explanations or comments around the JSON.",
      "No placeholders like 'Lorem ipsum', 'Title', 'Description', etc.",
    ],
    constraints: [
      "Explicitly reflect idealCustomer.",
      "Reflect mainProblem in hero/services copy.",
      "Match the selected toneOfVoice in writing style.",
      "Primary CTA must align with websiteGoal.",
    ],
    length: [
      "Headings/labels short and punchy.",
      "Descriptions/body text concrete and specific (often 4–8 sentences).",
    ],
  },

  cs: {
    systemIntro: [
      "Jsi zkušený seniorní český copywriter pro webové stránky.",
      "Specializuješ se na marketingové texty pro moderní landing page a služby / osobní značky.",
      "Piš přirozeně, konkrétně a přesvědčivě. Vyhýbej se obecným frázím a klišé.",
    ],
    toneRules: [
      "Piš česky.",
      "Buď konverzní, konkrétní a lidský.",
      "Nepoužívej generické marketingové fráze typu: 'posuňte své podnikání', 'na míru šitá řešení' apod., pokud nejsou opravdu podložené onboardingem.",
    ],
  },

  en: {
    systemIntro: [
      "You are a senior-level English web copywriter.",
      "You write conversion-focused copy for modern service businesses / personal brands.",
      "Be specific and persuasive. Avoid generic clichés.",
    ],
    toneRules: [
      "Write in English.",
      "Be conversion-focused and concrete.",
      "Avoid vague claims unless supported by onboarding proof.",
    ],
  },

  userPromptOrder: ["persona", "brief", "onboarding", "sectionType", "defaultData"] as const,
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

type AutogenWarning = { type: string; message: string };

/* ----------------------------- Helpers --------------------------- */
function safeJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function clean(s: unknown) {
  return String(s ?? "").trim();
}

function hasAnyOnboarding(o?: OnboardingV1 | null) {
  if (!o) return false;
  return Object.values(o).some((v) => clean(v).length > 0);
}

function resolveTheme(themeKey: ThemeKey | null | undefined) {
  if (themeKey === "whitey") return THEME_WHITEY;
  return THEME_BLACKY;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function snippet(s: string, n = 800) {
  const t = (s ?? "").toString();
  return t.length > n ? t.slice(0, n) + "…(truncated)" : t;
}

/* ---------------------- Brief / meta helpers ---------------------- */
function buildBriefFromOnboarding(o: OnboardingV1, language: Lang) {
  const lines: string[] = [];

  if (language === "cs") {
    lines.push("Vytvoř moderní one-page web pro osobní služby / podnikání.");
    if (clean(o.name)) lines.push(`Jméno / značka: ${clean(o.name)}`);
    if (clean(o.primaryFocus)) lines.push(`Obor: ${clean(o.primaryFocus)}`);

    if (clean(o.idealCustomer)) lines.push(`Ideální zákazník: ${clean(o.idealCustomer)}`);
    if (clean(o.mainProblem)) lines.push(`Hlavní problém, který řeším: ${clean(o.mainProblem)}`);
    if (clean(o.avoidCustomer)) lines.push(`S kým nechci spolupracovat: ${clean(o.avoidCustomer)}`);

    if (clean(o.projectCount)) lines.push(`Zkušenosti (projekty): ${clean(o.projectCount)}`);
    if (clean(o.toneOfVoice)) lines.push(`Tone of voice: ${clean(o.toneOfVoice)}`);
    if (clean(o.brag)) lines.push(`Důkaz / pochlubit se: ${clean(o.brag)}`);

    if (clean(o.websiteGoal)) lines.push(`Primární cíl webu (CTA): ${clean(o.websiteGoal)}`);
    if (clean(o.templateId)) lines.push(`Vybraný design (template): ${clean(o.templateId)}`);

    lines.push("Piš česky. Buď konkrétní, konverzní, bez klišé.");
  } else {
    lines.push("Create a modern one-page website for a service business / personal brand.");
    if (clean(o.name)) lines.push(`Brand / name: ${clean(o.name)}`);
    if (clean(o.primaryFocus)) lines.push(`Industry: ${clean(o.primaryFocus)}`);

    if (clean(o.idealCustomer)) lines.push(`Ideal customer: ${clean(o.idealCustomer)}`);
    if (clean(o.mainProblem)) lines.push(`Main problem solved: ${clean(o.mainProblem)}`);
    if (clean(o.avoidCustomer)) lines.push(`Avoid customers like: ${clean(o.avoidCustomer)}`);

    if (clean(o.projectCount)) lines.push(`Experience (projects): ${clean(o.projectCount)}`);
    if (clean(o.toneOfVoice)) lines.push(`Tone of voice: ${clean(o.toneOfVoice)}`);
    if (clean(o.brag)) lines.push(`Proof / credibility: ${clean(o.brag)}`);

    if (clean(o.websiteGoal)) lines.push(`Primary website goal (CTA): ${clean(o.websiteGoal)}`);
    if (clean(o.templateId)) lines.push(`Selected design (template): ${clean(o.templateId)}`);

    lines.push("Write in English. Be specific, conversion-focused, avoid generic clichés.");
  }

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

  let title = "";
  let description = "";

  if (language === "cs") {
    title = [name || "", focus || ""].filter(Boolean).join(" — ").slice(0, 120);
    if (!title) title = "Osobní web — služby a kontakt";

    description = [prob ? `Pomáhám řešit: ${prob}` : "", ic ? `Pro: ${ic}` : "", goal ? `Cíl: ${goal}` : ""]
      .filter(Boolean)
      .join(" • ")
      .slice(0, 300);

    if (!description) description = "Moderní one-page web pro služby, důvěru a konverze.";
  } else {
    title = [name || "", focus || ""].filter(Boolean).join(" — ").slice(0, 120);
    if (!title) title = "Service website — contact & conversions";

    description = [prob ? `I help solve: ${prob}` : "", ic ? `For: ${ic}` : "", goal ? `Goal: ${goal}` : ""]
      .filter(Boolean)
      .join(" • ")
      .slice(0, 300);

    if (!description) description = "Modern one-page website for services, trust and conversions.";
  }

  return {
    title,
    description,
    locale: language === "cs" ? "cs_CZ" : "en_US",
    robots: "noindex,nofollow",
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    twitterCard: null,
  };
}

/* ----------------------- Prompt builder ---------------------- */
function buildSystemPrompt(language: Lang) {
  const L = language === "cs" ? PROMPT.cs : PROMPT.en;
  return [
    ...L.systemIntro,
    "",
    "IMPORTANT:",
    ...PROMPT.common.output.map((x) => `- ${x}`),
    "",
    "HARD CONSTRAINTS:",
    ...PROMPT.common.constraints.map((x) => `- ${x}`),
    "",
    "LENGTH:",
    ...PROMPT.common.length.map((x) => `- ${x}`),
    "",
    "TONE:",
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

  const blocks: Record<(typeof PROMPT.userPromptOrder)[number], string> = {
    persona: persona ? `Persona: ${persona}` : "",
    brief: `Brief:\n${brief || "not provided"}`,
    onboarding: onboarding ? `ONBOARDING (source of truth):\n${JSON.stringify(onboarding, null, 2)}` : "",
    sectionType: `Section type: "${type}"`,
    defaultData: `defaultData structure to fill:\n${JSON.stringify(defaultData, null, 2)}`,
  };

  return PROMPT.userPromptOrder
    .map((k) => blocks[k])
    .filter((s) => s.trim().length > 0)
    .join("\n\n");
}

/* ----------------------- OpenAI call ----------------------- */
async function openaiChatCompletion(params: {
  debugId: string;
  type: string;
  system: string;
  user: string;
}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const willSendTemperature = supportsTemperature(OPENAI_MODEL);
    const willUseMaxCompletionTokens = usesMaxCompletionTokens(OPENAI_MODEL);

    console.log(`[autogen:${params.debugId}] openai.request`, {
      model: OPENAI_MODEL,
      type: params.type,
      systemChars: params.system.length,
      userChars: params.user.length,
      willSendTemperature,
      willUseMaxCompletionTokens,
      max_completion_tokens: willUseMaxCompletionTokens ? PROMPT.maxTokens : undefined,
      max_tokens: willUseMaxCompletionTokens ? undefined : PROMPT.maxTokens,
    });

    const body: any = {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      response_format: { type: "json_object" },
    };

    if (willUseMaxCompletionTokens) body.max_completion_tokens = PROMPT.maxTokens;
    else body.max_tokens = PROMPT.maxTokens;

    if (willSendTemperature) body.temperature = PROMPT.temperature;

    const started = Date.now();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const ms = Date.now() - started;
    const payload = (await res.json().catch(() => ({}))) as any;

    const raw: string = payload?.choices?.[0]?.message?.content ?? "";

    console.log(`[autogen:${params.debugId}] openai.response`, {
      type: params.type,
      status: res.status,
      ms,
      outputChars: raw?.length ?? 0,
      rawPreview: snippet(raw, 400),
      usage: payload?.usage,
      id: payload?.id,
    });

    return { ok: res.ok, status: res.status, payload, raw };
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? `Timeout after ${OPENAI_TIMEOUT_MS}ms` : String(e?.message ?? e);
    console.error(`[autogen:${params.debugId}] openai.fetch_error`, { type: params.type, message: msg });
    return { ok: false, status: 0, payload: null, raw: "" };
  } finally {
    clearTimeout(t);
  }
}

async function generateSectionCopy<T extends Json>(args: {
  debugId: string;
  type: string;
  defaultData: T;
  brief: string;
  language: Lang;
  persona?: string | null;
  onboarding?: OnboardingV1 | null;
}): Promise<{ data: T; warning?: string }> {
  const fallback = structuredClone(args.defaultData);

  if (!OPENAI_API_KEY) {
    const w = "OPENAI_API_KEY missing → fallback defaultData";
    console.warn(`[autogen:${args.debugId}] openai.missing_key`, { type: args.type });
    return { data: fallback, warning: w };
  }

  const system = buildSystemPrompt(args.language);
  const user = buildUserPrompt({
    type: args.type,
    defaultData: args.defaultData,
    brief: args.brief,
    persona: args.persona ?? null,
    onboarding: args.onboarding ?? null,
  });

  for (let httpAttempt = 1; httpAttempt <= 1 + OPENAI_RETRIES_HTTP; httpAttempt++) {
    const http = await openaiChatCompletion({
      debugId: args.debugId,
      type: args.type,
      system,
      user,
    });

    if (!http.ok) {
      const errMsg = http?.payload?.error?.message || `OpenAI HTTP error (${http.status})`;
      const canRetry =
        httpAttempt <= OPENAI_RETRIES_HTTP && (http.status === 429 || http.status >= 500 || http.status === 0);

      console.error(`[autogen:${args.debugId}] openai.error`, {
        type: args.type,
        attempt: httpAttempt,
        status: http.status,
        message: errMsg,
        canRetry,
      });

      if (canRetry) {
        await sleep(OPENAI_RETRY_BASE_DELAY_MS * httpAttempt);
        continue;
      }

      return { data: fallback, warning: `OpenAI error for "${args.type}": ${errMsg} → fallback defaultData` };
    }

    // empty output retries
    let raw = (http.raw || "").trim();
    if (!raw) {
      for (let attempt = 1; attempt <= OPENAI_RETRIES_EMPTY; attempt++) {
        const delay = OPENAI_RETRY_BASE_DELAY_MS * attempt;
        console.warn(`[autogen:${args.debugId}] openai.empty_output_retry`, { type: args.type, attempt, delay });
        await sleep(delay);

        const r2 = await openaiChatCompletion({
          debugId: args.debugId,
          type: args.type,
          system,
          user,
        });

        if (r2.ok && (r2.raw || "").trim()) {
          raw = (r2.raw || "").trim();
          break;
        }
      }

      if (!raw) return { data: fallback, warning: `Empty OpenAI output for "${args.type}" → fallback defaultData` };
    }

    // parse / invalid json retries
    try {
      const parsed = JSON.parse(raw) as T;
      return { data: parsed };
    } catch {
      for (let attempt = 1; attempt <= OPENAI_RETRIES_INVALID_JSON; attempt++) {
        const delay = OPENAI_RETRY_BASE_DELAY_MS * attempt;
        console.error(`[autogen:${args.debugId}] json.parse_failed`, {
          type: args.type,
          attempt,
          rawPreview: snippet(raw, 1200),
        });
        console.warn(`[autogen:${args.debugId}] json.parse_retry`, { type: args.type, attempt, delay });
        await sleep(delay);

        const r2 = await openaiChatCompletion({
          debugId: args.debugId,
          type: args.type,
          system,
          user,
        });

        const raw2 = (r2.raw || "").trim();
        if (!r2.ok || !raw2) {
          raw = raw2;
          continue;
        }

        try {
          const parsed2 = JSON.parse(raw2) as T;
          return { data: parsed2 };
        } catch {
          raw = raw2;
        }
      }

      return { data: fallback, warning: `Invalid JSON from OpenAI for "${args.type}" → fallback defaultData` };
    }
  }

  return { data: fallback, warning: `Unknown failure for "${args.type}" → fallback defaultData` };
}

/* ------------------------ Section picking ------------------------- */
function pickTypes(desc: string, definitions: Definitions, max: number): string[] {
  const all = Object.keys(definitions);
  if (!all.length) return [];

  const txt = (desc || "").toLowerCase();
  const take = (cands: string[]) => cands.filter((t) => definitions[t]).slice(0, max);

  const PREFERRED_ORDER = [
    "hd001",
    "h001",
    "h002",
    "sh001",
    "sv001",
    "sv002",
    "st001",
    "st002",
    "ab001",
    "ab002",
    "ga001",
    "ts001",
    "ts002",
    "ct001",
    "ct002",
  ];

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

  const fromPreferred = take(PREFERRED_ORDER);
  if (fromPreferred.length) return fromPreferred;

  return all.slice(0, max);
}

/* ----------------------------- Route ----------------------------- */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const debugId = nanoid();
  const params = await context.params;
  const projectParam = params.projectId;

  console.log(`[autogen:${debugId}] start`, { projectParam });

  const user = await getUser().catch(() => null);
  if (!user) {
    console.warn(`[autogen:${debugId}] unauthorized`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = (await request.json().catch(() => ({}))) as unknown;
  const b: BodyIn = typeof raw === "object" && raw !== null ? (raw as BodyIn) : ({} as BodyIn);

  const language: Lang = String(b.language ?? "cs").toLowerCase() === "en" ? "en" : "cs";
  const definitions: Definitions = b.definitions ?? {};
  const maxSections = Math.min(Number(b.maxSections ?? 10), 12);

  console.log(`[autogen:${debugId}] request.body`, {
    language,
    hasDefinitions: !!Object.keys(definitions).length,
    maxSections,
    templateId: b.templateId ?? null,
    themeKey: b.themeKey ?? null,
    forcedSectionsCount: Array.isArray(b.forcedSections) ? b.forcedSections.length : 0,
  });

  if (!Object.keys(definitions).length) {
    console.error(`[autogen:${debugId}] missing_definitions`);
    return NextResponse.json({ error: "Missing definitions" }, { status: 400 });
  }

  const onboarding = (b.onboarding ?? null) as OnboardingV1 | null;
  const legacyDesc = clean(b.desc);

  const desc = hasAnyOnboarding(onboarding) ? buildBriefFromOnboarding(onboarding!, language) : legacyDesc;

  if (!desc) {
    console.error(`[autogen:${debugId}] missing_desc_or_onboarding`);
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

  let project: { id: string; workspace_id: string; name: string } | null = projectById ?? null;

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
    console.error(`[autogen:${debugId}] project_not_found`, { projectParam });
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
      console.error(`[autogen:${debugId}] page_create_failed`, { message: cErr.message });
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }

    pageId = created!.id as string;
    console.log(`[autogen:${debugId}] page_created`, { pageId });
  } else {
    const { error: upErr } = await supabase
      .from("pages")
      .update({ settings_json, meta_json, theme_json })
      .eq("id", pageId);

    if (upErr) {
      console.error(`[autogen:${debugId}] page_update_failed`, { message: upErr.message });
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    console.log(`[autogen:${debugId}] page_updated`, { pageId });
  }

  // 4) pick sections
  let picked: string[] = [];

  if (templateId) {
    const preset = getPreset(templateId);
    if (preset?.sections?.length) picked = preset.sections.filter((t) => definitions[t]);
  }

  if (!picked.length && forcedSections?.length) picked = forcedSections.filter((s) => definitions[s]);
  if (!picked.length) picked = pickTypes(desc, definitions, maxSections);

  picked = picked.slice(0, maxSections);

  console.log(`[autogen:${debugId}] sections_picked`, { templateId, pickedCount: picked.length, picked });

  if (!picked.length) {
    const available = Object.keys(definitions);
    return NextResponse.json(
      {
        error: "No matching sections found",
        debug: { templateId, themeKey, availableCount: available.length, sampleAvailable: available.slice(0, 30) },
      },
      { status: 400 }
    );
  }

  // 5) generate sections (parallel) — fallback na defaultData jen když je fakt chyba
  const warnings: AutogenWarning[] = [];

  const sections: GeneratedSection[] = await Promise.all(
    picked.map(async (type) => {
      const def = definitions[type];

      const out = await generateSectionCopy({
        debugId,
        type,
        defaultData: def.defaultData,
        brief: desc,
        language,
        persona,
        onboarding,
      });

      if (out.warning) {
        warnings.push({ type, message: out.warning });
        console.warn(`[autogen:${debugId}] section_fallback`, { type, message: out.warning });
      }

      return {
        id: nanoid(),
        type,
        version: def.version,
        data: out.data,
        title: clean(def.title) || undefined,
      };
    })
  );

  // 6) save
  const draftDoc: DraftDoc = { version: 1, sections };
  const { error: uErr } = await supabase.from("pages").update({ draft_json: draftDoc }).eq("id", pageId!);

  if (uErr) {
    console.error(`[autogen:${debugId}] save_draft_failed`, { message: uErr.message });
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  console.log(`[autogen:${debugId}] done`, { pageId, sectionsCount: sections.length, warningsCount: warnings.length });

  return NextResponse.json({ ok: true, pageId, sections, warnings }, { status: 200 });
}
