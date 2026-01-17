import { getResendClient } from "@/lib/resend";
import type { ContactPayload, Recipient } from "./types";
import { renderContactEmail } from "./render-email";

export async function sendContactEmail(args: {
  payload: ContactPayload;
  recipient: Recipient;
}) {
  const resend = getResendClient();

  const { subject, html, text } = renderContactEmail(args);

  const { data, error } = await resend.emails.send({
    from: "Origio <owner@origio.site>", // ověřený sender
    to: [args.recipient.toEmail],
    replyTo: args.payload.email,
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
