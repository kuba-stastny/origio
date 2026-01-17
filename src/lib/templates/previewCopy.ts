type OnboardingPayload = {
    name: string;
    primaryFocus: string;
    idealCustomer: string;
    mainProblem: string;
    avoidCustomer?: string;
    projectCount: string;
    toneOfVoice: string;
    brag?: string;
    websiteGoal: string;
    templateId: string;
  };
  
  function s(v?: string) {
    return String(v ?? "").trim();
  }
  
  export function buildPreviewText(p: OnboardingPayload) {
    const name = s(p.name) || "Tvoje značka";
    const focus = s(p.primaryFocus) || "Služby";
    const ic = s(p.idealCustomer) || "Klienti";
    const prob = s(p.mainProblem) || "jasný problém a řešení";
    const goal = s(p.websiteGoal) || "Kontakt";
    const proof = s(p.brag) || "Reálné výsledky, které můžu doložit.";
  
    return {
      brand: name,
      heroH: `${focus}, které lidem ${ic} přináší výsledky`,
      heroS: `Pomáhám ${ic.toLowerCase()} vyřešit ${prob}. Přehledně, rychle a bez zbytečných řečí.`,
      cta: goal === "Kontaktoval mě" ? "Domluvit konzultaci" : goal === "Klikl na externí odkaz" ? "Zobrazit odkaz" : "Zobrazit práci",
      proof,
    };
  }
  
  /**
   * super jednoduchý “patcher”: projde objekt a pro klíče obsahující
   * heading/title/label/badge/description/body/text dosadí preview hodnoty.
   */
  export function injectPreviewCopy<T extends Record<string, any>>(data: T, p: OnboardingPayload): T {
    const t = buildPreviewText(p);
    const clone = structuredClone(data);
  
    const walk = (obj: any) => {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) {
        obj.forEach(walk);
        return;
      }
  
      for (const k of Object.keys(obj)) {
        const v = obj[k];
  
        if (typeof v === "string") {
          const key = k.toLowerCase();
  
          if (key.includes("brand") || key === "name") obj[k] = t.brand;
          else if (key.includes("headline") || key.includes("heading") || key === "title") obj[k] = t.heroH;
          else if (key.includes("sub") || key.includes("tagline")) obj[k] = t.heroS;
          else if (key.includes("description") || key.includes("body") || key.includes("text")) obj[k] = t.heroS;
          else if (key.includes("cta") && key.includes("label")) obj[k] = t.cta;
        } else {
          walk(v);
        }
      }
    };
  
    walk(clone);
    return clone;
  }
  