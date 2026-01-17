// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/* ----------------------------- Builder redirects ----------------------------- */

function shouldRedirectToBuilder(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/login/") return true;

  if (pathname === "/workspaces" || pathname === "/workspaces/") return true;

  if (/^\/workspaces\/[^\/]+\/?$/.test(pathname)) return true;

  if (/^\/workspaces\/[^\/]+\/projects\/?$/.test(pathname)) return true;

  if (/^\/workspaces\/[^\/]+\/projects\/[^\/]+\/?$/.test(pathname)) return true;

  return false;
}

/* ----------------------------- Host utilities ----------------------------- */

function stripPort(host: string) {
  return host.replace(/:\d+$/, "");
}

/**
 * Detect slug subdomain on a root domain.
 * - jacob.creatorpro.site -> "jacob"
 * - app.creatorpro.site   -> null (reserved)
 * - creatorpro.site       -> null (apex)
 * Supports localhost dev:
 * - jacob.localhost:3000 -> "jacob"
 */
function getSlugFromHost(host: string, rootDomain: string): string | null {
  const h = stripPort(host).toLowerCase();
  const root = rootDomain.toLowerCase();

  // localhost dev: <slug>.localhost
  if (h.endsWith(".localhost")) {
    const sub = h.replace(".localhost", "");
    if (!sub) return null;
    const slug = sub.split(".")[0];
    const reserved = new Set(["www", "app", "admin", "api"]);
    if (!slug || reserved.has(slug)) return null;
    return slug;
  }

  // apex -> no slug
  if (h === root) return null;

  // must end with ".root"
  if (!h.endsWith(`.${root}`)) return null;

  // take first label as slug
  const slug = h.slice(0, -(`.${root}`.length)).split(".")[0];
  if (!slug) return null;

  // avoid system/reserved subdomains
  const reserved = new Set(["www", "app", "admin", "api"]);
  if (reserved.has(slug)) return null;

  return slug;
}

/** Avoid rewriting requests that are definitely not page requests */
function isIgnoredPath(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  return false;
}

/* -------------------------------- Middleware -------------------------------- */

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostHeader = req.headers.get("host") ?? "";
  const pathname = url.pathname;

  // ✅ Root domain configurable per deployment (creatorpro.site)
  const ROOT_DOMAIN =
    (process.env.ROOT_DOMAIN ||
      process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
      "origio.site") as string;

  // 1) SUBDOMAINS: <slug>.ROOT_DOMAIN -> rewrite to /[projectSlug](+path)
  // Important:
  // - keep querystring
  // - keep nested path
  // - do not interfere with /api/_next/static/etc.
  const projectSlug = getSlugFromHost(hostHeader, ROOT_DOMAIN);

  if (projectSlug && !isIgnoredPath(pathname)) {
    const nextUrl = req.nextUrl.clone();

    // If user is on jacob.creatorpro.site/ -> rewrite to /jacob
    // If user is on jacob.creatorpro.site/foo -> rewrite to /jacob/foo
    nextUrl.pathname =
      pathname === "/" ? `/${projectSlug}` : `/${projectSlug}${pathname}`;

    return NextResponse.rewrite(nextUrl);
  }

  // 2) Everything else: your existing auth/cookie sync + redirect logic
  const res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
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

  // 2a) Get user
  let userId: string | null = null;
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("[middleware] getUser error", error);
    }
    userId = user?.id ?? null;
  } catch (err) {
    console.error("[middleware] getUser unexpected error", err);
  }

  // Not logged in -> just sync cookies
  if (!userId) {
    return res;
  }

  // Not a redirect target -> do nothing
  if (!shouldRedirectToBuilder(pathname)) {
    return res;
  }

  try {
    // 3) First workspace membership
    const { data: memberships, error: mErr } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (mErr) {
      console.error("[middleware] workspace_members error", mErr);
      return res;
    }

    if (!memberships || memberships.length === 0) {
      return res;
    }

    const workspaceId = memberships[0].workspace_id as string;

    // 4) First project in workspace
    const { data: projects, error: pErr } = await supabase
      .from("projects")
      .select("id")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (pErr) {
      console.error("[middleware] projects list error", pErr);
      return res;
    }

    if (!projects || projects.length === 0) {
      return res;
    }

    const projectId = projects[0].id as string;
    const targetPath = `/workspaces/${workspaceId}/projects/${projectId}/builder`;

    if (pathname === targetPath) {
      return res;
    }

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    redirectUrl.search = "";

    console.info("[middleware] redirecting authenticated user to", targetPath);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[middleware] redirect to builder error", err);
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
