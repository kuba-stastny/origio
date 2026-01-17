import type { ContactPayload } from "./types";

export function validateContactPayload(body: Partial<ContactPayload>) {
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !email || !message) {
    return { ok: false as const, error: "Missing required fields" };
  }

  // basic email sanity
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false as const, error: "Invalid email" };
  }

  // anti-spam soft limit
  if (message.length > 6000) {
    return { ok: false as const, error: "Message too long" };
  }

  return {
    ok: true as const,
    payload: {
      name,
      email,
      message,
      company: body.company?.trim() || undefined,
      industry: body.industry?.trim() || undefined,
    },
  };
}
