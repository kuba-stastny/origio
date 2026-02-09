import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { supabaseServer } from '@/lib/supabase/server';
import { migrateDocumentToLatest } from '@/lib/migrations';

import PublishedCanvas from './PublishedCanvas';
import BodyTheme from './BodyTheme';

import type { PageDocument } from '@/types/builder';
import type { DesignSystemJson, DesignSystem } from '@/types/design-system';
import { mapThemeJson } from '@/lib/design-system';

export const dynamic = 'force-dynamic';

type Params = { projectSlug: string };

type PageMetaJson = {
  title?: string;
  locale?: string; // "cs_CZ"
  robots?: string; // "noindex,nofollow"
  ogImage?: string | null;
  ogTitle?: string | null;
  description?: string;
  twitterCard?: string | null; // null | "summary" | "summary_large_image"
  ogDescription?: string | null;
  canonicalUrl?: string | null;
};

function robotsFromMeta(meta?: PageMetaJson | null): Metadata['robots'] {
  const raw = (meta?.robots || '').toLowerCase().replace(/\s+/g, '');
  if (!raw) return { index: true, follow: true };

  const parts = raw.split(',').filter(Boolean);
  const index = !parts.includes('noindex');
  const follow = !parts.includes('nofollow');
  return { index, follow };
}

async function getPageMeta(projectSlug: string): Promise<PageMetaJson | null> {
  const supabase = await supabaseServer();

  const { data: projectRow, error: projectErr } = await supabase
    .from('projects')
    .select('id, status')
    .eq('slug', projectSlug)
    .maybeSingle();

  if (projectErr) {
    console.error('[publish] project meta error', projectErr);
    return null;
  }
  if (!projectRow || projectRow.status !== 'published') return null;

  const { data: page, error: pageErr } = await supabase
    .from('pages')
    .select('meta_json')
    .eq('project_id', projectRow.id)
    .eq('path', '/')
    .maybeSingle();

  if (pageErr) {
    console.error('[publish] page meta error', pageErr);
    return null;
  }

  return (page?.meta_json as PageMetaJson) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const meta = await getPageMeta(params.projectSlug);

  const title = meta?.title || 'Page built with Origio';
  const description = meta?.description || 'This page was built with Origio.';
  const ogDescription = meta?.ogDescription || description;
  const locale = meta?.locale || 'en_US';

  const twitterCard =
    (meta?.twitterCard as 'summary' | 'summary_large_image' | null) ||
    'summary_large_image';

  const h = headers();
  const host = h.get('host') || 'app.origio.site';

  const isLocalhost = host.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';

  // If on app domain -> canonical includes /slug
  // If on custom domain (incl. slug.origio.site) -> canonical is root
  const rootDomain =
    process.env.ROOT_DOMAIN ||
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    'origio.site';

  const cleanHost = host.replace(/:\d+$/, '');
  const isAppDomain =
    cleanHost === `app.${rootDomain}` || cleanHost === `www.${rootDomain}`;

  const canonicalUrl = meta?.canonicalUrl?.trim()
    ? meta.canonicalUrl!
    : isAppDomain
    ? `${protocol}://${cleanHost}/${params.projectSlug}`
    : `${protocol}://${cleanHost}/`;

  const baseOgUrl =
    process.env.NEXT_PUBLIC_APP_URL || `https://app.${rootDomain}`;

  const ogTitle = meta?.ogTitle || title;
  const ogImage = meta?.ogImage || `${baseOgUrl}/images/og.png`;

  return {
    metadataBase: new URL(`${protocol}://${cleanHost}`),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalUrl,
      siteName: 'Origio',
      locale,
      type: 'website',
      images: ogImage,
    },
    twitter: {
      card: twitterCard,
      title,
      description: ogDescription,
      images: [ogImage],
    },
    robots: robotsFromMeta(meta),
  };
}

async function getData({ projectSlug }: Params) {
  const supabase = await supabaseServer();

  // 1) project
  const { data: projectRow, error: projectErr } = await supabase
    .from('projects')
    .select('id, slug, name, status, workspace_id')
    .eq('slug', projectSlug)
    .maybeSingle();

  if (projectErr) console.error('[publish] project error', projectErr);
  if (!projectRow || projectRow.status !== 'published') return null;

  // 2) workspace (for analytics)
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', projectRow.workspace_id)
    .maybeSingle();

  if (wsErr) console.error('[publish] workspace error', wsErr);
  if (!ws) return null;

  // 3) root page "/"
  const { data: page, error: pageErr } = await supabase
    .from('pages')
    .select('id, published_json, theme_json, meta_json')
    .eq('project_id', projectRow.id)
    .eq('path', '/')
    .maybeSingle();

  if (pageErr) console.error('[publish] page error', pageErr);
  if (!page) return null;

  const { doc } = migrateDocumentToLatest(
    (page.published_json as any) || { version: 1, sections: [], settings: {} }
  );

  const themeJson = (page.theme_json ?? null) as DesignSystemJson | null;
  const theme: DesignSystem = mapThemeJson(themeJson);

  return {
    workspace: { id: ws.id as string },
    project: { id: projectRow.id as string, slug: projectRow.slug as string },
    page: {
      id: page.id as string,
      doc: doc as PageDocument,
      theme,
      meta: (page.meta_json ?? {}) as PageMetaJson,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const data = await getData(params);
  if (!data) notFound();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: data.page.theme.background }}
    >
      <PublishedCanvas
        workspaceId={data.workspace.id}
        projectId={data.project.id}
        pageId={data.page.id}
        initialDoc={data.page.doc}
        theme={data.page.theme}
      />

      <BodyTheme theme={data.page.theme} />

  {/* badge */}
<div className="fixed bottom-0 left-1/2 -translate-x-1/2 p-5 z-[2000] sm:left-auto sm:right-0 sm:translate-x-0">
  <a
    href="https://origio.site"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Vytvořeno v Origio"
    className="block"
  >
    <div
      className={[
        "group relative overflow-hidden",
        "rounded-2xl px-4 py-2",
        "flex items-center gap-2",
        // mobil: široké, centrované
        "w-[calc(100vw-40px)] max-w-[520px] justify-center",
        // desktop: fit-content vpravo
        "sm:w-auto sm:max-w-none sm:justify-start",

        // ✅ DARK glass (lepší na bílém podkladu)
        "bg-black/55",
        "backdrop-blur-xl",
        "border border-white/10",
        "shadow-[0_12px_34px_rgba(0,0,0,0.35)]",

        // typography
        "text-sm text-white/90",

        // interaction
        "transition-all duration-200",
        "hover:bg-black/65 hover:shadow-[0_16px_44px_rgba(0,0,0,0.42)]",
        "active:scale-[0.99]",
        "cursor-pointer",
      ].join(" ")}
    >
      {/* specular highlight (tmavší, aby nerušil) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 left-1/2 h-24 w-[140%] -translate-x-1/2 rotate-[-6deg] bg-gradient-to-b from-white/14 to-transparent blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-black/25" />
      </div>

      {/* content */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="h-6 w-6 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
          <img
            className="h-4 w-4"
            src="https://app.origio.site/images/logo2.png"
            alt="Origio"
            draggable={false}
          />
        </div>

        <span className="text-white/70">vytvořeno v</span>
        <span className="font-semibold tracking-tight text-white">
          origio.site
        </span>
      </div>

      {/* glow (jemnější, aby nezesvětloval moc) */}
      <div className="pointer-events-none absolute -inset-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.14),transparent_45%)]" />
      </div>
    </div>
  </a>
</div>

    </main>
  );
}
