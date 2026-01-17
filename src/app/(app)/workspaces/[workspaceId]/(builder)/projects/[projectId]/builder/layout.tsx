// src/app/(app)/workspaces/[workspaceId]/(builder)/projects/[projectId]/builder/layout.tsx
import type { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

type LayoutParams = Promise<{ workspaceId: string; projectId: string }>;

export default async function BuilderLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: LayoutParams;
}) {
  const { workspaceId, projectId } = await params;

  await requireUser();
  const supabase = await supabaseServer();

  const { data: project } = await supabase
    .from("projects")
    .select("id,name,slug")
    .eq("id", projectId)
    .single();

  const { data: page } = await supabase
    .from("pages")
    .select("id,page_json")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const pageId = page?.id ?? "";

  return (
    <div
      className="flex min-h-dvh flex-col"
      data-workspace-id={workspaceId}
      data-project-id={projectId}
      data-project-name={project?.name ?? ""}
      data-project-slug={project?.slug ?? ""}
      data-page-id={pageId}
    >
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
