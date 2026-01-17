import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { getSlugFromHost } from "@/lib/contact/host";
import { validateContactPayload } from "@/lib/contact/validate";
import {
  resolveRecipientByProjectId,
  resolveRecipientBySlug,
} from "@/lib/contact/resolve-recipient";
import { sendContactEmail } from "@/lib/contact/send";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const hdrs = await headers();
    const host = hdrs.get("host");
    const slug = getSlugFromHost(host);

    const raw = await req.json().catch(() => ({}));
    const v = validateContactPayload(raw);

    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    // PUBLIC: slug z hostu
    if (slug) {
      const recipient = await resolveRecipientBySlug(slug);
      if (!recipient) {
        return NextResponse.json(
          { error: "Project not found or not published" },
          { status: 404 }
        );
      }

      const result = await sendContactEmail({ recipient, payload: v.payload });
      if (!result.ok) {
        return NextResponse.json(
          { error: "Email sending failed", details: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, id: result.id });
    }

    // BUILDER: musí přijít projectId v body
    const projectId = (raw?.projectId ?? "").trim();
    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId (builder mode)" },
        { status: 400 }
      );
    }

    const recipient = await resolveRecipientByProjectId(projectId);
    if (!recipient) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const result = await sendContactEmail({ recipient, payload: v.payload });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Email sending failed", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (err: any) {
    console.error("api/contact error:", err);
    return NextResponse.json(
      { error: "Unexpected server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
