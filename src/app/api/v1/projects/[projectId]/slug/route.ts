// src/app/api/v1/projects/[projectId]/slug/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

type RouteParams = { projectId: string };

const SlugSchema = z
  .string()
  .min(1, "Slug je prázdný.")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug může obsahovat jen malá písmena, čísla a pomlčky.");

export async function GET(
  _request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { projectId } = await context.params;

  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select("slug")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Nepodařilo se načíst slug." },
      { status: 400 }
    );
  }

  return NextResponse.json({ slug: data?.slug ?? "" });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { projectId } = await context.params;

  const sb = await supabaseServer();

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // ignoruj – validace níže vše ošetří
  }

  const slugInput = (body as { slug?: unknown })?.slug;
  const result = SlugSchema.safeParse(typeof slugInput === "string" ? slugInput.trim() : "");
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Neplatný slug." },
      { status: 400 }
    );
  }
  const newSlug = result.data;

  // najdi aktuální projekt
  const { data: current, error: curErr } = await sb
    .from("projects")
    .select("id, slug")
    .eq("id", projectId)
    .maybeSingle();

  if (curErr || !current) {
    return NextResponse.json({ error: "Projekt nebyl nalezen." }, { status: 404 });
  }

  // žádná změna
  if (current.slug === newSlug) {
    return NextResponse.json({ ok: true, slug: newSlug });
  }

  // ověř unikátnost slugu
  const { data: exists } = await sb
    .from("projects")
    .select("id")
    .eq("slug", newSlug)
    .maybeSingle();

  if (exists && exists.id !== projectId) {
    return NextResponse.json({ error: "Slug je již obsazen." }, { status: 400 });
  }

  const { error } = await sb.from("projects").update({ slug: newSlug }).eq("id", projectId);
  if (error) {
    return NextResponse.json({ error: error.message || "Uložení selhalo." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, slug: newSlug });
}
