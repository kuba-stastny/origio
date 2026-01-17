import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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
          res.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );
}

function getPublicOrigin(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.origio.site';
}

export async function GET(req: NextRequest) {
  const origin = getPublicOrigin(req);
  const url = new URL(req.url);

  const res = NextResponse.redirect(new URL('/api/v1/auth/post-login', origin));
  const supabase = makeClient(req, res);

  // ✅ Supabase OAuth vrací ?code=... → exchange → uloží cookies
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const error_description = url.searchParams.get('error_description');

  if (error) {
    const target = new URL('/login', origin);
    target.searchParams.set('e', error);
    if (error_description) target.searchParams.set('m', error_description);
    return NextResponse.redirect(target);
  }

  if (!code) {
    // nic k exchange → pošli na login
    return NextResponse.redirect(new URL('/login?e=no_code', origin));
  }

  const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);

  if (exErr) {
    const target = new URL('/login', origin);
    target.searchParams.set('e', 'oauth_exchange');
    target.searchParams.set('m', exErr.message ?? 'exchangeCodeForSession failed');
    return NextResponse.redirect(target);
  }

  return res;
}
