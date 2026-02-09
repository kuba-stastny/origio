// src/components/builder/BuilderOnboarding.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAutogen } from "./useAutogen";
import OnboardingTemplateStep, {
  TEMPLATE_PRESETS,
  type ThemeKey,
  type PresetGroup,
} from "@/components/builder/OnboardingTemplateStep";
import { supabase } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4 | 5;

type OnboardingPayload = {
  // Step 1
  name: string; // ✅ now loaded from Supabase auth user metadata
  primaryFocus: string;
  service: string; // povinné

  // Step 2
  idealCustomer: string;
  mainProblem: string;
  avoidCustomer?: string;

  // Step 3
  projectCount: string;
  toneOfVoice: string;
  brag?: string;

  // Step 4
  websiteGoal: string;
  externalUrl?: string;

  // Step 5
  templateId: string;
};

type BuilderOnboardingProps = {
  brandName?: string;
  tagline?: string;
  onClose?: () => void;
};

const focusOptions = [
  "IT & vývoj",
  "Design a grafika",
  "Marketing & růst",
  "Copywriting",
  "Poradenství",
  "Video & foto",
  "Administrativa",
  "Finance",
  "Nemovitosti",
  "Fitness",
  "Vzdělávání",
];

const customerOptions = ["Fyzické osoby", "Freelanceři", "Startupy", "Firmy", "Korporáty"];
const projectCountOptions = ["Zatím žádné", "1–5", "6–15", "16–30", "30+"];
const toneOptions = ["Klidný & profesionální", "Přátelský & lidský", "Kreativní & odvážný"];
const goalOptions = ["Kontaktoval mě", "Klikl na externí odkaz"];

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const tapPop = {
  whileTap: { scale: 0.965 },
  transition: { type: "spring", stiffness: 520, damping: 28, mass: 0.65 },
};

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...tapPop}
      className={cx(
        "h-12 rounded-xl text-[16px] px-6 leading-none backdrop-blur-2xl transition border",
        selected
          ? "bg-zinc-900 text-white border-zinc-400"
          : "bg-zinc-900/40 text-[#A1A1AA] border-zinc-800 hover:bg-zinc-900/60 hover:text-[#FAFAFA]"
      )}
    >
      <span className="text-sm">{label}</span>
    </motion.button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[17px] font-medium text-white">{children}</div>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-zinc-400">{children}</div>;
}

function Input({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(
        "w-full text-[16px] rounded-xl px-4 py-3",
        "bg-zinc-950 text-white placeholder:text-zinc-600",
        "border border-zinc-600/60 focus:border-white/70 focus:outline-none"
      )}
    />
  );
}

function Textarea({
  value,
  placeholder,
  onChange,
  rows = 4,
}: {
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cx(
        "w-full rounded-xl px-4 py-3",
        "bg-zinc-950 text-white placeholder:text-zinc-600",
        "border border-zinc-600/60 focus:border-white/70 focus:outline-none",
        "resize-none"
      )}
    />
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.985 }}
      transition={{ type: "spring", stiffness: 520, damping: 30 }}
      className={cx(
        "h-12 rounded-xl px-6 font-medium text-[17px] transition",
        disabled
          ? "bg-white/25 text-white/60 cursor-not-allowed border border-white/10"
          : "bg-white text-black hover:bg-white/90"
      )}
    >
      {children}
    </motion.button>
  );
}

function GhostButton({
  children,
  hidden,
  onClick,
}: {
  children: React.ReactNode;
  hidden?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...tapPop}
      className={cx(
        "h-12 rounded-xl px-6 font-medium text-[17px] transition",
        "border border-transparent text-white hover:bg-white/10",
        hidden && "opacity-0 pointer-events-none"
      )}
    >
      {children}
    </motion.button>
  );
}

