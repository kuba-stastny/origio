// src/components/builder/ChatPromptInput.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAutogen } from "./useAutogen";
import { useBuilderStore } from "@/store/builder-store";

export default function ChatPromptInput({
  persona,
  sectionsWanted,
}: {
  persona?: string | null;
  sectionsWanted?: string[];
} = {}) {
  const [value, setValue] = useState("");

  const params = useParams() as { workspaceId?: string; projectId?: string };
  const workspaceId = String(params.workspaceId || "");
  const projectId = String(params.projectId || "");
  const { run } = useAutogen(workspaceId, projectId);

  const generating = useBuilderStore((s) => s.pageGenerating);
  const hasContent = useBuilderStore((s) => s.sections.length > 0);

  async function submit() {
    const desc = value.trim();
    if (generating) return;
    // můžeme dovolit i prázdný desc, když máme aspoň personu/sece
    if (!desc && !persona && (!sectionsWanted || sectionsWanted.length === 0)) return;

    await run(desc, {
      persona: persona ?? undefined,
      sectionsWanted: sectionsWanted && sectionsWanted.length ? sectionsWanted : undefined,
    });
    setValue("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  if (generating || hasContent) return null;

  return (
    <div className="mx-auto w-[min(900px,92vw)] mt-6">
      <div className="relative rounded-2xl ring-1 ring-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-2 pl-4 pr-12 shadow-lg">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Popiš stránku, kterou chceš vytvořit…"
          rows={4}
          className="w-full bg-transparent outline-none text-zinc-100 placeholder:text-zinc-500 text-[15px] leading-6 resize-y"
        />
        <button
          onClick={submit}
          className="absolute right-2 top-2 h-9 px-4 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:opacity-95 active:opacity-90"
        >
          Vytvořit
        </button>
      </div>
      <div className="select-none mt-2 text-center text-xs text-zinc-500">
        Odeslat: Ctrl/Cmd + Enter
      </div>
    </div>
  );
}
