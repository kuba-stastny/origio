export function cx(...a: Array<string | false | null | undefined>) {
    return a.filter(Boolean).join(' ');
  }
  
  export function deepClone<T>(o: T): T {
    if (Array.isArray(o)) return o.map((x) => deepClone(x)) as any;
    if (o && typeof o === 'object') return { ...(o as any) };
    return o as any;
  }
  
  export function getByPath(obj: any, path?: string) {
    if (!obj || !path) return path ? undefined : obj;
    const parts = path.split('.').filter(Boolean);
    return parts.reduce((acc, p) => (acc ? acc[p] : undefined), obj);
  }
  
  export function setByPath(root: any, path: string, value: any) {
    const parts = (path || '').split('.').filter(Boolean);
    if (parts.length === 0) return value;
    const next = deepClone(root ?? {});
    let cur: any = next;
    for (let i = 0; i < parts.length; i++) {
      const k = parts[i]!;
      const last = i === parts.length - 1;
      if (last) {
        cur[k] = value;
      } else {
        const prev = cur[k];
        cur[k] = Array.isArray(prev) ? [...prev] : prev && typeof prev === 'object' ? { ...prev } : {};
        cur = cur[k];
      }
    }
    return next;
  }
  