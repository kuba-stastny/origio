// src/components/panels/WhatsNewPanel.tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsPlusLg } from "react-icons/bs";
import { Sparkles } from "lucide-react";

type ChangeType = "new" | "improved" | "fixed";
type FilterType = "all" | ChangeType;

type WhatsNewItem = {
  id: string;
  title: string;
  teaser: string;
  detail: string;
  date: string; // "2025-11-13"
  tag: ChangeType;
  area?: string; // např. "Builder", "Analytics"
  image?: string; // náhledový obrázek
};

const ITEMS: WhatsNewItem[] = [
  {
    id: "1",
    title: "Panel pro hlášení bugů",
    teaser: "Rychlejší způsob, jak nám poslat chybu přímo z aplikace.",
    detail:
      "Můžeš nahrát až 5 screenshotů, my je automaticky zkomprimujeme a uložíme do bezpečného úložiště. Vše se pak zobrazí v adminu jako jedno hlášení, takže chyby řešíme rychleji.",
    date: "2025-11-13",
    tag: "new",
    area: "Bug reports",
    image: "https://www.apple.com/v/iphone/home/cf/images/overview/select/iphone_17pro__0s6piftg70ym_large.jpg",
  },
  {
    id: "2",
    title: "Vylepšená analytika",
    teaser: "Přesnější měření návštěvnosti a lepší normalizace URL.",
    detail:
      "Přidali jsme limity pro extrémní hodnoty, sjednotili ukládání path a lépe pracujeme se session ID. Výsledkem jsou čistší data pro dashboardy.",
    date: "2025-11-11",
    tag: "improved",
    area: "Analytics",
    image: "https://www.apple.com/v/iphone/home/cf/images/overview/select/iphone_17pro__0s6piftg70ym_large.jpg",
  },
  {
    id: "3",
    title: "Opravy v builderu",
    teaser: "Stabilnější ukládání a méně pádů pravého panelu.",
    detail:
      "Vyřešili jsme edge-case, kdy při zavření panelu sekce došlo ke spadnutí editoru. Ukládání změn sekcí je teď spolehlivější i při rychlém klikání.",
    date: "2025-11-09",
    tag: "fixed",
    area: "Builder",
    image: "https://www.apple.com/v/iphone/home/cf/images/overview/select/iphone_17pro__0s6piftg70ym_large.jpg",
  },
];

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function tagLabel(tag: ChangeType): string {
  switch (tag) {
    case "new":
      return "Novinka";
    case "improved":
      return "Vylepšení";
    case "fixed":
      return "Opravy";
  }
}

function tagColor(tag: ChangeType): string {
  switch (tag) {
    case "new":
      return "bg-emerald-500/20 text-emerald-200";
    case "improved":
      return "bg-sky-500/20 text-sky-200";
    case "fixed":
      return "bg-amber-500/20 text-amber-200";
  }
}

export default function WhatsNewPanel() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return ITEMS;
    return ITEMS.filter((item) => item.tag === activeFilter);
  }, [activeFilter]);

  return (
    <div className="h-full bg-zinc-950 px-4 py-5 flex flex-col">
    

      {/* filters */}
      <div className="flex gap-2 mb-4 text-xs">
        <FilterChip
          label="Vše"
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        <FilterChip
          label="Novinky"
          active={activeFilter === "new"}
          onClick={() => setActiveFilter("new")}
        />
        <FilterChip
          label="Vylepšení"
          active={activeFilter === "improved"}
          onClick={() => setActiveFilter("improved")}
        />
        <FilterChip
          label="Opravy"
          active={activeFilter === "fixed"}
          onClick={() => setActiveFilter("fixed")}
        />
      </div>

      {/* vertical stack of square cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {filteredItems.map((item) => (
          <WhatsNewCard
            key={item.id}
            item={item}
            active={activeId === item.id}
            onToggle={() =>
              setActiveId((prev) => (prev === item.id ? null : item.id))
            }
          />
        ))}

        {filteredItems.length === 0 && (
          <p className="text-xs text-zinc-500 text-center mt-6">
            Pro tento filtr zatím nemáme žádné záznamy.
          </p>
        )}
      </div>

      {/* footer */}
      <div className="pt-3 border-t mx-auto border-zinc-900 mt-1">
        <p className="text-[11px] text-zinc-500">
          Chybí ti něco zásadního? Dej nám vědět přes panel{" "}
          <span className="text-zinc-200 font-medium">Zpětná vazba</span>.
        </p>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full border transition ${
        active
          ? "bg-zinc-100 text-zinc-900 border-zinc-100"
          : "bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:bg-zinc-900"
      }`}
    >
      {label}
    </button>
  );
}

function WhatsNewCard({
  item,
  active,
  onToggle,
}: {
  item: WhatsNewItem;
  active: boolean;
  onToggle: () => void;
}) {
  const bgImage = item.image;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      layout
      className={`relative w-full aspect-square rounded-3xl overflow-hidden transition-all duration-300 ${
        active
          ? "shadow-none"
          : "hover:border-zinc-600/80"
      }`}
    >
      {/* čistý obrázek v collapsed stavu */}
      <div className="absolute inset-0">
        {bgImage ? (
          <img
            src={bgImage}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950" />
        )}
      </div>

      {/* overlay s texty – jen když je karta aktivní */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 rounded-3xl to-zinc-950/20"
          >
            <div className="flex h-full flex-col justify-between p-10 text-left">
              {/* horní část: tagy + oblast + datum */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium ${tagColor(
                        item.tag
                      )}`}
                    >
                      {tagLabel(item.tag)}
                    </span>
                    {item.area && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-black/50 text-zinc-200 border border-white/10">
                        {item.area}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-zinc-400">
                  {formatDate(item.date)}
                </span>
              </div>

              {/* spodní část: nadpis + text */}
              <div className="space-y-1.5">
                <h3 className="text-xl font-medium tracking-tighter text-zinc-50">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-300 font-light tracking-wide leading-snug">
                  {item.detail}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* velké + vpravo dole – vždy viditelné */}
      <span
        aria-hidden
        className="absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-black/70 border border-white/15 text-zinc-100 shadow-lg"
      >
        <motion.span
          animate={{ rotate: active ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <BsPlusLg className="h-4 w-4" />
        </motion.span>
      </span>
    </motion.button>
  );
}
