// src/app/api/v1/auth/welcome/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emails/welcome/send-welcome-email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const res = await sendWelcomeEmail({ toEmail: email });
    if (!res.ok) {
      return NextResponse.json({ error: res.error?.message ?? "Send failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: res.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
