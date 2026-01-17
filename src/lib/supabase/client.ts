// src/lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Výrazné logy, ať je hned vidět problém s .env
if (!supabaseUrl) {
  console.error("Supabase: chybí NEXT_PUBLIC_SUPABASE_URL (.env.local)");
}
if (!supabaseAnonKey) {
  console.error("Supabase: chybí NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local)");
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
  {
    auth: {
      // volitelné – drž auth session v localStorage (standardní chování v prohlížeči)
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
