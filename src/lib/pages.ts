// src/lib/pages.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function ensureHomePage(projectId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  // zkus najít page "/"
  let { data: page, error } = await supabase
    .from("pages")
    .select("id,name,path,page_json,settings_json")
    .eq("project_id", projectId)
    .eq("path", "/")
    .single();

  if (!page) {
    // vytvoř default
    const defaultDoc = { version: 1, sections: [] };
    const { data: created, error: insErr } = await supabase
      .from("pages")
      .insert({
        project_id: projectId,
        name: "Home",
        path: "/",
        page_json: defaultDoc,
        settings_json: {},
      })
      .select("id,name,path,page_json,settings_json")
      .single();

    if (insErr || !created) throw new Error(insErr?.message || "Cannot create home page");
    page = created;
  }

  return page; // { id, name, path, page_json, settings_json }
}
