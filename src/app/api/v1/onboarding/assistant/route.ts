import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SECTION_META } from "@/sections/section-meta";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type AssistantResponse = {
  status: "ok" | "needs_more";
  assistantMessage: string;
  allCheckpointsDone: boolean;
  decidedSections: string[];
  missingInfo: {
    sectionType: string;
    sectionTitle: string;
    questions: string[];
  }[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = String(body.role ?? "").trim();
    const promptDraft = String(body.promptDraft ?? "").trim();

    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    if (!promptDraft) {
      const emptyResp: AssistantResponse = {
        status: "needs_more",
        assistantMessage:
          "Začni jednou až třemi větami o tom, co děláš a pro koho. Pak ti řeknu, co doplnit dál.",
        allCheckpointsDone: false,
        decidedSections: [],
        missingInfo: [],
      };
      return NextResponse.json(emptyResp);
    }

    // Předáme modelu jen textovou podobu registru
    const sectionsForModel = SECTION_META.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      aiHint: s.aiHint ?? "",
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Jsi onboarding AI asistent pro Origio – AI landing page builder.

Máš k dispozici:
- roli uživatele (např. trenér, webdesigner, agentura, e-shop…)
- textový návrh promptu (popis jeho služeb)
- seznam dostupných sekcí na stránce (id, type, title, aiHint)

Tvůj úkol:

1) Vyber z dostupných sekcí ty, které dávají největší smysl pro roli a popis uživatele.
   - Musíš vždy vybrat alespoň 3 sekce (hero + alespoň 2 další).
   - Pokud existuje sekce typu "header" (nebo s id "header"), VŽDY ji zařaď mezi vybrané sekce a ideálně ji dej na začátek seznamu.
   - Typicky: "header", "hero", "services", "showroom", "stats", "testimonials", "ctaBanner" atd.
2) Pro každou vybranou sekci si interně představ, jaké informace z promptu potřebuješ.
3) Analyzuj prompt:
   - Pokud máš dost informací i pro slabší generování všech vybraných sekcí, nastav:
     - "status": "ok"
     - "allCheckpointsDone": true
     - "missingInfo": []
   - Pokud něco důležitého chybí, nastav:
     - "status": "needs_more"
     - "allCheckpointsDone": false
     - "missingInfo": pole s konkrétními dotazy.

Důležité:
- Nikdy nevracej prázdné "decidedSections" – pokud si nejsi jistý, zvol bezpečný default pro danou roli.
- Pokud nastavíš "allCheckpointsDone": true, musí platit:
  - "status": "ok"
  - "missingInfo": []
  - "decidedSections": musí obsahovat alespoň 3 sekce.
- Pokud nastavíš "status": "needs_more", musí platit:
  - "allCheckpointsDone": false
  - "missingInfo": NESMÍ být prázdné.

Odpovídej jako čistý JSON ve formátu:

{
  "status": "ok" | "needs_more",
  "assistantMessage": "krátká zpráva v češtině, max 2 věty",
  "allCheckpointsDone": boolean,
  "decidedSections": ["hero", "services", ...],
  "missingInfo": [
    {
      "sectionType": "services",
      "sectionTitle": "Služby",
      "questions": [
        "Jaké 2–3 hlavní služby nabízíte?",
        "Jaký je typický výsledek pro klienta?"
      ]
    }
  ]
}
        `.trim(),
        },
        {
          role: "user",
          content: JSON.stringify({
            role,
            promptDraft,
            availableSections: sectionsForModel,
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: AssistantResponse;

    try {
      parsed = JSON.parse(raw) as AssistantResponse;
    } catch (e) {
      console.error("Failed to parse assistant JSON:", raw);
      parsed = {
        status: "needs_more",
        assistantMessage:
          "Napiš prosím víc o tom, co děláš, pro koho a jaký je hlavní přínos.",
        allCheckpointsDone: false,
        decidedSections: [],
        missingInfo: [],
      };
    }

    // --- Fallback logika, kdyby model i tak porušil pravidla ---

    // 1) nikdy nenech decidedSections prázdné, pokud sekce existují
    if (!parsed.decidedSections || parsed.decidedSections.length === 0) {
      // jednoduchý default podle role
      const baseHero = "hero";
      const defaultsForRole: Record<string, string[]> = {
        Fotograf: ["header", "hero", "showroom", "testimonials", "ctaBanner"],
        Designer: ["header", "hero", "services", "showroom", "ctaBanner"],
        "Kouč / mentor": [
          "header",
          "hero",
          "services",
          "testimonials",
          "ctaBanner",
        ],
        "E-shop": ["header", "hero", "showroom", "stats", "ctaBanner"],
      };

      const candidate =
        defaultsForRole[role] ??
        ["header", "hero", "services", "testimonials", "ctaBanner"];

      const onlyExisting = candidate.filter((idOrType) =>
        SECTION_META.some(
          (m) => m.id === idOrType || m.type === idOrType
        )
      );

      parsed.decidedSections =
        onlyExisting.length > 0 ? onlyExisting : [baseHero];
    }

    // 2) pokud status = "ok", ale missingInfo není prázdné → oprav
    if (parsed.status === "ok" && parsed.missingInfo.length > 0) {
      parsed.status = "needs_more";
      parsed.allCheckpointsDone = false;
    }

    // 3) pokud status = "needs_more", ale missingInfo je prázdné → přidej generický dotaz
    if (parsed.status === "needs_more" && parsed.missingInfo.length === 0) {
      parsed.allCheckpointsDone = false;
      parsed.missingInfo = [
        {
          sectionType: "hero",
          sectionTitle: "Hero",
          questions: [
            "Zkus ještě jednou shrnout 1–2 větami, čím přesně klientům pomáháš a jaký hlavní výsledek jim přinese spolupráce s tebou.",
          ],
        },
      ];
    }

    // 4) pokud allCheckpointsDone = true, ale status != "ok"
    if (parsed.allCheckpointsDone && parsed.status !== "ok") {
      parsed.status = "ok";
      parsed.missingInfo = [];
    }

    // 5) ZAJISTI, aby byla nahoře vždy nějaká 'header' sekce, pokud je k dispozici
    (() => {
      // Zda v registru vůbec existuje nějaká header sekce
      const headerExistsInRegistry = SECTION_META.some(
        (m) => m.type === "header" || m.id === "header"
      );
      if (!headerExistsInRegistry) return;

      const decided = parsed.decidedSections || [];

      // Najdi první položku v decidedSections, která odpovídá header sekci
      const resolveIsHeader = (value: string) =>
        value === "header" ||
        SECTION_META.some(
          (m) =>
            (m.id === value || m.type === value) &&
            m.type === "header"
        );

      const firstHeaderKey = decided.find((s) => resolveIsHeader(s));

      let newDecided: string[] = [];

      if (firstHeaderKey) {
        // Pokud už nějaký header je, dej ho na začátek
        newDecided = [
          firstHeaderKey,
          ...decided.filter((s) => s !== firstHeaderKey),
        ];
      } else {
        // Header není vybraný, ale v registru existuje – přidej univerzální "header" na začátek
        newDecided = ["header", ...decided];
      }

      // Odstraníme duplicitní položky, ale zachováme pořadí
      const seen = new Set<string>();
      parsed.decidedSections = newDecided.filter((s) => {
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
      });
    })();

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Onboarding assistant error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
