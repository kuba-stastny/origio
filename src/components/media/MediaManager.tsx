"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BsPlus, BsX } from "react-icons/bs";
import { supabase } from "@/lib/supabase/client";

type StorageFile = {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, meta?: { name: string; path: string }) => void;
  bucket?: string;
  folder?: string;
  maxFiles?: number;
  maxSizeMB?: number;
};

function isImageName(name: string) {
  return !!name.toLowerCase().match(/\.(png|jpg|jpeg|webp|avif|gif|svg)$/);
}

function inferKindFromFile(file: File): "image" | "other" {
  if (file.type.startsWith("image/")) return "image";
  return "other";
}

export default function MediaManager({
  open,
  onClose,
  onSelect,
  bucket = "files",
  folder = "media",
  maxFiles = 100,
  maxSizeMB = 12,
}: Props) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Portal root
  useEffect(() => {
    if (typeof document === "undefined") return;
    let node = document.getElementById("media-manager-root");
    if (!node) {
      node = document.createElement("div");
      node.id = "media-manager-root";
      document.body.appendChild(node);
    }
    setPortalEl(node);
  }, []);

  // Scroll lock + ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
    };
  }, [open, onClose]);

  const loadFiles = async (accId: string) => {
    setLoading(true);
    setError("");
    try {
      const p = `${accId}/${folder}`;
      const { data, error } = await supabase.storage.from(bucket).list(p, {
        limit: maxFiles + 1,
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error) throw error;

      // ✅ keep only images (by extension)
      const list = Array.isArray(data) ? data : [];
      setFiles(list.filter((f) => isImageName(f.name)));
    } catch (e: any) {
      console.error("❌ Chyba při načítání souborů:", e);
      setError(e?.message ?? "Nelze načíst soubory.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Init: user/account + list
  useEffect(() => {
    if (!open) return;
    (async () => {
      setError("");
      setLoading(true);
      try {
        const { data: sess } = await supabase.auth.getSession();
        const userId = sess.session?.user?.id;
        if (!userId) {
          setError("Nejste přihlášený.");
          setFiles([]);
          setLoading(false);
          return;
        }

        // fallback: userId jako account
        let accId = userId;

        const { data: acc, error: accErr } = await supabase
          .from("accounts")
          .select("account_id")
          .eq("account_id", userId)
          .maybeSingle();

        if (!accErr && acc?.account_id) accId = acc.account_id;

        setAccountId(accId);
        await loadFiles(accId);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Chyba při inicializaci.");
        setFiles([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const getPublicUrl = (name: string) => {
    if (!accountId) return "";
    const path = `${accountId}/${folder}/${name}`;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSelect = (file: StorageFile) => {
    if (!accountId) return;
    const path = `${accountId}/${folder}/${file.name}`;
    const url = getPublicUrl(file.name);
    onSelect(url, { name: file.name, path });
    onClose();
  };

  const onClickUpload = () => fileInputRef.current?.click();

  const uploadFile = async (file: File) => {
    if (!accountId) return;
    if (!file) return;

    const k = inferKindFromFile(file);
    if (k === "other") {
      setError("Podporujeme jen obrázky.");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Maximální velikost je ${maxSizeMB} MB.`);
      return;
    }

    setUploading(true);
    setError("");
    try {
      const safeName = file.name.replace(/\s+/g, "-");
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = `${accountId}/${folder}/${fileName}`;

      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) throw error;

      await loadFiles(accountId);
    } catch (e: any) {
      console.error("❌ Upload error:", e);
      setError(e?.message ?? "Upload souboru selhal.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!accountId) return;
    setError("");
    try {
      const path = `${accountId}/${folder}/${name}`;
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      setFiles((prev) => prev.filter((f) => f.name !== name));
    } catch (e: any) {
      console.error("❌ Chyba při mazání:", e);
      setError(e?.message ?? "Mazání selhalo.");
    }
  };

  // Drag & drop
  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) await uploadFile(file);
  };

  const filtered = useMemo(() => files || [], [files]);

  if (!open || !portalEl) return null;

  // ---- styles: dark, NO border/outline/ring ----
  const cardShadow = "shadow-[0_24px_90px_rgba(0,0,0,0.65)]";
  const divider = "bg-white/10";
  const softBtn =
    "rounded-full bg-white/8 px-3 py-1.5 text-sm text-zinc-100 transition hover:bg-white/12";
  const tile =
    "group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-white/6 shadow-[0_16px_60px_rgba(0,0,0,0.55)] transition hover:bg-white/9";

  return createPortal(
    <div
      className="fixed inset-0 z-[8000] bg-black/70 backdrop-blur-md"
      onMouseDown={onClose}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      role="dialog"
      aria-modal="true"
      aria-label="Media manager"
    >
      <div
        className="absolute inset-0 grid place-items-center p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={[
            "flex h-[84vh] w-full max-w-5xl flex-col rounded-3xl bg-zinc-950/70 p-4",
            cardShadow,
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-3">
            <div>
              <div className="text-base font-semibold text-zinc-50">Media manager</div>
              <div className="text-xs text-zinc-300">
                Knihovna obrázků (JPG/PNG/WebP/AVIF/GIF/SVG). Přetáhni soubor sem nebo klikni na Nahrát.
              </div>
            </div>

            <button onClick={onClose} className={softBtn}>
              <span className="inline-flex items-center gap-2">
                <BsX /> Zavřít
              </span>
            </button>
          </div>

          <div className={"h-px " + divider} />

          {/* Toolbar */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-300">
              {filtered.length}/{maxFiles} obrázků{uploading ? " • Nahrávám…" : ""}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={onClickUpload} className={softBtn}>
                <span className="inline-flex items-center gap-2">
                  <BsPlus /> Nahrát
                </span>
              </button>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f);
                  e.currentTarget.value = "";
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-200 shadow-[0_14px_50px_rgba(0,0,0,0.45)]">
              {error}
            </div>
          )}

          {/* Grid */}
          <div className="mt-4 min-h-0 flex-1 overflow-auto">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/6" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="grid h-full place-items-center">
                <div className="max-w-lg text-center text-sm text-zinc-300">
                  Zatím nic v knihovně. Nahraj první obrázek pomocí{" "}
                  <span className="text-zinc-50">Nahrát</span> nebo přetáhni soubor sem.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filtered.map((file) => {
                  const url = getPublicUrl(file.name);

                  return (
                    <div
                      key={file.name}
                      className={tile}
                      onClick={() => handleSelect(file)}
                      title={file.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={file.name} className="h-full w-full object-cover" />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(file.name);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70"
                        aria-label="Smazat"
                      >
                        <BsX size={16} />
                      </button>

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2">
                        <div className="truncate rounded-full bg-black/45 px-2 py-1 text-[10px] text-zinc-100 opacity-0 transition group-hover:opacity-100">
                          {file.name}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filtered.length < maxFiles && (
                  <button
                    type="button"
                    onClick={onClickUpload}
                    className={[
                      "flex aspect-square items-center justify-center rounded-2xl bg-white/6 text-zinc-200",
                      "shadow-[0_16px_60px_rgba(0,0,0,0.55)] transition hover:bg-white/9 hover:text-white",
                    ].join(" ")}
                    aria-label="Přidat"
                  >
                    <BsPlus size={28} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 text-[11px] text-zinc-300">
            Tip: nejlepší je WebP/AVIF (menší velikost), klidně i PNG/JPG.
          </div>
        </div>
      </div>
    </div>,
    portalEl
  );
}
