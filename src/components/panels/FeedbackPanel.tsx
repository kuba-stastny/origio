// src/components/panels/FeedbackPanel.tsx
"use client";

import { useEffect, useState } from "react";

const EMOJIS = ["🤬", "😐", "😏", "😎", "😍"];

export default function FeedbackPanel() {
  const [emoji, setEmoji] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const maxChars = 400;

  // ✅ skeleton (konzistentní s ostatními panely)
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit() {
    if (!emoji && !message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emoji,
          message,
          anonymous: true,
        }),
      });
      setSent(true);
      setMessage("");
      setEmoji(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  const Skeleton = () => (
    <div className="space-y-5 animate-pulse">
      {/* emojis */}
      <div className="flex gap-3 justify-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 w-14 rounded-full bg-zinc-900/70 border border-zinc-900"
          />
        ))}
      </div>

      {/* textarea + counter */}
      <div className="space-y-2">
        <div className="rounded-3xl overflow-hidden bg-zinc-900/50 border border-zinc-900">
          <div className="w-full min-h-[160px] bg-zinc-900/40" />
        </div>
        <div className="flex justify-end">
          <div className="h-3 w-16 rounded bg-zinc-900/40" />
        </div>
      </div>

      {/* button */}
      <div className="h-11 w-full rounded-3xl bg-zinc-900/50 border border-zinc-900" />
    </div>
  );

  return (
    <div className="h-full bg-zinc-950 px-4 py-5 space-y-5">
      {loading ? (
        <Skeleton />
      ) : (
        <>
          {/* emojis */}
          <div className="flex gap-3 justify-center">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji((prev) => (prev === e ? null : e))}
                className={`h-14 w-14 rounded-full flex items-center justify-center text-2xl transition ${
                  emoji === e
                    ? "bg-zinc-800 ring-2 ring-zinc-100/70"
                    : "bg-zinc-900/70 hover:bg-zinc-900"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* textarea */}
          <div className="space-y-2 text-center">
            <div className="rounded-3xl overflow-hidden bg-zinc-900/50 border border-zinc-900">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
                rows={6}
                className="w-full bg-transparent text-sm text-zinc-100 px-4 py-3 outline-none resize-none min-h-[160px] placeholder:text-zinc-600"
                placeholder="Napište nám svůj názor. Čteme úplně všechno..."
              />
            </div>
            <p className="text-[10px] text-zinc-500 text-right">
              {message.length}/{maxChars}
            </p>
          </div>

          {/* button */}
          <button
            onClick={handleSubmit}
            disabled={sending || (!emoji && !message.trim())}
            className="w-full rounded-3xl bg-zinc-600/80 text-zinc-50 py-3 text-sm font-medium hover:bg-zinc-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sent ? "Děkujeme ❤️" : sending ? "Odesílání…" : "Odeslat zpětnou vazbu"}
          </button>
        </>
      )}
    </div>
  );
}
