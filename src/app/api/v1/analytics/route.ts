import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}

/* =========================
   IP helpers (reliable)
========================= */

// ✅ GEO DISABLED
function normalizeIp(raw: string | null) {
  if (!raw) return null;
  let ip = raw.trim();

  // "ip, ip, ip"
  if (ip.includes(",")) ip = ip.split(",")[0].trim();

  // IPv6-mapped IPv4: ::ffff:1.2.3.4
  if (ip.startsWith("::ffff:")) ip = ip.slice("::ffff:".length);

  // sometimes IPv6 arrives in []
  ip = ip.replace(/^\[|\]$/g, "");

  return ip || null;
}

// ✅ GEO DISABLED
function getClientIp(req: Request) {
  // prioritize common proxy headers
  const xReal = normalizeIp(req.headers.get("x-real-ip"));
  const xff = normalizeIp(req.headers.get("x-forwarded-for"));

  return xReal || xff || null;
}

// ✅ GEO DISABLED
function isPrivateOrLocalIp(ip: string) {
  const s = ip.trim().toLowerCase();

  // localhost
  if (s === "127.0.0.1" || s === "::1") return true;

  // IPv4 private ranges
  if (s.startsWith("10.")) return true;
  if (s.startsWith("192.168.")) return true;

  // 172.16.0.0 – 172.31.255.255
  if (s.startsWith("172.")) {
    const parts = s.split(".");
    const second = Number(parts[1] ?? NaN);
    if (!Number.isNaN(second) && second >= 16 && second <= 31) return true;
  }

  // IPv6 private/link-local
  if (s.startsWith("fc") || s.startsWith("fd")) return true; // unique local
  if (s.startsWith("fe80:")) return true; // link-local

  return false;
}

/* =========================
   GEO via ipapi.co (CPU-safe)
========================= */

type Geo = { country: string | null; region: string | null; city: string | null };

// ✅ GEO DISABLED
const geoCache = new Map<string, { exp: number; geo: Geo }>();
const GEO_TTL_MS = 12 * 60 * 60 * 1000; // 12h
const GEO_FAIL_TTL_MS = 30 * 60 * 1000; // 30m
const GEO_TIMEOUT_MS = 1500; // safer than 800ms in real world

// ✅ GEO DISABLED
function cleanText(v: any): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

// ✅ GEO DISABLED
function cleanCountry(v: any): string | null {
  const t = cleanText(v);
  if (!t) return null;
  // ipapi returns ISO2
  const up = t.toUpperCase();
  if (/^[A-Z]{2}$/.test(up)) return up;
  return null;
}

// ✅ GEO DISABLED
async function geoFromIp(ip: string | null): Promise<Geo> {
  if (!ip) return { country: null, region: null, city: null };
  if (isPrivateOrLocalIp(ip)) return { country: null, region: null, city: null };

  const now = Date.now();
  const cached = geoCache.get(ip);
  if (cached && cached.exp > now) return cached.geo;

  const url = `https://ipapi.co/${encodeURIComponent(ip)}/json/`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEO_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: {
        "User-Agent": "creatorpro-analytics/1.0",
        Accept: "application/json",
      },
    }).catch(() => null);

    clearTimeout(timer);

    if (!res || !res.ok) {
      const geo: Geo = { country: null, region: null, city: null };
      geoCache.set(ip, { exp: now + GEO_FAIL_TTL_MS, geo });
      return geo;
    }

    const j = (await res.json().catch(() => null)) as any;

    const geo: Geo = {
      country: cleanCountry(j?.country),
      region: cleanText(j?.region),
      city: cleanText(j?.city),
    };

    geoCache.set(ip, { exp: now + GEO_TTL_MS, geo });
    return geo;
  } catch {
    clearTimeout(timer);
    const geo: Geo = { country: null, region: null, city: null };
    geoCache.set(ip, { exp: now + GEO_FAIL_TTL_MS, geo });
    return geo;
  }
}

/* =========================
   Referrer inference (no UTM)
========================= */

type PlatformKey =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "linkedin"
  | "youtube"
  | "google"
  | "bing"
  | "yahoo"
  | "pinterest"
  | "reddit"
  | "snapchat"
  | "threads"
  | "discord"
  | "other";

const PLATFORM_DOMAIN: Record<PlatformKey, string> = {
  facebook: "facebook.com",
  instagram: "instagram.com",
  tiktok: "tiktok.com",
  x: "t.co",
  linkedin: "linkedin.com",
  youtube: "youtube.com",
  google: "google.com",
  bing: "bing.com",
  yahoo: "yahoo.com",
  pinterest: "pinterest.com",
  reddit: "reddit.com",
  snapchat: "snapchat.com",
  threads: "threads.net",
  discord: "discord.com",
  other: "other",
};

function safeHost(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  try {
    return new URL(t).host.toLowerCase() || null;
  } catch {
    // handle "facebook.com/..." or "facebook.com"
    return t.replace(/^https?:\/\//, "").split("/")[0]?.toLowerCase() || null;
  }
}

function getReqHost(req: Request): string | null {
  const h =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    null;
  return h ? h.trim().toLowerCase() : null;
}

function isSelfOrChildHost(refHost: string, reqHost: string) {
  // exact match OR subdomain of reqHost (e.g. john.origio.site vs origio.site)
  if (refHost === reqHost) return true;
  if (refHost.endsWith("." + reqHost)) return true;
  return false;
}

function inferPlatformFromReferrer(ref: string | null): PlatformKey | null {
  const host = safeHost(ref);
  if (!host) return null;

  // TOP 15-ish mapping by host
  if (host.includes("facebook.com") || host.includes("fb.com")) return "facebook";
  if (host.includes("instagram.com")) return "instagram";
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("twitter.com") || host.includes("x.com") || host.includes("t.co")) return "x";
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("google.") || host.includes("google.com")) return "google";
  if (host.includes("bing.com")) return "bing";
  if (host.includes("yahoo.com")) return "yahoo";
  if (host.includes("pinterest.") || host.includes("pinterest.com")) return "pinterest";
  if (host.includes("reddit.com")) return "reddit";
  if (host.includes("snapchat.com")) return "snapchat";
  if (host.includes("threads.net")) return "threads";
  if (host.includes("discord.com") || host.includes("discord.gg")) return "discord";

  return "other";
}

