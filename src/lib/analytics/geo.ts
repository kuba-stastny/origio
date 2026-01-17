// src/lib/analytics/geo.ts
import type { NextRequest } from "next/server";

/* ----------------------------- public types ----------------------------- */
export type SimpleGeo = {
  country: string | null;
  region: string | null;
  city: string | null;
};

export type RichGeoCtx = {
  ip: string | null;
  ua: string | null;
  referer: string | null;
  acceptLang: string | null;
  geo: {
    country: string | null;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    source: "headers" | "vercel-edge" | "geoip-lite";
  } | null;
};

/* ------------------------------- helpers ------------------------------- */
export function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  if ((req as any).ip) return String((req as any).ip);
  return null;
}

export function isPrivateIp(ip: string) {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  );
}

/* ----------------------- 1) zpětně kompatibilní shim ----------------------- */
/** 
 * Zachovává původní API: čte geo z hlaviček (popř. z Vercel Edge `req.geo`).
 * Vhodné tam, kde čekáš jen country/region/city.
 */
export function readGeoFromHeaders(req: NextRequest): SimpleGeo {
  // Vercel Edge runtime (po deployi) – pokud běží v Edge, NextRequest má .geo
  const eg: any = (req as any).geo;
  if (eg && (eg.country || eg.region || eg.city)) {
    return {
      country: eg.country ?? null,
      region: eg.region ?? null,
      city: eg.city ?? null,
    };
  }

  // Hlavičky Vercel/Cloudflare – lokálně často prázdné
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;
  const region = req.headers.get("x-vercel-ip-country-region") || null;
  const city = req.headers.get("x-vercel-ip-city") || null;

  return { country, region, city };
}

/* ----------------------- 2) Edge runtime (bohatší) ----------------------- */
export function readGeoFromEdge(req: NextRequest): RichGeoCtx {
  const ua = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || req.headers.get("referrer") || null;
  const acceptLang = req.headers.get("accept-language") || null;
  const ip = getClientIp(req);

  const g: any = (req as any).geo ?? {};
  const geo =
    g && (g.country || g.region || g.city || g.latitude || g.longitude)
      ? {
          country: g.country ?? null,
          region: g.region ?? null,
          city: g.city ?? null,
          latitude: g.latitude ?? null,
          longitude: g.longitude ?? null,
          source: "vercel-edge" as const,
        }
      : null;

  return { ip, ua, referer, acceptLang, geo };
}

/* ----------------------- 3) Node runtime (lokálně) ----------------------- */
/** 
 * Node varianta s geoip-lite. Vyžaduje `export const runtime = "nodejs"` a
 * `npm i -D @types/geoip-lite` (případně vlastní .d.ts).
 */
export async function readGeoWithLibrary(req: NextRequest): Promise<RichGeoCtx> {
  const ua = req.headers.get("user-agent") || null;
  const referer = req.headers.get("referer") || req.headers.get("referrer") || null;
  const acceptLang = req.headers.get("accept-language") || null;
  const ip = getClientIp(req);

  let geo: RichGeoCtx["geo"] = null;
  try {
    if (ip && !isPrivateIp(ip)) {
      const geoip = (await import("geoip-lite")) as typeof import("geoip-lite");
      const hit = geoip.lookup(ip);
      geo = {
        country: hit?.country ?? null,
        region: hit?.region ?? null,
        city: hit?.city ?? null,
        latitude: hit?.ll?.[0] ?? null,
        longitude: hit?.ll?.[1] ?? null,
        source: "geoip-lite",
      };
    }
  } catch {
    // ignore
  }

  return { ip, ua, referer, acceptLang, geo };
}

/* ----------------------- 4) Auto runtime picker (nice) ----------------------- */
/** 
 * Zkusí Edge data, pokud nejsou, spadne na hlavičky; v Node můžeš
 * přepnout na geoip-lite (nastav `useLibraryInNode=true`).
 */
export async function readGeoAuto(
  req: NextRequest,
  useLibraryInNode = false
): Promise<RichGeoCtx> {
  // Edge?
  const hasEdgeGeo =
    (req as any).geo &&
    ( (req as any).geo.country ||
      (req as any).geo.region ||
      (req as any).geo.city );

  if (hasEdgeGeo) return readGeoFromEdge(req);

  if (useLibraryInNode) return readGeoWithLibrary(req);

  // fallback na prosté hlavičky
  const s = readGeoFromHeaders(req);
  const ip = getClientIp(req);
  return {
    ip,
    ua: req.headers.get("user-agent") || null,
    referer: req.headers.get("referer") || req.headers.get("referrer") || null,
    acceptLang: req.headers.get("accept-language") || null,
    geo: {
      country: s.country,
      region: s.region,
      city: s.city,
      latitude: null,
      longitude: null,
      source: "headers",
    },
  };
}
