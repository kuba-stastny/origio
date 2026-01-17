// src/app/api/v1/onboarding/autofill/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SECTION_META } from "@/sections/section-meta";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();
    if (!role) {
      return NextResponse.json({ error: "Missing role" }, { status: 400 });
    }

    const sections = SECTION_META.map((s) => ({
      id: s.id,
      title: s.title,
      hint: s.aiHint ?? "",
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.9, // trošku víc chaosu = víc „lidské“
      messages: [
        {
          role: "system",
          content: `
Jsi AI, která má napsat ukázkový text do onboardingu v jednoduché aplikaci pro tvorbu webu.

Text NESMÍ znít jako hotový marketingový copywriting, ale jako
běžný člověk, který popisuje svoje podnikání do formuláře.

Styl:
- piš česky, neformálně, v ich-formě ("dělám", "pomáhám", "chci", "mým cílem je"),
- klidně trochu kostrbaté, žádné přehnaně uhlazené věty,
- žádné podnadpisy, žádné odrážky, jen běžný text jako by ho člověk napsal do textarea,
- maximálně 3 krátké odstavce, dohromady zhruba 5–8 vět,
- žádné extra metafory, žádné "prémiové služby", "vysoce konverzní" a podobný buzzwordy.

Obsahově ale nenápadně zahrň:
- co dotyčný dělá (služby),
- pro koho (cílovka),
- jaký hlavní přínos/benefit klienti mají,
- co přibližně očekává od webu (co by tam chtěl ukázat),
- můžeš zmínit i jak chce působit (klidně jen 1 věta typu "chci aby text působil...").

Cíl: aby text vypadal jako slušný, ale amatérský popis, který reálně napíše uživatel do onboarding formuláře
a zároveň obsahoval informace, které potřebuje AI pro generování sekcí (Hero, Služby, Showroom/Portfolio, Testimonials, CTA).
`
        },
        {
          role: "user",
          content: JSON.stringify({
            role,
            availableSections: sections,
          }),
        },
      ],
    });

    // Model vrátí prostý text, žádný JSON
    const exampleText = completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ ok: true, text: exampleText });
  } catch (err) {
    console.error("Autofill error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
