// src/app/(app)/workspaces/[workspaceId]/(builder)/projects/[projectId]/builder/page.tsx
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import BuilderShell from "@/components/builder/BuilderShell";
import type { PageDocument } from "@/types/builder";
import { hasActiveAccess } from "@/lib/billing/hasActiveAccess";
import { mapThemeJson } from "@/lib/design-system"; // 👈 DŮLEŽITÉ

export default async function BuilderPage({
  params,
}: {
  params: { workspaceId: string; projectId: string };
}) {
  const { workspaceId, projectId } = params;

  const user = await requireUser();
  const supabase = await supabaseServer();

  // projekt (kvůli slug/názvu v top baru)
  const { data: project } = await supabase
    .from("projects")
    .select("id,name,slug")
    .eq("id", projectId)
    .single();

  // první stránka projektu – ➕ settings_json kvůli theme
  const { data: page } = await supabase
    .from("pages")
    .select("id, draft_json, page_json, theme_json")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();


  const pageId = page?.id ?? null;

  const draft = (page?.draft_json as PageDocument | null) ?? null;
  const live = (page?.page_json as PageDocument | null) ?? null;

  const picked: PageDocument =
    draft && Array.isArray(draft.sections)
      ? draft
      : live && Array.isArray(live.sections)
      ? live
      : { version: 1, sections: [] };

  // 🔥 1) vytáhneme theme JSON z settings_json
  const themeJson = page?.theme_json;
  console.log(page?.theme_json);

  // 🔥 2) přemapujeme na DesignSystem (tvůj helper)
  const theme = mapThemeJson(themeJson);

  // 🔐 tady zjistíme, jestli může publikovat
  const canPublish = await hasActiveAccess(workspaceId);

  return (
    <div className="mx-auto max-w-[1500px]">
      <BuilderShell
        workspaceId={workspaceId}
        projectId={projectId}
        projectSlug={project?.slug ?? "projekt"}
        pageId={pageId ?? ""}
        initialDoc={picked}
        canPublish={canPublish}
        theme={theme} // 👈 NOVĚ: pošli theme dál
      />
    </div>
  );
}
