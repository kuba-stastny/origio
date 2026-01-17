// src/app/api/v1/projects/[projectId]/meta/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

type RouteParams = { projectId: string };

const BodySchema = z.object({
  title: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(300).optional().or(z.literal("")),
  locale: z.string().optional().or(z.literal("")),
  robots: z.string().optional().or(z.literal("")),
});

type MetaOut = {
  title: string;
  description: string;
  locale: string;
  robots: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterCard: "summary_large_image" | "summary" | "app" | "player" | null;
};

async function getHomePageRow(
  sb: Awaited<ReturnType<typeof supabaseServer>>,
  projectId: string
) {
  // ⚠️ pokud máš víc stránek, tady ideálně filtruj jen homepage
  // např. .eq("is_home", true) nebo .eq("slug", "home")
  const { data, error } = await sb
    .from("pages")
    .select("id, meta_json")
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle();

  if (error) return { error: error.message, data: null as any };
  if (!data) return { error: "Homepage not found", data: null as any };

  return { error: null, data };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { projectId } = await context.params;
  const sb = await supabaseServer();

  const found = await getHomePageRow(sb, projectId);
  if (found.error) {
    return NextResponse.json({ error: found.error }, { status: 404 });
  }

  const meta = (found.data?.meta_json ?? {}) as Partial<MetaOut>;

  // ✅ vracej FLAT fields, aby to sedělo na client
  return NextResponse.json({
    title: meta.title ?? "",
    description: meta.description ?? "",
    locale: meta.locale ?? "cs_CZ",
    robots: meta.robots ?? "noindex,nofollow",
    ogTitle: meta.ogTitle ?? null,
    ogDescription: meta.ogDescription ?? null,
    ogImage: meta.ogImage ?? null,
    twitterCard: meta.twitterCard ?? null,
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { projectId } = await context.params;
  const sb = await supabaseServer();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body musí být JSON." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const found = await getHomePageRow(sb, projectId);
  if (found.error) {
    return NextResponse.json({ error: found.error }, { status: 404 });
  }

  const { title = "", description = "", locale = "", robots = "" } = parsed.data;

  const meta: MetaOut = {
    title,
    description,
    locale: locale || "cs_CZ",
    robots: robots || "noindex,nofollow",
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    twitterCard: null,
  };

  const { error } = await sb
    .from("pages")
    .update({ meta_json: meta })
    .eq("id", found.data.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    title: meta.title,
    description: meta.description,
    locale: meta.locale,
    robots: meta.robots,
  });
}