function inferPlatformFromUserAgent(uaRaw: string | null): PlatformKey | null {
  const ua = (uaRaw || "").toLowerCase();
  if (!ua) return null;

  // Facebook in-app: FBAN/FBAV, "FB_IAB", etc.
  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab") || ua.includes("facebookexternalhit"))
    return "facebook";

  // Instagram in-app: "instagram", often also has FBAN/FBAV but includes "instagram"
  if (ua.includes("instagram")) return "instagram";

  // Threads app
  if (ua.includes("threads")) return "threads";

  // TikTok in-app
  if (ua.includes("tiktok")) return "tiktok";

  // X/Twitter in-app
  if (ua.includes("twitter") || ua.includes("x-client") || ua.includes("x/")) return "x";

  // LinkedIn in-app
  if (ua.includes("linkedinapp") || ua.includes("linkedin")) return "linkedin";

  // Pinterest in-app
  if (ua.includes("pinterest")) return "pinterest";

  // Reddit in-app
  if (ua.includes("reddit")) return "reddit";

  // Snapchat in-app
  if (ua.includes("snapchat")) return "snapchat";

  // YouTube app / Google app (pozor: často jen "gsa" apod., bereme opatrně)
  if (ua.includes("youtube")) return "youtube";

  // Discord in-app
  if (ua.includes("discord")) return "discord";

  return null;
}

/* =========================
   Main route
========================= */

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  // Required IDs
  const workspace_id = body.workspace_id ?? body.workspaceId;
  const project_id = body.project_id ?? body.projectId;

  if (!workspace_id || !project_id) {
    return NextResponse.json(
      { error: "workspace_id and project_id are required" },
      { status: 400 }
    );
  }

  // Path
  const path = body.path ?? body.url ?? body.pathname ?? "/";

  // IDs
  const session_id =
    body.session_id ??
    body.sessionId ??
    (typeof crypto !== "undefined"
      ? crypto.randomUUID()
      : "00000000-0000-0000-0000-000000000000");

  const visitor_id =
    body.visitor_id ??
    body.visitorId ??
    (typeof crypto !== "undefined"
      ? "visitor-" + crypto.randomUUID()
      : "visitor-unknown");

  // Referrer RAW (původní logika)
  const raw_referrer =
    (typeof body.referrer === "string" && body.referrer.trim()
      ? body.referrer.trim()
      : null) ||
    req.headers.get("referer") ||
    req.headers.get("referrer") ||
    null;

  // ✅ AUTOMATIC inference (no UTM):
  // - Pokud raw_referrer je null nebo self/origio -> zkusit platformu z UA (in-app browser)
  // - Jinak, pokud raw_referrer obsahuje známou platform host -> normalizovat na platform doménu
  // - Jinak nechat raw_referrer tak jak je (klidně origio.site, jak chceš)
  const reqHost = getReqHost(req);
  const rawHost = safeHost(raw_referrer);

  let referrer = raw_referrer;

  // 1) Když referrer obsahuje známý platform host, normalizuj na doménu platformy
  const byRef = inferPlatformFromReferrer(raw_referrer);
  if (byRef && byRef !== "other") {
    referrer = PLATFORM_DOMAIN[byRef];
  } else {
    // 2) Když je referrer prázdný nebo self-host -> UA inference
    const isSelf =
      !!reqHost && !!rawHost ? isSelfOrChildHost(rawHost, reqHost) : false;

    if (!raw_referrer || isSelf) {
      const ua =
        (typeof body.user_agent === "string" ? body.user_agent : null) ||
        req.headers.get("user-agent") ||
        null;

      const byUa = inferPlatformFromUserAgent(ua);
      if (byUa) {
        referrer = PLATFORM_DOMAIN[byUa];
      }
      // else: necháme null nebo self-referrer (jak chceš)
    }
  }

  // ✅ GEO DISABLED (IP used only if you still want to store it)
  const ip = null;

  // Clamp duration + scroll
  const duration_ms =
    typeof body.duration_ms === "number" && body.duration_ms > 0
      ? Math.min(body.duration_ms, 180_000)
      : null;

  const scroll_depth =
    typeof body.scroll_depth === "number"
      ? Math.max(0, Math.min(100, body.scroll_depth))
      : null;

  // ✅ GEO DISABLED: always null
  const geo: Geo = { country: null, region: null, city: null };

  const payload = {
    workspace_id,
    project_id,
    path,
    session_id,
    visitor_id,
    referrer, // ✅ now: best-effort platform domain OR raw referrer OR null
    country: geo.country, // null
    region: geo.region,   // null
    city: geo.city,       // null
    ip,
    device_category:
      typeof body.device_category === "string" ? body.device_category : null,
    os: typeof body.os === "string" ? body.os : null,
    user_agent: typeof body.user_agent === "string" ? body.user_agent : null,
    duration_ms,
    scroll_depth,
    occurred_at: new Date().toISOString(),
  };

  const supabase = await supabaseServer();
  const { error } = await supabase.from("analytics_pageviews").insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
