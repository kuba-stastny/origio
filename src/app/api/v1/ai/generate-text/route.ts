// src/app/api/v1/ai/generate-text/route.ts
import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// volitelně: export const runtime = "nodejs"; // (výchozí)
// volitelně: export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const prompt: string = String(body?.prompt || "").trim();
    const language: "cs" | "en" = String(body?.language || "cs").toLowerCase() === "en" ? "en" : "cs";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const system =
      language === "cs"
        ? "Jsi zkušený český copywriter a editor. Odpovídej stručně, přirozeně a srozumitelně v češtině."
        : "You are a professional English copywriter and editor. Reply concisely, naturally, and clearly in English.";

    const user = language === "cs"
      ? `Vygeneruj text na základě následujícího zadání. Nepouživej žadné uvozovky ani hvězdičky. Buď stručný a praktický.\n\nZadání: ${prompt}`
      : `Generate text based on the following prompt. Keep it concise and practical.\n\nPrompt: ${prompt}`;

    // OpenAI chat/completions
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.8,
        max_tokens: 400, // klidně uprav
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return NextResponse.json({ error: `OpenAI error: ${err || res.statusText}` }, { status: 500 });
    }

    const json = await res.json().catch(() => ({}));
    const text: string = json?.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ text: String(text || "").trim() }, { status: 200 });
  } catch (err: any) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: "Generation error" }, { status: 500 });
  }
}
