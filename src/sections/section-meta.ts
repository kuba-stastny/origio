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
  // tohle není preffered order, jenom seznam, ale je to někde definované? 
  //někam do těch obecných guidelines pro AI bysme měli dát tone of voice, cílovku, avoid customer, aby to adekvátně stylizovala jako celek
  "hd001",
  "h001",
  "h002",
  "ab001",
  "ab002",
] as const;

export const SECTION_META: SectionMeta[] = [
  {
    id: "hd001",
    type: "header",
    title: "Hlavička (Header)",
    aiHint:
      "logo + profile (vlevo), nav (3–6 odkazů), cta (vpravo)",
    note:
      "'logo' obsahuje profilovou fotku uživatele (nebo výchozí placeholder). K logu přidáváme v rámci 'profile' jméno uživatele ('name' z onboardingu) a pod ním do 'status' vlož jeho primánrí zaměření ('primaryFocus' z onboardingu). Položky navigace (nav) pojmenuj podle sekcí umístěných na webu (např. Služby, Projekty, Reference, O mně, Kontakt, apod.) - po kliku scroll k příslušné sekci na webu. 'cta' nastav podle dat 'websitegoal' z onboardingu - pokud je cílem webu Kontakt, nastav button label na Kontaktujte mně (po kliku scroll na sekci Kontakt), pokud je cílem webu klik na externí odkaz, nastav label podle kontextu odkazované služby (např. pokud externí odkaz míří na službu Calendly, button label bude Rezervovat konzultaci). Toto CTA bude odkazovat na odkaz z 'websitegoal' onboardingu",
  },
  {
    id: "h001",
    type: "hero",
    title: "Hero 1 – galerie",
    aiHint:
      "Zarovnáno na střed a pod sebou: heading, subheading, ctaPrimary + ctaSecondary, gallery",
    note:
      "Text má být pochopitelný do 3 vteřin i pro člověka, který freelancera nezná. 'Heading' musí reflektovat zaměření freelancera ('primaryFocus' z onboardingu) a musí jasně říct, jaký problém řeší (čerpej z 'mainProblem' z onboardingu) a jaký je výsledek jeho práce, který zaujme cílovou skupinu ('idealCustomer' z onboardingu) - bez klišé, profesionální, realistické, důvěryhodné a k věci. Délka 'heading' se musí blížit 83 znaků, ale nesmí tuto délku překročit. 'subheading' musí rozvést a upřesnit 'heading' - nesmí opakovat jeho sdělení, délkou nesmí přesáhnout, ale měl by se co nejvíc blížit 174 znakům. 'ctaPrimary' i jeho odkaz ('href') se shoduje textem i vlastnostmi s tlačítkem v sekci header. 'ctaSecondary' má label Moje práce a po kliku scrolluje k této sekci na stránce - pokud chybí, odkazuje na sekci Služby a změní label na Moje služby.'gallery' obsahuje 3 placeholder obrázky projektů.",
  },
  {
    id: "h002",
    type: "hero",
    title: "Hero 2 – CTA",
    aiHint:
      "pod sebou zarovnáno vlevo: heading, subheading, ctaPrimary + ctaSecondary",
    note:
      "Text má být pochopitelný do 3 vteřin i pro člověka, který freelancera nezná. 'Heading' musí reflektovat zaměření freelancera ('primaryFocus' z onboardingu) a musí jasně říct, jaký problém řeší (čerpej z 'mainProblem' z onboardingu) a jaký je výsledek jeho práce, který zaujme cílovou skupinu ('idealCustomer' z onboardingu) - bez klišé, profesionální, realistické, důvěryhodné a k věci. Délka 'heading' se musí blížit 83 znaků, ale nesmí tuto délku překročit. 'subheading' musí rozvést a upřesnit 'heading' - nesmí opakovat jeho sdělení, délkou nesmí přesáhnout, ale měl by se co nejvíc blížit 174 znakům. 'ctaPrimary' i jeho odkaz ('href') se shoduje textem i vlastnostmi s tlačítkem v sekci header. 'ctaSecondary' má label Moje práce a po kliku scrolluje k této sekci na stránce - pokud chybí, odkazuje na sekci Služby a změní label na Moje služby.",
  },
  {
    id: "ab001",
    type: "about",
    title: "O mně 1 – profil",
    aiHint:
      "title + body (levý sloupec), image (pravý sloupec",
    note:
      "Text musí být zaměřený na uživatele, ne na ego autora. 'title' je vždy Něco o mně. V 'body' vysvětli, jak nad prací přemýšlí, proč je spolupráce s ním srozumitelná a efektivní a jak probíhá v kontextu jeho zaměření ('primaryFocus' z onboardingu). Pokud je k dispozici, využij 'brag' z onboardingu. Použij přirozený, lidský a sebevědomý tón, bez buzzwordů, bez výčtu nástrojů a bez životopisných informací. Text musí působit důvěryhodně, profesionálně a motivačně, aby čtenář měl chuť navázat spolupráci. Délka 'body' musí být maximálně dva odstavce každý o maximálně 200 znacích.",
  },
  {
    id: "ab002",
    type: "about",
    title: "O mně 2 – příběh (Story Text)",
    aiHint:
      "text",
    note:
      "Napiš krátký osobní statement. 'text' má vyjadřovat přístup autora k práci, jeho hodnoty a způsob přemýšlení, ne popis služeb ani přímý prodej. Použij první osobu („Já“) a přirozený, lidský tón. Statement má působit autenticky, sebevědomě a inspirativně, ale ne přehnaně emotivně ani marketingově. Délka textu by měla být 1–2 věty, maximálně cca 20–30 slov. Text má fungovat samostatně jako vizuální prvek na stránce a posilovat důvěru a osobní vztah k freelancerovi. Vycházej z 'primaryFocus' z onboardingu",
  },
  {
    id: "ct001",
    type: "cta",
    title: "CTA banner 1",
    aiHint:
      "2 sloupce: heading + subheading + socials (levý sloupec), form (pravý sloupec)",
    note:
      "Toto je závěrečné CTA sekce landing page. 'heading' má vybízet k zahájení konverzace nebo spolupráce (např. Pojďme probrat váš projekt). Použij přátelský, sebevědomý tón, bez nátlaku a bez marketingových klišé. Popisný text ('subheading', 1 krátký odstavec) má snížit bariéru ke kontaktu: znovu zmiň, čím se freelancer zabývá ('primaryFocus' z onboardingu) a čím může cílové skupině ('idealCustomer' z onboardingu) pomoct. Text má působit otevřeně, profesionálně a důvěryhodně. Předpokládej, že vedle textu je kontaktní formulář (jméno, e-mail, zpráva), takže text má přirozeně vést k jeho vyplnění. Výstup musí působit jako logické zakončení celé stránky, potvrzovat hodnotu autora a motivovat uživatele udělat poslední krok – napsat zprávu. CTA ve form je Odeslat zprávu.",
  },
  {
    id: "ct002",
    type: "cta",
    title: "CTA banner 2 – varianta",
    aiHint:
      "Zarovnáno na střed a pod sebou: heading, subheading, form (levý sloupec) + socials (pravý sloupec)",
    note:
      "Toto je závěrečné CTA sekce landing page. 'heading' má vybízet k zahájení konverzace nebo spolupráce (např. Pojďme probrat váš projekt). Použij přátelský, sebevědomý tón, bez nátlaku a bez marketingových klišé. Popisný text ('subheading', 1 krátký odstavec) má snížit bariéru ke kontaktu: znovu zmiň, čím se freelancer zabývá ('primaryFocus' z onboardingu) a čím může cílové skupině ('idealCustomer' z onboardingu) pomoct. Text má působit otevřeně, profesionálně a důvěryhodně. Předpokládej, že vedle textu je kontaktní formulář (jméno, e-mail, zpráva), takže text má přirozeně vést k jeho vyplnění. Výstup musí působit jako logické zakončení celé stránky, potvrzovat hodnotu autora a motivovat uživatele udělat poslední krok – napsat zprávu. CTA ve form je Odeslat zprávu.",
  },
  {
    id: "ga001",
    type: "gallery",
    title: "Galerie 1",
    aiHint:
      "gallery items",
    note:
      "Masonry grid obrázků (portfolio, fotky, screenshoty) s konzistentním ořezem; 6–12 položek.",
  },
  {
    id: "sv001",
    type: "services",
    title: "Služby 1 – seznam / accordion",
    aiHint:
      "3–5 služeb pod sebou v accordeon layoutu: image, title, description. Důraz na scannability;",
    note:
      "Služby musí řešit problémy potenciálních klientů ('idealCustomer' z onboardingu) freelancerova zaměření ('primaryFocus' z onboardingu) - každá musí být jiná a specifická. Drž konzistentní strukturu. Do 'title' napiš její název, maximálně 3 slova. 'description' musí obsahovat stručný popisek, max 180 znaků - texty musí být konkrétní, srozumitelné a orientované na hodnotu, ne na popis činností a vyhni se marketingovým frázím, buzzwordům a technickým detailům, kterým by klient nemusel rozumět.Každá služba má působit jako samostatný, jasně definovaný celek, ale zároveň zapadat do jednoho konzistentního přístupu freelancera. Předpokládej, že uživatel tuto sekci čte proto, aby si rychle ověřil, zda autor řeší právě jeho problém, ne aby studoval detaily realizace. 'image' obsahuje placeholder obrázky, do jejich 'alt' argumentu napiš jméno freelancera a 'title' služby.",
  },
  {
    id: "sv002",
    type: "services",
    title: "Služby 2 – grid karet",
    aiHint:
      "3-6 položek v gridu služeb (karty): icon, image, title, description. Důraz na scannability, konzistentní výšky.",
    note:
      "Služby musí řešit problémy potenciálních klientů ('idealCustomer' z onboardingu) freelancerova zaměření ('primaryFocus' z onboardingu) - každá musí být jiná a specifická. Drž konzistentní strukturu. Do 'title' napiš její název, maximálně 3 slova. 'description' musí obsahovat stručný popisek, max 180 znaků - texty musí být konkrétní, srozumitelné a orientované na hodnotu, ne na popis činností a vyhni se marketingovým frázím, buzzwordům a technickým detailům, kterým by klient nemusel rozumět.Každá služba má působit jako samostatný, jasně definovaný celek, ale zároveň zapadat do jednoho konzistentního přístupu freelancera. Předpokládej, že uživatel tuto sekci čte proto, aby si rychle ověřil, zda autor řeší právě jeho problém, ne aby studoval detaily realizace. 'image' obsahuje placeholder obrázky, do jejich 'alt' argumentu napiš jméno freelancera a 'title' služby. Do 'icon' vyber relevantní knihovnu z knihovny.",
  },
  {
    id: "st001",
    type: "stats",
    title: "Loga",
    aiHint:
      "Horizontální carousel log klientů/partnerů; 5–10 log",
    note:
      "Obsahuje placeholder log klientů",
  },
  {
    id: "st002",
    type: "stats",
    title: "Statistiky",
    aiHint:
      "4 metriky na jednom řádku v sloupcovém gridu: value + label",
    note:
      "Metriky musí vycházet z onboarding kontextu ('projectCount', 'brag'), kde vyplníš 'value' a vymyslíš relevantní 'label' o maximálně 3 slovech. Když nejsou data, vymysli bezpečné, nekontroverzní metriky, které by ideální klient ('idealCustomer' z onboardingu) chtěl vidět aby podpořily freelancerův kredibilitu z hlediska jeho 'primaryFocus' z onboardingu. Pokud je 'projectCount' 0, nezobrazuj tuto statistiku.",
  },
  {
    id: "ts001",
    type: "testimonials",
    title: "Reference 1",
    aiHint:
      "3 recenze fiktivních klientů vedle sebe, každá obsahuje: rating, quote a author (name, role, avatar)",
    note:
      "Napiš 3 krátké klientské recenze pro web freelancera. Text má být autentický a konkrétní, ne marketingový, maximálně 130 znaků. Vždy popiš: konkrétní problém klienta, průběh spolupráce a výsledek. Nenápadně zmiň některé služby, které klient využil, spolupráce byla vždy nakonec úspěšná. Vyhni se obecným frázím a přehnanému nadšení, ať je to relaistické. Reference musí znít lidsky a konkrétně (co se zlepšilo). Ke každé recenzi vždy vymysli jméno osoby píšící recenzi ('name'), její pracovní pozici ('role') - ideálně poodbnou lidem z 'idealCustomer' z onboardingu. 'avatar' bude obashovat profilový obrázek klienta. 'rating' bude vždy 5 z 5. Nevymšlej pod jménem za pozici firmu @nazevfirmy, pod jménem bude jenom název pozice bez názvu firmy.",
  },
  {
    id: "ts002",
    type: "testimonials",
    title: "Reference 2 – varianta",
    aiHint:
      "carousel 3 recenzí fiktivních klientů, každá obsahuje: rating, quote a author (name, role, avatar)",
    note:
      "Napiš 3 krátké klientské recenze pro web freelancera. Text má být autentický a konkrétní, ne marketingový, maximálně 130 znaků. Vždy popiš: konkrétní problém klienta, průběh spolupráce a výsledek. Nenápadně zmiň některé služby, které klient využil, spolupráce byla vždy nakonec úspěšná. Vyhni se obecným frázím a přehnanému nadšení, ať je to relaistické. Reference musí znít lidsky a konkrétně (co se zlepšilo). Ke každé recenzi vždy vymysli jméno osoby píšící recenzi ('name'), její pracovní pozici ('role') - ideálně poodbnou lidem z 'idealCustomer' z onboardingu. 'avatar' bude obashovat profilový obrázek klienta. 'rating' bude vždy 5 z 5. Nevymšlej pod jménem za pozici firmu @nazevfirmy, pod jménem bude jenom název pozice bez názvu firmy.",
  },
  {
    id: "sh001",
    type: "showroom",
    title: "Showroom 1 – náhled projektu",
    aiHint:
      "grid 3 projektů, každý obsahuje: media, title, tags",
    note:
      "Projekty se musí týkta freelancerova 'primaryFocus' a oslovit 'idealCustomer' z onboardingu (případně se inspiruj 'brag'). Projekt popiš jako case: do 'title' napiš výstup spolupráce s konkrétními čísly (např. Zvýšení konverze o +45 % po redesignu landing page). 'tags' obsahují základí činnosti, keré freelancer ve spolupráci vykonával (např. optimalizace, redesign, analytika apod.) - 2 až 4 položky.",
  },
  {
    id: "sh002",
    type: "showroom",
    title: "Showroom 2 – Project Highlight",
    aiHint:
      "2 sloupce: image (vlevo), (vpravo) title + body + rows (link, time, metric)",
    note:
      "3 projekty, které se musí týkat freelancerova 'primaryFocus' a oslovit 'idealCustomer' z onboardingu (případně se inspiruj 'brag'). Každý obsahuje obrázek ('image'), a v pravém sloupci pod sebou vždy 'title' (maximálně dvouslovný název projektu), popis projektu s maximálně 160 znaky ('body') obsahující problém a řešení, a v 'rows' jsou následující 3 infromace - odkaz na web projektu ('link'), relevantní délku trvání projektu ('time', např. 4 týdny) a číselně znázirněný úspěch projketu ('metric', např. Zvýšení konverze o +45 %)",
  },
  {
    id: "sh003",
    type: "showroom",
    title: "Showroom 3 – varianta (v2)",
    aiHint:
      "grid 3 projektů, každý obsahuje: image, title, description",
    note:
      "Projekty se musí týkta freelancerova 'primaryFocus' a oslovit 'idealCustomer' z onboardingu (případně se inspiruj 'brag'). Projekt popiš jako case: do 'title' napiš výstup spolupráce s konkrétními čísly (např. Zvýšení konverze o +45 % po redesignu landing page, maximálně 80 znaků). Do popisku ('description') stručně popiš problém projektu a jeho řešení (maximálně 160 znaků)",
  },
  
];

export const SECTION_META_BY_ID: Record<string, SectionMeta> = Object.fromEntries(
  SECTION_META.map((m) => [m.id, m])
);
