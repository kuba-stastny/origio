// src/components/panels/BugReportPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";

const MAX_FILES = 5;

export default function BugReportPanel() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ skeleton (stejný styl jako ostatní panely)
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // panel nemá fetch, ale chceme konzistentní skeleton při otevření
    const t = setTimeout(() => setLoading(false), 220);
    return () => clearTimeout(t);
  }, []);

  const maxChars = 600;

  function handlePickFiles() {
    fileInputRef.current?.click();
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    // jen obrázky
    const onlyImages = selected.filter((f) => f.type.startsWith("image/"));

    // sloučit se stávajícími
    const merged = [...files, ...onlyImages].slice(0, MAX_FILES);
    setFiles(merged);

    // reset inputu
    e.target.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!message.trim() && files.length === 0) return;
    setSending(true);

    try {
      const form = new FormData();
      form.append("message", message);
      files.forEach((f, i) => {
        form.append("files", f, f.name || `screenshot-${i}.png`);
      });

      await fetch("/api/v1/bug-report", {
        method: "POST",
        body: form,
      });

      setSent(true);
      setMessage("");
      setFiles([]);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  const Skeleton = () => (
    <div className="space-y-5 animate-pulse">
      {/* header text */}
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-zinc-900/40" />
        <div className="h-3 w-72 max-w-[80%] rounded bg-zinc-900/40" />
      </div>

      {/* upload area */}
      <div className="space-y-3">
        <div className="h-4 w-52 rounded bg-zinc-900/40" />

        <div className="flex gap-3 overflow-x-auto pb-1">
          {/* "Přidat" box skeleton */}
          <div className="min-w-[90px] h-[90px] rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center justify-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-zinc-800" />
            <div className="h-3 w-12 rounded bg-zinc-800" />
            <div className="h-2.5 w-10 rounded bg-zinc-800/70" />
          </div>

          {/* preview boxy skeleton */}
          <div className="min-w-[90px] h-[90px] rounded-2xl bg-zinc-900/60 border border-zinc-800" />
          <div className="min-w-[90px] h-[90px] rounded-2xl bg-zinc-900/60 border border-zinc-800" />
          <div className="min-w-[90px] h-[90px] rounded-2xl bg-zinc-900/60 border border-zinc-800 hidden sm:block" />
        </div>
      </div>

      {/* text area */}
      <div className="space-y-2">
        <div className="h-4 w-72 max-w-[90%] rounded bg-zinc-900/40" />
        <div className="rounded-3xl overflow-hidden bg-zinc-900/50 border border-zinc-900">
          <div className="h-[140px] w-full bg-zinc-900/40" />
        </div>
        <div className="flex justify-end">
          <div className="h-3 w-16 rounded bg-zinc-900/40" />
        </div>
      </div>

      {/* submit */}
      <div className="h-11 w-full rounded-3xl bg-zinc-900/50 border border-zinc-900" />
    </div>
  );

  return (
    <div className="h-full bg-zinc-950 px-4 py-5 space-y-5">
      {loading ? (
        <Skeleton />
      ) : (
        <>
          <div className="space-y-1">
            <p className="text-sm text-zinc-100 font-medium">Nahlásit chybu</p>
            <p className="text-sm text-zinc-500 -mt-1">
              Přilož screenshoty, ať to opravíme rychleji.
            </p>
          </div>

          {/* upload area */}
          <div className="space-y-3">
            <p className="text-sm text-zinc-100">Screenshoty (max {MAX_FILES})</p>

            {/* nahrávací box */}
            <div className="flex gap-3 overflow-x-auto pb-1">
              {/* button na přidání */}
              <button
                type="button"
                onClick={handlePickFiles}
                className="min-w-[90px] h-[90px] rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center justify-center gap-1 text-xs text-zinc-400 hover:bg-zinc-900 transition"
              >
                <div className="h-9 w-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-100">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span>Přidat</span>
                <span className="text-[10px] text-zinc-500">
                  {files.length}/{MAX_FILES}
                </span>
              </button>

              {/* previews */}
              {files.map((file, idx) => {
                const url = URL.createObjectURL(file);
                return (
                  <div
                    key={idx}
                    className="relative min-w-[90px] h-[90px] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800"
                  >
                    <img src={url} alt={file.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center text-zinc-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
          </div>

          {/* text area */}
          <div className="space-y-2">
            <p className="text-sm text-zinc-100">Popište, co se stalo / jak chybu zopakovat:</p>
            <div className="rounded-3xl overflow-hidden bg-zinc-900/50 border border-zinc-900">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
                rows={6}
                className="w-full bg-transparent text-sm text-zinc-100 px-4 py-3 outline-none resize-none min-h-[140px] placeholder:text-zinc-600"
                placeholder="Např. otevřel jsem projekt, kliknul na Publish a vyskočila chyba 500…"
              />
            </div>
            <p className="text-[10px] text-zinc-500 text-right">
              {message.length}/{maxChars}
            </p>
          </div>

          {/* submit */}
          <button
            onClick={handleSubmit}
            disabled={sending || (!message.trim() && files.length === 0)}
            className="w-full rounded-3xl bg-zinc-600/80 text-zinc-50 py-3 text-sm font-medium hover:bg-zinc-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sent ? "Děkujeme, podíváme se na to ❤️" : sending ? "Odesílám…" : "Odeslat hlášení"}
          </button>
        </>
      )}
    </div>
  );
}
