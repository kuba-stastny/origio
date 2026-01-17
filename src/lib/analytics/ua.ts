// src/lib/analytics/ua.ts
export function parseDeviceAndOS(ua: string | null | undefined) {
    const u = (ua || "").toLowerCase();
  
    const isMobile = /mobile|iphone|android(?!.*tablet)|windows phone/.test(u);
    const isTablet = /ipad|tablet|nexus 7|nexus 10/.test(u);
    const device_type = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
  
    let os: "ios" | "android" | "macos" | "windows" | "linux" | "other" = "other";
    if (/iphone|ipad|ipod|ios/.test(u)) os = "ios";
    else if (/android/.test(u)) os = "android";
    else if (/mac os x|macintosh/.test(u)) os = "macos";
    else if (/windows nt/.test(u)) os = "windows";
    else if (/linux/.test(u)) os = "linux";
  
    return { device_type, os };
  }
  