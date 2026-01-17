// src/app/api/v1/onboarding/autofill-answers/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { role, promptDraft, questions } = await req.json();

    if (!role || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.85,
      messages: [
        {
          role: "system",
          content: `
Tvojí úlohou je vytvořit krátké, lidské a nenucené odpovědi na otázky,
které uživateli chybí v promptu.

Styl:
- čeština
- neformální (já-forma)
- žádný marketing, žádné superlativy
- maximálně 1–2 věty na otázku
- realisticky, jako by to psal obyčejný člověk do formuláře

Cíl:
- vrátit objekt { answers: string[] }
- každý index odpovídá jedné otázce ve vstupu

NEVRACEJ nic jiného než JSON.
        `,
        },
        {
          role: "user",
          content: JSON.stringify({
            role,
            currentPrompt: promptDraft,
            missingQuestions: questions,
          }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const json = completion.choices[0].message?.content ?? "{}";
    const parsed = JSON.parse(json);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("autofill-answers error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