const fade = {
  initial: { opacity: 0, y: 10, filter: "blur(10px)" as any },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" as any },
  exit: { opacity: 0, y: -8, filter: "blur(10px)" as any },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

// map templateId -> sections (forced order)
const PRESET_MAP: Record<string, string[]> = Object.fromEntries(
  TEMPLATE_PRESETS.map((p) => [p.id, p.sections])
);

function resolveGroupFromPrimaryFocus(primaryFocus: string): PresetGroup {
  const f = (primaryFocus || "").toLowerCase();

  // IT / design / visual creators
  if (
    f.includes("it") ||
    f.includes("vývoj") ||
    f.includes("vyvoj") ||
    f.includes("design") ||
    f.includes("grafika") ||
    f.includes("video") ||
    f.includes("foto") ||
    f.includes("fitness")
  ) {
    return "it_design";
  }

  // Marketing / growth / copy / consulting
  if (
    f.includes("marketing") ||
    f.includes("růst") ||
    f.includes("rust") ||
    f.includes("copy") ||
    f.includes("poraden")
  ) {
    return "marketing";
  }

  // Finance / admin / real estate / education
  if (
    f.includes("finance") ||
    f.includes("nemovit") ||
    f.includes("administr") ||
    f.includes("vzděl") ||
    f.includes("vzdel")
  ) {
    return "finance";
  }

  return "it_design";
}

function getRecommendedPreset(primaryFocus: string) {
  const group = resolveGroupFromPrimaryFocus(primaryFocus);

  // prefer blacky variant as default pick for onboarding (premium dark)
  const p =
    TEMPLATE_PRESETS.find((x) => x.group === group && x.themeKey === "blacky") ??
    TEMPLATE_PRESETS.find((x) => x.group === group) ??
    TEMPLATE_PRESETS[0];

  return p;
}

export default function BuilderOnboarding({
  brandName = "origio",
  tagline = "Jsi blízko novým zákazníkům",
  onClose,
}: BuilderOnboardingProps) {
  const params = useParams() as Record<string, string | string[] | undefined>;

  const projectId =
    (typeof params?.projectId === "string" && params.projectId) ||
    (typeof params?.id === "string" && params.id) ||
    (typeof params?.slug === "string" && params.slug) ||
    "";

  const workspaceId = (typeof params?.workspaceId === "string" && params.workspaceId) || "";

  const { run } = useAutogen(workspaceId, projectId);

  const [step, setStep] = useState<Step>(1);
  const totalSteps = 5;

  const [isGenerating, setIsGenerating] = useState(false);

  // ✅ Name is auto-loaded from Supabase Auth user metadata (no input)
  const [name, setName] = useState("");

  // Step 1
  const [service, setService] = useState(""); // povinné
  const [primaryFocus, setPrimaryFocus] = useState("");

  // Step 2
  const [idealCustomer, setIdealCustomer] = useState("");
  const [mainProblem, setMainProblem] = useState("");
  const [avoidCustomer, setAvoidCustomer] = useState("");

  // Step 3
  const [projectCount, setProjectCount] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [brag, setBrag] = useState("");

  // Step 4
  const [websiteGoal, setWebsiteGoal] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  // Step 5
  const [templateId, setTemplateId] = useState<OnboardingPayload["templateId"]>("t001");
  const [themeKey, setThemeKey] = useState<ThemeKey>("blacky");

  const router = useRouter();

  // ✅ Load full_name / display_name from Supabase Auth user metadata
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!alive) return;

        if (error) {
          console.warn("[Onboarding] getUser error", error);
          return;
        }

        const u = data?.user;
        const md: any = u?.user_metadata ?? {};
        const full =
          (typeof md?.full_name === "string" && md.full_name.trim()) ||
          (typeof md?.display_name === "string" && md.display_name.trim()) ||
          "";

        if (full && !name) setName(full);
      } catch (e) {
        console.warn("[Onboarding] getUser unexpected error", e);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const md: any = session?.user?.user_metadata ?? {};
      const full =
        (typeof md?.full_name === "string" && md.full_name.trim()) ||
        (typeof md?.display_name === "string" && md.display_name.trim()) ||
        "";

      if (alive && full) setName((prev) => (prev ? prev : full));
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payload: OnboardingPayload = useMemo(
    () => ({
      name: name.trim(),
      primaryFocus,
      service: service.trim(),

      idealCustomer,
      mainProblem: mainProblem.trim(),
      avoidCustomer: avoidCustomer.trim() || undefined,

      projectCount,
      toneOfVoice,
      brag: brag.trim() || undefined,

      websiteGoal,
      externalUrl:
        websiteGoal === "Klikl na externí odkaz" ? externalUrl.trim() || undefined : undefined,

      templateId,
    }),
    [
      name,
      primaryFocus,
      service,
      idealCustomer,
      mainProblem,
      avoidCustomer,
      projectCount,
      toneOfVoice,
      brag,
      websiteGoal,
      externalUrl,
      templateId,
    ]
  );

  const progress = useMemo(() => {
    const pct = (step / totalSteps) * 100;
    return clamp(pct, 0, 100);
  }, [step]);

  const canContinue = useMemo(() => {
    if (isGenerating) return false;

    // ✅ Step 1: name is not required from input anymore; require focus + service only
    if (step === 1) return !!payload.primaryFocus && payload.service.length > 2;

    if (step === 2) return !!payload.idealCustomer && payload.mainProblem.length >= 10;

    if (step === 3) return !!payload.projectCount && !!payload.toneOfVoice;

    if (step === 4) {
      if (!payload.websiteGoal) return false;
      if (payload.websiteGoal === "Klikl na externí odkaz") {
        const v = (payload.externalUrl || "").trim();
        return v.startsWith("http://") || v.startsWith("https://");
      }
      return true;
    }

    if (step === 5) return false;

    return false;
  }, [step, payload, isGenerating]);

  function goBack() {
    if (isGenerating) return;
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  function goNext() {
    if (!canContinue) return;

    // ✅ entering Step 5 → auto-pick recommended template based on primaryFocus
    if (step === 4) {
      const rec = getRecommendedPreset(payload.primaryFocus);
      setTemplateId(rec?.id ?? "t001");
      setThemeKey(rec?.themeKey ?? "blacky");
      setStep(5);
      return;
    }

    if (step < 5) setStep((s) => (s + 1) as Step);
  }

  async function startGeneration(nextTemplateId: string, nextThemeKey: ThemeKey) {
    if (isGenerating) return;

    setTemplateId(nextTemplateId);
    setThemeKey(nextThemeKey);

    try {
      setIsGenerating(true);

      const forcedSections = PRESET_MAP[nextTemplateId] ?? PRESET_MAP["t001"];

      await run({
        language: "cs",
        maxSections: forcedSections.length,
        forcedSections,
        persona: payload.primaryFocus || null,
        themeKey: nextThemeKey,
        onboarding: {
          name: payload.name, // loaded from auth metadata
          primaryFocus: payload.primaryFocus,
          service: payload.service,
          idealCustomer: payload.idealCustomer,
          mainProblem: payload.mainProblem,
          avoidCustomer: payload.avoidCustomer,
          projectCount: payload.projectCount,
          toneOfVoice: payload.toneOfVoice,
          brag: payload.brag,
          websiteGoal: payload.websiteGoal,
          externalUrl: payload.externalUrl,
          templateId: nextTemplateId,
        },
        version: 1,
      });

      await new Promise((r) => setTimeout(r, 250));
      router.refresh();
    } finally {
      setIsGenerating(false);
    }
  }

  const contentMax = step === 5 ? "max-w-[1260px]" : "max-w-[720px]";

  return (
    <div className="relative min-h-[100vh] w-full text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28" />

      <div className=" z-10 flex min-h-[100svh] flex-col">
        {/* Top bar */}
        <div className="px-6 fixed z-[999] w-full top-0 left-0 sm:px-10 pt-8 sm:pt-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img className="w-8" src="/images/logo2.png" alt="" />

              <div className="flex flex-col leading-tight">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-zinc-100 font-semibold tracking-tight">Origio</span>
                  <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-[10px] font-semibold text-zinc-200">
                    BETA
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block text-xs text-zinc-400">
              {isGenerating ? "Stránka se generuje…" : tagline}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 sm:px-10 pb-44">
          <div
            className={cx(
              "mx-auto w-full h-[100vh] overflow-y-scroll pb-40 no-scrollbar",
              contentMax,
              step === 5 ? "pt-28 sm:pt-40" : "pt-24 sm:pt-36"
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={fade.initial}
                animate={fade.animate}
                exit={fade.exit}
                transition={fade.transition}
              >
                {step === 1 && (
                  <div className="flex flex-col gap-12">
                    <div className="flex flex-col gap-2">
                      <div className="text-[40px] leading-[50px] font-medium">Kdo jsi a co děláš</div>
                      <div className="text-[17px] font-light text-white/90">
                        Odpověz na pár otázek, ať můžeme připravit stránku, která ti bude vydělávat.
                      </div>

                 
                    </div>

                    <div className="flex flex-col gap-12">
                      <div className="flex flex-col gap-3 text-sm">
                        <FieldLabel>Čemu se primárně věnuješ?</FieldLabel>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap gap-4">
                            {focusOptions.map((o) => (
                              <Chip
                                key={o}
                                label={o}
                                selected={primaryFocus === o}
                                onClick={() => setPrimaryFocus(o)}
                              />
                            ))}
                          </div>
                          <Hint>Vyber jedno zaměření</Hint>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 text-sm">
                        <FieldLabel>Čemu se přesně věnuješ?</FieldLabel>
                        <Input
                          value={service}
                          onChange={setService}
                          placeholder="Např. Navrhuju vizuály na sociální sítě a letáky"
                        />
                        <Hint>Co by o tobě potenciální zákazníci měli vědět</Hint>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-12">
                    <div className="flex flex-col gap-2">
                      <div className="text-[40px] leading-[50px] font-medium">S kým chceš spolupracovat</div>
                      <div className="text-[17px] font-light text-white/90">
                        Nastavení cílovky a hodnoty pro tvoje klienty.
                      </div>
                    </div>

                    <div className="flex flex-col gap-10">
                      <div className="flex flex-col gap-4">
                        <FieldLabel>Kdo je tvůj ideální zákazník?</FieldLabel>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap gap-4">
                            {customerOptions.map((o) => (
                              <Chip
                                key={o}
                                label={o}
                                selected={idealCustomer === o}
                                onClick={() => setIdealCustomer(o)}
                              />
                            ))}
                          </div>
                          <Hint>Vyber jednoho - na různé cílovky platí různé argumentace</Hint>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <FieldLabel>Jaký hlavní problém těmto lidem řešíš?</FieldLabel>
                        <Textarea
                          value={mainProblem}
                          onChange={setMainProblem}
                          placeholder="Např. „Pomáhám realitním makléřům proměnit jejich nefunkční weby v řešení podporující jejich osobní značku a zvyšování autority před klienty, což vede k vyšším prodejním cenám nemovitostí.“"
                          rows={4}
                        />
                        <Hint>Popiš jeden konkrétní problém, který řešíš nejčastěji.</Hint>
                      </div>

                      <div className="flex flex-col gap-3">
                        <FieldLabel>S kým spolupracovat naopak nechceš?</FieldLabel>
                        <Textarea
                          value={avoidCustomer}
                          onChange={setAvoidCustomer}
                          placeholder="Např. „Nechci spolupracovat s klienty, kteří se soustředí na minimální cenu“"
                          rows={4}
                        />
                        <Hint>Volitelné, ale doporučené</Hint>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-12">
                    <div className="flex flex-col gap-2">
                      <div className="text-[40px] leading-[50px] font-medium">Proč by si tě měl klient vybrat</div>
                      <div className="text-[17px] font-light text-white/90">Zkušenosti a důvěryhodnost.</div>
                    </div>

                    <div className="flex flex-col gap-10">
                      <div className="flex flex-col gap-4">
                        <FieldLabel>Kolik máš za sebou projektů?</FieldLabel>
                        <div className="flex flex-wrap gap-4">
                          {projectCountOptions.map((o) => (
                            <Chip
                              key={o}
                              label={o}
                              selected={projectCount === o}
                              onClick={() => setProjectCount(o)}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <FieldLabel>Nastavení tone of voice</FieldLabel>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap gap-4">
                            {toneOptions.map((o) => (
                              <Chip
                                key={o}
                                label={o}
                                selected={toneOfVoice === o}
                                onClick={() => setToneOfVoice(o)}
                              />
                            ))}
                          </div>
                          <Hint>Ovlivní styl textů i celkový dojem, který si návštěvník odnese</Hint>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <FieldLabel>Je něco čím by ses chtěl pochlubit?</FieldLabel>
                        <Textarea
                          value={brag}
                          onChange={setBrag}
                          placeholder="Např. klient po spuštění nového webu začal dostávat o 120% více poptávek na automat a investice se mu vrátila za 1 měsíc"
                          rows={4}
                        />
                        <Hint>
                          Pokud chceš, popiš konkrétní situaci, své unikátní vlastnosti nebo způsoby, které tví klienti
                          oceňují
                        </Hint>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col gap-12">
                    <div className="flex flex-col gap-2">
                      <div className="text-[40px] leading-[50px] font-medium">Cíl webu</div>
                      <div className="text-[17px] font-light text-white/90">Co má návštěvník udělat?</div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <FieldLabel>Co potřebuješ, aby návštěvník na webu ideálně provedl za akci?</FieldLabel>

                      <div className="grid grid-cols-2 gap-4">
                        {goalOptions.map((o) => (
                          <Chip key={o} label={o} selected={websiteGoal === o} onClick={() => setWebsiteGoal(o)} />
                        ))}
                      </div>

                      <Hint>Kontaktní formulář, externí rezervační systém, nebo jen portfolio projektů.</Hint>

                      <AnimatePresence initial={false}>
                        {websiteGoal === "Klikl na externí odkaz" && (
                          <motion.div
                            key="external-url"
                            initial={{ opacity: 0, y: 10, filter: "blur(8px)" as any }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" as any }}
                            exit={{ opacity: 0, y: -6, filter: "blur(8px)" as any }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="pt-2 flex flex-col gap-3"
                          >
                            <FieldLabel>Externí odkaz</FieldLabel>
                            <Input value={externalUrl} onChange={setExternalUrl} placeholder="https://calendly.com" />
                            <Hint>Např. Calendly nebo jiný rezervační systém</Hint>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <OnboardingTemplateStep
                    payload={{
                      name: payload.name,
                      primaryFocus: payload.primaryFocus,
                      service: payload.service,
                      idealCustomer: payload.idealCustomer,
                      mainProblem: payload.mainProblem,
                      avoidCustomer: payload.avoidCustomer,
                      projectCount: payload.projectCount,
                      toneOfVoice: payload.toneOfVoice,
                      brag: payload.brag,
                      websiteGoal: payload.websiteGoal,
                      externalUrl: payload.externalUrl,
                    }}
                    themeKey={themeKey}
                    setThemeKey={setThemeKey}
                    templateId={templateId}
                    setTemplateId={setTemplateId}
                    isGenerating={isGenerating}
                    onConfirmTemplate={(id, tk) => startGeneration(id, tk)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed inset-x-0 bottom-0 z-30">
          <div className="h-1 bg-white/10 backdrop-blur">
            <div
              className="h-full bg-white transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-6 sm:px-10 py-4 flex items-center justify-between bg-zinc-950">
            {step === 1 ? (
              <GhostButton hidden={!onClose || isGenerating} onClick={onClose}>
                Přihlásit se
              </GhostButton>
            ) : (
              <GhostButton hidden={isGenerating} onClick={goBack}>
                Zpět
              </GhostButton>
            )}

            {step < 5 ? (
              <PrimaryButton onClick={goNext} disabled={!canContinue}>
                Pokračovat
              </PrimaryButton>
            ) : (
              <div className="flex items-center gap-3">
                {isGenerating ? (
                  <div className="text-sm text-zinc-300">Generuji…</div>
                ) : (
                  <div className="text-sm text-zinc-400">Vyber šablonu kliknutím na kartu.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
