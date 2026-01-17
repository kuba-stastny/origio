import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function supabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies(); // Next 15: async cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            (cookieStore as any).set?.({ name, value, ...options });
          } catch {
            // v čisté RSC nelze zapisovat cookies → ignoruj
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            (cookieStore as any).set?.({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // viz výše
          }
        },
      },
    }
  );
}
