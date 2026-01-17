// src/lib/emails/contact/render-email.ts
import type { ContactPayload, Recipient } from "./types";

const safe = (v: any) => String(v ?? "").replace(/[<>]/g, "");

export function renderContactEmail(args: {
  payload: ContactPayload;
  recipient: Recipient;
}) {
  const { payload } = args;

  const subject = `Máš tu poptávku z Origio.`;

  const message = safe(payload.message || "");
  const name = safe(payload.name || "—");
  const email = safe(payload.email || "—");

  const html = `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${subject}</title>
</head>

<body style="margin:0;padding:0;background:#09090b;">
  <div style="background:#09090b;padding:24px 12px;">
    <div style="max-width:624px;margin:0 auto;">
      <div style="
        background:#09090b;
        padding:40px;
        box-sizing:border-box;
        text-align:center;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      ">

        <!-- Icon: envelope -->
        <div style="display:inline-block;margin:0 auto;">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 16 16" fill="#ffffff" aria-hidden="true">
            <path fill-rule="evenodd" d="M6.5 9.5 3 7.5v-6A1.5 1.5 0 0 1 4.5 0h7A1.5 1.5 0 0 1 13 1.5v6l-3.5 2L8 8.75zM1.059 3.635 2 3.133v3.753L0 5.713V5.4a2 2 0 0 1 1.059-1.765M16 5.713l-2 1.173V3.133l.941.502A2 2 0 0 1 16 5.4zm0 1.16-5.693 3.337L16 13.372v-6.5Zm-8 3.199 7.941 4.412A2 2 0 0 1 14 16H2a2 2 0 0 1-1.941-1.516zm-8 3.3 5.693-3.162L0 6.873v6.5Z"/>
          </svg>
        </div>

        <!-- Title -->
        <div style="
          margin-top:12px;
          color:#ffffff;
          font-size:36px;
          font-weight:700;
          letter-spacing:-0.03em;
          line-height:1.05;
        ">
          Máš tu poptávku z Origio.
        </div>

        <!-- Subtitle -->
        <div style="
          margin-top:12px;
          color:#a3a3a3;
          font-size:12px;
          font-weight:300;
          letter-spacing:-0.01em;
          line-height:1.5;
        ">
          Na Origio ti právě někdo poslal poptávku.
        </div>

        <!-- Divider -->
        <div style="height:1px;background:#1c1917;margin:22px 0;"></div>

        <!-- Message -->
        <div style="
          color:#a3a3a3;
          font-size:12px;
          font-weight:300;
          letter-spacing:-0.01em;
          line-height:1.6;
          white-space:pre-wrap;
          text-align:center;
        ">${message}</div>

        <!-- Sender -->
        <div style="margin-top:12px;">
          <div style="
            color:#e5e5e5;
            font-size:12px;
            font-weight:300;
            letter-spacing:-0.01em;
            line-height:1.4;
          ">${name}</div>

          <div style="margin-top:2px;">
            <a href="mailto:${email}" style="
              color:#e5e5e5;
              font-size:12px;
              font-weight:300;
              letter-spacing:-0.01em;
              text-decoration:underline;
            ">${email}</a>
          </div>
        </div>

        <!-- Small icons row (2x) -->
        <div style="margin-top:22px;text-align:center;">
          <span style="display:inline-block;width:20px;height:20px;background:#ffffff;border-radius:6px;margin-right:10px;"></span>
          <span style="display:inline-block;width:20px;height:20px;background:#ffffff;border-radius:6px;"></span>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:#1c1917;margin:22px 0;"></div>

        <!-- Footer -->
        <div style="
          color:#a3a3a3;
          font-size:10px;
          font-weight:600;
          letter-spacing:-0.01em;
          line-height:1.5;
        ">
          Tento e-mail byl odeslán na základě tvého registrovaného e-mailu v origio.site,
          na který ti budou chodit poptávky.
        </div>

      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `
Máš tu poptávku z Origio.

${payload.message}

${payload.name} (${payload.email})
  `.trim();

  return { subject, html, text };
}
