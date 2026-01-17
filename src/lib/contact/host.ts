export function getSlugFromHost(hostRaw: string | null) {
    if (!hostRaw) return null;
  
    // host může přijít i s portem: "abc.origio.site:3000"
    const host = hostRaw.split(":")[0].toLowerCase();
  
    // očekáváme {slug}.origio.site
    const suffix = ".origio.site";
    if (!host.endsWith(suffix)) return null;
  
    const sub = host.slice(0, -suffix.length); // vše před ".origio.site"
    if (!sub) return null;
  
    // případ: "www.origio.site" / "app.origio.site" / "origio.site"
    // (subdomain bez slugu)
    if (["www", "app", "admin"].includes(sub)) return null;
  
    // kdyby někdo udělal "a.b.origio.site" => vezmeme jen první segment jako slug
    const slug = sub.split(".")[0].trim();
    if (!slug) return null;
  
    return slug;
  }
  