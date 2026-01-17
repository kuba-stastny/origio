// src/sections/section-meta.ts
// POZOR: žádné "use client" – musí být použitelné i na serveru.

export type SectionMeta = {
  id: string;
  type: string;
  title: string;
  aiHint?: string;

  /**
   * ✅ HIGH PRIORITY instrukce pro AI pro konkrétní sekci
   * - co musí zaznít
   * - na co se zaměřit
   * - čemu se vyhnout
   * - jaký “úhel” komunikace zvolit
   */
  note?: string;
};

export const PREFERRED_ORDER = [
  "hd001",
  "h001",
  "h002",
  "sh001",
  "sv001",
  "sv002",
  "st001",
  "st002",
  "ab001",
  "ab002",
  "ga001",
  "ts001",
  "ts002",
  "ct001",
  "ct002",
] as const;

export const SECTION_META: SectionMeta[] = [
  {
    id: "hd001",
    type: "header",
    title: "Hlavička (Header)",
    aiHint:
      "Logo vlevo, navigace (3–6 odkazů), volitelně primární CTA tlačítko vpravo, případně sticky varianta.",
    note:
      "Navigaci pojmenuj podle obsahu webu (např. Služby, Projekty, Reference, O mně, Kontakt). Nepiš generické labely. Pokud defaultData obsahuje CTA button, slaď label s websiteGoal (např. 'Napsat mi', 'Domluvit konzultaci').",
  },
  {
    id: "h001",
    type: "hero",
    title: "Hero 1 – klasické CTA",
    aiHint:
      "Silný headline, krátký podheadline, primární CTA, sekundární odkaz/CTA, doplňující text nebo badge; čistý above-the-fold layout.",
    note:
      "Headline musí jasně říct 'co dělám + pro koho + výsledek' (bez klišé). V subheadline přidej konkrétnost (jak/čím). CTA musí odpovídat websiteGoal (kontakt, poptávka, rezervace…).",
  },
  {
    id: "h002",
    type: "hero",
    title: "Hero 2 – galerie (Hero Gallery)",
    aiHint:
      "Headline + subheadline + CTA, vedle/níže gallery grid (více obrázků) pro ukázku práce nebo produktu; vhodné pro portfolio.",
    note:
      "U gallery popiš smysluplné alt texty a názvy (žádné 'image 1'). Copy v hero musí být konzistentní s portfolio úhlem (ukázky práce, výsledky, rychlá důvěra).",
  },
  {
    id: "sh001",
    type: "showroom",
    title: "Showroom 1 – náhled projektu",
    aiHint:
      "1 hlavní vizuál (screenshot/mockup) + popis projektu: název, krátký text, 2–4 highlighty a CTA na detail/odkaz.",
    note:
      "Projekt popiš jako case: co bylo cílem, co jsi udělal, jaký byl dopad. Highlighty mají být konkrétní (např. rychlost, konverze, design system, SEO) a ne obecné.",
  },
  {
    id: "sh002",
    type: "showroom",
    title: "Showroom 2 – Project Highlight",
    aiHint:
      "Vybraný projekt/case study: vizuál + detailnější text, přínosy, metriky, role, použité technologie; výrazné CTA.",
    note:
      "Přidej aspoň 1 měřitelný nebo ověřitelný výsledek (i když je to rozumný rozsah). Nepřeháněj. Role uveď konkrétně (např. UX, UI, FE, integrace, nasazení).",
  },
  {
    id: "sh003",
    type: "showroom",
    title: "Showroom 3 – varianta (v2)",
    aiHint:
      "Alternativní showroom layout: větší důraz na vizuál, krátké copy, rychlé benefity a jasná navigace na další ukázku/sekci.",
    note:
      "Tady buď stručnější než u sh002, ale pořád konkrétní. Věty krátké, úderné. Žádné dlouhé odstavce.",
  },
  {
    id: "lg001",
    type: "logo-loop",
    title: "Logo loop – social proof",
    aiHint:
      "Horizontální loop log klientů/partnerů; 6–20 log, ideálně monochrom/neutral, plynulý marquee bez rušivých efektů.",
    note:
      "Pokud nemáš reálné brandy, použij neutrální názvy, které nepůsobí jako fake enterprise (raději 'Studio A', 'Team B' než 'Google'). Nepiš nic zavádějícího.",
  },
  {
    id: "st001",
    type: "stats",
    title: "Statistiky 1",
    aiHint:
      "3–6 metrik: číslo + label + krátký kontext (např. +32% konverze, 120+ klientů); jednoduché, důvěryhodné, bez přehánění.",
    note:
      "Metriky musí vycházet z onboarding contextu (projectCount, brag). Když nejsou data, použij bezpečné, nekontroverzní metriky (např. 'rychlost dodání', 'počet iterací', 'doba reakce') bez tvrdých čísel.",
  },
  {
    id: "st002",
    type: "stats",
    title: "Statistiky 2 – rozšířená varianta",
    aiHint:
      "Metriky s detailnějším vysvětlením nebo ikonami; vhodné pro doplnění credibility (NPS, reviews, roky zkušeností, projekty).",
    note:
      "Každá metrika = číslo/claim + krátké vysvětlení proč to je důležité pro ideálního zákazníka. Nepiš vatu.",
  },
  {
    id: "sv001",
    type: "services",
    title: "Služby 1 – seznam / accordion",
    aiHint:
      "3–8 služeb: název + krátký popis; může být accordion pro detail; jasně sděl co děláš a pro koho.",
    note:
      "Služby musí explicitně řešit mainProblem. U každé služby napiš výsledek (co klient získá). Žádné obecné 'konzultace' bez obsahu; raději konkrétní balíčky.",
  },
  {
    id: "sv002",
    type: "services",
    title: "Služby 2 – grid karet",
    aiHint:
      "Grid služeb (karty) s ikonou/obrázkem, názvem a popisem; důraz na scannability; 6–9 položek, konzistentní výšky.",
    note:
      "Drž konzistentní strukturu: Název (2–5 slov) + 1–2 věty popisu. Každá karta má být jiná (bez synonym).",
  },
  {
    id: "ts001",
    type: "testimonials",
    title: "Reference 1",
    aiHint:
      "2–6 referencí: citace, jméno, role, firma; volitelně avatar a rating; vybírej konkrétní benefity a výsledky.",
    note:
      "Reference musí znít lidsky a konkrétně (co se zlepšilo). Vyhni se příliš marketingovým formulacím. Nezmiňuj nereálné enterprise brandy.",
  },
  {
    id: "ts002",
    type: "testimonials",
    title: "Reference 2 – varianta",
    aiHint:
      "Alternativní layout referencí (např. slider/masonry/featured quote); stále krátké, konkrétní citace + jasná identita autora.",
    note:
      "Jedna reference může být 'featured' delší, ostatní kratší. Ale pořád konkrétní: problém → řešení → dopad.",
  },
  {
    id: "ct001",
    type: "cta",
    title: "CTA banner 1",
    aiHint:
      "Krátký claim (1 věta), doplňující text (1–2 věty) a jedno hlavní CTA tlačítko; volitelně sekundární odkaz.",
    note:
      "CTA text musí odpovídat websiteGoal a být jednoduchý. Nepiš 'Zjistit více' pokud cílem je kontakt. Přidej mikro-benefit (co se stane po kliknutí).",
  },
  {
    id: "ct002",
    type: "cta",
    title: "CTA banner 2 – varianta",
    aiHint:
      "Silnější CTA s card vzhledem nebo invertovaným kontrastem; může obsahovat malé benefity, social proof nebo jednoduchý formulář.",
    note:
      "Pokud je zde formulář/pole, drž copy ultra stručné. Benefity: max 3 krátké body, ale do textu (ne nutně seznam), podle defaultData.",
  },
  {
    id: "ab001",
    type: "about",
    title: "O mně 1 – profil",
    aiHint:
      "Foto/ilustrace + krátký příběh: kdo jsi, pro koho pracuješ, čím se lišíš; 2–4 quick facts a CTA na kontakt.",
    note:
      "Zaměř se na důvěryhodnost: přístup k práci, způsob spolupráce, rychlost/komunikace. Quick facts musí být ověřitelné (projectCount, roky, technologie, proces).",
  },
  {
    id: "ab002",
    type: "about",
    title: "O mně 2 – příběh (Story Text)",
    aiHint:
      "Delší textový blok: příběh, přístup, hodnoty; vhodné pro důvěru; rozděl do odstavců, klidně zvýrazni klíčové věty.",
    note:
      "Tahle sekce musí být nejvíc 'lidská'. Struktura: 1) co dělám a proč, 2) jak pracuju (proces), 3) pro koho to je (idealCustomer) + co řeším (mainProblem), 4) jemná výzva k akci. Žádné prázdné fráze. Nepřehánět claimy.",
  },
  {
    id: "ga001",
    type: "gallery",
    title: "Galerie 1",
    aiHint:
      "Mřížka obrázků (portfolio, fotky, screenshots) s konzistentním ořezem; 6–12 položek; volitelně lightbox nebo odkazy.",
    note:
      "Názvy/alt texty popisné a konkrétní (co je na obrázku + kontext). Pokud defaultData dovoluje odkazy, používej smysluplné href (ne prázdné).",
  },
];

export const SECTION_META_BY_ID: Record<string, SectionMeta> = Object.fromEntries(
  SECTION_META.map((m) => [m.id, m])
);
