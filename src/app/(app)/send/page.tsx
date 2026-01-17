// src/app/send-test/page.tsx
import { sendWelcomeEmail } from "@/lib/emails/welcome/send-welcome-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ✅ NATVRDO (bez URL, bez .env) — ZMĚŇ SI TO
const TO_EMAIL = "kuba-stastny@seznam.cz";
const FIRST_NAME = "Kuba";
const PROJECT_SLUG = "demo";
const APP_URL = "https://app.origio.site";

export default async function SendTestPage() {
  const res = await sendWelcomeEmail({
    toEmail: TO_EMAIL,
    firstName: FIRST_NAME,
    projectSlug: PROJECT_SLUG,
    appUrl: APP_URL,
  });

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <h1>Send test welcome email</h1>

      <div style={{ marginTop: 12, padding: 14, border: "1px solid #ddd" }}>
        <div>
          <b>To:</b> {TO_EMAIL}
        </div>
        <div>
          <b>Name:</b> {FIRST_NAME}
        </div>
        <div>
          <b>Slug:</b> {PROJECT_SLUG}
        </div>
        <div>
          <b>App URL:</b> {APP_URL}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {res.ok ? (
          <>
            <div style={{ color: "green", fontWeight: 700 }}>✅ Odesláno</div>
            <div style={{ marginTop: 8 }}>
              <b>Resend ID:</b> {res.id ?? "—"}
            </div>
          </>
        ) : (
          <>
            <div style={{ color: "crimson", fontWeight: 700 }}>
              ❌ Chyba při odeslání
            </div>
            <pre
              style={{
                marginTop: 10,
                padding: 12,
                background: "#111",
                color: "#eee",
                overflow: "auto",
                borderRadius: 8,
              }}
            >
              {JSON.stringify(res.error, null, 2)}
            </pre>
          </>
        )}
      </div>

      <p style={{ marginTop: 18, opacity: 0.7 }}>
        Pozn.: Tahle stránka odešle e-mail při každém otevření/refreshi.
      </p>
    </div>
  );
}
