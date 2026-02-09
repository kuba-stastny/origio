export type theme = "blacky" | "whitey";

export type TemplatePreset = {
  id: string;               // t001..t006
  name: string;
  subtitle: string;
  theme: theme;          // default theme for preview (user can toggle)
  sections: string[];       // your new types: hd001, h001/h002, st001/st002...
};

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  // ===== GROUP: IT / Design =====
  {
    id: "t001",
    theme: "blacky",
    name: "Dev / Design Portfolio",
    subtitle: "Carousel hero + galerie projektů + proof",
    sections: ["hd001", "h002", "sh003", "st002", "ab001", "ab002", "sv001", "ts001", "ct001"],
  },
  {
    id: "t002",
    theme: "whitey",
    name: "Dev / Design Portfolio (Light)",
    subtitle: "Stejná struktura v bílém designu",
    sections: ["hd001", "h002", "sh003", "st002", "ab001", "ab002", "sv001", "ts001", "ct001"],
  },

  // ===== GROUP: Marketing / Copy =====
  {
    id: "t003",
    theme: "blacky",
    name: "Marketing / Copywriter",
    subtitle: "Text hero + projekty s odkazy + konverzní flow",
    sections: ["hd001", "h001", "sh001", "st002", "ab001", "ab002", "sv001", "ts001", "ct001"],
  },
  {
    id: "t004",
    theme: "whitey",
    name: "Marketing / Copywriter (Light)",
    subtitle: "Stejná struktura v bílém designu",
    sections: ["hd001", "h001", "sh001", "st002", "ab001", "ab002", "sv001", "ts001", "ct001"],
  },

  // ===== GROUP: Finance / RE / Admin / Edu =====
  {
    id: "t005",
    theme: "blacky",
    name: "Finance / Real Estate",
    subtitle: "Důvěra přes čísla + detailní služby",
    sections: ["hd001", "h001", "st002", "sv002", "ab001", "ab002", "ts001", "ct001"],
  },
  {
    id: "t006",
    theme: "whitey",
    name: "Finance / Real Estate (Light)",
    subtitle: "Stejná struktura v bílém designu",
    sections: ["hd001", "h001", "st002", "sv002", "ab001", "ab002", "ts001", "ct001"],
  },
];

export function getPreset(presetId: string) {
  return TEMPLATE_PRESETS.find((p) => p.id === presetId) || null;
}
