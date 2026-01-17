// src/lib/emails/welcome/render-welcome-email.ts

const safe = (v: any) => String(v ?? "").replace(/[<>]/g, "");

export function renderWelcomeEmail(args?: {
  headline?: string;
  text?: string;
}) {
  const headline = safe(args?.headline ?? "Odteď jsi součástí Origia");
  const text = safe(
    args?.text ??
      "Jsme rádi, že jste se rozhodli používat origio.site. Origio je perfektní cesta, jak si do 2 minut vytvořit osobní profesionální stránku, která vám pomůže prezentovat vaši službu a získávat nové klienty."
  );

  const subject = "Vítej v Origio 👋";

  const html = `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${safe(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#000000;">
  <div style="background:#000000;padding:24px 12px;">
    <div style="max-width:624px;margin:0 auto;border-radius:0;overflow:hidden;">
      <!-- Card -->
      <div style="
        width:100%;
        padding:40px;
        box-sizing:border-box;
        background: linear-gradient(180deg, #000000 0%, #171717 100%);
      ">
        <!-- Header -->
        <div style="text-align:center;">
          <!-- logo placeholder (bílý blok) -->
          <div style="width:48px;height:64px;background:#ffffff;margin:0 auto 10px auto;border-radius:8px;"></div>

          <div style="
            color:#ffffff;
            font-size:28px;
            font-weight:700;
            letter-spacing:-0.02em;
            line-height:1.2;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            margin:0 0 8px 0;
          ">
            ${headline}
          </div>

          <div style="
            color:#a3a3a3;
            font-size:12px;
            font-weight:600;
            line-height:1.6;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            margin:0 auto;
            max-width:520px;
          ">
            ${text}
          </div>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:#1c1917;margin:22px 0;"></div>

        <!-- Icons row (2 bílé ikonky placeholder) -->
        <div style="text-align:center;">
          <span style="display:inline-block;width:20px;height:20px;background:#ffffff;border-radius:6px;margin-right:10px;"></span>
          <span style="display:inline-block;width:20px;height:20px;background:#ffffff;border-radius:6px;"></span>
        </div>

        <!-- Divider -->
        <div style="height:1px;background:#1c1917;margin:22px 0;"></div>

        <!-- Footer note -->
        <div style="
          color:#a3a3a3;
          font-size:10px;
          font-weight:600;
          line-height:1.6;
          text-align:center;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        ">
          Tento e-mail byl odeslán proto, že sis vytvořil účet v Origio.<br/>
          Pokud to nebyl tvůj účet, můžeš e-mail ignorovat.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  const textPlain = `
${headline}

${text}

Tento e-mail byl odeslán proto, že sis vytvořil účet v Origio.
Pokud to nebyl tvůj účet, můžeš e-mail ignorovat.
  `.trim();

  return { subject, html, text: textPlain };
}
