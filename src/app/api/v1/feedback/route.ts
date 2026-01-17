import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type FeedbackPayload = {
  emoji?: string | null;
  message?: string;
  anonymous?: boolean;
};

export async function POST(req: Request) {
  // 1) načtení JSON body
  let body: FeedbackPayload;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[feedback] JSON error:", err);
    return NextResponse.json(
      { error: "Body musí být validní JSON." },
      { status: 400 }
    );
  }

  console.log("📥 [feedback] RAW BODY:", body);

  const emoji = body.emoji ?? null;
  const rawMessage = (body.message ?? "").toString();
  const maxChars = 400;
  const message = rawMessage.slice(0, maxChars);
  const anonymous = body.anonymous ?? true;

  // musí být aspoň emoji nebo nějaký text
  if (!emoji && !message.trim()) {
    return NextResponse.json(
      { error: "Musíte poslat alespoň emoji nebo text zprávy." },
      { status: 400 }
    );
  }

  // 2) user (pokud není anonymní)
  const supabase = await supabaseServer();
  let userId: string | null = null;

  if (!anonymous) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  // 3) metadata z hlaviček
  const userAgent = req.headers.get("user-agent");
  const referer = req.headers.get("referer") ?? req.headers.get("origin");

  const payload = {
    emoji,
    message: message || null,
    anonymous,
    user_id: userId,
    user_agent: userAgent,
    path: referer,
  };

  console.log("📝 [feedback] FINAL PAYLOAD:", payload);

  // 4) insert do tabulky feedback
  const { error } = await supabase.from("feedback").insert(payload);

  if (error) {
    console.error("❌ [feedback] INSERT ERROR:", error);
    return NextResponse.json(
      { error: error.message, payload },
      { status: 500 }
    );
  }

  console.log("✅ [feedback] INSERT OK");
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  // jednoduchý healthcheck, jako máš u analytics
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
