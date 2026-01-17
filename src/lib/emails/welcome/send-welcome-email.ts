// src/lib/emails/welcome/send-welcome-email.ts
import { getResendClient } from "@/lib/resend";
import { renderWelcomeEmail } from "./render-welcome-email";

export async function sendWelcomeEmail(args: { toEmail: string }) {
  const resend = getResendClient();
  const { subject, html, text } = renderWelcomeEmail();

  const { data, error } = await resend.emails.send({
    from: "Origio <hello@origio.site>", // doporučeno
    to: [args.toEmail],
    replyTo: "hello@origio.site",
    subject,
    html,
    text,
  });

  if (error) {
    const anyError = error as any;
    return {
      ok: false as const,
      error: {
        message: anyError?.message ?? "Unknown Resend error",
        name: anyError?.name,
        statusCode: anyError?.statusCode,
        type: anyError?.type,
        issues: anyError?.issues ?? anyError?.errors ?? null,
      },
    };
  }

  return { ok: true as const, id: data?.id ?? null };
}
