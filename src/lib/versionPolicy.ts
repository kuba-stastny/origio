export const MAX_SNAPSHOTS = 20;

/**
 * Uvolní místo před vložením nové verze tak, aby po INSERTu
 * zůstal max celkový počet verzí = `max`.
 * Nikdy nemaže aktuálně LIVE verzi (z `publications`).
 *
 * - client: serverový Supabase klient
 * - pageId: ID stránky
 * - projectId: ID projektu (kvůli zjištění LIVE verze)
 * - max: celkový limit verzí na stránku (včetně published)
 */
export async function pruneBeforeInsert(
  client: any,
  pageId: string,
  projectId: string,
  max = MAX_SNAPSHOTS
) {
  if (max < 1) return;

  // 1) LIVE verze (ta se nikdy nesmí smazat)
  const { data: pub } = await client
    .from("publications")
    .select("version_id")
    .eq("project_id", projectId)
    .maybeSingle();

  const liveId: string | null = pub?.version_id ?? null;

  // 2) Všechny verze stránky, nejnovější první
  const { data: versions, error } = await client
    .from("page_versions")
    .select("id, created_at")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false });

  if (error || !versions) return;

  const total = versions.length;
  if (total < max) return; // je místo, není co mazat

  // 3) Kolik chceme ponechat PŘED vložením nové verze:
  //    Po insertu +1 bude celkem max.
  const keepCount = Math.max(0, max - 1);

  // primárně necháme nejnovějších `keepCount`
  let keepIds = versions.slice(0, keepCount).map((v: any) => v.id);

  // pokud LIVE není v těch nejnovějších, vynutíme její zachování
  if (liveId && !keepIds.includes(liveId)) {
    keepIds = [liveId, ...keepIds].slice(0, keepCount);
  }

  // 4) Smazat vše, co není v keepIds
  const toDelete = versions
    .map((v: any) => v.id)
    .filter((id: string) => !keepIds.includes(id));

  if (toDelete.length) {
    await client.from("page_versions").delete().in("id", toDelete);
  }
}
