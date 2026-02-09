import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function makeClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

function getPublicOrigin(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.origio.site";
}

function randomSlug(len = 7) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";

  const cryptoObj: Crypto | undefined = (globalThis as any).crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint8Array(len);
    cryptoObj.getRandomValues(buf);
    for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length];
    return out;
  }

  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** ✅ přenese cookies z jedné NextResponse do druhé */
function copyCookies(from: NextResponse, to: NextResponse) {
  const all = from.cookies.getAll();
  for (const c of all) {
    to.cookies.set(c);
  }
}

export async function GET(req: NextRequest) {
  const origin = getPublicOrigin(req);

  // ✅ base response, do které Supabase zapisuje cookies
  const resBase = NextResponse.next();
  resBase.headers.set("cache-control", "no-store");

  const supabase = makeClient(req, resBase);

  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();

  if (uErr) console.error("[post-login] getUser error", uErr);

  if (!user) {
    const redirectRes = NextResponse.redirect(new URL("/login", origin));
    redirectRes.headers.set("cache-control", "no-store");
    copyCookies(resBase, redirectRes);
    return redirectRes;
  }

  // 1) membership
  const { data: membership, error: mErr } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (mErr) console.error("[post-login] membership error", mErr);

  let workspaceId: string | null = membership?.workspace_id ?? null;

  // 2) create workspace if missing
  if (!workspaceId) {
    const baseName = user.email?.split("@")[0] ?? "Můj workspace";
    let wsSlug = randomSlug(7);

    for (let i = 0; i < 4; i++) {
      const { data: newWs, error: wsErr } = await supabase
        .from("workspaces")
        .insert({
          name: baseName || "Můj workspace",
          slug: wsSlug,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (!wsErr && newWs?.id) {
        workspaceId = newWs.id as string;
        break;
      }

      wsSlug = randomSlug(7);

      if (i === 3) {
        console.error("[post-login] create workspace failed", wsErr);
        const redirectRes = NextResponse.redirect(new URL("/login?e=ws", origin));
        redirectRes.headers.set("cache-control", "no-store");
        copyCookies(resBase, redirectRes);
        return redirectRes;
      }
    }

    if (!workspaceId) {
      const redirectRes = NextResponse.redirect(new URL("/login?e=ws", origin));
      redirectRes.headers.set("cache-control", "no-store");
      copyCookies(resBase, redirectRes);
      return redirectRes;
    }

    const { error: wmErr } = await supabase.from("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      role: "owner",
    });

    if (wmErr) {
      console.error("[post-login] create membership failed", wmErr);
      const redirectRes = NextResponse.redirect(new URL("/login?e=member", origin));
      redirectRes.headers.set("cache-control", "no-store");
      copyCookies(resBase, redirectRes);
      return redirectRes;
    }
  }

  // 3) first project
  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select("id")
    .eq("workspace_id", workspaceId!)
    .order("created_at", { ascending: true })
    .limit(1);

  if (pErr) console.error("[post-login] list projects error", pErr);

  let projectId: string | null = projects?.[0]?.id ?? null;

  // 4) create project if missing
  if (!projectId) {
    let projSlug = randomSlug(7);

    for (let i = 0; i < 4; i++) {
      const { data: newProject, error: newProjErr } = await supabase
        .from("projects")
        .insert({
          workspace_id: workspaceId,
          name: "Můj první projekt",
          slug: projSlug,
          status: "draft",
          meta_json: {},
        })
        .select("id")
        .single();

      if (!newProjErr && newProject?.id) {
        projectId = newProject.id as string;

        const { error: pageErr } = await supabase.from("pages").insert({
          project_id: projectId,
          name: "Homepage",
          path: "/",
          page_json: {},
          settings_json: {},
          draft_json: {},
          published_json: {},
          meta_json: {},
        });

        if (pageErr) console.error("[post-login] create default page error", pageErr);
        break;
      }

      projSlug = randomSlug(7);

      if (i === 3) {
        console.error("[post-login] create project failed", newProjErr);
        const redirectRes = NextResponse.redirect(new URL("/login?e=project", origin));
        redirectRes.headers.set("cache-control", "no-store");
        copyCookies(resBase, redirectRes);
        return redirectRes;
      }
    }
  }

  const target = new URL(
    `/workspaces/${workspaceId}/projects/${projectId}/builder`,
    origin
  );

  const redirectRes = NextResponse.redirect(target);
  redirectRes.headers.set("cache-control", "no-store");

  // ✅ KRITICKÉ: přenést cookies, které Supabase případně upravila během getUser/DB flow
  copyCookies(resBase, redirectRes);

  return redirectRes;
}
