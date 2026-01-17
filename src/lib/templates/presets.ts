export type ThemeKey = "blacky" | "whitey";

export type TemplatePreset = {
  id: string;               // t001..t006
  name: string;
  subtitle: string;
  theme: ThemeKey;          // default theme for preview (user can toggle)
  sections: string[];       // your new types: hd001, h001/h002, st001/st002...
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  // ✅ 1) tvoje varianta #1
  {
    id: "t001",
    name: "Showcase Services",
    subtitle: "Showroom + služby + proof",
    theme: "blacky",
    sections: ["hd001","h002","st002","sh001","st001","ab001","ab002","sv001","ts001","ct001"],
  },

  // ✅ 2) tvoje varianta #2
  {
    id: "t002",
    name: "Services First",
    subtitle: "Služby nahoře, showroom později",
    theme: "whitey",
    sections: ["hd001","h001","st002","sv002","st001","ab001","ab002","sh002","ts002","ct001"],
  },

  // ✅ 3) NEW – Story / About-heavy (ideální pro freelancera)
  {
    id: "t003",
    name: "Personal Story",
    subtitle: "Více o tobě + důvěra",
    theme: "blacky",
    sections: ["hd001","h002","ab001","st002","sv001","ab002","ts001","st001","ct002"],
  },

  // ✅ 4) NEW – Results-led (čísla + sociální důkaz)
  {
    id: "t004",
    name: "Results Led",
    subtitle: "Výsledky → služby → CTA",
    theme: "whitey",
    sections: ["hd001","h001","st001","st002","sv002","ts001","sh001","ab001","ct001"],
  },

  // ✅ 5) NEW – Portfolio / Case studies heavy (showroom výrazně)
  {
    id: "t005",
    name: "Portfolio Heavy",
    subtitle: "Ukázky práce jako hlavní tahák",
    theme: "blacky",
    sections: ["hd001","h002","sh003","st002","sh001","sv001","ts002","ab002","ct001"],
  },

  // ✅ 6) NEW – Conversion compact (kratší, přímější)
  {
    id: "t006",
    name: "Conversion Compact",
    subtitle: "Stručné, úderné, konverzní",
    theme: "whitey",
    sections: ["hd001","h002","sv002","st002","ts001","ct001"],
  },
];

export function getPreset(presetId: string) {
  return TEMPLATE_PRESETS.find((p) => p.id === presetId) || null;
}
