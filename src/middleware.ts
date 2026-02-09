import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/* ----------------------------- Builder redirects ----------------------------- */

function shouldRedirectToBuilder(pathname: string): boolean {
  if (pathname === '/login' || pathname === '/login/') return true;
  if (pathname === '/workspaces' || pathname === '/workspaces/') return true;
  if (/^\/workspaces\/[^\/]+\/?$/.test(pathname)) return true;
  if (/^\/workspaces\/[^\/]+\/projects\/?$/.test(pathname)) return true;
  if (/^\/workspaces\/[^\/]+\/projects\/[^\/]+\/?$/.test(pathname)) return true;
  return false;
}

/* ----------------------------- Host utilities ----------------------------- */

function stripPort(host: string) {
  return host.replace(/:\d+$/, '');
}

function getSlugFromHost(host: string, rootDomain: string): string | null {
  const h = stripPort(host).toLowerCase();
  const root = rootDomain.toLowerCase();

  if (h.endsWith('.localhost')) {
    const sub = h.replace('.localhost', '');
    if (!sub) return null;
    const slug = sub.split('.')[0];
    const reserved = new Set(['www', 'app', 'admin', 'api']);
    if (!slug || reserved.has(slug)) return null;
    return slug;
  }

  if (h === root) return null;
  if (!h.endsWith(`.${root}`)) return null;

  const slug = h.slice(0, -(`.${root}`.length)).split('.')[0];
  if (!slug) return null;

  const reserved = new Set(['www', 'app', 'admin', 'api']);
  if (reserved.has(slug)) return null;

  return slug;
}

function isIgnoredPath(pathname: string) {
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/api')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/robots.txt') return true;
  if (pathname === '/sitemap.xml') return true;
  return false;
}

/* -------------------------------- Middleware -------------------------------- */

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostHeader = req.headers.get('host') ?? '';
  const pathname = url.pathname;

  const ROOT_DOMAIN =
    (process.env.ROOT_DOMAIN ||
      process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
      'origio.site') as string;

  // 1) subdomain rewrite
  const projectSlug = getSlugFromHost(hostHeader, ROOT_DOMAIN);

  if (projectSlug && !isIgnoredPath(pathname)) {
    const nextUrl = req.nextUrl.clone();
    nextUrl.pathname = pathname === '/' ? `/${projectSlug}` : `/${projectSlug}${pathname}`;
    return NextResponse.rewrite(nextUrl);
  }

  // 2) auth sync client
  const res = NextResponse.next({ request: { headers: req.headers } });

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
          res.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  // ✅ pokud to není path, kde chceme redirect, neřeš DB lookup vůbec
  const needsBuilderRedirect = shouldRedirectToBuilder(pathname);

  // 2a) get user (cheap)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;

  if (!userId) {
    // pokud chceš vynutit auth na /workspaces, můžeš tady:
    // if (pathname.startsWith('/workspaces')) return NextResponse.redirect(new URL('/login', req.url));
    return res;
  }

  if (!needsBuilderRedirect) return res;

  try {
    // workspace membership
    const { data: memberships, error: mErr } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (mErr || !memberships?.length) return res;

    const workspaceId = memberships[0].workspace_id as string;

    // first project
    const { data: projects, error: pErr } = await supabase
      .from('projects')
      .select('id')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (pErr || !projects?.length) return res;

    const projectId = projects[0].id as string;
    const targetPath = `/workspaces/${workspaceId}/projects/${projectId}/builder`;

    if (pathname === targetPath) return res;

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    redirectUrl.search = '';

    return NextResponse.redirect(redirectUrl);
  } catch {
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
